"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Rocket, BarChart3, GraduationCap, Cable } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ActivationState } from "@/lib/activation/activation-types";
import { trackEvent } from "@/lib/track";

interface WelcomeHeroProps {
  userName: string;
  activationState: ActivationState;
  tradingGoal?: string | null;
}

// Goal-based personalization for the hero section
const goalMessages: Record<string, { title: string; subtitle: string }> = {
  track: {
    title: "Let's start tracking your trades.",
    subtitle: "Connect your MT5 account and your dashboard will automatically organize every trade — entries, exits, and results.",
  },
  mistakes: {
    title: "Let's find what's costing you money.",
    subtitle: "Your dashboard will analyze patterns in your trades and spotlight recurring mistakes so you can fix them fast.",
  },
  discipline: {
    title: "Let's build your trading discipline.",
    subtitle: "Start with Academy lessons and connect your account — your dashboard will track consistency and risk management.",
  },
  pro: {
    title: "Let's unlock your Pro toolkit.",
    subtitle: "Connect your account to access AI coaching, Trade Score, advanced analytics, and exclusive Pro features.",
  },
};

const defaultMessage = {
  title: "let's set up your edge.",
  subtitle: "Your dashboard will come alive once you start logging trades. Complete these steps to unlock analytics, insights, and your personal Trade Score.",
};

export function WelcomeHero({ userName, activationState, tradingGoal }: WelcomeHeroProps) {
  // Fire once on mount
  const hasTracked = useRef(false);
  useEffect(() => {
    if (!hasTracked.current) {
      trackEvent("new_user_zero_state_viewed", { tradingGoal: tradingGoal || "none" });
      hasTracked.current = true;
    }
  }, [tradingGoal]);
  const progress = Math.round(
    (activationState.completedCount / activationState.totalCount) * 100
  );

  const nextStep = activationState.nextStep;

  // Secondary actions: show 2 non-next, non-completed steps
  const secondarySteps = activationState.steps
    .filter((s) => !s.completed && s.id !== nextStep?.id)
    .slice(0, 2);

  const handleCtaClick = (stepId: string, href: string) => {
    trackEvent("activation_next_step_clicked", { step: stepId, href });
  };

  // Resolve personalized message
  const goal = tradingGoal ? goalMessages[tradingGoal] : null;
  const heroTitle = goal ? goal.title : defaultMessage.title;
  const heroSubtitle = goal ? goal.subtitle : defaultMessage.subtitle;

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
            <div className="relative p-2 bg-primary/10 rounded-xl">
              <Rocket size={20} className="text-primary animate-[wiggle_2s_ease-in-out_infinite]" />
              <div className="absolute inset-0 rounded-xl bg-primary/20 animate-[icon-ping_2.5s_cubic-bezier(0,0,0.2,1)_infinite]" />
            </div>
            <span className="text-xs font-bold text-primary uppercase tracking-wider">
              Welcome to your Command Center
            </span>
          </div>

          <style jsx>{`
            @keyframes wiggle {
              0%, 100% { transform: rotate(0deg); }
              25% { transform: rotate(-8deg); }
              75% { transform: rotate(8deg); }
            }
            @keyframes icon-ping {
              0% { transform: scale(1); opacity: 0.4; }
              75%, 100% { transform: scale(1.5); opacity: 0; }
            }
          `}</style>

          <h2 className="text-2xl md:text-3xl font-black text-gray-900 dark:text-white tracking-tight mb-2">
            {goal ? heroTitle : <>Hey {userName}, {heroTitle}</>}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-sm md:text-base max-w-xl leading-relaxed mb-6">
            {heroSubtitle}
          </p>

          {/* Progress */}
          <div className="flex items-center gap-3 mb-4">
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

          {/* Primary Next Best Action */}
          {nextStep && (
            <Link
              href={nextStep.ctaHref}
              onClick={() => handleCtaClick(nextStep.id, nextStep.ctaHref)}
            >
              <Button variant="primary" className="gap-2 shadow-lg shadow-primary/25 px-6 py-3 text-sm">
                {nextStep.ctaLabel}
                <ArrowRight size={16} />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Secondary Action Cards — show 2 relevant next actions */}
      {secondarySteps.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {secondarySteps.map((step) => (
            <Link
              key={step.id}
              href={step.ctaHref}
              onClick={() => handleCtaClick(step.id, step.ctaHref)}
              className="group block"
            >
              <div className="relative rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B0E14] p-5 transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5 hover:border-primary/30">
                <div className="flex items-start gap-3">
                  <div className="p-2.5 rounded-xl bg-gray-100 dark:bg-white/5 shrink-0">
                    {step.id === "START_ACADEMY" ? (
                      <GraduationCap size={18} className="text-purple-500" />
                    ) : step.id === "CONNECT_ACCOUNT" ? (
                      <Cable size={18} className="text-cyan-500" />
                    ) : (
                      <BarChart3 size={18} className="text-primary" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white">
                      {step.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                      {step.description}
                    </p>
                  </div>
                  <ArrowRight
                    size={16}
                    className="text-gray-300 dark:text-gray-600 group-hover:text-primary group-hover:translate-x-1 transition-all shrink-0 mt-1"
                  />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Ghost Chart Preview — show what the dashboard will look like */}
      <div className="relative rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B0E14] overflow-hidden">
        {/* Blurred mock chart (SVG) */}
        <div className="relative h-36 md:h-48 overflow-hidden">
          <svg viewBox="0 0 400 120" className="w-full h-full blur-[2px] opacity-40 dark:opacity-25" preserveAspectRatio="none">
            {/* Grid lines */}
            <line x1="0" y1="30" x2="400" y2="30" stroke="currentColor" strokeOpacity="0.06" />
            <line x1="0" y1="60" x2="400" y2="60" stroke="currentColor" strokeOpacity="0.06" />
            <line x1="0" y1="90" x2="400" y2="90" stroke="currentColor" strokeOpacity="0.06" />
            {/* Mock area fill */}
            <path
              d="M0,85 L30,78 L60,72 L90,80 L120,65 L150,55 L180,60 L210,45 L240,50 L270,35 L300,40 L330,28 L360,32 L400,20 L400,120 L0,120 Z"
              className="fill-primary/15 dark:fill-primary/10"
            />
            {/* Mock line */}
            <path
              d="M0,85 L30,78 L60,72 L90,80 L120,65 L150,55 L180,60 L210,45 L240,50 L270,35 L300,40 L330,28 L360,32 L400,20"
              fill="none"
              className="stroke-primary/30 dark:stroke-primary/20"
              strokeWidth="2"
            />
            {/* Mock bars */}
            {[40, 100, 160, 220, 280, 340].map((x, i) => (
              <rect key={i} x={x} y={95 - [15, 25, 20, 30, 18, 28][i]} width="20" height={[15, 25, 20, 30, 18, 28][i]} rx="3" className="fill-primary/10 dark:fill-primary/8" />
            ))}
          </svg>

          {/* Overlay text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-t from-white/80 via-white/40 to-transparent dark:from-[#0B0E14]/80 dark:via-[#0B0E14]/40 dark:to-transparent">
            <BarChart3 size={24} className="text-primary/50 mb-2" />
            <p className="text-sm font-bold text-gray-800 dark:text-white">
              Your performance charts will appear here
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              After your first trade: AI insights, Trade Score, Psychology tracker &amp; more
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
