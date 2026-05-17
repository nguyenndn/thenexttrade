"use client";

import Link from "next/link";
import { Wallet, FileText, GraduationCap, ArrowRight, Sparkles, BarChart3 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ActivationState } from "@/lib/activation/activation-types";

interface WelcomeHeroProps {
  userName: string;
  activationState: ActivationState;
}

const QUICK_ACTIONS = [
  {
    icon: Wallet,
    title: "Connect Account",
    description: "Sync your broker to auto-import trades",
    href: "/dashboard/accounts",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: FileText,
    title: "Log First Trade",
    description: "Start building your trading history",
    href: "/dashboard/journal",
    color: "text-primary",
    bg: "bg-primary/10",
  },
  {
    icon: GraduationCap,
    title: "Explore Academy",
    description: "Level-up with structured lessons",
    href: "/dashboard/academy",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
];

export function WelcomeHero({ userName, activationState }: WelcomeHeroProps) {
  const progress = Math.round(
    (activationState.completedCount / activationState.totalCount) * 100
  );

  return (
    <div className="space-y-4">
      {/* Hero Card */}
      <div className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B0E14] overflow-hidden">
        {/* Background glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 dark:bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-500/5 dark:bg-purple-500/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 p-6 md:p-8">
          {/* Greeting */}
          <div className="flex items-center gap-2 mb-4">
            <div className="p-2 bg-primary/10 rounded-xl">
              <Sparkles size={20} className="text-primary" />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Welcome to your Command Center
            </span>
          </div>

          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            Hey {userName}, let&apos;s set up your edge.
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-xl leading-relaxed mb-6">
            Your dashboard will come alive once you start logging trades.
            Complete these 3 quick steps to unlock analytics, insights, and your personal Trade Score.
          </p>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-2">
            <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden max-w-xs">
              <div
                className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-700"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 tabular-nums">
              {activationState.completedCount}/{activationState.totalCount} done
            </span>
          </div>
        </div>
      </div>

      {/* Quick Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {QUICK_ACTIONS.map((action) => {
          const isCompleted = activationState.steps.some(
            (s) =>
              s.ctaHref === action.href && s.completed
          );
          return (
            <Link key={action.href} href={action.href} className="group block">
              <div
                className={`relative rounded-xl border p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 ${
                  isCompleted
                    ? "border-primary/20 bg-primary/5 dark:bg-primary/10"
                    : "border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B0E14] hover:border-primary/30"
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2.5 rounded-xl ${action.bg} shrink-0`}>
                    <action.icon size={20} className={action.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                        {action.title}
                      </h3>
                      {isCompleted && (
                        <span className="text-[9px] font-black text-primary bg-primary/10 px-1.5 py-0.5 rounded-md uppercase tracking-wider">
                          Done
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {action.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1"
                  />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* What you'll unlock hint */}
      <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5">
        <BarChart3 size={16} className="text-gray-400 shrink-0" />
        <p className="text-xs text-gray-500 dark:text-gray-400">
          <span className="font-bold text-gray-600 dark:text-gray-300">After your first trade:</span>{" "}
          Performance charts, AI insights, Trade Score, Psychology tracker, and Weekly Reports will appear here.
        </p>
      </div>
    </div>
  );
}
