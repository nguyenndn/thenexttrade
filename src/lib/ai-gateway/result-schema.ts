import { z } from "zod";

// Version Tracking to differentiate contracts
export const API_RESPONSE_SCHEMA_VERSION = "1.0";
export const SNAPSHOT_SCHEMA_VERSION = "1.1";
export const CLIENT_REQUEST_SCHEMA_VERSION = "1.1";


export const AiTradingResultSchema = z.object({
  action: z.enum(["BUY", "SELL", "WAIT"]),
  confidence: z.number().min(0).max(100),
  market_analysis: z.string().max(4000),
  short_term_trend: z.string().max(2000),
  price_forecast: z.string().max(2000),
  reason: z.string().max(4000),
  invalidation: z.string().max(2000),
  risk_note: z.string().max(2000),
  entry: z.number().finite().nonnegative(),
  sl: z.number().finite().nonnegative(),
  tp1: z.number().finite().nonnegative(),
  tp2: z.number().finite().nonnegative(),
  tp3: z.number().finite().nonnegative(),
  rr: z.number().finite().nonnegative(),
  reference_action: z.enum(["BUY", "SELL", "WAIT"]),
  reference_order_type: z.enum(["BUY", "SELL", "BUY LIMIT", "SELL LIMIT", "WAIT"]),
  reference_trigger: z.string().max(4000),
  reference_entry: z.number().finite().nonnegative(),
  reference_sl: z.number().finite().nonnegative(),
  reference_tp1: z.number().finite().nonnegative(),
  reference_tp2: z.number().finite().nonnegative(),
  reference_tp3: z.number().finite().nonnegative(),
  reference_rr: z.number().finite().nonnegative()
}).strict();

export type AiTradingResult = z.infer<typeof AiTradingResultSchema>;

export function validateAndCleanResult(rawJson: unknown): { ok: true; data: AiTradingResult } | { ok: false; error: z.ZodError } {
  const result = AiTradingResultSchema.safeParse(rawJson);
  if (result.success) {
    return { ok: true, data: result.data };
  } else {
    return { ok: false, error: result.error };
  }
}
