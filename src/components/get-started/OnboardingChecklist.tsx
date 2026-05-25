"use client";

import Link from "next/link";
import {
  CheckCircle2,
  Circle,
  User,
  MonitorSmartphone,
  ArrowRight,
  RefreshCw,
  LayoutDashboard,
  Target,
  FileText,
  ExternalLink,
  ChevronDown,
  Sparkles,
} from "lucide-react";
import { useState } from "react";
import { FadeIn } from "@/components/ui/FadeIn";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
export interface UserProgress {
  userName: string;
  hasProfile: boolean;
  hasAccount: boolean;
  hasFirstTrade: boolean;
  hasMissionComplete: boolean;
  totalAccounts: number;
  totalTrades: number;
  totalMissions: number;
  xp: number;
  level: number;
}

/* ------------------------------------------------------------------ */
/*  Checklist Step Data                                                 */
/* ------------------------------------------------------------------ */
interface StepDef {
  id: string;
  title: string;
  description: string;
  icon: typeof User;
  href: string;
  linkText: string;
  completed: (p: UserProgress) => boolean;
  detail: string;
}

const STEPS: StepDef[] = [
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Set your username, avatar and bio so others can find you on the leaderboard.",
    icon: User,
    href: "/dashboard/settings",
    linkText: "Go to Settings",
    completed: (p) => p.hasProfile,
    detail:
      "Your profile is your identity on TheNextTrade. A complete profile builds trust in the community and makes your leaderboard presence stand out.",
  },
  {
    id: "connect",
    title: "Connect Your MT5 Account",
    description: "Add your first trading account to start syncing trades automatically.",
    icon: MonitorSmartphone,
    href: "/dashboard/accounts",
    linkText: "Add Account",
    completed: (p) => p.hasAccount,
    detail:
      "Go to Dashboard → Accounts → Add Account. You can sync via TNT Connect (desktop app) or EA Sync (MT5 Expert Advisor). Both methods import trades in real-time.",
  },
  {
    id: "sync",
    title: "Sync Your First Trade",
    description: "Execute a trade on MT5 and see it appear in your journal automatically.",
    icon: RefreshCw,
    href: "/dashboard",
    linkText: "View Dashboard",
    completed: (p) => p.hasFirstTrade,
    detail:
      "Once your account is connected, any new closed trade will appear in your dashboard within seconds. Open MT5, close a trade, then refresh your dashboard.",
  },
  {
    id: "explore",
    title: "Explore Your Dashboard",
    description: "Check out your balance, win rate, P&L charts and trade calendar.",
    icon: LayoutDashboard,
    href: "/dashboard",
    linkText: "Open Dashboard",
    completed: (p) => p.totalTrades >= 3,
    detail:
      "Your dashboard shows real-time stats: balance, equity, win rate, profit factor, trade score, and more. The more trades you sync, the richer your analytics become.",
  },
  {
    id: "mission",
    title: "Complete Your First Mission",
    description: "Earn Edge Points by completing a mission. It is how you level up.",
    icon: Target,
    href: "/dashboard#missions",
    linkText: "View Missions",
    completed: (p) => p.hasMissionComplete,
    detail:
      "Missions are challenges that reward you with XP (Edge Points). Complete missions like 'First Trade', 'Log a Journal Entry', or 'Win 3 Trades in a Row' to climb the leaderboard.",
  },
  {
    id: "report",
    title: "Check Your AI Report",
    description: "After a week of trading, your first AI-powered performance report will be generated.",
    icon: FileText,
    href: "/dashboard/reports",
    linkText: "View Reports",
    completed: (p) => p.totalTrades >= 10,
    detail:
      "AI reports analyze your trading patterns weekly. They highlight strengths, weaknesses, and actionable suggestions. The more data you have, the more insightful the reports become.",
  },
];

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export function OnboardingChecklist({ progress }: { progress: UserProgress }) {
  const [expandedStep, setExpandedStep] = useState<string | null>(null);
  const completedCount = STEPS.filter((s) => s.completed(progress)).length;
  const percentage = Math.round((completedCount / STEPS.length) * 100);

  return (
    <div className="py-12 md:py-20">
      <div className="max-w-[720px] mx-auto px-4 sm:px-6">
        {/* Header */}
        <FadeIn delay={0.1}>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-4">
              <Sparkles size={12} />
              Getting Started
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white mb-3">
              Welcome{progress.userName ? `, ${progress.userName}` : ""}! 👋
            </h1>
            <p className="text-base text-gray-500 dark:text-gray-400 max-w-md mx-auto">
              Follow these steps to set up your trading journal and start improving your performance.
            </p>
          </div>
        </FadeIn>

        {/* Progress Bar */}
        <FadeIn delay={0.2}>
          <div className="mb-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                {completedCount} of {STEPS.length} completed
              </span>
              <span className="text-sm font-black text-primary">{percentage}%</span>
            </div>
            <div className="h-3 rounded-full bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-primary to-[#00A570] transition-all duration-700 ease-out"
                style={{ width: `${percentage}%` }}
              />
            </div>
          </div>
        </FadeIn>

        {/* Checklist */}
        <div className="space-y-3">
          {STEPS.map((step, idx) => {
            const done = step.completed(progress);
            const Icon = step.icon;
            const isExpanded = expandedStep === step.id;

            return (
              <FadeIn key={step.id} delay={0.05 + idx * 0.05}>
                <div
                  className={`rounded-xl border transition-all ${
                    done
                      ? "border-primary/20 bg-primary/[0.02] dark:bg-primary/5"
                      : isExpanded
                        ? "border-primary/30 bg-white dark:bg-white/[0.03] shadow-sm"
                        : "border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:border-gray-300 dark:hover:border-white/15"
                  }`}
                >
                  {/* Step Header */}
                  <button
                    onClick={() => setExpandedStep(isExpanded ? null : step.id)}
                    className="flex items-center gap-4 w-full px-5 py-4 text-left"
                  >
                    {/* Status icon */}
                    {done ? (
                      <CheckCircle2 size={22} className="text-primary shrink-0" strokeWidth={2.5} />
                    ) : (
                      <Circle size={22} className="text-gray-300 dark:text-gray-600 shrink-0" strokeWidth={2} />
                    )}

                    {/* Icon + Text */}
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${done ? "bg-primary/10" : "bg-gray-100 dark:bg-white/5"}`}>
                      <Icon size={16} className={done ? "text-primary" : "text-gray-400"} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-sm font-bold ${done ? "text-primary" : "text-gray-800 dark:text-white"}`}>
                        {done ? <s>{step.title}</s> : step.title}
                      </h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                        {step.description}
                      </p>
                    </div>

                    {/* Expand toggle */}
                    <ChevronDown
                      size={16}
                      className={`shrink-0 text-gray-400 transition-transform duration-200 ${isExpanded ? "rotate-180 text-primary" : ""}`}
                    />
                  </button>

                  {/* Expanded Detail */}
                  <div className={`overflow-hidden transition-all duration-300 ${isExpanded ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-5 pb-4 pl-[4.5rem]">
                      <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-3">
                        {step.detail}
                      </p>
                      {!done && (
                        <Link
                          href={step.href}
                          className="inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:underline group"
                        >
                          {step.linkText}
                          <ExternalLink size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                      )}
                    </div>
                  </div>
                </div>
              </FadeIn>
            );
          })}
        </div>

        {/* Stats Summary (if has some progress) */}
        {progress.totalTrades > 0 && (
          <FadeIn delay={0.4} direction="up">
            <div className="mt-10 grid grid-cols-3 gap-4">
              <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                <p className="text-2xl font-black text-primary">{progress.totalAccounts}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Accounts</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                <p className="text-2xl font-black text-primary">{progress.totalTrades}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">Trades Synced</p>
              </div>
              <div className="text-center p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border border-gray-200 dark:border-white/10">
                <p className="text-2xl font-black text-primary">Lv.{progress.level}</p>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-1">{progress.xp} XP</p>
              </div>
            </div>
          </FadeIn>
        )}

        {/* All Done */}
        {completedCount === STEPS.length && (
          <FadeIn delay={0.5} direction="up">
            <div className="mt-10 text-center p-8 rounded-2xl border border-primary/20 bg-primary/[0.03] dark:bg-primary/5">
              <div className="text-4xl mb-3">🎉</div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2">You are all set!</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                Your trading journal is fully configured. Keep trading and climbing the leaderboard!
              </p>
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-bold rounded-xl hover:bg-primary/90 transition-all group"
              >
                Go to Dashboard <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
            </div>
          </FadeIn>
        )}
      </div>
    </div>
  );
}
