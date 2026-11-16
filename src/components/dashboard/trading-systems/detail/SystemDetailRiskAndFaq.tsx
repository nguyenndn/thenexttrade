"use client";

import { AlertTriangle, Server } from "lucide-react";
import type {
    SystemFaq,
    SystemRiskControl,
} from "@/config/trading-systems-data";

export function SystemDetailRiskSection({
    riskControls,
}: {
    riskControls?: SystemRiskControl[];
}) {
    return (
        <div className="space-y-5">
            <div className="p-4 rounded-xl border border-amber-500/30 bg-amber-500/[0.05] dark:bg-amber-500/[0.08] flex items-start gap-3.5">
                <AlertTriangle
                    className="text-amber-500 shrink-0 mt-0.5"
                    size={18}
                />
                <div className="space-y-1">
                    <p className="text-xs font-extrabold text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                        Important Risk Note
                    </p>
                    <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed">
                        Algorithmic trading entails capital risk. Always test
                        this EA on a demo account first to understand its
                        drawdown profile, basket dynamics, and lot sizing before
                        deploying live capital. Never disable hard equity
                        stop-loss limits.
                    </p>
                </div>
            </div>

            <div className="p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/5 dark:bg-emerald-500/10 flex items-start gap-3">
                <Server
                    size={18}
                    className="text-emerald-500 shrink-0 mt-0.5"
                />
                <div>
                    <p className="text-xs font-bold text-emerald-800 dark:text-emerald-400">
                        VPS Continuous Execution Recommended
                    </p>
                    <p className="text-[11px] text-gray-600 dark:text-gray-300 mt-1 leading-relaxed">
                        For automated Expert Advisors, running on a low-latency
                        Virtual Private Server ensures 24/7 uptime without risk
                        of home internet drops or power interruptions.
                    </p>
                </div>
            </div>

            {riskControls && riskControls.length > 0 && (
                <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                        Capital Protection &amp; Risk Controls
                    </h4>
                    <div className="space-y-2">
                        {riskControls.map((ctrl, idx) => (
                            <div
                                key={idx}
                                className="p-3.5 rounded-lg border border-amber-500/20 bg-amber-500/[0.03] text-xs leading-relaxed"
                            >
                                <span className="font-bold text-gray-900 dark:text-white">
                                    {ctrl.title}:{" "}
                                </span>
                                <span className="text-gray-600 dark:text-gray-400">
                                    {ctrl.desc}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export function SystemDetailFaqSection({ faqs }: { faqs?: SystemFaq[] }) {
    if (!faqs || faqs.length === 0) {
        return (
            <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                No frequently asked questions available for this system.
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {faqs.map((faq, idx) => (
                <div
                    key={idx}
                    className="p-4 rounded-lg border border-dashboard dark:border-white/[0.08] bg-gray-50/40 dark:bg-white/[0.02]"
                >
                    <p className="text-xs font-bold text-gray-900 dark:text-white mb-1.5 flex items-center gap-2">
                        <span className="w-5 h-5 rounded-lg bg-amber-500/10 text-amber-500 flex items-center justify-center text-[10px] font-bold shrink-0">
                            Q
                        </span>
                        <span>{faq.question}</span>
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 pl-7 leading-relaxed">
                        {faq.answer}
                    </p>
                </div>
            ))}
        </div>
    );
}
