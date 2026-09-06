"use client";

export function Pillar1MicroCard() {
    return (
        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-3.5 border border-slate-200/70 dark:border-white/[0.05] text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-700 dark:text-gray-300">Live MT5 Cloud Sync</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded">
                    0 Friction
                </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Trade execution, SL/TP updates &amp; partial exits recorded instantly.
            </p>
        </div>
    );
}

export function Pillar2MicroCard() {
    return (
        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-3.5 border border-slate-200/70 dark:border-white/[0.05] text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-700 dark:text-gray-300">Psychology Radar</span>
                <span className="text-gold font-bold text-[10px] bg-gold/10 px-2 py-0.5 rounded">
                    10+ Leaks Caught
                </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Real-time alerts on tilt sizing, moving stop-losses, and impulsive entries.
            </p>
        </div>
    );
}

export function Pillar3MicroCard() {
    return (
        <div className="rounded-xl bg-slate-50 dark:bg-white/[0.04] p-3.5 border border-slate-200/70 dark:border-white/[0.05] text-xs space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-bold">
                <span className="text-gray-700 dark:text-gray-300">Habit Ladder</span>
                <span className="text-slate-700 dark:text-slate-300 font-bold text-[10px] bg-slate-200/60 dark:bg-white/10 px-2 py-0.5 rounded">
                    8/10 On Track
                </span>
            </div>
            <p className="text-[11px] text-gray-500 dark:text-gray-400">
                Single-rule focus cycles that systematically turn undisciplined traders into pros.
            </p>
        </div>
    );
}
