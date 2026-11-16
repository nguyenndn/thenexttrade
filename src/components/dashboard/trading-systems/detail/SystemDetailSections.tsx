"use client";

import type { SystemData } from "@/config/trading-systems-data";
import { TradingSystemsParamsTable } from "@/components/trading-systems/TradingSystemsParamsTable";
import { SystemDetailInstallSection } from "./SystemDetailInstallSection";
import {
    SystemDetailFaqSection,
    SystemDetailRiskSection,
} from "./SystemDetailRiskAndFaq";

interface SystemDetailSectionsProps {
    activeTab: string;
    system?: SystemData;
    guideType: "MT5_EA" | "MT5_INDICATOR";
}

export function SystemDetailSections({
    activeTab,
    system,
    guideType,
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

    if (activeTab === "parameters") {
        return system?.parameters && system.parameters.length > 0 ? (
            <TradingSystemsParamsTable parameters={system.parameters} />
        ) : (
            <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                No parameters specified for this system.
            </div>
        );
    }

    if (activeTab === "guide") {
        return (
            <SystemDetailInstallSection
                guideType={guideType}
                setupSteps={system?.setupSteps}
            />
        );
    }

    if (activeTab === "risk") {
        return <SystemDetailRiskSection riskControls={system?.riskControls} />;
    }

    if (activeTab === "faqs") {
        return <SystemDetailFaqSection faqs={system?.faqs} />;
    }

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 rounded-xl border border-dashboard dark:border-white/[0.08] bg-gray-50/50 dark:bg-white/[0.02] divide-y sm:divide-x divide-dashboard dark:divide-white/[0.08] overflow-hidden">
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
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-3">
                        Core Architecture &amp; Capabilities
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
