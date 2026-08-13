"use client";

import React, { useState } from "react";
import { DataConfidenceLevel, DataConfidenceView } from "@/lib/trader-growth/types";
import { ShieldCheck, AlertCircle, Info, ChevronRight } from "lucide-react";
import { DataEvidenceDrawer } from "./DataEvidenceDrawer";

interface DataConfidenceBadgeProps {
    confidence: DataConfidenceView | DataConfidenceLevel;
    sampleSize?: number;
    className?: string;
    showDrawerOnClick?: boolean;
}

export function DataConfidenceBadge({
    confidence,
    sampleSize,
    className = "",
    showDrawerOnClick = true,
}: DataConfidenceBadgeProps) {
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);

    const level: DataConfidenceLevel =
        typeof confidence === "string" ? confidence : confidence.level;

    const size = typeof confidence === "object" ? confidence.sampleSize : sampleSize ?? 0;

    let badgeColor = "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700";
    let icon = <Info className="w-3.5 h-3.5" />;
    let label = "Low Confidence";

    if (level === "HIGH") {
        badgeColor = "bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30 hover:bg-emerald-100 dark:hover:bg-emerald-950/80";
        icon = <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />;
        label = "High Confidence";
    } else if (level === "MEDIUM") {
        badgeColor = "bg-cyan-50 dark:bg-cyan-950/60 text-cyan-800 dark:text-cyan-300 border-cyan-200 dark:border-cyan-500/30 hover:bg-cyan-100 dark:hover:bg-cyan-950/80";
        icon = <Info className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />;
        label = "Actionable Sample";
    } else if (level === "LOW") {
        badgeColor = "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-400 border-amber-200 dark:border-amber-500/30 hover:bg-amber-100 dark:hover:bg-amber-950/80";
        icon = <AlertCircle className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />;
        label = "Early Observation";
    } else {
        badgeColor = "bg-slate-100 dark:bg-slate-900 text-slate-700 dark:text-slate-400 border-slate-200 dark:border-slate-800 hover:bg-slate-200 dark:hover:bg-slate-800";
        icon = <AlertCircle className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />;
        label = "Insufficient Sample";
    }

    const confidenceObj: DataConfidenceView =
        typeof confidence === "object"
            ? confidence
            : {
                  level,
                  score: level === "HIGH" ? 80 : level === "MEDIUM" ? 50 : 20,
                  sampleSize: size,
                  reasons: [`Sample size of ${size} closed trades`],
                  warnings: [],
                  lastSyncAt: null,
                  periodStart: null,
                  periodEnd: null,
                  accountScope: [],
              };

    return (
        <>
            <button
                type="button"
                onClick={() => showDrawerOnClick && setIsDrawerOpen(true)}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all hover:opacity-90 ${badgeColor} ${className}`}

            >
                {icon}
                <span>{label}</span>
                {size > 0 && <span className="opacity-75">({size} trades)</span>}
                {showDrawerOnClick && <ChevronRight className="w-3 h-3 opacity-60 ml-0.5" />}
            </button>

            {showDrawerOnClick && (
                <DataEvidenceDrawer
                    isOpen={isDrawerOpen}
                    onClose={() => setIsDrawerOpen(false)}
                    confidence={confidenceObj}
                />
            )}
        </>
    );
}
