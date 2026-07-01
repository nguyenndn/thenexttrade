import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSystemBySlug } from "@/config/trading-systems-data";
import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TradingSystemsDetailTabs } from "@/components/trading-systems/TradingSystemsDetailTabs";
import { TradingSystemMockPanel } from "@/components/trading-systems/TradingSystemMockPanel";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { ArrowLeft, Shield, HelpCircle, CheckCircle, Lock, UserPlus, KeyRound, Sparkles, Server, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import type { Metadata } from "next";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const system = getSystemBySlug(slug);

  if (!system) {
    return {
      title: "System Not Found | TheNextTrade",
    };
  }

  return {
    title: `${system.title} Specs & Parameters | TheNextTrade`,
    description: system.description,
  };
}

export default async function TradingSystemDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const system = getSystemBySlug(slug);

  if (!system) {
    notFound();
  }

  const user = await getAuthUser();
  const isLoggedIn = !!user;

  const features = system.functions;

  // Query database product stats if available
  const dbProduct = await prisma.eAProduct.findUnique({
    where: { slug: system.slug },
  });

  let displayVersion = dbProduct?.version || system.version || system.parameters.find(p => p.name.toLowerCase() === "version")?.defaultValue || "1.0.0";
  if (displayVersion.startsWith("v")) {
    displayVersion = displayVersion.substring(1);
  }
  const heroHighlights = getSystemHeroHighlights(system.slug);

  return (
    <TradingSystemsPageShell maxWidth="max-w-7xl">
      {/* Back button & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link
          href="/trading-systems"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-550 dark:text-gray-400 hover:text-primary transition-colors uppercase tracking-wider"
        >
          <ArrowLeft size={14} />
          Back to Systems
        </Link>
        <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 tracking-wider">
          TRADING SYSTEMS &bull; {system.platform} &bull; {system.title.toUpperCase()}
        </div>
      </div>

      {/* Header Panel */}
      <div className="relative rounded-3xl border border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#111318]/50 p-6 md:p-8 shadow-sm mb-8 overflow-hidden">
        {/* Ambient background glow inside header */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/4 w-72 h-72 bg-gold/5 dark:bg-gold/[0.03] rounded-full blur-3xl pointer-events-none" />

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto] lg:items-start lg:gap-6 xl:gap-8 relative z-10">
          <div className="min-w-0">
            <div className="mb-5 flex min-w-0 flex-wrap items-center gap-2">
              {/* Platform & Type Badge */}
              <span className="inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-full bg-gold/10 dark:bg-gold/15 text-gold border border-gold/25 shadow-[0_2px_10px_-3px_rgba(250,204,21,0.2)]">
                <span className="h-1 w-1 rounded-full bg-gold animate-pulse" />
                {system.platform} {system.type === "AUTO_TRADE" ? "EXPERT ADVISOR" : "UTILITY"}
              </span>

              {/* Version Badge */}
              <span className="inline-flex items-center text-[9px] font-black tracking-wider px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-505 dark:text-gray-400 rounded-full border border-gray-200/60 dark:border-white/10 uppercase">
                v{displayVersion}
              </span>

              {/* Verified Badge with Pulse */}
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 dark:bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 rounded-full text-[9px] font-black uppercase tracking-wider border border-emerald-500/25 shadow-[0_2px_10px_-3px_rgba(16,185,129,0.2)]">
                <span className="relative flex h-1.5 w-1.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500"></span>
                </span>
                <span>MT5 Verified</span>
              </span>
            </div>
            <h1 className="text-2xl md:text-4xl font-black font-heading text-gray-800 dark:text-white leading-tight">
              {system.title}
            </h1>
            <p 
              className="mt-2 text-sm md:text-base text-gray-550 dark:text-gray-400 leading-relaxed font-medium"
              dangerouslySetInnerHTML={{ __html: system.longDescription }}
            />
          </div>

          <div className="w-full shrink-0 flex justify-center lg:justify-end">
            <TradingSystemMockPanel slug={system.slug} />
          </div>
        </div>
      </div>

      {/* Built for real MT5 workflow (Outside) */}
      <div className="mb-8 rounded-3xl border border-gold/15 bg-gold/[0.02] p-6 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
        <h3 className="text-xs font-black text-gold mb-5 uppercase tracking-[0.18em] flex items-center gap-2 relative z-10">
          <Sparkles size={14} className="stroke-[2.5]" />
          Built for real MT5 workflow
        </h3>
        <div className="grid gap-6 md:grid-cols-3 relative z-10">
          {heroHighlights.map((item) => (
            <div
              key={item.title}
              className="rounded-2xl border border-gray-200/40 bg-white/30 dark:border-white/5 dark:bg-[#151822]/22 p-4 space-y-2.5 hover:border-gold/30 transition-all duration-300"
            >
              <div className="flex items-center gap-2 text-emerald-500">
                <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 border border-emerald-500/20">
                  <CheckCircle size={10} className="stroke-[2.5]" />
                </div>
                <h4 className="text-xs font-black uppercase tracking-wider leading-none">
                  {item.title}
                </h4>
              </div>
              <p className="text-[11px] font-semibold leading-relaxed text-gray-550 dark:text-gray-400">
                {item.description}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Detail Technical Tabs */}
      <div className="mb-8">
        <TradingSystemsDetailTabs
          system={{
            slug: system.slug,
            title: system.title,
            targetAsset: system.targetAsset,
            strategyStyle: system.strategyStyle,
            setupDifficulty: system.setupDifficulty,
            recommendedLeverage: system.recommendedLeverage,
            specHighlights: system.specHighlights,
            logic: system.logic,
            riskControls: system.riskControls,
            colorTheme: system.colorTheme,
            features: features,
          }}
        />
      </div>

      {/* Recommended VPS Block */}
      {system.slug !== "trade-manager" && (
        <div className="mb-8 rounded-3xl border border-emerald-500/15 dark:border-emerald-500/10 bg-white/80 dark:bg-[#111318]/50 p-6 md:p-8 shadow-sm backdrop-blur-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 dark:bg-emerald-500/[0.02] rounded-full blur-2xl pointer-events-none" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20">
                  <Server size={18} />
                </div>
                <h3 className="text-sm font-black uppercase tracking-wider text-gray-800 dark:text-white">
                  Recommended VPS
                </h3>
              </div>
              <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed font-semibold mt-4">
                To ensure your EA runs smoothly 24/7, we recommend using a VPS. It provides a stable connection, faster execution, and keeps your trades running even when your PC is offline.
              </p>
            </div>

            <div className="shrink-0 min-w-[200px]">
              <a href="https://www.fxvm.net" target="_blank" rel="noopener noreferrer" className="block w-full">
                <Button className="w-full min-h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2">
                  <Server size={14} />
                  Get a VPS
                  <span className="font-bold">&rarr;</span>
                </Button>
              </a>
            </div>
          </div>

          <details className="group border-t border-gray-200/50 dark:border-white/5 pt-4 mt-5 relative z-10">
            <summary className="flex items-center justify-between cursor-pointer list-none text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400 select-none hover:text-emerald-500 transition-colors">
              <span>Don't know what a VPS is?</span>
              <ChevronDown size={14} className="transition-transform duration-200 group-open:rotate-180 text-gray-400" />
            </summary>
            <div className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed font-semibold">
              A VPS (Virtual Private Server) is a virtual machine running in the cloud 24/7. Running your Expert Advisor on a VPS ensures continuous execution, low latency to the broker's servers, and safeguards against power outages, system sleep modes, or home internet disruptions.
            </div>
          </details>
        </div>
      )}

      {/* Main vertical stack */}
      <div className="space-y-8">

        {/* Unlock License (CTA Widget Banner) */}
        <div className="rounded-3xl border border-gold/25 dark:border-gold/15 bg-gold/[0.03] dark:bg-gold/[0.01] p-6 md:p-8 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="text-gold animate-pulse" size={16} />
                <h3 className="text-sm font-black uppercase tracking-wider text-gold">
                  Unlock License
                </h3>
              </div>
              <p className="text-xs text-gray-650 dark:text-gray-400 leading-relaxed font-semibold">
                This system is fully compiled and ready to download. You can unlock your MT5 account license key by opening and maintaining an eligible account under our partner network. Access is free but subject to active partner verification.
              </p>
            </div>

            <div className="shrink-0 min-w-[240px]">
              {isLoggedIn ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                    <CheckCircle size={14} />
                    <span>You are signed in</span>
                  </div>
                  <Link href="/dashboard/accounts" className="block w-full">
                    <Button className="w-full min-h-11 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2">
                      <KeyRound size={14} />
                      Verify Partner Eligibility
                    </Button>
                  </Link>
                </div>
              ) : (
                <div className="flex flex-col gap-3">
                  <Link href="/auth/signup?next=/dashboard/accounts&source=trading_systems" className="block w-full">
                    <Button className="w-full min-h-11 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2">
                      <UserPlus size={14} />
                      Sign Up for Eligibility
                    </Button>
                  </Link>
                  <Link href="/auth/login?next=/dashboard/accounts" className="block w-full">
                    <Button variant="outline" className="w-full min-h-11 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-gold/30 dark:border-gold/20 text-gray-800 dark:text-gray-200 font-black text-xs transition-all flex items-center justify-center gap-2">
                      Sign In
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>

          {/* Product-specific disclaimer */}
          <div className="mt-6 pt-4 border-t border-dashed border-gold/20 dark:border-gold/10 text-[11px] font-semibold text-gray-400 dark:text-gray-500 flex items-start gap-2">
            <Shield size={14} className="text-gold shrink-0 mt-0.5" />
            <div>
              {system.slug === "goldscalperninja" && (
                <p>
                  Risk Note: EA GoldScalperNinja utilizes automated grid execution. Grid systems can increase market exposure quickly; ensure you configure strict daily loss limits and test on demo/cent environments before live deployment.
                </p>
              )}
              {system.slug === "trade-manager" && (
                <p>
                  Usage Note: Trade Manager is an execution assistant tool. All trading decisions, manual entries, and risk parameters remain the sole responsibility of the user.
                </p>
              )}
              {system.slug === "gsn-phoenix-grid" && (
                <p>
                  Risk Warning: GSN Phoenix Grid is an advanced grid and hedging system designed for experienced traders only. It uses aggressive multipliers and hedging cycles that carry high margin exposure risk.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FAQ */}
        <div className="rounded-3xl border border-gray-200 dark:border-white/5 bg-white/60 dark:bg-[#111318]/30 p-6 shadow-sm">
          <h3 className="text-base font-black text-gray-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
            <HelpCircle size={16} className="text-gold" />
            Frequently Asked Questions
          </h3>

          <div className="space-y-4">
            {system.faqs.map((faq, idx) => (
              <div key={idx} className="border-b border-gray-200/50 dark:border-white/5 last:border-0 pb-4 last:pb-0">
                <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 mb-1 flex items-start gap-2">
                  <span className="text-gold">Q:</span>
                  {faq.question}
                </h4>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold leading-relaxed pl-4">
                  {faq.answer}
                </p>
              </div>
            ))}
          </div>
        </div>

      </div>
    </TradingSystemsPageShell>
  );
}

function getSystemHeroHighlights(slug: string) {
  if (slug === "goldscalperninja") {
    return [
      {
        title: "D1 Trend Master context",
        description:
          "Reads daily market bias and control zones so grid decisions stay aligned with higher-timeframe structure.",
      },
      {
        title: "Smart recovery management",
        description:
          "Uses rolling recovery and sequence pruning to trim older negative positions instead of blindly stacking exposure.",
      },
      {
        title: "Gold-specific execution setup",
        description:
          "Built around XAUUSD behavior, wick zones, ATR movement, and session volatility rather than generic symbol assumptions.",
      },
    ];
  }

  if (slug === "trade-manager") {
    return [
      {
        title: "Manual execution stays fast",
        description:
          "One-click order actions, lot controls, SL/TP levels, and break-even tools stay directly on the MT5 chart.",
      },
      {
        title: "Risk is visible before action",
        description:
          "Lot size, max risk, zone distance, and loss estimate live in the same working surface before the trader commits.",
      },
      {
        title: "Works beside your own strategy",
        description:
          "Designed for manual traders who want faster control without handing every decision to a fully automated EA.",
      },
    ];
  }

  if (slug === "gsn-phoenix-grid") {
    return [
      {
        title: "Grid recovery visibility",
        description:
          "Shows bias, drawdown, recovery lots, and profit-bank status before aggressive recovery actions are taken.",
      },
      {
        title: "Hedge and profit-bank controls",
        description:
          "Separates hedge protection from harvesting and trim decisions so the trader understands the active mode.",
      },
      {
        title: "Advanced trader workflow",
        description:
          "Made for users who already understand grid exposure, margin pressure, and recovery-cycle risk.",
      },
    ];
  }

  return [
    {
      title: "Built for MT5 workflow",
      description:
        "Connect setup, execution, and review into one practical trading system.",
    },
    {
      title: "Partner verified access",
      description:
        "Unlock workflow is tied to eligible partner accounts and MT5 license verification.",
    },
    {
      title: "Designed for review",
      description:
        "The system feeds into account tracking, synced trades, analytics, and coach reports.",
    },
  ];
}
