import { z } from "zod";

export type TargetType = "USD" | "PERCENT";

const targetTypeSchema = z.enum(["USD", "PERCENT"]);

export const profitTargetsInputSchema = z.object({
  weeklyTarget: z.number().min(0, "Weekly target cannot be negative").nullable().optional(),
  weeklyTargetType: targetTypeSchema.default("USD"),
  monthlyTarget: z.number().min(0, "Monthly target cannot be negative").nullable().optional(),
  monthlyTargetType: targetTypeSchema.default("USD"),
  initialBalance: z.number().min(0, "Initial balance cannot be negative").nullable().optional(),
});

export type ValidatedProfitTargetsInput = z.infer<typeof profitTargetsInputSchema>;

export type TargetStatus = "NOT_SET" | "IN_PROGRESS" | "ACHIEVED";

export interface TargetProgressSummary {
  targetAmount: number; // Effective target in USD
  targetType: TargetType;
  rawTargetValue: number | null;
  netClosedPnl: number;
  completionRate: number | null; // e.g. 75.5 (%) clamped >= 0
  visualProgressPercent: number; // Clamped [0, 100] for visual UI fill
  remainingAmount: number; // targetAmount - max(0, netClosedPnl) (0 if achieved)
  status: TargetStatus;
}

export interface AccountTargetConfig {
  id?: string;
  name?: string;
  balance: number;
  initialBalance?: number | null;
  weeklyTarget?: number | null;
  weeklyTargetType?: TargetType;
  monthlyTarget?: number | null;
  monthlyTargetType?: TargetType;
  status?: string;
}

export interface TradePnLInput {
  pnl?: number | null;
  commission?: number | null;
  swap?: number | null;
  status?: string;
  exitDate?: Date | string | null;
}

export interface UpdateProfitTargetsInput {
  weeklyTarget: number | null;
  weeklyTargetType: TargetType;
  monthlyTarget: number | null;
  monthlyTargetType: TargetType;
  initialBalance?: number | null;
}

export type ActionResponse<T> =
  | { success: true; data: T }
  | { success: false; error: string };
