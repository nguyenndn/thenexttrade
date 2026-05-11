"use client";

import { createPortal } from "react-dom";
import { useEffect, useState } from "react";
import {
  X,
  Crown,
  BarChart2,
  Brain,
  Headphones,
  Zap,
  Shield,
  BookOpen,
  TrendingUp,
  CheckCircle2,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

interface Benefit {
  icon: React.ElementType;
  title: string;
  description: string;
  highlight?: boolean;
}

const BENEFITS: { category: string; items: Benefit[] }[] = [
  {
    category: "Analytics & Intelligence",
    items: [
      {
        icon: BarChart2,
        title: "Advanced Analytics Dashboard",
        description:
          "Detailed breakdowns: win rate by session, symbol, strategy, drawdown curves, and risk-adjusted returns.",
        highlight: true,
      },
      {
        icon: Brain,
        title: "AI Trading Intelligence",
        description:
          "Personalized AI insights surfaced daily — identify patterns, strengths, and blindspots in your trading.",
        highlight: true,
      },
      {
        icon: TrendingUp,
        title: "Performance Benchmarking",
        description:
          "Compare your stats against top traders in the community to calibrate your progress.",
      },
    ],
  },
  {
    category: "Tools & Features",
    items: [
      {
        icon: Zap,
        title: "EA Toolkit (Advanced Config)",
        description:
          "Unlock advanced parameters for GoldScalperNinja and partner EAs — fine-tune risk, filters, and strategy modes.",
      },
      {
        icon: BookOpen,
        title: "Full Academy Access",
        description:
          "Unlock all Level 2 and Level 3 Academy lessons — prop firm prep, advanced strategy, and live market walkthroughs.",
      },
      {
        icon: Shield,
        title: "Pro Trading Journal",
        description:
          "Unlimited journal entries with AI-generated post-trade reviews, tagging, and psychology scoring.",
      },
    ],
  },
  {
    category: "Support & Community",
    items: [
      {
        icon: Headphones,
        title: "Priority Support",
        description:
          "Skip the queue — Pro members get responses within 4 hours via Telegram or email.",
      },
      {
        icon: Crown,
        title: "VIP Community Access",
        description:
          "Exclusive Pro Telegram group with live trade ideas, market calls, and direct access to our analysts.",
      },
    ],
  },
];

interface ProBenefitsModalProps {
  isOpen: boolean;
  onClose: () => void;
  isPro?: boolean;
}

export function ProBenefitsModal({ isOpen, onClose, isPro = false }: ProBenefitsModalProps) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  if (!isOpen || !mounted) return null;

  return createPortal(
    /* Backdrop */
    <div
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4"
      onClick={onClose}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative z-10 w-full sm:max-w-lg max-h-[92dvh] overflow-y-auto rounded-t-3xl sm:rounded-2xl bg-white dark:bg-[#13151f] shadow-2xl ring-1 ring-black/5 dark:ring-white/10 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-start justify-between gap-3 bg-white dark:bg-[#13151f] border-b border-gray-100 dark:border-white/8 px-5 pt-5 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-400/20 to-orange-400/15 ring-1 ring-amber-300/30 dark:ring-amber-500/20">
              <Crown className="h-5 w-5 text-amber-500 dark:text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white leading-tight">
                {isPro ? "Your Pro Benefits" : "What You Get with Pro"}
              </h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {isPro
                  ? "All features included in your active plan"
                  : "100% free — verify as a VIP trader to unlock"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close modal"
            className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-gray-400 hover:text-gray-700 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/8 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {BENEFITS.map((section) => (
            <div key={section.category}>
              <p className="mb-2.5 text-[11px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
                {section.category}
              </p>
              <div className="space-y-2">
                {section.items.map((item) => (
                  <div
                    key={item.title}
                    className={`flex gap-3 rounded-xl p-3 transition-colors ${
                      item.highlight
                        ? "bg-gradient-to-r from-amber-50 to-orange-50/50 dark:from-amber-500/8 dark:to-orange-500/5 ring-1 ring-amber-200/60 dark:ring-amber-500/15"
                        : "bg-gray-50 dark:bg-white/[0.03] ring-1 ring-gray-100 dark:ring-white/6"
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                        item.highlight
                          ? "bg-amber-100 dark:bg-amber-500/15 text-amber-600 dark:text-amber-400"
                          : "bg-gray-100 dark:bg-white/8 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-[13px] font-semibold text-gray-800 dark:text-white leading-tight">
                          {item.title}
                        </p>
                        {item.highlight && (
                          <CheckCircle2 className="h-3 w-3 shrink-0 text-amber-500 dark:text-amber-400" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer CTA — only for Free Plan */}
        {!isPro && (
          <div className="sticky bottom-0 border-t border-gray-100 dark:border-white/8 bg-white dark:bg-[#13151f] px-5 py-4">
            <Link
              href="/dashboard/accounts?action=add&intent=unlock-pro"
              onClick={onClose}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-4 py-2.5 text-[13px] font-bold text-white shadow-sm shadow-amber-500/20 transition-all hover:from-amber-600 hover:to-orange-600 hover:-translate-y-px active:translate-y-0"
            >
              Unlock Pro Free
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
            <p className="mt-2 text-center text-[11px] text-gray-400 dark:text-gray-500">
              No payment required — free for verified IB clients
            </p>
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
