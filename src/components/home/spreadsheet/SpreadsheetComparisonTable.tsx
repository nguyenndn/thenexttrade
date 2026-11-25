import { FileText, Brain, X, Check } from "lucide-react";

const comparisonRows = [
    {
        traditional: "45 mins wasted copy-pasting MT5 tickets into Excel every weekend",
        tnt: "Zero manual typing — entries, SL/TP, commissions & swaps logged automatically",
    },
    {
        traditional: "Clunky CSV/HTML file imports that break formatting & require a desktop PC",
        tnt: "Proprietary MT5 Cloud Sync — sync in 1 click from mobile or web (no VPS needed)",
    },
    {
        traditional: "Only tracks net P&L — blind to whether it was real edge or pure luck",
        tnt: "Full edge telemetry: Win rate, R:R, session edge, MAE & drawdowns",
    },
    {
        traditional: "Messy charts, scattered Discord notes & lost screenshots",
        tnt: "5 SMC/ICT playbooks + auditable rule checklists & A+ setup compliance rates",
    },
    {
        traditional: "Can’t pinpoint which bad habit is draining your account",
        tnt: "Behavioral leak radar flags revenge sizing, moved stops & off-session FOMO",
    },
    {
        traditional: "Reviewing red days without knowing what to fix on Monday",
        tnt: "10-trade sprint plans with weekly coach accountability benchmarks",
    },
];

export function SpreadsheetComparisonTable() {
    return (
        <div>
            {/* Header Row (Desktop/Tablet) */}
            <div className="hidden md:grid grid-cols-2 gap-4 mb-3">
                <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-slate-100/70 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-center">
                    <FileText size={16} className="text-slate-400 flex-shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-slate-600 dark:text-slate-400">
                        Excel & Manual CSV Journals
                    </span>
                </div>
                <div className="flex items-center justify-center gap-2 p-3.5 rounded-xl bg-gold/5 border border-gold/20 dark:border-gold/30 text-center">
                    <Brain size={16} className="text-gold flex-shrink-0" />
                    <span className="text-xs font-black uppercase tracking-wider text-gold">
                        TheNextTrade OS
                    </span>
                </div>
            </div>

            {/* Data Rows */}
            <div className="space-y-2.5">
                {comparisonRows.map((row, idx) => (
                    <div key={idx} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-50/50 dark:bg-[#0D111C] border border-gray-200 dark:border-white/10">
                            <X size={14} className="text-slate-400 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium leading-snug">
                                {row.traditional}
                            </span>
                        </div>
                        <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gold/[0.02] dark:bg-gold/[0.02] border border-gold/20 dark:border-gold/25">
                            <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold leading-snug">
                                {row.tnt}
                            </span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
