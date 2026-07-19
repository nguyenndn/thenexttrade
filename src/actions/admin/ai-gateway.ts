"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { encrypt, decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";
import { getAdapter } from "@/lib/ai-gateway/provider-registry";
import { statusAfterSuccessfulCredentialTest } from "@/lib/ai-gateway/credential-lifecycle";

async function requireAiGatewayAdmin() {
    const user = await getAuthUser();
    if (!user) throw new Error("Unauthorized");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (!profile || !["ADMIN", "EDITOR"].includes(profile.role)) {
        throw new Error("Forbidden");
    }
    return user;
}

async function logAudit(
    action: string,
    entityType: string,
    entityId?: string,
    details?: any
) {
    const user = await getAuthUser();
    if (user) {
        await prisma.adminAuditLog.create({
            data: {
                adminId: user.id,
                action,
                entityType,
                entityId,
                detailsJson: details || {},
            },
        });
    }
}

export async function getAiProviders() {
    await requireAiGatewayAdmin();

    return prisma.aiProvider.findMany({
        include: {
            credentials: {
                select: {
                    id: true,
                    alias: true,
                    lastFour: true,
                    status: true,
                    testedAt: true,
                    activatedAt: true,
                    revokedAt: true,
                    createdAt: true,
                    createdBy: true,
                },
                orderBy: { createdAt: "desc" },
            },
            models: true,
        },
        orderBy: { createdAt: "asc" },
    });
}

export async function createAiProvider(data: {
    providerCode: string;
    displayName: string;
    providerEnum: number;
    baseUrl?: string;
}) {
    await requireAiGatewayAdmin();

    const provider = await prisma.aiProvider.create({
        data: {
            providerCode: data.providerCode,
            displayName: data.displayName,
            providerEnum: data.providerEnum,
            baseUrl: data.baseUrl,
        },
    });

    await logAudit("CREATE_PROVIDER", "AiProvider", provider.id, {
        providerCode: data.providerCode,
    });
    revalidatePath("/admin/ai/providers");
    return provider;
}

export async function updateAiProvider(
    id: string,
    data: { baseUrl?: string; defaultModelId?: string; timeoutMs?: number }
) {
    await requireAiGatewayAdmin();

    const provider = await prisma.aiProvider.update({
        where: { id },
        data: {
            baseUrl: data.baseUrl,
            defaultModelId: data.defaultModelId,
            timeoutMs: data.timeoutMs,
        },
    });

    await logAudit("UPDATE_PROVIDER", "AiProvider", provider.id, data);
    revalidatePath("/admin/ai/providers");
    return provider;
}

export async function toggleAiProvider(id: string, enabled: boolean) {
    await requireAiGatewayAdmin();

    await prisma.aiProvider.update({
        where: { id },
        data: { enabled },
    });
    await logAudit("TOGGLE_PROVIDER", "AiProvider", id, { enabled });
    revalidatePath("/admin/ai/providers");
}

export async function addAiCredential(
    providerId: string,
    alias: string,
    secretKey: string
) {
    const user = await requireAiGatewayAdmin();

    if (!secretKey || secretKey.trim() === "") {
        throw new Error("Secret key cannot be empty");
    }

    const encryptedSecret = encrypt(secretKey);
    const lastFour = secretKey.length >= 4 ? secretKey.slice(-4) : "***";

    const cred = await prisma.aiProviderCredential.create({
        data: {
            providerId,
            alias,
            encryptedSecret,
            lastFour,
            status: "DRAFT",
            createdBy: user.id,
        },
    });

    await logAudit("ADD_API_KEY", "AiProviderCredential", cred.id, {
        providerId,
        alias,
    });
    revalidatePath("/admin/ai/providers");
    return { success: true, id: cred.id };
}

export async function revokeAiCredential(credentialId: string) {
    await requireAiGatewayAdmin();

    await prisma.aiProviderCredential.update({
        where: { id: credentialId },
        data: {
            status: "REVOKED",
            revokedAt: new Date(),
        },
    });

    await logAudit("REVOKE_API_KEY", "AiProviderCredential", credentialId);
    revalidatePath("/admin/ai/providers");
    return { success: true };
}

export async function testAiCredential(id: string) {
    await requireAiGatewayAdmin();

    const cred = await prisma.aiProviderCredential.findUnique({
        where: { id },
        include: { provider: true },
    });

    if (!cred) throw new Error("Credential not found");

    try {
        let secret: string;
        try {
            secret = decrypt(cred.encryptedSecret);
            if (!secret) throw new Error("Decrypted secret is empty");
        } catch (err: any) {
            throw new Error("Failed to decrypt secret: " + err.message);
        }

        const adapter = getAdapter(cred.provider.providerCode);
        if (!adapter?.testCredential) {
            throw new Error(
                `Credential test is not implemented for ${cred.provider.providerCode}`
            );
        }
        const res = await adapter.testCredential({
            baseUrl: cred.provider.baseUrl || "",
            decryptedSecret: secret,
            timeoutMs: 10000,
            modelId: cred.provider.defaultModelId || "",
        });
        if (!res.ok) {
            throw new Error(res.message || "Credential test failed");
        }

        await prisma.aiProvider.update({
            where: { id: cred.providerId },
            data: { healthStatus: "HEALTHY", healthCheckedAt: new Date() },
        });

        await prisma.aiProviderCredential.update({
            where: { id },
            data: {
                testedAt: new Date(),
                status: statusAfterSuccessfulCredentialTest(
                    cred.status,
                    cred.activatedAt
                ),
            },
        });

        await logAudit("TEST_API_KEY", "AiProviderCredential", id, {
            status: "SUCCESS",
        });
        revalidatePath("/admin/ai/providers");
        return { success: true };
    } catch {
        await prisma.aiProviderCredential.update({
            where: { id },
            data: { status: "INVALID" },
        });
        await logAudit("TEST_API_KEY", "AiProviderCredential", id, {
            status: "FAILED",
        });
        await prisma.aiProvider.update({
            where: { id: cred.providerId },
            data: { healthStatus: "DEGRADED", healthCheckedAt: new Date() },
        });
        throw new Error("Failed to test credential");
    }
}

export async function activateAiCredential(id: string) {
    await requireAiGatewayAdmin();

    const cred = await prisma.aiProviderCredential.findUnique({
        where: { id },
    });
    if (!cred) throw new Error("Credential not found");
    if (cred.status !== "TESTED") {
        throw new Error("Credential must be TESTED before activation.");
    }

    const activatedAt = new Date();
    await prisma.$transaction(async (tx) => {
        await tx.aiProviderCredential.updateMany({
            where: {
                providerId: cred.providerId,
                status: "ACTIVE",
                id: { not: id },
            },
            data: { status: "REVOKED", revokedAt: activatedAt },
        });
        await tx.aiProviderCredential.update({
            where: { id },
            data: {
                status: "ACTIVE",
                activatedAt,
                revokedAt: null,
            },
        });
    });

    await logAudit("ACTIVATE_API_KEY", "AiProviderCredential", id);
    revalidatePath("/admin/ai/providers");
    return { success: true };
}

export async function rotateAiCredential(
    providerId: string,
    oldCredId: string,
    newAlias: string,
    newSecret: string
) {
    const user = await requireAiGatewayAdmin();

    if (!newSecret || newSecret.trim() === "") {
        throw new Error("Secret key cannot be empty");
    }

    if (oldCredId) {
        const oldCredential = await prisma.aiProviderCredential.findUnique({
            where: { id: oldCredId },
        });
        if (!oldCredential || oldCredential.providerId !== providerId) {
            throw new Error(
                "Existing credential does not belong to this provider"
            );
        }
    }

    // Keep the old key active until the new DRAFT key is tested and activated.
    const encryptedSecret = encrypt(newSecret);
    const lastFour = newSecret.length >= 4 ? newSecret.slice(-4) : "***";

    const cred = await prisma.aiProviderCredential.create({
        data: {
            providerId,
            alias: newAlias,
            encryptedSecret,
            lastFour,
            status: "DRAFT",
            createdBy: user.id,
        },
    });

    await logAudit("PREPARE_API_KEY_ROTATION", "AiProvider", providerId, {
        oldCredId,
        newCredId: cred.id,
    });
    revalidatePath("/admin/ai/providers");
    return { success: true, id: cred.id };
}

export async function getAiRoutingPolicies() {
    await requireAiGatewayAdmin();

    return prisma.aiRoutingPolicy.findMany({
        orderBy: { createdAt: "desc" },
    });
}

export async function createAiRoutingPolicy(data: {
    name: string;
    mode: string;
    primaryModelId?: string;
    fallbackConfigJson?: any;
    timeoutMs?: number;
    maxAttempts?: number;
}) {
    const user = await requireAiGatewayAdmin();

    const name = data.name?.trim();
    if (!name) throw new Error("Policy name is required");
    if (data.mode !== "FIXED" && data.mode !== "AUTO_FAILOVER") {
        throw new Error("Routing mode must be FIXED or AUTO_FAILOVER");
    }
    if (!data.primaryModelId) {
        throw new Error("Primary model is required");
    }

    // Validate Primary Model
    const primaryModel = await prisma.aiModel.findUnique({
        where: { id: data.primaryModelId },
        include: { provider: true },
    });
    if (!primaryModel || !primaryModel.enabled) {
        throw new Error("Primary model must exist and be enabled");
    }
    if (!primaryModel.provider.enabled) {
        throw new Error("Primary model's provider must be enabled");
    }

    // Validate Fallback Config
    const fallbacks =
        data.mode === "AUTO_FAILOVER" && Array.isArray(data.fallbackConfigJson)
            ? (data.fallbackConfigJson as string[])
            : [];
    if (fallbacks.length > 0) {
        const uniqueFallbacks = new Set(fallbacks);
        if (uniqueFallbacks.size !== fallbacks.length) {
            throw new Error("Fallback models must be unique");
        }
        if (data.primaryModelId && uniqueFallbacks.has(data.primaryModelId)) {
            throw new Error("Fallback models cannot include the primary model");
        }
        for (const fbId of fallbacks) {
            const fbModel = await prisma.aiModel.findUnique({
                where: { id: fbId },
                include: { provider: true },
            });
            if (!fbModel || !fbModel.enabled) {
                throw new Error(
                    `Fallback model ${fbId} must exist and be enabled`
                );
            }
            if (!fbModel.provider.enabled) {
                throw new Error(
                    `Fallback model ${fbId} belongs to a disabled provider`
                );
            }
        }
    }

    const timeoutMs = data.timeoutMs ?? 30000;
    if (
        !Number.isInteger(timeoutMs) ||
        timeoutMs < 1000 ||
        timeoutMs > 120000
    ) {
        throw new Error("Timeout must be between 1000 and 120000 milliseconds");
    }
    const availableAttempts = 1 + fallbacks.length;
    const maxAttempts = data.maxAttempts ?? availableAttempts;
    if (
        !Number.isInteger(maxAttempts) ||
        maxAttempts < 1 ||
        maxAttempts > availableAttempts
    ) {
        throw new Error(
            `Max attempts must be between 1 and ${availableAttempts}`
        );
    }

    const policy = await prisma.aiRoutingPolicy.create({
        data: {
            name,
            mode: data.mode,
            primaryModelId: data.primaryModelId,
            fallbackConfigJson: fallbacks,
            timeoutMs,
            maxAttempts,
            createdBy: user.id,
            publishedAt: new Date(),
        },
    });

    await logAudit("CREATE_ROUTING_POLICY", "AiRoutingPolicy", policy.id, data);
    revalidatePath("/admin/ai/routes");
    return policy;
}

export async function getAiRequests(limit = 50) {
    await requireAiGatewayAdmin();

    return prisma.aiRequest.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            user: {
                select: {
                    id: true,
                    email: true,
                },
            },
            attempts: true,
        },
    });
}

export async function getAiGatewayStats() {
    await requireAiGatewayAdmin();

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const totalRequestsToday = await prisma.aiRequest.count({
        where: { createdAt: { gte: today } },
    });

    const requestsByStatus = await prisma.aiRequest.groupBy({
        by: ["status"],
        where: { createdAt: { gte: today } },
        _count: true,
    });

    const providers = await prisma.aiProvider.findMany({
        select: { displayName: true, healthStatus: true, providerCode: true },
    });

    const latencyResult = await prisma.aiRequest.aggregate({
        where: {
            createdAt: { gte: today },
            totalLatencyMs: { not: null },
        },
        _avg: {
            totalLatencyMs: true,
        },
    });

    const costResult = await prisma.aiRequest.aggregate({
        where: {
            createdAt: { gte: today },
            estimatedCostUsd: { not: null },
        },
        _sum: {
            estimatedCostUsd: true,
        },
    });

    const avgLatencyToday = Math.round(latencyResult._avg.totalLatencyMs || 0);
    const totalCostToday = costResult._sum.estimatedCostUsd || 0;

    return {
        totalRequestsToday,
        requestsByStatus,
        providers,
        avgLatencyToday,
        totalCostToday,
    };
}

export async function getAdminAuditLogs(limit = 50) {
    await requireAiGatewayAdmin();

    return prisma.adminAuditLog.findMany({
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
            admin: {
                select: {
                    id: true,
                    email: true,
                    name: true,
                },
            },
        },
    });
}

export async function getAiModels() {
    await requireAiGatewayAdmin();

    return prisma.aiModel.findMany({
        where: {
            enabled: true,
            provider: { enabled: true },
        },
        include: {
            provider: {
                select: {
                    providerCode: true,
                    displayName: true,
                },
            },
        },
        orderBy: [{ provider: { displayName: "asc" } }, { displayName: "asc" }],
    });
}
