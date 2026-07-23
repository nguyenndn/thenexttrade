import {
    AiModel,
    AiProvider,
    AiProviderCredential,
    AiRoutingPolicy,
} from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { decrypt } from "@/lib/encryption";
import { getAdapter } from "./provider-registry";
import { AiGatewayProviderAdapter } from "./providers/types";
import { isAiTaskKey } from "./task-keys";

export interface ResolvedExecutionCandidate {
    model: AiModel;
    provider: AiProvider;
    credential: AiProviderCredential;
    decryptedSecret: string;
    adapter: AiGatewayProviderAdapter;
}

export interface SkippedExecutionCandidate {
    modelId?: string;
    providerId?: string;
    credentialId?: string;
    errorCode: string;
    reason: string;
}

export type ExecutionStep =
    | { kind: "candidate"; candidate: ResolvedExecutionCandidate }
    | { kind: "skipped"; diagnostic: SkippedExecutionCandidate };

export interface ExecutionPlan {
    policy: AiRoutingPolicy | null;
    modelIds: string[];
    steps: ExecutionStep[];
}

export async function resolveModelsToTry(taskKey?: string) {
    let policy = null;

    if (taskKey && !isAiTaskKey(taskKey)) {
        return { policy: null, modelsToTry: [] as string[] };
    }

    if (taskKey) {
        policy = await prisma.aiRoutingPolicy.findFirst({
            where: {
                enabled: true,
                publishedAt: { not: null },
                scopeType: "TASK",
                scopeValue: taskKey,
            },
            orderBy: { publishedAt: "desc" },
        });
    }

    if (!policy) {
        policy = await prisma.aiRoutingPolicy.findFirst({
            where: {
                enabled: true,
                publishedAt: { not: null },
                scopeType: "GLOBAL",
            },
            orderBy: { publishedAt: "desc" },
        });
    }

    if (!policy?.primaryModelId)
        return { policy: null, modelsToTry: [] as string[] };

    const fallbackIds =
        policy.mode === "AUTO_FAILOVER" &&
        Array.isArray(policy.fallbackConfigJson)
            ? policy.fallbackConfigJson.filter(
                  (id): id is string => typeof id === "string"
              )
            : [];
    return {
        policy,
        modelsToTry: [policy.primaryModelId, ...fallbackIds],
    };
}

export async function resolveAvailableModels(modelsToTry: string[]) {
    return prisma.aiModel.findMany({
        where: { id: { in: modelsToTry } },
        include: {
            provider: {
                include: {
                    credentials: {
                        where: { status: "ACTIVE" },
                        orderBy: { activatedAt: "desc" },
                    },
                },
            },
        },
    });
}

function isValidProviderUrl(baseUrl: string | null): boolean {
    if (!baseUrl) return false;
    try {
        const parsed = new URL(
            baseUrl.replace("{model}", "model").replace("{secret}", "secret")
        );
        return parsed.protocol === "https:";
    } catch {
        return false;
    }
}

export async function resolveExecutionPlan(
    taskKey?: string
): Promise<ExecutionPlan> {
    const { policy, modelsToTry } = await resolveModelsToTry(taskKey);
    if (!policy) return { policy: null, modelIds: [], steps: [] };

    const modelIds = modelsToTry.slice(0, Math.max(1, policy.maxAttempts));
    const models = await resolveAvailableModels(modelIds);
    const modelMap = new Map(models.map((model) => [model.id, model]));
    const steps: ExecutionStep[] = [];

    for (const modelId of modelIds) {
        const model = modelMap.get(modelId);
        if (!model) {
            steps.push({
                kind: "skipped",
                diagnostic: {
                    modelId,
                    errorCode: "MODEL_NOT_FOUND",
                    reason: "Configured model does not exist",
                },
            });
            continue;
        }
        const provider = model.provider;
        if (!model.enabled) {
            steps.push({
                kind: "skipped",
                diagnostic: {
                    modelId,
                    providerId: provider.id,
                    errorCode: "MODEL_DISABLED",
                    reason: "Configured model is disabled",
                },
            });
            continue;
        }
        if (!provider.enabled) {
            steps.push({
                kind: "skipped",
                diagnostic: {
                    modelId,
                    providerId: provider.id,
                    errorCode: "PROVIDER_DISABLED",
                    reason: "Provider is disabled",
                },
            });
            continue;
        }
        if (provider.healthStatus !== "HEALTHY") {
            steps.push({
                kind: "skipped",
                diagnostic: {
                    modelId,
                    providerId: provider.id,
                    errorCode: "PROVIDER_UNHEALTHY",
                    reason: "Provider health is not HEALTHY",
                },
            });
            continue;
        }
        if (!isValidProviderUrl(provider.baseUrl)) {
            steps.push({
                kind: "skipped",
                diagnostic: {
                    modelId,
                    providerId: provider.id,
                    errorCode: "PROVIDER_URL_INVALID",
                    reason: "Provider Base URL must be a valid HTTPS URL",
                },
            });
            continue;
        }

        const credential = provider.credentials.find(
            (item) => item.testedAt && item.activatedAt
        );
        if (!credential) {
            steps.push({
                kind: "skipped",
                diagnostic: {
                    modelId,
                    providerId: provider.id,
                    errorCode: "PROVIDER_CREDENTIAL_INVALID",
                    reason: "No tested and activated credential is available",
                },
            });
            continue;
        }
        const adapter = getAdapter(provider.providerCode);
        if (!adapter) {
            steps.push({
                kind: "skipped",
                diagnostic: {
                    modelId,
                    providerId: provider.id,
                    credentialId: credential.id,
                    errorCode: "UNSUPPORTED_PROVIDER",
                    reason: "Provider adapter is not registered",
                },
            });
            continue;
        }

        try {
            const decryptedSecret = decrypt(credential.encryptedSecret);
            if (!decryptedSecret) throw new Error("Empty credential");
            steps.push({
                kind: "candidate",
                candidate: {
                    model,
                    provider,
                    credential,
                    decryptedSecret,
                    adapter,
                },
            });
        } catch {
            steps.push({
                kind: "skipped",
                diagnostic: {
                    modelId,
                    providerId: provider.id,
                    credentialId: credential.id,
                    errorCode: "PROVIDER_CREDENTIAL_INVALID",
                    reason: "Credential cannot be decrypted",
                },
            });
        }
    }

    return { policy, modelIds, steps };
}
