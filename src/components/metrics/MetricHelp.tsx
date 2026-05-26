"use client";

import { useState } from "react";
import { HelpCircle } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { METRIC_DEFINITIONS, type MetricId, type MetricDefinition } from "@/lib/metrics/metric-definitions";

interface MetricHelpProps {
  metricId: MetricId;
  compact?: boolean;
  side?: "top" | "right" | "bottom" | "left";
}

function MetricHelpContent({
  metricId,
  compact,
}: {
  metricId: MetricId;
  compact?: boolean;
}) {
  const def = METRIC_DEFINITIONS[metricId] as MetricDefinition;

  if (compact) {
    return (
      <p className="text-xs leading-relaxed">{def.shortDescription}</p>
    );
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-bold leading-snug">{def.shortDescription}</p>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
          Formula
        </p>
        <p className="text-[11px] font-mono leading-snug">{def.formula}</p>
      </div>

      <div>
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
          Included Data
        </p>
        <p className="text-[11px] leading-snug">{def.includedData}</p>
      </div>

      {def.edgeCases.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
            Edge Cases
          </p>
          <ul className="space-y-0.5">
            {def.edgeCases.map((ec, i) => (
              <li key={i} className="text-[11px] leading-snug flex gap-1.5">
                <span className="text-primary shrink-0 mt-0.5">•</span>
                <span>{ec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {def.goodToKnow && (
        <p className="text-[10px] italic text-gray-400 dark:text-gray-500 leading-snug border-t border-gray-200 dark:border-white/10 pt-2">
          {def.goodToKnow}
        </p>
      )}
    </div>
  );
}

/**
 * MetricHelp — Shared KPI explanation component
 *
 * Desktop: tooltip on hover (via Radix Tooltip)
 * Mobile: click-triggered popover (via Radix Popover)
 *
 * Usage:
 *   <MetricHelp metricId="winRate" />
 *   <MetricHelp metricId="profitFactor" compact />
 */
export function MetricHelp({ metricId, compact, side = "top" }: MetricHelpProps) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const def = METRIC_DEFINITIONS[metricId];

  return (
    <>
      {/* Desktop: Tooltip (hover) — hidden on mobile */}
      <div className="hidden md:inline-flex">
        <TooltipProvider delayDuration={150}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:hover:bg-white/10 dark:hover:text-gray-200"
                aria-label={`Explain ${def.label}`}
              >
                <HelpCircle size={13} />
              </button>
            </TooltipTrigger>
            <TooltipContent
              side={side}
              align="center"
              className="max-w-[320px] bg-gray-950 px-3.5 py-3 text-white shadow-xl dark:bg-white dark:text-gray-950 rounded-xl"
            >
              <MetricHelpContent metricId={metricId} compact={compact} />
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      {/* Mobile: Popover (click) — hidden on desktop */}
      <div className="inline-flex md:hidden">
        <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
          <PopoverTrigger asChild>
            <button
              type="button"
              className="inline-flex h-5 w-5 items-center justify-center rounded-full text-gray-400 transition-colors active:bg-gray-100 dark:active:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40"
              aria-label={`Explain ${def.label}`}
            >
              <HelpCircle size={14} />
            </button>
          </PopoverTrigger>
          <PopoverContent
            side={side}
            align="center"
            className="w-72 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl p-3.5 text-gray-700 dark:text-gray-200"
          >
            <MetricHelpContent metricId={metricId} compact={compact} />
          </PopoverContent>
        </Popover>
      </div>
    </>
  );
}
