"use client";

import Link from "next/link";
import { CheckCircle2, Circle, ArrowRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { ActivationState } from "@/lib/activation/activation-types";
import { trackEvent } from "@/lib/track";

interface ActivationChecklistProps {
  state: ActivationState;
}

export function ActivationChecklist({ state }: ActivationChecklistProps) {
  const { steps, nextStep, completedCount, totalCount } = state;
  const progress = Math.round((completedCount / totalCount) * 100);

  const handleCtaClick = (stepId: string, href: string) => {
    trackEvent("activation_cta_clicked", { step: stepId, href });
  };

  return (
    <div className="rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0B0E14] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-gray-100 dark:border-white/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Compass size={16} className="text-primary" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-800 dark:text-white">Your next step</h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Set up the workflow that makes your trading data useful.
              </p>
            </div>
          </div>
          <span className="text-xs font-bold text-primary">{completedCount}/{totalCount}</span>
        </div>
        {/* Progress bar */}
        <div className="mt-3 h-1.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-teal-400 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Next Step CTA */}
      {nextStep && (
        <div className="px-5 py-4 bg-primary/5 dark:bg-primary/10 border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-gray-800 dark:text-white">{nextStep.title}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 line-clamp-1">
                {nextStep.description}
              </p>
            </div>
            <Link
              href={nextStep.ctaHref}
              onClick={() => handleCtaClick(nextStep.id, nextStep.ctaHref)}
            >
              <Button variant="primary" className="shrink-0 gap-1.5 text-sm px-4 py-2">
                {nextStep.ctaLabel}
                <ArrowRight size={14} />
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Step List */}
      <div className="px-5 py-3 space-y-1">
        {steps.map((step) => (
          <div key={step.id} className="flex items-center gap-3 py-1.5">
            {step.completed ? (
              <CheckCircle2 size={16} className="text-primary shrink-0" />
            ) : (
              <Circle size={16} className="text-gray-300 dark:text-gray-600 shrink-0" />
            )}
            <span
              className={`text-sm flex-1 ${
                step.completed
                  ? "text-gray-400 dark:text-gray-500 line-through"
                  : "text-gray-700 dark:text-gray-300 font-medium"
              }`}
            >
              {step.title}
            </span>
            {!step.completed && step.id !== nextStep?.id && (
              <Link
                href={step.ctaHref}
                onClick={() => handleCtaClick(step.id, step.ctaHref)}
                className="text-xs text-primary font-semibold hover:underline"
              >
                {step.ctaLabel}
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
