"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface SaaSHeroSectionProps {
  isLoggedIn: boolean;
}

export function SaaSHeroSection({ isLoggedIn }: SaaSHeroSectionProps) {
  return (
    <div className="pt-24 pb-12 bg-white dark:bg-transparent relative overflow-hidden text-center">
      {/* Grid Pattern Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:50px_50px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_70%,transparent_100%)]" />
      <div className="absolute inset-0 noise-bg opacity-[0.02] dark:opacity-[0.04] pointer-events-none" />

      <section className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
        {/* Main Headline */}
        <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-800 dark:text-white tracking-tight leading-[1.08] mb-6 max-w-4xl animate-in fade-in slide-in-from-top-4 duration-700">
          Turn Your Trade History <br className="hidden sm:inline" /> Into{" "}
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-500 dark:from-gold dark:to-yellow-400">
            Your Next Move
          </span>
        </h1>

        {/* Supporting Copy */}
        <p className="text-base sm:text-lg text-gray-650 dark:text-gray-300 leading-relaxed mb-8 max-w-5xl font-medium animate-in fade-in duration-1000 lg:whitespace-nowrap">
          Sync MT5 trades, review what happened, and get one focused weekly action to improve your trading.
        </p>

        {/* Single Primary CTA */}
        <div className="flex flex-col items-center justify-center gap-4 mb-4 w-full sm:w-auto animate-in fade-in duration-1000">
          <Link href={isLoggedIn ? "/dashboard" : "/auth/signup?source=homepage_hero"} className="w-full sm:w-auto group">
            <Button
              className="w-full sm:w-auto min-h-12 px-8 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-sm shadow-[0_10px_24px_rgba(245,158,11,0.22)] hover:shadow-[0_14px_30px_rgba(245,158,11,0.3)] hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap animate-btn-shine"
            >
              <span>{isLoggedIn ? "Open Dashboard" : "Start Free Journal"}</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform duration-300" />
            </Button>
          </Link>
        </div>

      </section>
    </div>
  );
}

