"use client";

import type { SystemData } from "@/config/trading-systems-data";
import { htmlToPlainText } from "@/lib/sanitize";
import { SystemDetailInstallSection } from "./SystemDetailInstallSection";
import {
    SystemDetailFaqSection,
    SystemDetailRiskSection,
} from "./SystemDetailRiskAndFaq";

interface SystemDetailSectionsProps {
    activeTab: string;
    system?: SystemData;
    productDescription?: string | null;
}

function extractDescriptionParagraphs(
    rawDescription?: string | null,
    fallback?: string
): string[] {
    const source = rawDescription?.trim() || "";
    if (source) {
        const chunks = source
            .split(/<\/(?:p|div|blockquote)>|<br\s*\/?>\s*<br\s*\/?>|\r?\n\s*\r?\n/gi)
            .map((chunk) => htmlToPlainText(chunk))
            .filter(Boolean);
        if (chunks.length > 0) {
            return chunks;
        }
    }
    const cleanFallback = htmlToPlainText(fallback);
    return cleanFallback
        ? [cleanFallback]
        : [
              "MetaTrader 5 execution system built with strict risk controls and server-side stop-loss protection.",
          ];
}

export function SystemDetailSections({
    activeTab,
    system,
    productDescription,
}: SystemDetailSectionsProps) {
    const specItems = system?.specHighlights?.length
        ? system.specHighlights
        : [
              {
                  label: "Target Instrument",
                  value: system?.targetAsset || "XAUUSD (Gold)",
              },
              {
                  label: "Execution Style",
                  value: system?.strategyStyle || "Automated Trend & Grid",
              },
              {
                  label: "Setup Difficulty",
                  value: system?.setupDifficulty || "Easy (5 min)",
              },
              {
                  label: "Recommended Leverage",
                  value: system?.recommendedLeverage || "1:100 or higher",
              },
          ];

    if (activeTab === "guide") {
        return (
            <SystemDetailInstallSection
                setupSteps={system?.setupSteps}
                webRequestServers={system?.webRequestServers}
            />
        );
    }

    if (activeTab === "risk") {
        return <SystemDetailRiskSection riskControls={system?.riskControls} />;
    }

    if (activeTab === "faqs") {
        return <SystemDetailFaqSection faqs={system?.faqs} />;
    }

    const overviewParagraphs = extractDescriptionParagraphs(
        system?.longDescription || system?.description || productDescription,
        productDescription || undefined
    );

    return (
        <div className="space-y-3 md:space-y-6">
            {overviewParagraphs.length > 0 && (
                <div className="space-y-2.5 text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed tabular-nums">
                    {overviewParagraphs.map((paragraph, idx) => (
                        <p key={idx}>{paragraph}</p>
                    ))}
                </div>
            )}

            {/* Mobile Unified 2x2 Matrix Card (< sm) */}
            <div className="sm:hidden grid grid-cols-2 rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t [&>*]:border-dashboard/70 dark:[&>*]:border-white/[0.06]">
                {specItems.map((spec, i) => (
                    <div key={i} className="py-2 px-2.5 min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                            {spec.label}
                        </p>
                        <p className="text-xs font-bold text-gray-900 dark:text-white mt-0.5 truncate tabular-nums">
                            {spec.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Desktop Grid (>= sm) */}
            <div className="hidden sm:grid sm:grid-cols-2 rounded-xl border border-dashboard dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02] divide-y sm:divide-x divide-dashboard dark:divide-white/[0.08] overflow-hidden">
                {specItems.map((spec, i) => (
                    <div key={i} className="p-4">
                        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            {spec.label}
                        </p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white mt-1 break-words tabular-nums">
                            {spec.value}
                        </p>
                    </div>
                ))}
            </div>

            {system?.functions && system.functions.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                        Core Architecture &amp; Capabilities
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {system.functions.map((func, idx) => (
                            <div
                                key={idx}
                                className="p-3.5 rounded-lg border border-dashboard dark:border-white/[0.08] bg-gray-50/40 dark:bg-white/[0.02]"
                            >
                                <p className="text-xs font-bold text-gray-900 dark:text-white">
                                    {func.title}
                                </p>
                                <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                    {func.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {system?.logic && system.logic.length > 0 && (
                <div className="p-4 rounded-xl border border-dashboard dark:border-white/[0.08] bg-gray-50/30 dark:bg-white/[0.01]">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                        Execution Logic
                    </h4>
                    <ul className="space-y-1.5 text-xs text-gray-600 dark:text-gray-400 list-disc list-inside">
                        {system.logic.map((item, idx) => (
                            <li key={idx} className="leading-relaxed">
                                {item}
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
