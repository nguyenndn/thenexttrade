"use client";

import { ChevronRight, Sparkles, Cable, Zap, PenLine } from "lucide-react";
import { trackEvent } from "@/lib/track";
import { SetupProgressTrail } from "@/components/onboarding/SetupProgressTrail";
import type { FirstSessionStep } from "@/lib/onboarding/first-session.server";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface FirstSessionLauncherProps {
  currentStep: FirstSessionStep;
  onOpen: () => void;
}

// ---------------------------------------------------------------------------
// Step config
// ---------------------------------------------------------------------------

const STEP_CONFIG: Record<
  FirstSessionStep,
  { subtitle: string; icon: React.ReactNode }
> = {
  CONNECT_ACCOUNT: {
    subtitle: "Add your first account",
    icon: <Cable size={14} className="text-amber-500 dark:text-gold" />,
  },
  CHOOSE_SYNC_METHOD: {
    subtitle: "Choose your sync method",
    icon: <Zap size={14} className="text-amber-500" />,
  },
  BRING_FIRST_DATA: {
    subtitle: "Sync or log your first trade",
    icon: <PenLine size={14} className="text-gray-500 dark:text-gray-400" />,
  },
  REVIEW_DASHBOARD: {
    subtitle: "Your dashboard is ready",
    icon: <Sparkles size={14} className="text-emerald-500" />,
  },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function FirstSessionLauncher({
  currentStep,
  onOpen,
}: FirstSessionLauncherProps) {
  const config = STEP_CONFIG[currentStep];
  const isGold = currentStep === "CONNECT_ACCOUNT";

  const handleClick = () => {
    trackEvent("first_session_launcher_clicked", { step: currentStep });
    trackEvent("first_session_wizard_shown", { step: currentStep, source: "launcher" });
    onOpen();
  };

  return (
    <button
      onClick={handleClick}
      className={`w-full text-left relative overflow-hidden rounded-xl border backdrop-blur-md px-4 py-2.5 flex items-center justify-between gap-4 shadow-sm transition-all duration-300 group cursor-pointer ${
        isGold
          ? "border-amber-500/35 dark:border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] via-amber-50/70 to-orange-500/[0.08] dark:from-amber-500/[0.06] dark:via-transparent dark:to-orange-500/[0.03] shadow-[0_4px_20px_rgba(245,158,11,0.06)] dark:shadow-[0_4px_20px_rgba(245,158,11,0.04)] hover:border-amber-500/60 dark:hover:border-gold/30 hover:shadow-[0_8px_30px_rgba(245,158,11,0.1)]"
          : "border-primary/20 dark:border-primary/10 bg-gradient-to-r from-primary/[0.04] to-cyan-500/[0.02] dark:from-primary/[0.02] dark:to-transparent hover:border-primary/35 hover:shadow-md"
      }`}
    >
      {/* Glowing highlight animation */}
      <div
        className={`absolute inset-0 bg-gradient-to-r from-transparent to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out ${
          isGold ? "via-amber-500/[0.05]" : "via-primary/[0.03]"
        }`}
      />

      {/* Ambient glow for gold variant */}
      {isGold && (
        <div className="absolute -top-10 -right-10 w-40 h-40 bg-amber-400/[0.12] dark:bg-amber-500/[0.08] rounded-full blur-[60px] pointer-events-none" />
      )}

      <div className="flex flex-col gap-1.5 min-w-0 relative z-10">
        <div className="flex items-center gap-2 min-w-0">
          {config.icon}
          <span
            className={`text-[10px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shrink-0 ${
              isGold
                ? "text-amber-600 dark:text-amber-400 bg-amber-500/15 dark:bg-amber-500/20"
                : "text-primary bg-primary/10"
            }`}
          >
            Finish Setup
          </span>
          <p className="text-xs font-bold text-gray-700 dark:text-gray-200 truncate leading-none">
            {config.subtitle}
          </p>
        </div>
        <div className="pl-6">
          <SetupProgressTrail currentStep={currentStep} compact source="launcher" />
        </div>
      </div>

      <div
        className={`shrink-0 flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider transition-colors relative z-10 ${
          isGold
            ? "text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-gold"
            : "text-primary group-hover:text-primary/80"
        }`}
      >
        <span>Continue</span>
        <ChevronRight
          size={12}
          className="transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </button>
  );
}
