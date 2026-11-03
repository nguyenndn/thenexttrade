import { Wallet, ArrowRight, ArrowDown, Building2, RotateCcw, ShieldCheck } from "lucide-react";

export function BrokerCapitalFlow() {
    return (
        <div className="w-full bg-white/95 dark:bg-[#0D111C] rounded-xl p-5 sm:p-6 border border-gray-200 dark:border-white/10 shadow-md mb-6 sm:mb-8 backdrop-blur-md">
            <div className="text-center max-w-2xl mx-auto mb-5">
                <h4 className="text-base sm:text-lg font-black text-gray-900 dark:text-white mb-1">
                    Where does your{" "}
                    <span className="text-gold font-mono tabular-nums">$200</span> deposit actually go?
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400">
                    See how your funds flow directly between you and your chosen regulated broker without touching TheNextTrade.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-center mb-5">
                {/* Node 1: Trader */}
                <div className="p-3.5 rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-center flex flex-col items-center">
                    <div className="w-9 h-9 rounded-lg bg-white dark:bg-white/10 text-gray-800 dark:text-white flex items-center justify-center mb-1.5 shadow-sm border border-gray-200 dark:border-white/10">
                        <Wallet size={18} />
                    </div>
                    <h5 className="text-sm font-extrabold text-gray-900 dark:text-white">You (Trader)</h5>
                    <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium">
                        <span className="font-mono tabular-nums">100%</span> Sole Owner of Capital
                    </span>
                </div>

                {/* Mid Indicator: Direct Deposit */}
                <div className="flex flex-col items-center justify-center p-2 text-center relative w-full">
                    <div className="relative w-full max-w-[240px] flex items-center justify-center mb-2 py-1">
                        <div className="hidden md:block absolute inset-x-0 top-1/2 -translate-y-1/2 h-[2px] bg-gradient-to-r from-gray-200 via-gold/40 to-gray-200 dark:from-white/10 dark:via-gold/40 dark:to-white/10" />

                        {/* Central Floating Badge with Gold Glow */}
                        <div className="relative z-10 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-amber-50/90 dark:bg-[#151925] text-amber-900 dark:text-gold text-[11px] font-black uppercase tracking-wider border border-gold/50 shadow-[0_0_15px_rgba(229,165,10,0.2)] backdrop-blur-md">
                            <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-gold opacity-75" />
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500" />
                            </span>
                            <span className="font-mono tabular-nums">Deposit $200</span>
                            <ArrowRight size={13} className="text-gold hidden md:inline" />
                            <ArrowDown size={13} className="text-gold md:hidden" />
                        </div>
                    </div>

                    <div className="flex items-center gap-1.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">
                        <RotateCcw size={11} className="shrink-0" />
                        <span>Withdraw whenever you choose</span>
                    </div>
                </div>

                {/* Node 2: Regulated Broker */}
                <div className="p-3.5 rounded-lg bg-gold/10 dark:bg-gold/15 border border-gold/40 text-center flex flex-col items-center">
                    <div className="w-9 h-9 rounded-lg bg-gold text-white flex items-center justify-center mb-1.5 shadow-md shadow-gold/20">
                        <Building2 size={18} />
                    </div>
                    <h5 className="text-sm font-extrabold text-gray-900 dark:text-white">Your Broker Account</h5>
                    <span className="text-[11px] font-bold text-amber-900 dark:text-gold">
                        <span className="font-mono tabular-nums">100%</span> In Your Legal Name
                    </span>
                </div>
            </div>

            {/* Zero Fee Guarantee Banner */}
            <div className="p-3 sm:p-3.5 rounded-lg bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/30 text-emerald-900 dark:text-emerald-200 text-xs font-semibold flex items-center justify-center gap-2 text-center">
                <ShieldCheck size={16} className="text-emerald-600 dark:text-emerald-400 shrink-0 hidden sm:block" />
                <span>
                    <strong>
                        TheNextTrade receives <span className="font-mono tabular-nums">$0</span>.
                    </strong>{" "}
                    Your full VIP membership unlocks automatically — there is nothing to pay us, ever.
                </span>
            </div>
        </div>
    );
}
