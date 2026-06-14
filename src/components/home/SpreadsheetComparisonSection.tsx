"use client";

import Link from "next/link";
import { X, Check, FileSpreadsheet, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SpreadsheetComparisonSectionProps {
  isLoggedIn: boolean;
}

const comparisonRows = [
  {
    spreadsheet: "Manual entry becomes inconsistent",
    tnt: "MT5 sync through TNT Connect or EA",
  },
  {
    spreadsheet: "P&L is the only metric",
    tnt: "Sessions, symbols, win rate, profit factor, trade score",
  },
  {
    spreadsheet: "Hard to spot repeat mistakes",
    tnt: "Weekly coach report and recommended learning",
  },
  {
    spreadsheet: "No action plan after review",
    tnt: "One next action each week",
  },
];

export function SpreadsheetComparisonSection({ isLoggedIn }: SpreadsheetComparisonSectionProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-[#0B0E14] border-t border-dashboard">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />

      <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center mb-8">
          <h2 className="text-3xl sm:text-4xl font-black text-gray-800 dark:text-white tracking-tight leading-none mb-3">
            A spreadsheet records trades.{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-500">
              TheNextTrade explains them.
            </span>
          </h2>
          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-medium max-w-2xl mx-auto">
            A spreadsheet can tell you what happened. TheNextTrade helps you decide what to change.
          </p>
        </div>

        {/* Comparison Table */}
        <div className="max-w-4xl mx-auto">
          {/* Header Row */}
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div className="flex items-center gap-2 p-3 rounded-xl bg-red-50/50 dark:bg-red-500/5 border border-red-100/50 dark:border-red-500/10">
              <FileSpreadsheet size={16} className="text-red-400 flex-shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-red-500">Spreadsheet / Manual Notes</span>
            </div>
            <div className="flex items-center gap-2 p-3 rounded-xl bg-gold/5 border border-gold/20">
              <Sparkles size={16} className="text-gold flex-shrink-0" />
              <span className="text-xs font-black uppercase tracking-wider text-gold">TheNextTrade</span>
            </div>
          </div>

          {/* Data Rows */}
          <div className="space-y-2">
            {comparisonRows.map((row, idx) => (
              <div key={idx} className="grid grid-cols-2 gap-3">
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gray-50/50 dark:bg-white/[0.01] border border-dashboard/30 dark:border-white/5">
                  <X size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium leading-snug">
                    {row.spreadsheet}
                  </span>
                </div>
                <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-gold/[0.02] dark:bg-gold/[0.01] border border-gold/10 dark:border-gold/5">
                  <Check size={14} className="text-emerald-500 flex-shrink-0 mt-0.5" />
                  <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 font-bold leading-snug">
                    {row.tnt}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="flex justify-center mt-8">
            <Link href={isLoggedIn ? "/dashboard" : "/auth/signup?source=spreadsheet_comparison"}>
              <Button 
                className="min-h-11 px-8 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-[0_4px_12px_rgba(245,158,11,0.25)] hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                {isLoggedIn ? "Open My Journal" : "Start Free Journal"} <Sparkles size={14} className="text-yellow-300" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
