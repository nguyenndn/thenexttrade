"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { encrypt, decrypt } from "@/lib/encryption";
import { revalidatePath } from "next/cache";

async function logAudit(action: string, entityType: string, entityId?: string, details?: any) {
  const user = await getAuthUser();
  if (user) {
    await prisma.adminAuditLog.create({
      data: {
        adminId: user.id,
        action,
        entityType,
        entityId,
        detailsJson: details || {},
      }
    });
  }
}

export async function getAiProviders() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");
  
  let providers = await prisma.aiProvider.findMany({
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
    orderBy: { createdAt: "asc" }
  });

  const defaults = [
    { providerEnum: 1, providerCode: "anthropic", displayName: "Anthropic (Claude)", defaultModelId: "claude-3-5-sonnet-latest", baseUrl: "https://api.anthropic.com/v1/messages" },
    { providerEnum: 2, providerCode: "openai", displayName: "OpenAI (GPT)", defaultModelId: "gpt-4o", baseUrl: "https://api.openai.com/v1/chat/completions" },
    { providerEnum: 3, providerCode: "google", displayName: "Google (Gemini)", defaultModelId: "gemini-1.5-pro", baseUrl: "generativelanguage.googleapis.com" },
    { providerEnum: 4, providerCode: "deepseek", displayName: "DeepSeek", defaultModelId: "deepseek-chat", baseUrl: "https://api.deepseek.com/v1/chat/completions" },
    { providerEnum: 5, providerCode: "xai", displayName: "xAI (Grok)", defaultModelId: "grok-beta", baseUrl: "https://api.x.ai/v1/chat/completions" },
  ];

  // Auto-sync / Seed defaults
  let needsRefetch = false;
  for (const d of defaults) {
    const existing = await prisma.aiProvider.findUnique({
      where: { providerCode: d.providerCode }
    });

    if (!existing) {
      await prisma.aiProvider.create({
        data: {
          providerEnum: d.providerEnum,
          providerCode: d.providerCode,
          displayName: d.displayName,
          defaultModelId: d.defaultModelId,
          baseUrl: d.baseUrl,
          enabled: true,
          healthStatus: "HEALTHY",
        }
      });
      needsRefetch = true;
    } else if (!existing.baseUrl) {
      await prisma.aiProvider.update({
        where: { id: existing.id },
        data: { baseUrl: d.baseUrl }
      });
      needsRefetch = true;
    }
  }

  if (needsRefetch) {
    providers = await prisma.aiProvider.findMany({
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
      orderBy: { createdAt: "asc" }
    });
  }

  return providers;
}

export async function createAiProvider(data: { providerCode: string; displayName: string; providerEnum: number; baseUrl?: string }) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const provider = await prisma.aiProvider.create({
    data: {
      providerCode: data.providerCode,
      displayName: data.displayName,
      providerEnum: data.providerEnum,
      baseUrl: data.baseUrl,
    }
  });
  
  await logAudit("CREATE_PROVIDER", "AiProvider", provider.id, { providerCode: data.providerCode });
  revalidatePath("/admin/ai/providers");
  return provider;
}

export async function updateAiProvider(id: string, data: { baseUrl?: string; defaultModelId?: string; timeoutMs?: number }) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const provider = await prisma.aiProvider.update({
    where: { id },
    data: {
      baseUrl: data.baseUrl,
      defaultModelId: data.defaultModelId,
      timeoutMs: data.timeoutMs,
    }
  });

  await logAudit("UPDATE_PROVIDER", "AiProvider", provider.id, data);
  revalidatePath("/admin/ai/providers");
  return provider;
}

export async function toggleAiProvider(id: string, enabled: boolean) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.aiProvider.update({
    where: { id },
    data: { enabled }
  });
  await logAudit("TOGGLE_PROVIDER", "AiProvider", id, { enabled });
  revalidatePath("/admin/ai/providers");
}

export async function addAiCredential(providerId: string, alias: string, secretKey: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const encryptedSecret = encrypt(secretKey);
  const lastFour = secretKey.length >= 4 ? secretKey.slice(-4) : "***";

  const cred = await prisma.aiProviderCredential.create({
    data: {
      providerId,
      alias,
      encryptedSecret,
      lastFour,
      status: "ACTIVE", // Defaulting to ACTIVE
      createdBy: user.id,
    }
  });

  await logAudit("ADD_API_KEY", "AiProviderCredential", cred.id, { providerId, alias });
  revalidatePath("/admin/ai/providers");
  return { success: true, id: cred.id };
}

export async function revokeAiCredential(credentialId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.aiProviderCredential.update({
    where: { id: credentialId },
    data: {
      status: "REVOKED",
      revokedAt: new Date(),
    }
  });

  await logAudit("REVOKE_API_KEY", "AiProviderCredential", credentialId);
  revalidatePath("/admin/ai/providers");
  return { success: true };
}

export async function testAiCredential(id: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // In a real scenario, this would decrypt the key and make a lightweight request (e.g. models list)
  // For now, we mock the success.
  await prisma.aiProviderCredential.update({
    where: { id },
    data: {
      testedAt: new Date(),
    }
  });

  await logAudit("TEST_API_KEY", "AiProviderCredential", id);
  revalidatePath("/admin/ai/providers");
  return { success: true };
}

export async function activateAiCredential(id: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  await prisma.aiProviderCredential.update({
    where: { id },
    data: {
      status: "ACTIVE",
      activatedAt: new Date(),
    }
  });

  await logAudit("ACTIVATE_API_KEY", "AiProviderCredential", id);
  revalidatePath("/admin/ai/providers");
  return { success: true };
}

export async function rotateAiCredential(providerId: string, oldCredId: string, newAlias: string, newSecret: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Revoke old
  if (oldCredId) {
    await prisma.aiProviderCredential.update({
      where: { id: oldCredId },
      data: { status: "REVOKED", revokedAt: new Date() }
    });
  }

  // Add new
  const encryptedSecret = encrypt(newSecret);
  const lastFour = newSecret.length >= 4 ? newSecret.slice(-4) : "***";

  const cred = await prisma.aiProviderCredential.create({
    data: {
      providerId,
      alias: newAlias,
      encryptedSecret,
      lastFour,
      status: "ACTIVE",
      activatedAt: new Date(),
      createdBy: user.id,
    }
  });

  await logAudit("ROTATE_API_KEY", "AiProvider", providerId, { oldCredId, newCredId: cred.id });
  revalidatePath("/admin/ai/providers");
  return { success: true, id: cred.id };
}

export async function getAiRoutingPolicies() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.aiRoutingPolicy.findMany({
    orderBy: { createdAt: "desc" }
  });
}

export async function createAiRoutingPolicy(data: { name: string; mode: string; primaryModelId?: string; fallbackConfigJson?: any; timeoutMs?: number; maxAttempts?: number }) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const policy = await prisma.aiRoutingPolicy.create({
    data: {
      name: data.name,
      mode: data.mode,
      primaryModelId: data.primaryModelId,
      fallbackConfigJson: data.fallbackConfigJson || [],
      timeoutMs: data.timeoutMs || 30000,
      maxAttempts: data.maxAttempts || 3,
      createdBy: user.id,
      publishedAt: new Date(),
    }
  });

  await logAudit("CREATE_ROUTING_POLICY", "AiRoutingPolicy", policy.id, data);
  revalidatePath("/admin/ai/routes");
  return policy;
}

export async function getAiRequests(limit = 50) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.aiRequest.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      user: {
        select: {
          id: true,
          email: true,
        }
      },
      attempts: true,
    }
  });
}

export async function getAiGatewayStats() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalRequestsToday = await prisma.aiRequest.count({
    where: { createdAt: { gte: today } }
  });

  const requestsByStatus = await prisma.aiRequest.groupBy({
    by: ['status'],
    where: { createdAt: { gte: today } },
    _count: true
  });

  const providers = await prisma.aiProvider.findMany({
    select: { displayName: true, healthStatus: true, providerCode: true }
  });

  const latencyResult = await prisma.aiRequest.aggregate({
    where: { 
      createdAt: { gte: today },
      totalLatencyMs: { not: null }
    },
    _avg: {
      totalLatencyMs: true
    }
  });

  const costResult = await prisma.aiRequest.aggregate({
    where: { 
      createdAt: { gte: today },
      estimatedCostUsd: { not: null }
    },
    _sum: {
      estimatedCostUsd: true
    }
  });

  const avgLatencyToday = Math.round(latencyResult._avg.totalLatencyMs || 0);
  const totalCostToday = costResult._sum.estimatedCostUsd || 0;

  return {
    totalRequestsToday,
    requestsByStatus,
    providers,
    avgLatencyToday,
    totalCostToday
  };
}

export async function getAdminAuditLogs(limit = 50) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  return prisma.adminAuditLog.findMany({
    take: limit,
    orderBy: { createdAt: "desc" },
    include: {
      admin: {
        select: {
          id: true,
          email: true,
          name: true,
        }
      }
    }
  });
}
