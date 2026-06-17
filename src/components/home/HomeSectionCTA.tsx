"use client";

import Link from "next/link";
import { ArrowRight, Star } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface HomeSectionCTAProps {
  isLoggedIn: boolean;
}

export function HomeSectionCTA({ isLoggedIn }: HomeSectionCTAProps) {
  return (
    <div className="relative overflow-hidden bg-white dark:bg-transparent">
      <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="relative p-5 sm:p-6 rounded-2xl border border-gold/20 dark:border-gold/15 bg-gradient-to-r from-gold/[0.03] to-amber-500/[0.01] dark:from-gold/[0.02] dark:to-transparent backdrop-blur-md shadow-sm overflow-hidden group hover:border-gold/40 transition-all duration-300">
          <div className="absolute top-1/2 -right-4 -translate-y-1/2 w-32 h-32 bg-gold/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col sm:flex-row gap-5 sm:items-center sm:justify-between relative z-10">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-gold/10 text-gold h-fit">
                <Star size={16} className="animate-pulse" />
              </div>
              <div>
                <h4 className="text-sm sm:text-base font-black text-gray-800 dark:text-white">
                  Ready to apply this to your own trades?
                </h4>
                <p className="mt-0.5 text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-medium">
                  Sync your MT5 history and turn what you learn into a weekly improvement plan.
                </p>
              </div>
            </div>
            
            <Link 
              href={isLoggedIn ? "/dashboard" : "/auth/signup?source=popular_guides_cta&intent=track"}
              className="w-full sm:w-auto"
            >
              <Button
                className="w-full sm:w-auto min-h-11 px-6 rounded-xl bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white font-black text-xs sm:text-sm shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-1.5"
              >
                <span>{isLoggedIn ? "Open My Journal" : "Start Free Journal"}</span>
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
