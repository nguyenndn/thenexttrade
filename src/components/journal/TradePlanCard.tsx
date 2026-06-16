"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Check, X, LogIn, Trash2, BookOpen, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { cancelTradePlan, updateTradePlanStatus } from "@/actions/trade-plans";

interface TradePlanCardProps {
  plan: {
    id: string;
    symbol: string;
    type: "BUY" | "SELL" | null;
    plannedEntry: number | null;
    plannedStopLoss: number | null;
    plannedTakeProfit: number | null;
    plannedLotSize: number | null;
    riskAmount: number | null;
    setupName: string | null;
    thesis: string | null;
    invalidation: string | null;
    status: string;
    createdAt: string;
    journalEntryId: string | null;
  };
  onEdit?: (plan: any) => void;
  onRefresh: () => void;
  onLogTrade: (plan: any) => void;
  onViewActual?: (journalEntryId: string) => void;
}

export function TradePlanCard({ plan, onEdit, onRefresh, onLogTrade, onViewActual }: TradePlanCardProps) {
  const [isPending, setIsPending] = useState(false);
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const handleStatusUpdate = async (status: "ACTIVE" | "PLANNED") => {
    setIsPending(true);
    try {
      const res = await updateTradePlanStatus(plan.id, status);
      if (res.error) throw new Error(res.error);
      toast.success(`Trade plan is now ${status.toLowerCase()}!`);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to update plan status");
    } finally {
      setIsPending(false);
    }
  };

  const handleCancelSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cancelReason.trim()) {
      toast.error("Please provide a reason for cancellation");
      return;
    }

    setIsPending(true);
    try {
      const res = await cancelTradePlan(plan.id, cancelReason);
      if (res.error) throw new Error(res.error);
      toast.success("Trade plan cancelled (invalidated).");
      setShowCancelPrompt(false);
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to cancel plan");
    } finally {
      setIsPending(false);
    }
  };

  const statusColors: Record<string, string> = {
    PLANNED: "bg-purple-100 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-500/20",
    ACTIVE: "bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-500/20",
    MATCHED: "bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 border-green-200 dark:border-green-500/20",
    CANCELLED: "bg-gray-100 dark:bg-white/5 text-gray-500 border-gray-200 dark:border-white/10",
  };

  return (
    <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-all p-5 flex flex-col justify-between space-y-4">
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className={cn(
              "w-2.5 h-2.5 rounded-full",
              plan.type === "BUY" ? "bg-blue-500 animate-pulse" : "bg-red-500 animate-pulse"
            )} />
            <h4 className="font-bold text-gray-700 dark:text-white text-base">
              {plan.symbol} Setup
            </h4>
          </div>
          {plan.setupName ? (
            <p className="text-xs text-gray-500 font-bold mt-1 uppercase tracking-wide">
              {plan.setupName}
            </p>
          ) : (
            <p className="text-xs text-gray-400 italic mt-0.5">Unnamed Plan</p>
          )}
        </div>

        <span className={cn(
          "px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase border",
          statusColors[plan.status] || "bg-gray-100 text-gray-500"
        )}>
          {plan.status}
        </span>
      </div>

      {/* Target parameters */}
      <div className="grid grid-cols-3 gap-2 bg-gray-50 dark:bg-black/10 p-3 rounded-lg border border-dashboard text-center">
        <div>
          <p className="text-[9px] font-black uppercase text-gray-400">Entry</p>
          <p className="font-mono text-xs font-bold text-gray-700 dark:text-gray-300 mt-0.5">
            {plan.plannedEntry ? plan.plannedEntry.toFixed(5) : "-"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase text-red-500/80">Stop Loss</p>
          <p className="font-mono text-xs font-bold text-red-500 mt-0.5">
            {plan.plannedStopLoss ? plan.plannedStopLoss.toFixed(5) : "-"}
          </p>
        </div>
        <div>
          <p className="text-[9px] font-black uppercase text-emerald-500/80">Take Profit</p>
          <p className="font-mono text-xs font-bold text-emerald-500 mt-0.5">
            {plan.plannedTakeProfit ? plan.plannedTakeProfit.toFixed(5) : "-"}
          </p>
        </div>
      </div>

      {/* Lot / Risk & Date info */}
      <div className="flex justify-between items-center text-xs text-gray-500 border-b border-dashboard pb-3">
        <span className="font-medium">
          {plan.plannedLotSize ? `${plan.plannedLotSize} lots` : ""}{" "}
          {plan.riskAmount ? `(Risk: $${plan.riskAmount})` : ""}
        </span>
        <span className="text-[10px]">
          Planned {format(new Date(plan.createdAt), "dd MMM yyyy")}
        </span>
      </div>

      {/* Thesis description */}
      {plan.thesis && (
        <p className="text-xs text-gray-600 dark:text-gray-400 italic leading-relaxed line-clamp-2">
          &ldquo;{plan.thesis}&rdquo;
        </p>
      )}

      {/* Invalidation prompt */}
      {plan.status === "CANCELLED" && plan.invalidation && (
        <div className="p-2.5 rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard flex items-start gap-2">
          <AlertCircle size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
          <p className="text-[11px] text-gray-500 italic">
            Invalidation reason: {plan.invalidation}
          </p>
        </div>
      )}

      {/* Actions */}
      {!showCancelPrompt ? (
        <div className="flex items-center gap-2 pt-2 justify-end">
          {plan.status === "PLANNED" && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusUpdate("ACTIVE")}
                disabled={isPending}
                className="text-xs py-1.5 h-auto text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10"
              >
                <Check size={12} className="mr-1" /> Activate
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelPrompt(true)}
                disabled={isPending}
                className="text-xs py-1.5 h-auto text-gray-500"
              >
                <X size={12} className="mr-1" /> Invalidate
              </Button>
            </>
          )}

          {plan.status === "ACTIVE" && (
            <>
              <Button
                variant="primary"
                size="sm"
                onClick={() => onLogTrade(plan)}
                disabled={isPending}
                className="text-xs py-1.5 h-auto"
              >
                <LogIn size={12} className="mr-1" /> Log Trade
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelPrompt(true)}
                disabled={isPending}
                className="text-xs py-1.5 h-auto text-gray-500"
              >
                <X size={12} className="mr-1" /> Invalidate
              </Button>
            </>
          )}

          {plan.status === "MATCHED" && plan.journalEntryId && onViewActual && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onViewActual(plan.journalEntryId!)}
              className="text-xs py-1.5 h-auto w-full text-green-500 hover:bg-green-50 dark:hover:bg-green-500/10 border-green-200 dark:border-green-500/20 font-bold"
            >
              <BookOpen size={12} className="mr-1" /> View Executed Trade
            </Button>
          )}
        </div>
      ) : (
        /* Cancel input prompt */
        <form onSubmit={handleCancelSubmit} className="space-y-2 pt-2">
          <input
            type="text"
            placeholder="Reason (e.g. S/R broken, NFP volatility)..."
            value={cancelReason}
            onChange={(e) => setCancelReason(e.target.value)}
            className="w-full p-2 text-xs rounded-lg bg-gray-50 dark:bg-black/20 border border-dashboard focus:outline-none"
            required
            autoFocus
          />
          <div className="flex justify-end gap-1.5">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setShowCancelPrompt(false)}
              className="text-[10px] py-1 px-2.5 h-auto"
            >
              Back
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="sm"
              disabled={isPending}
              className="text-[10px] py-1 px-2.5 h-auto"
            >
              Confirm Cancel
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}
