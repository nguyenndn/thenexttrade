import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getUserProAccess } from "@/lib/pro-access";

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY;

// Rate limits
const PRO_LIMIT = 100;
const FREE_LIMIT = 10;

// Safety validator
function validateTradingSafety(result: any, snapshot: any) {
  const currentPrice = snapshot?.price?.current ?? snapshot?.price?.bid ?? 0;
  
  if (!["BUY", "SELL", "WAIT"].includes(result.action)) {
    return { ok: false, reason: "Invalid action." };
  }

  if (["BUY STOP", "SELL STOP", "STOP", "BREAKOUT STOP"].includes(result.reference_order_type)) {
    return { ok: false, reason: "Stop orders are disabled." };
  }

  if (result.reference_action === "SELL" && result.reference_entry > 0 && result.reference_entry < currentPrice) {
    return { ok: false, reason: "SELL reference entry below current price is stop-style." };
  }

  if (result.reference_action === "BUY" && result.reference_entry > 0 && result.reference_entry > currentPrice) {
    return { ok: false, reason: "BUY reference entry above current price is stop-style." };
  }

  if (result.reference_action === "BUY") {
    if (result.reference_sl > 0 && !(result.reference_sl < result.reference_entry)) return { ok: false, reason: "Invalid BUY SL." };
    if (result.reference_tp1 > 0 && !(result.reference_tp1 > result.reference_entry)) return { ok: false, reason: "Invalid BUY TP1." };
  }

  if (result.reference_action === "SELL") {
    if (result.reference_sl > 0 && !(result.reference_sl > result.reference_entry)) return { ok: false, reason: "Invalid SELL SL." };
    if (result.reference_tp1 > 0 && !(result.reference_tp1 < result.reference_entry)) return { ok: false, reason: "Invalid SELL TP1." };
  }

  return { ok: true };
}

function buildWaitFallback(reason: string, requestId?: string) {
  return {
    ok: true,
    provider_hidden: true,
    request_id: requestId || "srv_fallback",
    action: "WAIT",
    confidence: 0,
    market_analysis: "Safety validation failed. Analysis rejected.",
    short_term_trend: "N/A",
    price_forecast: "N/A",
    reason: reason,
    invalidation: "N/A",
    risk_note: "Setup was rejected by server guard.",
    entry: 0,
    sl: 0,
    tp1: 0,
    tp2: 0,
    tp3: 0,
    rr: 0,
    reference_action: "WAIT",
    reference_order_type: "WAIT",
    reference_trigger: reason,
    reference_entry: 0,
    reference_sl: 0,
    reference_tp1: 0,
    reference_tp2: 0,
    reference_tp3: 0,
    reference_rr: 0,
    server_validation: {
      schema_valid: true,
      safety_valid: false,
      fallback_used: true,
      model_provider: "hidden",
      model_alias: "gsn-safety-guard"
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const authHeader = request.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ ok: false, error_code: "INVALID_LICENSE", message: "Missing or invalid token" }, { status: 401 });
    }
    
    const token = authHeader.replace("Bearer ", "").trim();
    
    // Auth using syncApiKey
    const user = await prisma.user.findUnique({
      where: { syncApiKey: token },
      select: { id: true, email: true }
    });

    if (!user) {
      return NextResponse.json({ ok: false, error_code: "INVALID_LICENSE", message: "License key is invalid or expired." }, { status: 401 });
    }

    const body = await request.json();
    const snapshot = body.snapshot;

    if (!snapshot || !snapshot.symbol) {
      return NextResponse.json({ ok: false, error_code: "SNAPSHOT_INVALID", message: "Invalid snapshot data." }, { status: 400 });
    }

    // Quota check
    const proAccess = await getUserProAccess(user.id);
    const dailyLimit = proAccess.isPro ? PRO_LIMIT : FREE_LIMIT;
    
    const startOfDay = new Date();
    startOfDay.setUTCHours(0,0,0,0);

    const usedToday = await prisma.analyticsEvent.count({
      where: {
        userId: user.id,
        name: "AI_ANALYZE",
        createdAt: { gte: startOfDay }
      }
    });

    if (usedToday >= dailyLimit) {
      return NextResponse.json({
        ok: false,
        error_code: "QUOTA_EXCEEDED",
        message: "Daily AI analysis quota exceeded.",
        usage: { plan: proAccess.isPro ? "pro" : "free", daily_limit: dailyLimit, used_today: usedToday, remaining_today: 0 }
      }, { status: 429 });
    }

    // Call DeepSeek
    const systemPrompt = `You are an elite, no-nonsense GoldScalperNinja AI Analyst for MT5.
You must analyze the provided trading snapshot and output a JSON response matching the EXACT schema required.
CRITICAL RULES:
1. Advisory only, no auto execution.
2. Use the snapshot data provided.
3. No stop order, no stop-style entry. SELL must be at or above current price, BUY must be at or below current price.
4. If uncertain or conflicting timeframes, return WAIT.
5. Use TP1 for primary RR calculation.
6. XAUUSD can sweep highs/lows, avoid poor SL placement.

Input Snapshot:
${JSON.stringify(snapshot, null, 2)}

You must return a raw JSON object with the following keys exactly:
{
  "action": "BUY" | "SELL" | "WAIT",
  "confidence": number (0-100),
  "market_analysis": "Blunt 2-3 sentence overview",
  "short_term_trend": "Trend alignment across timeframes",
  "price_forecast": "Forecast near current price",
  "reason": "Why taking or rejecting this setup",
  "invalidation": "What breaks this bias",
  "risk_note": "Any risk warnings",
  "entry": 0,
  "sl": 0,
  "tp1": 0,
  "tp2": 0,
  "tp3": 0,
  "rr": 0,
  "reference_action": "BUY" | "SELL" | "WAIT",
  "reference_order_type": "BUY" | "SELL" | "BUY LIMIT" | "SELL LIMIT" | "WAIT",
  "reference_trigger": "What must happen before entry",
  "reference_entry": 0,
  "reference_sl": 0,
  "reference_tp1": 0,
  "reference_tp2": 0,
  "reference_tp3": 0,
  "reference_rr": 0
}
NEVER output markdown backticks. Return ONLY the JSON object.
`;

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ ok: false, error_code: "SERVER_ERROR", message: "API key not configured." }, { status: 500 });
    }

    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        messages: [
          { role: "system", content: "You are a JSON-only API. You must return valid JSON." },
          { role: "user", content: systemPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 800
      }),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error("DeepSeek Analyze Error:", errText);
      return NextResponse.json({ ok: false, error_code: "MODEL_PROVIDER_ERROR", message: "AI provider failed." }, { status: 502 });
    }

    const aiData = await res.json();
    if (aiData.error) {
      console.error("DeepSeek Payload Error:", aiData.error);
      return NextResponse.json({ ok: false, error_code: "MODEL_PROVIDER_ERROR", message: "AI provider returned an error." }, { status: 502 });
    }

    let parsedResult;
    try {
      let content = aiData.choices?.[0]?.message?.content || "{}";
      if (content.startsWith("\`\`\`")) {
         const firstNewline = content.indexOf("\n");
         if (firstNewline !== -1) content = content.substring(firstNewline + 1);
         if (content.endsWith("\`\`\`")) content = content.substring(0, content.length - 3);
         content = content.trim();
      }
      if (content.startsWith("json")) {
         content = content.substring(4).trim();
      }
      parsedResult = JSON.parse(content);
    } catch (err) {
      return NextResponse.json({ ok: false, error_code: "MODEL_RESPONSE_INVALID", message: "Failed to parse AI output." }, { status: 500 });
    }

    // Recalculate RR based on TP1
    const refEntry = parsedResult.reference_entry || 0;
    const refSl = parsedResult.reference_sl || 0;
    const refTp1 = parsedResult.reference_tp1 || 0;
    let computedRr = 0;
    
    if (parsedResult.reference_action === "BUY" && refEntry > 0 && refSl < refEntry && refTp1 > refEntry) {
      const risk = refEntry - refSl;
      const reward = refTp1 - refEntry;
      if (risk > 0) computedRr = parseFloat((reward / risk).toFixed(2));
    } else if (parsedResult.reference_action === "SELL" && refEntry > 0 && refSl > refEntry && refTp1 < refEntry) {
      const risk = refSl - refEntry;
      const reward = refEntry - refTp1;
      if (risk > 0) computedRr = parseFloat((reward / risk).toFixed(2));
    }
    parsedResult.reference_rr = computedRr;
    parsedResult.rr = computedRr; // sync main rr

    const safety = validateTradingSafety(parsedResult, snapshot);
    if (!safety.ok) {
      const fallback = buildWaitFallback(safety.reason || "Validation failed", body.analysis?.request_id);
      
      // Still log usage even if rejected, but as a rejected request
      await prisma.analyticsEvent.create({
        data: {
          userId: user.id,
          sessionId: `ea-api-${user.id}`,
          name: "AI_ANALYZE",
          data: { status: "rejected", reason: safety.reason }
        }
      });
      
      return NextResponse.json({
         ...fallback,
         usage: { plan: proAccess.isPro ? "pro" : "free", daily_limit: dailyLimit, used_today: usedToday + 1, remaining_today: Math.max(0, dailyLimit - usedToday - 1) }
      });
    }

    // Log usage
    await prisma.analyticsEvent.create({
      data: {
        userId: user.id,
        sessionId: `ea-api-${user.id}`,
        name: "AI_ANALYZE",
        data: { status: "success", action: parsedResult.action }
      }
    });

    const responsePayload = {
      ok: true,
      provider_hidden: true,
      request_id: body.analysis?.request_id || "srv_" + Date.now(),
      ...parsedResult,
      server_validation: {
        schema_valid: true,
        safety_valid: true,
        fallback_used: false,
        model_provider: "hidden",
        model_alias: "gsn-pa-scalper-v1"
      },
      usage: {
        plan: proAccess.isPro ? "pro" : "free",
        daily_limit: dailyLimit,
        used_today: usedToday + 1,
        remaining_today: Math.max(0, dailyLimit - usedToday - 1)
      }
    };

    return NextResponse.json(responsePayload);

  } catch (error: any) {
    console.error("AI Gateway Analyze Error:", error);
    return NextResponse.json({ ok: false, error_code: "SERVER_ERROR", message: "Internal server error" }, { status: 500 });
  }
}
