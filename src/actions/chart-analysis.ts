"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { reserveAiRequest } from "@/lib/ai-gateway/quota-service";
import { executeAiGateway } from "@/lib/ai-gateway/provider-router";
import {
    buildChartAnalysisSystemPrompt,
    CHART_ANALYSIS_PROMPT_VERSION,
} from "@/lib/ai-gateway/chart-analysis-prompt";
import { captureTradingViewChartServerSide } from "@/lib/ai-gateway/server-chart-capture";
import { randomUUID } from "node:crypto";

const MAX_IMAGE_SIZE = 4 * 1024 * 1024; // 4MB
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];

export interface ChartAnalysisInput {
    prompt?: string;
}

export interface ChartAnalysisResult {
    ok: boolean;
    capturedImagePreview?: string;
    data?: {
        action: string;
        confidence: number;
        market_analysis: string;
        short_term_trend: string;
        price_forecast: string;
        reason: string;
        invalidation: string;
        risk_note: string;
        entry: number;
        sl: number;
        tp1: number;
        tp2: number;
        tp3: number;
        rr: number;
        reference_action: string;
        reference_order_type: string;
        reference_trigger: string;
        reference_entry: number;
        reference_sl: number;
        reference_tp1: number;
        reference_tp2: number;
        reference_tp3: number;
        reference_rr: number;
    };
    error?: string;
    errorCode?: string;
    quota?: {
        isPro: boolean;
        dailyLimit: number;
        usedToday: number;
        remainingToday: number;
    };
}

export async function analyzeChartImage(
    formData: FormData
): Promise<ChartAnalysisResult> {
    // 1. Auth check
    const user = await getAuthUser();
    if (!user) {
        return {
            ok: false,
            error: "Login required to use AI Chart Analysis.",
            errorCode: "LOGIN_REQUIRED",
        };
    }

    // 1b. Pro gate — AI Chart Analysis is the most expensive capability (vision
    // model + headless browser capture). Mirror ai-coach.ts: hard-gate on Pro so
    // free users can't burn real provider dollars via the shared free quota pool.
    const { getUserProAccess } = await import("@/lib/pro-access");
    const pro = await getUserProAccess(user.id);
    if (!pro.isPro) {
        return {
            ok: false,
            error: "AI Chart Analysis is a Pro feature. Unlock Pro for free by verifying as a VIP trader.",
            errorCode: "PRO_REQUIRED",
        };
    }

    // 2. Extract inputs
    const imageFile = formData.get("image") as File | null;
    const userPrompt = (formData.get("prompt") as string) || "";
    const symbol = (formData.get("symbol") as string) || "OANDA:XAUUSD";
    const timeframe = (formData.get("timeframe") as string) || "60";
    const theme = ((formData.get("theme") as string) || "dark") as "dark" | "light";

    let imageBase64: string;
    let imageMimeType: string;

    if (imageFile && imageFile.size > 0) {
        // Validation for user-uploaded/pasted file
        if (!ALLOWED_MIME_TYPES.includes(imageFile.type)) {
            return {
                ok: false,
                error: "Only JPEG, PNG, and WebP images are supported.",
                errorCode: "INVALID_IMAGE_TYPE",
            };
        }

        if (imageFile.size > MAX_IMAGE_SIZE) {
            return {
                ok: false,
                error: "Image must be under 4MB.",
                errorCode: "IMAGE_TOO_LARGE",
            };
        }

        const arrayBuffer = await imageFile.arrayBuffer();
        imageBase64 = Buffer.from(arrayBuffer).toString("base64");
        imageMimeType = imageFile.type;
    } else {
        // Zero-click server-side auto capture
        try {
            const pngBuffer = await captureTradingViewChartServerSide({
                symbol,
                interval: timeframe,
                theme,
            });
            imageBase64 = pngBuffer.toString("base64");
            imageMimeType = "image/png";
        } catch (err: any) {
            return {
                ok: false,
                error:
                    err?.message ||
                    "Could not capture chart automatically. Please upload a screenshot.",
                errorCode: "CAPTURE_FAILED",
            };
        }
    }

    // 3. Reserve quota
    const requestId = randomUUID();
    const reservation = await reserveAiRequest({
        requestId,
        userId: user.id,
        symbol: "AUTO_DETECT",
        timeframe: "AUTO_DETECT",
        analysisMode: "CHART_VISION",
        promptVersion: CHART_ANALYSIS_PROMPT_VERSION,
        taskKey: "CHART_ANALYSIS",
    });

    if (reservation.status === "QUOTA_EXCEEDED") {
        return {
            ok: false,
            error: "Daily AI analysis limit reached. Upgrade to Pro for more.",
            errorCode: "QUOTA_EXCEEDED",
            quota: reservation.quota,
        };
    }

    if (reservation.status === "DUPLICATE") {
        return { ok: false, error: "Duplicate request.", errorCode: "DUPLICATE" };
    }

    // 4. Build prompt
    const systemPrompt = buildChartAnalysisSystemPrompt();
    const userContext = [
        "Identify the symbol (instrument) and timeframe directly from the chart image.",
        userPrompt ? `User request: ${userPrompt}` : "",
        "Analyze the attached chart image and provide your trading analysis in the required JSON format.",
    ]
        .filter(Boolean)
        .join("\n");

    // 5. Execute AI Gateway
    try {
        const result = await executeAiGateway({
            requestId,
            userId: user.id,
            snapshot: userContext,
            systemPrompt,
            taskKey: "CHART_ANALYSIS",
            skipTradingSchemaValidation: false,
            imageBase64,
            imageMimeType,
        });

        if (!result.ok) {
            return {
                ok: false,
                error: result.message || "AI analysis failed. Please try again.",
                errorCode: result.error_code,
                quota:
                    reservation.status === "RESERVED"
                        ? reservation.quota
                        : undefined,
            };
        }

        return {
            ok: true,
            capturedImagePreview: `data:${imageMimeType};base64,${imageBase64}`,
            data: result.normalizedResult,
            quota:
                reservation.status === "RESERVED"
                    ? reservation.quota
                    : undefined,
        };
    } catch (error) {
        console.error("[Chart Analysis Error]:", error);
        return {
            ok: false,
            error: "An unexpected error occurred. Please try again.",
            errorCode: "INTERNAL_ERROR",
        };
    }
}
