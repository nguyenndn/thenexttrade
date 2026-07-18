"use client";

import React, { useState, useTransition } from "react";
import { Award, ShieldAlert, Sparkles, CheckSquare, Square, ExternalLink } from "lucide-react";
import Link from "next/link";
import { toggleCoachActionPlanItem } from "@/actions/coach";

interface ActionItem {
  id: string;
  stableKey: string;
  label: string;
  detail: string;
  ctaHref?: string | null;
  status: string;
}

interface WeeklyCoachPlanProps {
  plan: {
    id: string;
    title: string;
    summary: string;
    keepDoing: string | null;
    fixNext: string | null;
    items?: ActionItem[];
    nextActions?: any[]; // legacy fallback
  };
}

export function WeeklyCoachPlan({ plan }: WeeklyCoachPlanProps) {
  const [isPending, startTransition] = useTransition();

  // Handle fallback from legacy JSON if items are missing
  const actionsToRender = plan.items && plan.items.length > 0
    ? plan.items
    : (plan.nextActions || []).map((a, i) => ({
        id: `legacy-${i}`,
        stableKey: `legacy-${i}`,
        label: a.label,
        detail: a.detail,
        ctaHref: a.ctaHref,
        status: "PENDING"
      }));

  const [items, setItems] = useState(actionsToRender);

  const handleToggle = (itemId: string, currentStatus: string) => {
    // If it's a legacy item (no real ID), don't allow toggling
    if (itemId.startsWith('legacy-')) return;

    const isCompleted = currentStatus === "COMPLETED";
    const nextStatus = isCompleted ? "PENDING" : "COMPLETED";
    setItems(currentItems => currentItems.map(item =>
      item.id === itemId ? { ...item, status: nextStatus } : item
    ));

    startTransition(async () => {
      const result = await toggleCoachActionPlanItem(plan.id, itemId, !isCompleted);

      if (!result.success) {
        setItems(currentItems => currentItems.map(item =>
          item.id === itemId ? { ...item, status: currentStatus } : item
        ));
      }
    });
  };

  return (
    <div className="relative overflow-hidden rounded-2xl border border-amber-500/20 dark:border-gold/15 bg-gradient-to-br from-amber-500/[0.04] via-transparent to-transparent dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md p-6 space-y-6 shadow-sm">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Sparkles className="text-amber-500 dark:text-gold" size={18} />
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-600 dark:text-gold bg-amber-500/10 dark:bg-gold/10 px-2.5 py-0.5 rounded-md">
              Weekly Coach Action Plan
            </span>
          </div>
          <h3 className="text-xl font-black text-gray-800 dark:text-white leading-tight">
            {plan.title}
          </h3>
          <p className="text-sm font-medium text-gray-600 dark:text-gray-300">
            {plan.summary}
          </p>
        </div>
      </div>

      {/* Keep Doing & Fix Next side-by-side blocks */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {plan.keepDoing && (
          <div className="p-4 bg-emerald-500/[0.03] dark:bg-emerald-500/[0.01] border border-emerald-500/15 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-extrabold text-xs uppercase tracking-wide">
              <Award size={16} />
              <span>Keep Doing (Edge Strengths)</span>
            </div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-relaxed">
              {plan.keepDoing}
            </p>
          </div>
        )}

        {plan.fixNext && (
          <div className="p-4 bg-amber-500/[0.03] dark:bg-gold/[0.01] border border-amber-500/15 dark:border-gold/10 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-600 dark:text-gold font-extrabold text-xs uppercase tracking-wide">
              <ShieldAlert size={16} />
              <span>Fix Next (Edge Leaks)</span>
            </div>
            <p className="text-xs font-semibold text-gray-600 dark:text-gray-300 leading-relaxed">
              {plan.fixNext}
            </p>
          </div>
        )}
      </div>

      {/* Next Week Checklist */}
      <div className="space-y-3">
        <h4 className="text-xs font-extrabold uppercase tracking-widest text-gray-600 dark:text-gray-400">
          Next-Week Checklist
        </h4>
        <div className="space-y-2">
          {items.map((action, idx) => {
            const isChecked = action.status === "COMPLETED";
            const isLegacy = action.id.startsWith("legacy-");

            return (
              <div
                key={action.id || idx}
                className={`w-full text-left flex items-start gap-3 p-3 border rounded-xl transition-all duration-300 ${
                  isChecked
                    ? "bg-gray-50/50 dark:bg-white/[0.01] border-dashboard opacity-60"
                    : "bg-white dark:bg-[#151925] border-dashboard hover:border-amber-500/30 dark:hover:border-gold/30 hover:shadow-sm"
                } ${isLegacy ? "cursor-not-allowed opacity-70" : "cursor-pointer"}`}
              >
                <button
                  type="button"
                  onClick={() => handleToggle(action.id, action.status)}
                  disabled={isLegacy || isPending}
                  aria-label={`Toggle completion for ${action.label}`}
                  title={isLegacy ? "Legacy action items cannot be toggled" : "Mark action complete"}
                  className="shrink-0 mt-0.5 text-amber-500 dark:text-gold disabled:cursor-not-allowed"
                >
                  {isChecked ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
                <div className="space-y-0.5 flex-1 min-w-0">
                  <p className={`text-sm font-black text-gray-800 dark:text-white leading-tight ${isChecked ? "line-through" : ""}`}>
                    {action.label}
                  </p>
                  <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
                    {action.detail}
                  </p>
                </div>
                {action.ctaHref && !isChecked && (
                  <div className="shrink-0 self-center pl-2">
                    <Link
                      href={action.ctaHref}
                      title={`Go to ${action.label}`}
                      aria-label={`Navigate to complete action: ${action.label}`}
                      className="flex h-8 w-8 items-center justify-center rounded-lg text-gray-500 hover:text-amber-500 dark:hover:text-gold hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                      <ExternalLink size={14} />
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
