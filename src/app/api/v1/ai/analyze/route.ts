import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { prisma } from "@/lib/prisma";
import {
    executeAiGateway,
    GatewayExecutionResult,
} from "@/lib/ai-gateway/provider-router";
import {
    validateTradingSafety,
    buildWaitFallback,
} from "@/lib/ai-gateway/safety-validator";
import {
    buildSystemPrompt,
    PROMPT_VERSION,
} from "@/lib/ai-gateway/prompt-builder";
import { API_RESPONSE_SCHEMA_VERSION } from "@/lib/ai-gateway/result-schema";
import {
    getUserQuotaUsage,
    reserveAiRequest,
} from "@/lib/ai-gateway/quota-service";

function usagePayload(quota: Awaited<ReturnType<typeof getUserQuotaUsage>>) {
    return {
        plan: quota.isPro ? "pro" : "free",
        daily_limit: quota.dailyLimit,
        used_today: quota.usedToday,
        remaining_today: quota.remainingToday,
    };
}

export async function POST(request: NextRequest) {
    let activeRequestId: string | undefined;
    try {
        const authHeader = request.headers.get("Authorization");
        if (!authHeader?.startsWith("Bearer ")) {
            return NextResponse.json(
                {
                    ok: false,
                    error_code: "INVALID_LICENSE",
                    message: "Missing or invalid token",
                },
                { status: 401 }
            );
        }

        const token = authHeader.slice("Bearer ".length).trim();
        const user = await prisma.user.findUnique({
            where: { syncApiKey: token },
            select: { id: true },
        });
        if (!user) {
            return NextResponse.json(
                {
                    ok: false,
                    error_code: "INVALID_LICENSE",
                    message: "License key is invalid or expired.",
                },
                { status: 401 }
            );
        }

        const body = await request.json();
        const snapshot = body.snapshot;
        if (!snapshot?.symbol) {
            return NextResponse.json(
                {
                    ok: false,
                    error_code: "SNAPSHOT_INVALID",
                    message: "Invalid snapshot data.",
                },
                { status: 400 }
            );
        }

        const clientRequestId =
            body.analysis?.request_id || `srv_${randomUUID()}`;
        const reservation = await reserveAiRequest({
            requestId: clientRequestId,
            userId: user.id,
            symbol: snapshot.symbol,
            timeframe: snapshot.chart_timeframe || snapshot.timeframe,
            analysisMode: body.analysis?.mode === "AUTO" ? "AUTO" : "MANUAL",
            promptVersion: PROMPT_VERSION,
            taskKey: "TRADE_ANALYSIS",
        });

        if (reservation.status === "DUPLICATE") {
            return NextResponse.json(
                {
                    ok: false,
                    error_code: "DUPLICATE_REQUEST",
                    message: "Request ID already processed.",
                },
                { status: 409 }
            );
        }
        if (reservation.status === "QUOTA_EXCEEDED") {
            const quota = await getUserQuotaUsage(user.id);
            return NextResponse.json(
                {
                    ok: false,
                    error_code: "AI_QUOTA_EXCEEDED",
                    message: "Daily AI quota limit reached for your plan.",
                    usage: usagePayload(quota),
                },
                { status: 429 }
            );
        }
        const aiRequest = reservation.aiRequest;
        activeRequestId = aiRequest.id;
        const gatewayStart = Date.now();
        let gatewayResult: GatewayExecutionResult;
        try {
            gatewayResult = await executeAiGateway({
                requestId: clientRequestId,
                userId: user.id,
                snapshot,
                systemPrompt: buildSystemPrompt(),
                taskKey: "TRADE_ANALYSIS",
            });
        } catch {
            gatewayResult = {
                ok: false,
                attempts: [],
                error_code: "SERVER_ERROR",
                message: "Gateway execution failed unexpectedly.",
            };
        }
        const totalLatencyMs = Date.now() - gatewayStart;

        let totalInputTokens = 0;
        let totalOutputTokens = 0;
        for (const attempt of gatewayResult.attempts) {
            totalInputTokens += attempt.inputTokens || 0;
            totalOutputTokens += attempt.outputTokens || 0;
        }

        if (!gatewayResult.ok || !gatewayResult.normalizedResult) {
            await prisma.aiRequest.update({
                where: { id: aiRequest.id },
                data: {
                    status: "FAILED",
                    totalLatencyMs,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    errorCode: gatewayResult.error_code || "SERVER_ERROR",
                    routingPolicyId: gatewayResult.policyId,
                    routingPolicyVersion: gatewayResult.policyVersion,
                    completedAt: new Date(),
                },
            });
            activeRequestId = undefined;
            const quota = await getUserQuotaUsage(user.id);
            return NextResponse.json(
                {
                    ok: false,
                    error_code: gatewayResult.error_code || "SERVER_ERROR",
                    message: gatewayResult.message || "Provider failed",
                    usage: usagePayload(quota),
                },
                { status: 502 }
            );
        }

        const parsedResult = gatewayResult.normalizedResult;
        if (
            parsedResult.action === "BUY" &&
            parsedResult.entry > parsedResult.sl
        ) {
            parsedResult.rr = Number(
                (
                    (parsedResult.tp1 - parsedResult.entry) /
                    (parsedResult.entry - parsedResult.sl)
                ).toFixed(2)
            );
        } else if (
            parsedResult.action === "SELL" &&
            parsedResult.sl > parsedResult.entry
        ) {
            parsedResult.rr = Number(
                (
                    (parsedResult.entry - parsedResult.tp1) /
                    (parsedResult.sl - parsedResult.entry)
                ).toFixed(2)
            );
        } else parsedResult.rr = 0;

        if (
            parsedResult.reference_action === "BUY" &&
            parsedResult.reference_entry > parsedResult.reference_sl
        ) {
            parsedResult.reference_rr = Number(
                (
                    (parsedResult.reference_tp1 -
                        parsedResult.reference_entry) /
                    (parsedResult.reference_entry - parsedResult.reference_sl)
                ).toFixed(2)
            );
        } else if (
            parsedResult.reference_action === "SELL" &&
            parsedResult.reference_sl > parsedResult.reference_entry
        ) {
            parsedResult.reference_rr = Number(
                (
                    (parsedResult.reference_entry -
                        parsedResult.reference_tp1) /
                    (parsedResult.reference_sl - parsedResult.reference_entry)
                ).toFixed(2)
            );
        } else parsedResult.reference_rr = 0;

        const safety = validateTradingSafety(parsedResult, snapshot);
        if (!safety.ok) {
            await prisma.aiRequest.update({
                where: { id: aiRequest.id },
                data: {
                    status: "REJECTED",
                    totalLatencyMs,
                    inputTokens: totalInputTokens,
                    outputTokens: totalOutputTokens,
                    action: "WAIT",
                    errorCode: "SAFETY_REJECTED",
                    safetyResultJson: {
                        status: "REJECTED",
                        reason: safety.reason,
                    },
                    completedAt: new Date(),
                },
            });
            activeRequestId = undefined;
            const quota = await getUserQuotaUsage(user.id);
            return NextResponse.json({
                ...buildWaitFallback(
                    safety.reason || "Validation failed",
                    clientRequestId
                ),
                schema_version: API_RESPONSE_SCHEMA_VERSION,
                usage: usagePayload(quota),
            });
        }

        await prisma.aiRequest.update({
            where: { id: aiRequest.id },
            data: {
                status: "COMPLETED",
                totalLatencyMs,
                inputTokens: totalInputTokens,
                outputTokens: totalOutputTokens,
                action: parsedResult.action,
                normalizedResponseJson: parsedResult,
                safetyResultJson: { status: "PASSED" },
                routingPolicyId: gatewayResult.policyId,
                routingPolicyVersion: gatewayResult.policyVersion,
                completedAt: new Date(),
            },
        });
        activeRequestId = undefined;
        const quota = await getUserQuotaUsage(user.id);
        return NextResponse.json({
            ok: true,
            provider_hidden: true,
            request_id: clientRequestId,
            schema_version: API_RESPONSE_SCHEMA_VERSION,
            ...parsedResult,
            server_validation: {
                schema_valid: true,
                safety_valid: true,
                fallback_used:
                    gatewayResult.attempts.filter(
                        (attempt) => (attempt.latencyMs || 0) > 0
                    ).length > 1,
                model_provider: "hidden",
                model_alias: "gsn-pa-scalper-v1",
            },
            usage: usagePayload(quota),
        });
    } catch {
        if (activeRequestId) {
            await prisma.aiRequest
                .updateMany({
                    where: {
                        id: activeRequestId,
                        status: {
                            in: ["RECEIVED", "ROUTING", "CALLING_PROVIDER"],
                        },
                    },
                    data: {
                        status: "FAILED",
                        errorCode: "SERVER_ERROR",
                        completedAt: new Date(),
                    },
                })
                .catch(() => undefined);
        }
        return NextResponse.json(
            {
                ok: false,
                error_code: "SERVER_ERROR",
                message: "Internal server error",
            },
            { status: 500 }
        );
    }
}
