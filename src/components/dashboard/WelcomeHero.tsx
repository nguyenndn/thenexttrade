"use client";

import Link from "next/link";
import { ArrowRight, Sparkles, BarChart3, GraduationCap, Cable } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ActivationState } from "@/lib/activation/activation-types";
import { trackEvent } from "@/lib/track";

interface WelcomeHeroProps {
  userName: string;
  activationState: ActivationState;
}

export function WelcomeHero({ userName, activationState }: WelcomeHeroProps) {
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
            Complete these steps to unlock analytics, insights, and your personal Trade Score.
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
