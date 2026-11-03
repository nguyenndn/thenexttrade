import { RotateCcw, Lock, Building2, Zap } from "lucide-react";

export function BrokerTrustPillars() {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-8 w-full">
            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-card/50 border border-gray-200 dark:border-white/10 shadow-sm hover:border-gold/40 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <RotateCcw size={15} />
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                        Withdraw Anytime
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                        100% at your command
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-card/50 border border-gray-200 dark:border-white/10 shadow-sm hover:border-gold/40 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-gold/15 text-gold flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Lock size={15} />
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                        100% In Your Name
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                        Regulated broker account
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-card/50 border border-gray-200 dark:border-white/10 shadow-sm hover:border-gold/40 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 size={15} />
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                        New or Existing
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                        Flexible broker connection
                    </p>
                </div>
            </div>

            <div className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl bg-white dark:bg-card/50 border border-gray-200 dark:border-white/10 shadow-sm hover:border-gold/40 transition-all group">
                <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-white/5 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Zap size={15} />
                </div>
                <div className="min-w-0">
                    <h4 className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                        No Monthly Subscription
                    </h4>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-medium truncate">
                        No recurring card charges
                    </p>
                </div>
            </div>
        </div>
    );
}
