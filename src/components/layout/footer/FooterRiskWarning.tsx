import { AlertTriangle } from "lucide-react";

export function FooterRiskWarning() {
    return (
        <div className="flex gap-4 p-5 rounded-xl border border-amber-500/10 dark:border-amber-500/5 bg-amber-500/[0.02] dark:bg-amber-500/[0.01] text-left my-6">
            <div className="shrink-0 flex items-center justify-center w-9 h-9 rounded-full bg-amber-500/10 dark:bg-amber-500/5 border border-amber-500/20 text-amber-600 dark:text-amber-500/90">
                <AlertTriangle size={16} className="stroke-[2.5]" />
            </div>

            <div className="flex-1 min-w-0 space-y-1.5">
                <p className="text-[11px] sm:text-xs leading-relaxed font-semibold text-gray-500 dark:text-gray-400">
                    <span className="text-amber-600 dark:text-amber-500 font-black uppercase tracking-wider mr-1.5">
                        Risk Warning &amp; Disclaimer:
                    </span>
                    Trading forex, cryptocurrencies, and CFDs carries a{" "}
                    <span className="text-amber-600 dark:text-amber-500 font-bold">
                        high level of risk
                    </span>{" "}
                    and may not be suitable for all investors. You may lose more
                    than your initial investment. Only trade with money you can
                    afford to lose. Past performance is not indicative of future
                    results. TheNextTrade provides software tools and trade
                    analytics only and does not act as a broker, custodian, or
                    financial advisor.
                </p>
                <p className="text-[11px] leading-relaxed font-medium text-gray-400 dark:text-gray-500">
                    <span className="font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mr-1">
                        Restricted Jurisdictions:
                    </span>
                    The information, software tools, and partner broker links on
                    this website are directed at global markets and are not
                    intended for distribution to, or use by, any person in any
                    country or jurisdiction where such distribution or leveraged
                    FX/CFD trading would be contrary to local law or regulation
                    (including the United States, Vietnam, and other restricted
                    territories).
                </p>
            </div>
        </div>
    );
}
