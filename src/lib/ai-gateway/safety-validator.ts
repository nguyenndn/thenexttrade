import { AiTradingResult } from "./result-schema";

export function validateImmediatePlan(result: AiTradingResult, currentPrice: number): { ok: true } | { ok: false; reason: string } {
  if (result.action === "WAIT") {
    if (result.entry !== 0 || result.sl !== 0 || result.tp1 !== 0 || result.tp2 !== 0 || result.tp3 !== 0 || result.rr !== 0) {
      return { ok: false, reason: "Action is WAIT but price fields are not 0." };
    }
    return { ok: true };
  }

  if (result.entry <= 0) return { ok: false, reason: "Entry must be > 0 for BUY/SELL." };

  if (result.action === "BUY") {
    if (result.sl <= 0 || result.sl >= result.entry) return { ok: false, reason: "Invalid BUY SL. Must be > 0 and below entry." };
    if (result.tp1 <= result.entry) return { ok: false, reason: "Invalid BUY TP1. Must be above entry." };
    if (result.tp2 > 0 && result.tp2 <= result.tp1) return { ok: false, reason: "Invalid BUY TP2. Must be > TP1." };
    if (result.tp3 > 0 && result.tp3 <= (result.tp2 || result.tp1)) return { ok: false, reason: "Invalid BUY TP3. Must be > TP2/TP1." };
    if (result.entry > currentPrice) return { ok: false, reason: "BUY entry above current price is stop-style. Only limit/market allowed." };
    if (result.rr <= 0) return { ok: false, reason: "RR must be > 0." };
  }

  if (result.action === "SELL") {
    if (result.sl <= result.entry) return { ok: false, reason: "Invalid SELL SL. Must be above entry." };
    if (result.tp1 <= 0 || result.tp1 >= result.entry) return { ok: false, reason: "Invalid SELL TP1. Must be > 0 and below entry." };
    if (result.tp2 > 0 && result.tp2 >= result.tp1) return { ok: false, reason: "Invalid SELL TP2. Must be < TP1." };
    if (result.tp3 > 0 && result.tp3 >= (result.tp2 || result.tp1)) return { ok: false, reason: "Invalid SELL TP3. Must be < TP2/TP1." };
    if (result.entry < currentPrice) return { ok: false, reason: "SELL entry below current price is stop-style. Only limit/market allowed." };
    if (result.rr <= 0) return { ok: false, reason: "RR must be > 0." };
  }

  return { ok: true };
}

export function validateReferencePlan(result: AiTradingResult, currentPrice: number): { ok: true } | { ok: false; reason: string } {
  const isWaitOrderType = result.reference_order_type === "WAIT" || !result.reference_order_type;

  if (result.reference_action === "WAIT") {
    if (!isWaitOrderType) return { ok: false, reason: "reference_action is WAIT but reference_order_type is not WAIT." };
    if (result.reference_entry !== 0 || result.reference_sl !== 0 || result.reference_tp1 !== 0 || result.reference_tp2 !== 0 || result.reference_tp3 !== 0 || result.reference_rr !== 0) {
       return { ok: false, reason: "reference_action is WAIT but reference price fields are not 0." };
    }
    return { ok: true };
  }

  if (isWaitOrderType) {
    return { ok: false, reason: "reference_order_type is WAIT but reference_action is not WAIT." };
  }

  const orderTypeStr = result.reference_order_type.toUpperCase();
  if (result.reference_action === "BUY" && !orderTypeStr.includes("BUY")) {
     return { ok: false, reason: "reference_action BUY does not match reference_order_type." };
  }
  if (result.reference_action === "SELL" && !orderTypeStr.includes("SELL")) {
     return { ok: false, reason: "reference_action SELL does not match reference_order_type." };
  }

  if (result.reference_entry <= 0) return { ok: false, reason: "Reference Entry must be > 0 for BUY/SELL." };
  
  if (["BUY STOP", "SELL STOP", "STOP", "BREAKOUT STOP"].includes(orderTypeStr)) {
    return { ok: false, reason: "Stop orders are disabled." };
  }

  if (result.reference_action === "BUY") {
    if (result.reference_sl <= 0 || result.reference_sl >= result.reference_entry) return { ok: false, reason: "Invalid reference BUY SL." };
    if (result.reference_tp1 <= result.reference_entry) return { ok: false, reason: "Invalid reference BUY TP1." };
    if (result.reference_tp2 > 0 && result.reference_tp2 <= result.reference_tp1) return { ok: false, reason: "Invalid reference BUY TP2." };
    if (result.reference_tp3 > 0 && result.reference_tp3 <= (result.reference_tp2 || result.reference_tp1)) return { ok: false, reason: "Invalid reference BUY TP3." };
    if (result.reference_entry > currentPrice) return { ok: false, reason: "BUY reference entry above current price is stop-style." };
    if (result.reference_rr <= 0) return { ok: false, reason: "Reference RR must be > 0." };
  }

  if (result.reference_action === "SELL") {
    if (result.reference_sl <= result.reference_entry) return { ok: false, reason: "Invalid reference SELL SL." };
    if (result.reference_tp1 <= 0 || result.reference_tp1 >= result.reference_entry) return { ok: false, reason: "Invalid reference SELL TP1." };
    if (result.reference_tp2 > 0 && result.reference_tp2 >= result.reference_tp1) return { ok: false, reason: "Invalid reference SELL TP2." };
    if (result.reference_tp3 > 0 && result.reference_tp3 >= (result.reference_tp2 || result.reference_tp1)) return { ok: false, reason: "Invalid reference SELL TP3." };
    if (result.reference_entry < currentPrice) return { ok: false, reason: "SELL reference entry below current price is stop-style." };
    if (result.reference_rr <= 0) return { ok: false, reason: "Reference RR must be > 0." };
  }

  return { ok: true };
}

export function validateTradingSafety(result: AiTradingResult, snapshot: any): { ok: true } | { ok: false; reason: string } {
  const currentPrice = snapshot?.price?.current ?? snapshot?.price?.bid ?? 0;

  if (currentPrice <= 0) {
    return { ok: false, reason: "SNAPSHOT_INVALID: currentPrice must be > 0" };
  }
  
  const immediateValid = validateImmediatePlan(result, currentPrice);
  if (!immediateValid.ok) return immediateValid;

  const referenceValid = validateReferencePlan(result, currentPrice);
  if (!referenceValid.ok) return referenceValid;

  return { ok: true };
}

export function buildWaitFallback(reason: string, requestId?: string) {
  return {
    ok: true,
    provider_hidden: true,
    request_id: requestId || "srv_fallback",
    action: "WAIT" as const,
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
    reference_action: "WAIT" as const,
    reference_order_type: "WAIT" as const,
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
