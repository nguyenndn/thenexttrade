"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  BookOpenCheck,
  CheckCircle2,
  FileDown,
  KeyRound,
  LockKeyhole,
  MousePointerClick,
  Settings2,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  Zap,
} from "lucide-react";

interface TradingSystemsSimulatorProps {
  initialSlug?: string;
}

const TOOLKITS = [
  {
    slug: "goldscalperninja",
    shortName: "GoldScalperNinja",
    title: "EA GoldScalperNinja",
    eyebrow: "Automated MT5 execution",
    icon: Bot,
    accent: "gold",
    summary:
      "A gold-focused MT5 Expert Advisor workflow for traders who want automated execution support while keeping risk settings under their control.",
    functions: [
      "Automated MT5 execution workflow for XAUUSD-focused setups",
      "Configurable risk, lot, stop-loss, and take-profit parameters",
      "Built-in execution rules to reduce emotional clicking",
      "Account-based access so only eligible partner accounts can unlock",
      "Setup guide and versioned download inside the dashboard",
    ],
    outcomes: [
      "Fewer manual order-entry mistakes",
      "More consistent execution rules",
      "Cleaner handoff from tool usage to trade review",
    ],
  },
  {
    slug: "trade-manager",
    shortName: "Trade Manager",
    title: "Trade Manager Panel",
    eyebrow: "Manual execution assistant",
    icon: SlidersHorizontal,
    accent: "blue",
    summary:
      "A lightweight MT5 control panel for traders who still enter manually but want faster order management and clearer risk actions.",
    functions: [
      "One-click trade management for manual MT5 execution",
      "Lot size, stop-loss, take-profit, and break-even helpers",
      "Partial close and position-management shortcuts",
      "Cleaner workflow for traders who do not want full automation",
      "Works alongside your journal and weekly review process",
    ],
    outcomes: [
      "Less hesitation during live execution",
      "Faster risk adjustment after entry",
      "More consistent manual trade handling",
    ],
  },
  {
    slug: "partner-ea-toolkit",
    shortName: "Partner Toolkit",
    title: "Partner EA Toolkit",
    eyebrow: "Approved-user MT5 tools",
    icon: Wrench,
    accent: "emerald",
    summary:
      "A curated set of extra MT5 utilities and partner tools for approved accounts that need practical execution support beyond the core journal.",
    functions: [
      "Additional MT5 utilities for approved partner accounts",
      "License-gated access tied to your TheNextTrade account",
      "Versioned downloads so users know exactly what they install",
      "Setup documentation for each supported workflow",
      "Support path from dashboard when setup gets stuck",
    ],
    outcomes: [
      "A clearer unlock process for advanced tools",
      "Less confusion around downloads and versions",
      "One place to manage access and setup status",
    ],
  },
] as const;

const accentClasses = {
  gold: {
    border: "border-gold/35",
    softBorder: "border-gold/20",
    bg: "bg-gold/10",
    softBg: "bg-gold/[0.04]",
    text: "text-gold",
    ring: "shadow-[0_18px_50px_rgba(245,158,11,0.10)]",
  },
  blue: {
    border: "border-blue-400/30",
    softBorder: "border-blue-400/20",
    bg: "bg-blue-500/10",
    softBg: "bg-blue-500/[0.04]",
    text: "text-blue-500",
    ring: "shadow-[0_18px_50px_rgba(59,130,246,0.08)]",
  },
  emerald: {
    border: "border-emerald-400/30",
    softBorder: "border-emerald-400/20",
    bg: "bg-emerald-500/10",
    softBg: "bg-emerald-500/[0.04]",
    text: "text-emerald-500",
    ring: "shadow-[0_18px_50px_rgba(16,185,129,0.08)]",
  },
} as const;

const unlockSteps = [
  {
    icon: KeyRound,
    label: "Link eligible account",
    description: "Connect or submit a partner account so the system can verify unlock eligibility.",
  },
  {
    icon: FileDown,
    label: "Download from dashboard",
    description: "Approved users get the right MT5 file, version notes, and setup instructions.",
  },
  {
    icon: BookOpenCheck,
    label: "Install and review",
    description: "Use the tool on MT5, then review synced trades inside TheNextTrade.",
  },
];

export function TradingSystemsSimulator({ initialSlug }: TradingSystemsSimulatorProps) {
  const defaultToolkitIndex = useMemo(() => {
    if (!initialSlug) return 0;
    const foundIdx = TOOLKITS.findIndex((toolkit) => toolkit.slug === initialSlug);
    return foundIdx !== -1 ? foundIdx : 0;
  }, [initialSlug]);

  const [selectedToolkitIdx, setSelectedToolkitIdx] = useState(defaultToolkitIndex);
  const selectedToolkit = TOOLKITS[selectedToolkitIdx];
  const selectedAccent = accentClasses[selectedToolkit.accent];
  const SelectedIcon = selectedToolkit.icon;

  return (
    <div className="relative overflow-hidden rounded-3xl border border-gray-200 bg-white/85 p-5 shadow-lg dark:border-white/10 dark:bg-[#111318]/55 sm:p-7 md:p-8">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(rgba(245,158,11,0.035)_1px,transparent_1px)] [background-size:20px_20px]" />
      <div className="pointer-events-none absolute right-0 top-0 h-72 w-72 translate-x-1/4 -translate-y-1/3 rounded-full bg-gold/10 blur-[90px]" />
      <div className="pointer-events-none absolute bottom-0 left-0 h-64 w-64 -translate-x-1/4 translate-y-1/3 rounded-full bg-emerald-500/10 blur-[90px]" />

      <div className="relative z-10 space-y-8">
        <div className="flex flex-col gap-5 border-b border-dashed border-gray-200 pb-6 dark:border-white/5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold">
              <Sparkles size={12} />
              MT5 Toolkit Access
            </div>
            <h3 className="text-2xl font-black text-gray-850 dark:text-white sm:text-3xl">
              What you unlock with TheNextTrade
            </h3>
            <p className="mt-2 text-sm font-semibold leading-relaxed text-gray-600 dark:text-gray-400">
              Show the actual EA and MT5 tool functions clearly: what each tool does, which mistakes it helps reduce, and how users unlock access through an eligible partner account.
            </p>
          </div>

          {!initialSlug ? (
            <div className="flex flex-wrap gap-2 rounded-2xl border border-gray-200 bg-gray-50 p-1 dark:border-white/5 dark:bg-white/[0.04]">
              {TOOLKITS.map((toolkit, idx) => {
                const ToolkitIcon = toolkit.icon;
                const isSelected = selectedToolkitIdx === idx;
                return (
                  <button
                    key={toolkit.slug}
                    type="button"
                    onClick={() => setSelectedToolkitIdx(idx)}
                    className={`inline-flex min-h-10 items-center gap-2 rounded-xl px-3 text-xs font-black transition-all ${
                      isSelected
                        ? "border border-gold/25 bg-white text-gold shadow-sm dark:bg-[#1E2028]"
                        : "text-gray-500 hover:bg-white/80 hover:text-gray-800 dark:hover:bg-white/5 dark:hover:text-gray-200"
                    }`}
                  >
                    <ToolkitIcon size={14} />
                    {toolkit.shortName}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="inline-flex items-center gap-2 rounded-2xl border border-gold/25 bg-gold/10 px-3 py-2 text-xs font-black uppercase tracking-wider text-gold">
              <BadgeCheck size={14} />
              Selected System
            </div>
          )}
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
          <div className={`relative overflow-hidden rounded-3xl border ${selectedAccent.border} ${selectedAccent.softBg} p-6 ${selectedAccent.ring}`}>
            <div className="absolute right-5 top-5 text-[10px] font-black uppercase tracking-[0.16em] text-gray-400">
              Unlock only
            </div>

            <div className={`mb-5 flex h-14 w-14 items-center justify-center rounded-2xl border ${selectedAccent.softBorder} ${selectedAccent.bg} ${selectedAccent.text}`}>
              <SelectedIcon size={25} />
            </div>

            <div className="space-y-3">
              <div>
                <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${selectedAccent.text}`}>
                  {selectedToolkit.eyebrow}
                </p>
                <h4 className="mt-2 text-2xl font-black text-gray-850 dark:text-white">
                  {selectedToolkit.title}
                </h4>
              </div>

              <p className="text-sm font-semibold leading-relaxed text-gray-650 dark:text-gray-400">
                {selectedToolkit.summary}
              </p>

              <div className="flex flex-wrap gap-2 pt-2">
                {["Eligible account required", "MT5 workflow", "No profit guarantee"].map((chip) => (
                  <span
                    key={chip}
                    className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white/70 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider text-gray-600 dark:border-white/5 dark:bg-white/[0.04] dark:text-gray-350"
                  >
                    <ShieldCheck size={11} className={selectedAccent.text} />
                    {chip}
                  </span>
                ))}
              </div>

              <div className="grid gap-3 pt-3 sm:grid-cols-2">
                <Link
                  href="/dashboard/accounts"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-gold px-4 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-gold/20 transition-all hover:-translate-y-0.5 hover:bg-amber-600"
                >
                  Check Unlock Eligibility
                  <ArrowRight size={14} />
                </Link>
                <Link
                  href="/get-started"
                  className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xl border border-gold/25 bg-white/70 px-4 text-xs font-black uppercase tracking-wider text-gray-800 transition-all hover:border-gold/45 hover:text-gold dark:bg-white/[0.03] dark:text-white"
                >
                  View Setup Guide
                  <ArrowRight size={14} />
                </Link>
              </div>
            </div>
          </div>

          <div className="grid gap-4">
            <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 dark:border-white/5 dark:bg-white/[0.03]">
              <div className="mb-4 flex items-center gap-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${selectedAccent.softBorder} ${selectedAccent.bg} ${selectedAccent.text}`}>
                  <Settings2 size={18} />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                    Core Functions
                  </p>
                  <h4 className="text-base font-black text-gray-850 dark:text-white">
                    What the user actually gets
                  </h4>
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {selectedToolkit.functions.map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-2.5 rounded-2xl border border-gray-200/80 bg-gray-50/70 p-3 dark:border-white/5 dark:bg-[#151925]/35"
                  >
                    <CheckCircle2 size={15} className={`mt-0.5 shrink-0 ${selectedAccent.text}`} />
                    <span className="text-xs font-bold leading-relaxed text-gray-700 dark:text-gray-300">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-[0.9fr_1.1fr]">
              <div className="rounded-3xl border border-gray-200 bg-white/70 p-5 dark:border-white/5 dark:bg-white/[0.03]">
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl border ${selectedAccent.softBorder} ${selectedAccent.bg} ${selectedAccent.text}`}>
                    <MousePointerClick size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gray-400">
                      Helps Reduce
                    </p>
                    <h4 className="text-base font-black text-gray-850 dark:text-white">
                      Execution mistakes
                    </h4>
                  </div>
                </div>

                <div className="space-y-3">
                  {selectedToolkit.outcomes.map((item) => (
                    <div key={item} className="flex items-start gap-2.5">
                      <Zap size={14} className={`mt-0.5 shrink-0 ${selectedAccent.text}`} />
                      <p className="text-xs font-bold leading-relaxed text-gray-650 dark:text-gray-350">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-3xl border border-gold/20 bg-gold/[0.025] p-5">
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold/20 bg-gold/10 text-gold">
                    <LockKeyhole size={18} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold">
                      Unlock Path
                    </p>
                    <h4 className="text-base font-black text-gray-850 dark:text-white">
                      How access works
                    </h4>
                  </div>
                </div>

                <div className="space-y-3">
                  {unlockSteps.map((step, idx) => {
                    const StepIcon = step.icon;
                    return (
                      <div key={step.label} className="flex gap-3 rounded-2xl border border-gold/15 bg-white/65 p-3 dark:bg-white/[0.03]">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gold/10 text-gold">
                          <StepIcon size={15} />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black uppercase tracking-wider text-gold">
                              Step {idx + 1}
                            </span>
                            <span className="h-px w-5 bg-gold/20" />
                          </div>
                          <h5 className="text-xs font-black text-gray-850 dark:text-white">
                            {step.label}
                          </h5>
                          <p className="mt-0.5 text-[11px] font-semibold leading-relaxed text-gray-550 dark:text-gray-400">
                            {step.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 bg-gray-50/75 p-4 text-center dark:border-white/5 dark:bg-white/[0.03]">
          <p className="mx-auto max-w-3xl text-[11px] font-bold leading-relaxed text-gray-500 dark:text-gray-400">
            These MT5 tools support execution, workflow discipline, and setup consistency. They do not guarantee profit, remove market risk, or replace proper risk management.
          </p>
        </div>
      </div>
    </div>
  );
}
