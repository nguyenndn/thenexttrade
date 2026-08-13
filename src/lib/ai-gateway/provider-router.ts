import { validateAndCleanResult, AiTradingResult } from "./result-schema";
import { resolveExecutionPlan } from "./execution-resolver";
import { prisma } from "@/lib/prisma";

export { getAdapter } from "./provider-registry";

export interface GatewayExecutionInput {
    requestId: string;
    userId?: string;
    snapshot: unknown;
    systemPrompt: string;
    taskKey?: string;
    skipTradingSchemaValidation?: boolean;
    /** Base64-encoded image data for Vision/multimodal requests */
    imageBase64?: string;
    /** MIME type of the image (e.g. "image/png", "image/jpeg") */
    imageMimeType?: string;
}

export interface ProviderAttemptResult {
    providerId?: string;
    modelId?: string;
    credentialId?: string;
    latencyMs: number;
    httpStatus?: number;
    error_code?: string;
    errorMessageRedacted?: string;
    inputTokens?: number;
    outputTokens?: number;
    estimatedCostUsd?: number;
    providerRequestId?: string;
    finishReason?: string;
    completedAt: Date;
}

function estimateModelCost(
    model: {
        inputCostPerMillion: number | null;
        outputCostPerMillion: number | null;
    },
    inputTokens?: number,
    outputTokens?: number
) {
    if (
        model.inputCostPerMillion == null ||
        model.outputCostPerMillion == null
    ) {
        return undefined;
    }

    return (
        ((inputTokens || 0) / 1_000_000) * model.inputCostPerMillion +
        ((outputTokens || 0) / 1_000_000) * model.outputCostPerMillion
    );
}

export interface GatewayExecutionResult {
    ok: boolean;
    normalizedResult?: AiTradingResult;
    rawResult?: any;
    attempts: ProviderAttemptResult[];
    selectedProviderId?: string;
    selectedModelId?: string;
    error_code?: string;
    message?: string;
    policyId?: string;
    policyVersion?: number;
}

function redactProviderError(
    message: string | undefined,
    secret: string
): string | undefined {
    if (!message) return undefined;
    let redacted = message.split(secret).join("[REDACTED]");
    redacted = redacted.replace(
        /(authorization|api[-_ ]?key)\s*[:=]\s*\S+/gi,
        "$1=[REDACTED]"
    );
    redacted = redacted.replace(/([?&]key=)[^&\s]+/gi, "$1[REDACTED]");
    return redacted.slice(0, 500);
}

function isAuditPersistenceError(error: unknown): boolean {
    return (
        error instanceof Error &&
        error.message === "AI_AUDIT_PERSISTENCE_FAILED"
    );
}

async function saveGatewayAuditRecord(
    input: GatewayExecutionInput,
    ok: boolean,
    attempts: ProviderAttemptResult[],
    startedAt: number,
    errorCode?: string,
    policyId?: string,
    policyVersion?: number
) {
    try {
        const totalLatencyMs = Date.now() - startedAt;
        const totalInputTokens = attempts.reduce(
            (sum, a) => sum + (a.inputTokens || 0),
            0
        );
        const totalOutputTokens = attempts.reduce(
            (sum, a) => sum + (a.outputTokens || 0),
            0
        );
        const pricedAttempts = attempts.filter(
            (attempt) => attempt.estimatedCostUsd !== undefined
        );
        const estimatedCostUsd =
            pricedAttempts.length === 0
                ? null
                : pricedAttempts.reduce(
                      (sum, attempt) => sum + (attempt.estimatedCostUsd || 0),
                      0
                  );

        const existing = await prisma.aiRequest.findUnique({
            where: { requestId: input.requestId },
        });

        const status = ok
            ? "COMPLETED"
            : errorCode === "SAFETY_REJECTED"
              ? "REJECTED"
              : "FAILED";

        let aiRequestId = existing?.id;

        if (existing) {
            await prisma.aiRequest.update({
                where: { id: existing.id },
                data: {
                    status,
                    userId: input.userId || existing.userId,
                    taskKey: input.taskKey || existing.taskKey,
                    routingPolicyId: policyId || existing.routingPolicyId,
                    routingPolicyVersion:
                        policyVersion || existing.routingPolicyVersion,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    totalLatencyMs,
                    estimatedCostUsd,
                    errorCode: errorCode || null,
                    completedAt: new Date(),
                },
            });
        } else {
            const created = await prisma.aiRequest.create({
                data: {
                    requestId: input.requestId,
                    userId: input.userId || null,
                    taskKey: input.taskKey || "TRADE_ANALYSIS",
                    status,
                    routingPolicyId: policyId || null,
                    routingPolicyVersion: policyVersion || null,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    totalLatencyMs,
                    estimatedCostUsd,
                    errorCode: errorCode || null,
                    completedAt: new Date(),
                },
            });
            aiRequestId = created.id;
        }

        if (aiRequestId && attempts.length > 0) {
            const existingAttempts = await prisma.aiRequestAttempt.findMany({
                where: { aiRequestId },
                select: { attemptNumber: true },
            });
            const existingAttemptNumbers = new Set(
                existingAttempts.map((attempt) => attempt.attemptNumber)
            );
            const attemptsToPersist = attempts
                .map((attempt, index) => ({ attempt, attemptNumber: index + 1 }))
                .filter(({ attemptNumber }) => !existingAttemptNumbers.has(attemptNumber));

            if (attemptsToPersist.length > 0) {
                await prisma.aiRequestAttempt.createMany({
                    data: attemptsToPersist.map(({ attempt, attemptNumber }) => ({
                        aiRequestId: aiRequestId!,
                        attemptNumber,
                        providerId: attempt.providerId || null,
                        modelId: attempt.modelId || null,
                        credentialId: attempt.credentialId || null,
                        status: attempt.error_code ? "FAILED" : "COMPLETED",
                        latencyMs: attempt.latencyMs,
                        httpStatus: attempt.httpStatus || null,
                        errorCode: attempt.error_code || null,
                        errorMessageRedacted:
                            attempt.errorMessageRedacted || null,
                        inputTokens: attempt.inputTokens || 0,
                        outputTokens: attempt.outputTokens || 0,
                        estimatedCostUsd: attempt.estimatedCostUsd ?? null,
                        providerRequestId: attempt.providerRequestId || null,
                        finishReason: attempt.finishReason || null,
                        completedAt: attempt.completedAt || new Date(),
                    })),
                });
            }
        }
    } catch (err) {
        console.error("[AI Gateway Audit Log Error]:", err);
        try {
            await prisma.aiRequest.updateMany({
                where: { requestId: input.requestId },
                data: {
                    status: "FAILED",
                    errorCode: "AI_AUDIT_PERSISTENCE_FAILED",
                    completedAt: new Date(),
                },
            });
        } catch (finalizeError) {
            console.error(
                "[AI Gateway Audit Finalization Error]:",
                finalizeError
            );
        }
        throw new Error("AI_AUDIT_PERSISTENCE_FAILED");
    }
}

export async function executeAiGateway(
    input: GatewayExecutionInput
): Promise<GatewayExecutionResult> {
    const gatewayStartedAt = Date.now();
    const attempts: ProviderAttemptResult[] = [];
    let plan;
    try {
        plan = await resolveExecutionPlan(input.taskKey);
    } catch {
        const res = {
            ok: false,
            attempts,
            error_code: "ROUTING_RESOLUTION_FAILED",
            message: "AI routing plan could not be resolved.",
        };
        await saveGatewayAuditRecord(
            input,
            res.ok,
            res.attempts,
            gatewayStartedAt,
            res.error_code
        );
        return res;
    }

    if (!plan.policy) {
        const res = {
            ok: false,
            attempts,
            error_code: "NO_ROUTING_POLICY",
            message: "No active AI routing policy found.",
        };
        await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, res.error_code);
        return res;
    }
    if (plan.steps.length === 0) {
        const res = {
            ok: false,
            attempts,
            error_code: "NO_ROUTABLE_MODEL",
            message: "No routable model is available.",
            policyId: plan.policy.id,
            policyVersion: plan.policy.version,
        };
        await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, res.error_code, res.policyId, res.policyVersion);
        return res;
    }

    let lastError: { error_code: string; message: string } | undefined;

    for (const step of plan.steps) {
        if (step.kind === "skipped") {
            attempts.push({
                providerId: step.diagnostic.providerId,
                modelId: step.diagnostic.modelId,
                credentialId: step.diagnostic.credentialId,
                latencyMs: 0,
                error_code: step.diagnostic.errorCode,
                errorMessageRedacted: step.diagnostic.reason,
                completedAt: new Date(),
            });
            lastError = {
                error_code: step.diagnostic.errorCode,
                message: step.diagnostic.reason,
            };
            continue;
        }

        const candidate = step.candidate;
        const { model, provider, credential, decryptedSecret, adapter } =
            candidate;
        const startedAt = Date.now();
        try {
            const providerResult = await adapter.execute({
                requestId: input.requestId,
                baseUrl: provider.baseUrl || "",
                modelId: model.modelCode,
                decryptedSecret,
                systemPrompt: input.systemPrompt,
                snapshot: input.snapshot,
                timeoutMs: input.imageBase64
                    ? Math.max(plan.policy.timeoutMs || provider.timeoutMs || 30000, 60000)
                    : plan.policy.timeoutMs || provider.timeoutMs || 30000,
                imageBase64: input.imageBase64,
                imageMimeType: input.imageMimeType,
            });

            let errorCode = providerResult.error_code;
            let errorMessage = providerResult.message;
            let normalizedResult: AiTradingResult | undefined;
            if (providerResult.ok) {
                if (input.skipTradingSchemaValidation) {
                    attempts.push({
                        providerId: provider.id,
                        modelId: model.id,
                        credentialId: credential.id,
                        latencyMs: Date.now() - startedAt,
                        httpStatus: providerResult.httpStatus,
                        inputTokens: providerResult.inputTokens,
                        outputTokens: providerResult.outputTokens,
                        estimatedCostUsd: estimateModelCost(
                            model,
                            providerResult.inputTokens,
                            providerResult.outputTokens
                        ),
                        providerRequestId: providerResult.providerRequestId,
                        finishReason: providerResult.finishReason,
                        completedAt: new Date(),
                    });
                    const res = {
                        ok: true,
                        attempts,
                        selectedProviderId: provider.id,
                        selectedModelId: model.id,
                        rawResult: providerResult.data,
                        policyId: plan.policy.id,
                        policyVersion: plan.policy.version,
                    };
                    await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, undefined, res.policyId, res.policyVersion);
                    return res;
                }
                const validation = validateAndCleanResult(providerResult.data);
                if (validation.ok) normalizedResult = validation.data;
                else {
                    errorCode = "MODEL_RESPONSE_INVALID";
                    errorMessage = "Model response failed schema validation.";
                }
            }

            attempts.push({
                providerId: provider.id,
                modelId: model.id,
                credentialId: credential.id,
                latencyMs: Date.now() - startedAt,
                httpStatus: providerResult.httpStatus,
                error_code: errorCode,
                errorMessageRedacted: redactProviderError(
                    errorMessage,
                    decryptedSecret
                ),
                inputTokens: providerResult.inputTokens,
                outputTokens: providerResult.outputTokens,
                estimatedCostUsd: estimateModelCost(
                    model,
                    providerResult.inputTokens,
                    providerResult.outputTokens
                ),
                providerRequestId: providerResult.providerRequestId,
                finishReason: providerResult.finishReason,
                completedAt: new Date(),
            });

            if (normalizedResult) {
                const res = {
                    ok: true,
                    attempts,
                    selectedProviderId: provider.id,
                    selectedModelId: model.id,
                    normalizedResult,
                    policyId: plan.policy.id,
                    policyVersion: plan.policy.version,
                };
                await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, undefined, res.policyId, res.policyVersion);
                return res;
            }

            lastError = {
                error_code: errorCode || "MODEL_PROVIDER_ERROR",
                message:
                    redactProviderError(errorMessage, decryptedSecret) ||
                    "Provider request failed.",
            };
            if (
                ["PROVIDER_AUTH_ERROR", "PROVIDER_CREDENTIAL_INVALID"].includes(
                    lastError.error_code
                )
            )
                break;
        } catch (error) {
            if (isAuditPersistenceError(error)) {
                throw error;
            }
            const message =
                error instanceof Error
                    ? error.message
                    : "Provider adapter failed unexpectedly.";
            attempts.push({
                providerId: provider.id,
                modelId: model.id,
                credentialId: credential.id,
                latencyMs: Date.now() - startedAt,
                error_code: "PROVIDER_CONNECTION_ERROR",
                errorMessageRedacted: redactProviderError(
                    message,
                    decryptedSecret
                ),
                completedAt: new Date(),
            });
            lastError = {
                error_code: "PROVIDER_CONNECTION_ERROR",
                message: "Provider adapter failed unexpectedly.",
            };
        }
    }

    const res = {
        ok: false,
        attempts,
        error_code: lastError?.error_code || "ALL_PROVIDERS_FAILED",
        message: lastError?.message || "All routing attempts failed.",
        policyId: plan.policy.id,
        policyVersion: plan.policy.version,
    };
    await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, res.error_code, res.policyId, res.policyVersion);
    return res;
}

export interface CoachGatewayExecutionResult {
    ok: boolean;
    result?: string;
    attempts: ProviderAttemptResult[];
    selectedProviderId?: string;
    selectedModelId?: string;
    error_code?: string;
    message?: string;
    policyId?: string;
    policyVersion?: number;
}

export async function executeCoachGateway(
    input: GatewayExecutionInput
): Promise<CoachGatewayExecutionResult> {
    const gatewayStartedAt = Date.now();
    const attempts: ProviderAttemptResult[] = [];
    let plan;
    try {
        plan = await resolveExecutionPlan(input.taskKey);
    } catch {
        const res = {
            ok: false,
            attempts,
            error_code: "ROUTING_RESOLUTION_FAILED",
            message: "AI routing plan could not be resolved.",
        };
        await saveGatewayAuditRecord(
            input,
            res.ok,
            res.attempts,
            gatewayStartedAt,
            res.error_code
        );
        return res;
    }

    if (!plan.policy) {
        const res = {
            ok: false,
            attempts,
            error_code: "NO_ROUTING_POLICY",
            message: "No active AI routing policy found.",
        };
        await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, res.error_code);
        return res;
    }
    if (plan.steps.length === 0) {
        const res = {
            ok: false,
            attempts,
            error_code: "NO_ROUTABLE_MODEL",
            message: "No routable model is available.",
            policyId: plan.policy.id,
            policyVersion: plan.policy.version,
        };
        await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, res.error_code, res.policyId, res.policyVersion);
        return res;
    }

    let lastError: { error_code: string; message: string } | undefined;

    for (const step of plan.steps) {
        if (step.kind === "skipped") {
            attempts.push({
                providerId: step.diagnostic.providerId,
                modelId: step.diagnostic.modelId,
                credentialId: step.diagnostic.credentialId,
                latencyMs: 0,
                error_code: step.diagnostic.errorCode,
                errorMessageRedacted: step.diagnostic.reason,
                completedAt: new Date(),
            });
            lastError = {
                error_code: step.diagnostic.errorCode,
                message: step.diagnostic.reason,
            };
            continue;
        }

        const candidate = step.candidate;
        const { model, provider, credential, decryptedSecret, adapter } =
            candidate;
        const startedAt = Date.now();
        try {
            const providerResult = await adapter.execute({
                requestId: input.requestId,
                baseUrl: provider.baseUrl || "",
                modelId: model.modelCode,
                decryptedSecret,
                systemPrompt: input.systemPrompt,
                snapshot: input.snapshot,
                timeoutMs: plan.policy.timeoutMs || provider.timeoutMs || 60000, // Coach might take longer
            });

            attempts.push({
                providerId: provider.id,
                modelId: model.id,
                credentialId: credential.id,
                latencyMs: Date.now() - startedAt,
                httpStatus: providerResult.httpStatus,
                error_code: providerResult.error_code,
                errorMessageRedacted: redactProviderError(
                    providerResult.message,
                    decryptedSecret
                ),
                inputTokens: providerResult.inputTokens,
                outputTokens: providerResult.outputTokens,
                estimatedCostUsd: estimateModelCost(
                    model,
                    providerResult.inputTokens,
                    providerResult.outputTokens
                ),
                providerRequestId: providerResult.providerRequestId,
                finishReason: providerResult.finishReason,
                completedAt: new Date(),
            });

            if (providerResult.ok && providerResult.data) {
                const res = {
                    ok: true,
                    attempts,
                    selectedProviderId: provider.id,
                    selectedModelId: model.id,
                    result: providerResult.data,
                    policyId: plan.policy.id,
                    policyVersion: plan.policy.version,
                };
                await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, undefined, res.policyId, res.policyVersion);
                return res;
            }

            lastError = {
                error_code: providerResult.error_code || "MODEL_PROVIDER_ERROR",
                message:
                    redactProviderError(
                        providerResult.message,
                        decryptedSecret
                    ) || "Provider request failed.",
            };
            if (
                ["PROVIDER_AUTH_ERROR", "PROVIDER_CREDENTIAL_INVALID"].includes(
                    lastError.error_code
                )
            )
                break;
        } catch (error) {
            if (isAuditPersistenceError(error)) {
                throw error;
            }
            const message =
                error instanceof Error
                    ? error.message
                    : "Provider adapter failed unexpectedly.";
            attempts.push({
                providerId: provider.id,
                modelId: model.id,
                credentialId: credential.id,
                latencyMs: Date.now() - startedAt,
                error_code: "PROVIDER_CONNECTION_ERROR",
                errorMessageRedacted: redactProviderError(
                    message,
                    decryptedSecret
                ),
                completedAt: new Date(),
            });
            lastError = {
                error_code: "PROVIDER_CONNECTION_ERROR",
                message: "Provider adapter failed unexpectedly.",
            };
        }
    }

    const res = {
        ok: false,
        attempts,
        error_code: lastError?.error_code || "ALL_PROVIDERS_FAILED",
        message: lastError?.message || "All routing attempts failed.",
        policyId: plan.policy.id,
        policyVersion: plan.policy.version,
    };
    await saveGatewayAuditRecord(input, res.ok, res.attempts, gatewayStartedAt, res.error_code, res.policyId, res.policyVersion);
    return res;
}
