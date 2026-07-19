import { validateAndCleanResult, AiTradingResult } from "./result-schema";
import { resolveExecutionPlan } from "./execution-resolver";

export { getAdapter } from "./provider-registry";

export interface GatewayExecutionInput {
    requestId: string;
    snapshot: unknown;
    systemPrompt: string;
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
    providerRequestId?: string;
    finishReason?: string;
    completedAt: Date;
}

export interface GatewayExecutionResult {
    ok: boolean;
    normalizedResult?: AiTradingResult;
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

export async function executeAiGateway(
    input: GatewayExecutionInput
): Promise<GatewayExecutionResult> {
    const plan = await resolveExecutionPlan();
    const attempts: ProviderAttemptResult[] = [];

    if (!plan.policy) {
        return {
            ok: false,
            attempts,
            error_code: "NO_ROUTING_POLICY",
            message: "No active AI routing policy found.",
        };
    }
    if (plan.steps.length === 0) {
        return {
            ok: false,
            attempts,
            error_code: "NO_ROUTABLE_MODEL",
            message: "No routable model is available.",
            policyId: plan.policy.id,
            policyVersion: plan.policy.version,
        };
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
                timeoutMs: plan.policy.timeoutMs || provider.timeoutMs || 30000,
            });

            let errorCode = providerResult.error_code;
            let errorMessage = providerResult.message;
            let normalizedResult: AiTradingResult | undefined;
            if (providerResult.ok) {
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
                providerRequestId: providerResult.providerRequestId,
                finishReason: providerResult.finishReason,
                completedAt: new Date(),
            });

            if (normalizedResult) {
                return {
                    ok: true,
                    attempts,
                    selectedProviderId: provider.id,
                    selectedModelId: model.id,
                    normalizedResult,
                    policyId: plan.policy.id,
                    policyVersion: plan.policy.version,
                };
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

    return {
        ok: false,
        attempts,
        error_code: lastError?.error_code || "ALL_PROVIDERS_FAILED",
        message: lastError?.message || "All routing attempts failed.",
        policyId: plan.policy.id,
        policyVersion: plan.policy.version,
    };
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
    const plan = await resolveExecutionPlan();
    const attempts: ProviderAttemptResult[] = [];

    if (!plan.policy) {
        return {
            ok: false,
            attempts,
            error_code: "NO_ROUTING_POLICY",
            message: "No active AI routing policy found.",
        };
    }
    if (plan.steps.length === 0) {
        return {
            ok: false,
            attempts,
            error_code: "NO_ROUTABLE_MODEL",
            message: "No routable model is available.",
            policyId: plan.policy.id,
            policyVersion: plan.policy.version,
        };
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
                providerRequestId: providerResult.providerRequestId,
                finishReason: providerResult.finishReason,
                completedAt: new Date(),
            });

            if (providerResult.ok && providerResult.data) {
                return {
                    ok: true,
                    attempts,
                    selectedProviderId: provider.id,
                    selectedModelId: model.id,
                    result: providerResult.data,
                    policyId: plan.policy.id,
                    policyVersion: plan.policy.version,
                };
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

    return {
        ok: false,
        attempts,
        error_code: lastError?.error_code || "ALL_PROVIDERS_FAILED",
        message: lastError?.message || "All routing attempts failed.",
        policyId: plan.policy.id,
        policyVersion: plan.policy.version,
    };
}
