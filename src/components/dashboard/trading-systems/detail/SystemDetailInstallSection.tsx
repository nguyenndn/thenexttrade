"use client";

import type { SystemData, SystemSetupStep } from "@/config/trading-systems-data";
import { Mt5WebRequestUrlList } from "@/components/trading-accounts/Mt5WebRequestUrlList";

interface SystemDetailInstallSectionProps {
    setupSteps?: SystemSetupStep[];
    webRequestServers?: SystemData["webRequestServers"];
}

export function SystemDetailInstallSection({
    setupSteps,
    webRequestServers,
}: SystemDetailInstallSectionProps) {
    return (
        <div className="space-y-2 md:space-y-6">
            {/* WebRequest Whitelist Quick Copy */}
            <div className="rounded-xl border border-dashboard dark:border-white/[0.08] p-3.5 sm:p-5 bg-gray-50/40 dark:bg-[#151925]">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-800 dark:text-white mb-1">
                    MT5 WebRequest Whitelist
                </h4>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 leading-relaxed">
                    In MetaTrader 5 (Tools &rarr; Options &rarr; Expert Advisors),
                    enable &ldquo;Allow WebRequest for listed URL&rdquo; and add
                    the URLs below for this EA release:
                </p>
                <Mt5WebRequestUrlList compact servers={webRequestServers} />
            </div>

            {/* EA-Specific Setup Checklist */}
            {setupSteps && setupSteps.length > 0 && (
                <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2 sm:mb-3">
                        System-Specific Deployment Checklist
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                        {setupSteps.map((stepItem) => (
                            <div
                                key={stepItem.step}
                                className="p-3.5 rounded-lg border border-dashboard dark:border-white/[0.08] bg-gray-50/40 dark:bg-white/[0.02] flex items-start gap-3"
                            >
                                <span className="px-2 py-0.5 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold text-[10px] font-black tabular-nums shrink-0 mt-0.5">
                                    {stepItem.step}
                                </span>
                                <div className="min-w-0">
                                    <p className="text-xs font-bold text-gray-900 dark:text-white">
                                        {stepItem.title}
                                    </p>
                                    <p className="text-[11px] text-gray-600 dark:text-gray-400 mt-1 leading-relaxed">
                                        {stepItem.desc}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
