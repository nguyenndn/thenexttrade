import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSystemBySlug } from "@/config/trading-systems-data";
import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TradingSystemsDetailTabs } from "@/components/trading-systems/TradingSystemsDetailTabs";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { ArrowLeft, Shield, Cpu, HelpCircle, CheckCircle, Lock, UserPlus, KeyRound, Sparkles, ShieldAlert, Scale, Clock, ArrowUpDown, SlidersHorizontal, TrendingUp, Bot, RotateCw, ChevronDown, Server } from "lucide-react";
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
  const TabIcon = system.icon;

  // Query database product stats if available
  const dbProduct = await prisma.eAProduct.findUnique({
    where: { slug: system.slug },
  });

  let displayVersion = dbProduct?.version || system.version || system.parameters.find(p => p.name.toLowerCase() === "version")?.defaultValue || "1.0.0";
  if (displayVersion.startsWith("v")) {
    displayVersion = displayVersion.substring(1);
  }
  const Icon = system.icon;
  const heroHighlights = getSystemHeroHighlights(system.slug);

  return (
    <TradingSystemsPageShell maxWidth="max-w-6xl">
      {/* Back button & Breadcrumbs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <Link
          href="/trading-systems"
          className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 dark:text-gray-400 hover:text-primary transition-colors uppercase tracking-wider"
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
              <span className="inline-flex items-center text-[9px] font-black tracking-wider px-2.5 py-1 bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400 rounded-full border border-gray-200/60 dark:border-white/10 uppercase">
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
            <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
              {system.longDescription}
            </p>
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

      {/* Key Features & Functions */}
      <div className="mb-8 rounded-3xl border border-gray-200 dark:border-white/5 bg-white/60 dark:bg-[#111318]/30 p-6 shadow-sm">
        <h3 className="text-base font-black text-gray-800 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2">
          <Sparkles size={16} className="text-gold" />
          Key Features & Functions
        </h3>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((item, idx) => (
            <div
              key={idx}
              className="rounded-2xl border border-gray-200/50 bg-white/40 dark:border-white/5 dark:bg-[#151822]/44 p-5 space-y-3 hover:border-gold/30 hover:shadow-md transition-all duration-300 relative overflow-hidden group"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/15 relative z-10">
                <TabIcon size={18} />
              </div>
              <h4 className="text-xs font-black text-gray-850 dark:text-white uppercase tracking-wider relative z-10">
                {item.title}
              </h4>
              <p className="text-xs font-semibold leading-relaxed text-gray-500 dark:text-gray-400 relative z-10">
                {item.desc}
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
              <Link href="/brokers?tab=vps" className="block w-full">
                <Button className="w-full min-h-11 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-lg shadow-emerald-500/15 transition-all flex items-center justify-center gap-2">
                  <Server size={14} />
                  Get a VPS
                  <span className="font-bold">&rarr;</span>
                </Button>
              </Link>
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
                <Lock size={16} className="text-gold animate-pulse" />
                <h3 className="text-sm font-black uppercase tracking-wider text-gold">
                  Unlock License
                </h3>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-semibold">
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

function TradingSystemMockPanel({ slug }: { slug: string }) {
  if (slug === "goldscalperninja") {
    return (
      <div className="mx-auto w-full lg:w-[385px] border-2 border-[#f7b500] bg-[#070d17] p-2.5 text-left font-mono text-[10px] text-slate-300 shadow-2xl shadow-gold/10">
        <div className="mb-2 text-center">
          <div className="text-[22px] font-black leading-none tracking-tight text-[#ffd21f]">
            GoldScalperNinja v3.0
          </div>
          <div className="mx-auto mt-1 h-px w-36 border-t border-dashed border-[#f7b500]/80" />
        </div>

        <div className="mb-1.5 border border-[#f7b500] bg-[#0c1321] px-2 py-1.5">
          <div className="mb-1 text-center text-[10px] uppercase tracking-[0.18em] text-slate-400">
            Account Info
          </div>
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Balance:</span>
              <span className="font-black text-white">$0.00</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Equity:</span>
              <span className="font-black text-white">$0.00</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Today P/L:</span>
              <span className="font-black text-emerald-400">+$0.00</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span className="text-slate-400">Drawdown:</span>
              <span className="font-black text-emerald-400">0.00%</span>
            </div>
          </div>
        </div>

        <div className="mb-1.5 border-2 border-[#f7b500] bg-[#0c1321] px-2 py-2 text-center">
          <div className="mb-1 text-[10px] uppercase tracking-[0.22em] text-slate-400">Floating P/L</div>
          <div className="text-[28px] font-black leading-none text-emerald-400">$0.00</div>
        </div>

        <div className="mb-1.5 grid grid-cols-2 gap-2">
          <div className="border border-emerald-400 bg-emerald-950/60">
            <div className="border-b border-emerald-400/80 py-1 text-center text-[11px] font-black text-emerald-300">
              BUY
            </div>
            <div className="space-y-0.5 py-1.5 text-center">
              <div className="font-black text-white">Orders: 0</div>
              <div className="text-slate-400">Lots: 0.00</div>
              <div className="font-black text-emerald-400">$0.00</div>
            </div>
          </div>
          <div className="border border-rose-500 bg-rose-950/60">
            <div className="border-b border-rose-500/80 py-1 text-center text-[11px] font-black text-rose-300">
              SELL
            </div>
            <div className="space-y-0.5 py-1.5 text-center">
              <div className="font-black text-white">Orders: 0</div>
              <div className="text-slate-400">Lots: 0.00</div>
              <div className="font-black text-rose-400">$0.00</div>
            </div>
          </div>
        </div>

        <div className="mb-2 border border-[#f7b500] bg-[#0c1321] px-2 py-1.5">
          <div className="grid grid-cols-2 gap-x-6 gap-y-1">
            <div>
              <span className="text-slate-500">News: </span>
              <span className="font-black text-slate-500">OFF</span>
            </div>
            <div>
              <span className="text-slate-500">Daily: </span>
              <span className="font-black text-emerald-400">OK</span>
            </div>
            <div>
              <span className="text-slate-500">Cycle: </span>
              <span className="font-black text-emerald-400">RUNNING</span>
            </div>
            <div>
              <span className="text-slate-500">Trend: </span>
              <span className="font-black text-slate-500">---</span>
            </div>
          </div>
        </div>

        <div className="mb-1.5 text-center text-[10px] uppercase tracking-[0.22em] text-slate-400">
          Trade Direction
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: "ONLY BUY", state: "disabled" },
            { label: "ONLY SELL", state: "disabled" },
            { label: "BUY & SELL", state: "disabled" },
            { label: "AUTO TREND", state: "active" },
            { label: "CLOSE BUY", state: "buy" },
            { label: "CLOSE SELL", state: "sell" },
            { label: "CLOSE ALL", state: "danger" },
            { label: "CYCLE: ON", state: "cycle" },
          ].map((button) => {
            const styles = {
              disabled: "border-slate-600 bg-slate-800/80 text-slate-500",
              active: "border-cyan-400 bg-cyan-950/70 text-cyan-300",
              buy: "border-emerald-400 bg-emerald-950/60 text-emerald-300",
              sell: "border-rose-500 bg-rose-950/60 text-rose-300",
              danger: "border-red-500 bg-red-950/70 text-red-300",
              cycle: "border-emerald-400 bg-slate-900 text-emerald-300",
            }[button.state];

            return (
              <div
                key={button.label}
                className={`min-h-7 border px-2 py-1.5 text-center text-[10px] font-black uppercase tracking-wide ${styles}`}
              >
                {button.label}
              </div>
            );
          })}
        </div>

        <div className="mt-2 text-center text-[10px] font-bold text-[#ffd21f]">
          Copyright @2026 GoldScalperNinja
        </div>
      </div>
    );
  }

  if (slug === "trade-manager") {
    return (
      <div className="mx-auto w-full lg:w-[500px] border-2 border-[#f7b500] bg-[#101722] p-1.5 text-left font-mono text-[10px] text-slate-200 shadow-2xl shadow-slate-950/20 lg:mx-0">
        <div className="mb-2 flex items-center justify-between gap-2 bg-[#0b111d] px-2.5 py-1.5">
          <span className="whitespace-nowrap text-[10px] font-black uppercase tracking-wide text-[#ffd21f] sm:text-[11px]">
            GSN - Trade Manager
          </span>
          <div className="flex shrink-0 items-center gap-2 text-[9px] font-black text-[#ffd21f] sm:text-[10px]">
            <span>Peak Pips: 0</span>
            <div className="flex items-center gap-1">
              <Clock size={10} className="text-[#ffd21f] shrink-0" />
              <span>00:40</span>
            </div>
          </div>
        </div>

        <div className="mb-2 grid grid-cols-5 gap-1">
          {[
            { label: "TRADE", icon: ArrowUpDown, active: true },
            { label: "S&D ZONE", icon: SlidersHorizontal },
            { label: "TREND", icon: TrendingUp },
            { label: "SEMI AUTO", icon: Bot },
            { label: "SYNC", icon: RotateCw },
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <div
                key={tab.label}
                className={`border px-1 py-1.5 flex items-center justify-center gap-1.5 text-center text-[9px] font-black uppercase tracking-wide cursor-pointer ${tab.active
                  ? "border-[#f7b500] bg-slate-800 text-[#ffd21f] shadow-[inset_0_-2px_0_#f7b500]"
                  : "border-slate-600 bg-slate-800 text-white"
                  }`}
              >
                <Icon size={10} className={tab.active ? "text-[#ffd21f]" : "text-slate-400"} />
                <span>{tab.label}</span>
              </div>
            );
          })}
        </div>

        <div className="grid gap-2 md:grid-cols-[1.08fr_1fr_1.14fr]">
          <div className="flex flex-col justify-between gap-1 h-full">
            {[
              { label: "SL:", value: "0.00", bar: "bg-rose-500", text: "text-rose-400" },
              { label: "ENTRY:", value: "4064.32", bar: "bg-blue-500", text: "text-blue-400" },
              { label: "TP1:", value: "0.00", qty: "2", bar: "bg-emerald-400", text: "text-emerald-300" },
              { label: "TP2:", value: "0.00", qty: "2", bar: "bg-emerald-400", text: "text-emerald-300" },
              { label: "TP3:", value: "0.00", qty: "2", bar: "bg-emerald-400", text: "text-emerald-300" },
            ].map((row) => (
              <div key={row.label} className="relative flex min-h-7 items-center justify-between border border-slate-700 bg-[#0d1420] px-2 pl-3">
                <span className={`absolute left-0 top-0 h-full w-1 ${row.bar}`} />
                <span className={`font-black ${row.text}`}>{row.label}</span>
                <span className="font-black text-white">{row.value}</span>
                {row.qty && <span className="ml-3 font-black text-white">{row.qty}</span>}
              </div>
            ))}
          </div>

          <div className="space-y-2 border border-slate-700 bg-[#0b111d] p-2">
            <div className="flex items-center justify-between gap-2">
              <span className="whitespace-nowrap font-black text-[#ffd21f]">Lot Size:</span>
              <span className="border border-slate-700 bg-slate-800 px-1 text-[#ffd21f]">-</span>
              <span className="font-black text-white">0.01</span>
              <span className="border border-slate-700 bg-slate-800 px-1 text-[#ffd21f]">+</span>
            </div>
            {[
              ["Zone (pips):", "70", "text-white"],
              ["SL Loss:", "0.00%   -$0.00", "text-red-400"],
              ["Max Risk:", "20.0%", "text-white"],
              ["BE Offset:", "0", "text-white"],
            ].map(([label, value, color]) => (
              <div key={label} className="flex min-h-6 items-center justify-between gap-2">
                <span className="font-black text-[#ffd21f]">{label}</span>
                <span className={`font-black ${color}`}>{value}</span>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            {[
              { label: "GET BUY", className: "bg-blue-600" },
              { label: "GET SELL", className: "bg-rose-900" },
              { label: "BUY NOW", className: "col-span-2 bg-blue-500" },
              { label: "SELL NOW", className: "col-span-2 bg-rose-500" },
              { label: "SET PENDING", className: "bg-green-700" },
              { label: "CLOSE PENDING", className: "bg-green-700" },
              { label: "SYNC LEVELS", className: "bg-orange-500" },
              { label: "CLEAR INPUTS", className: "bg-orange-500" },
            ].map((button) => (
              <div
                key={button.label}
                className={`${button.className} flex min-h-7 items-center justify-center px-2 py-1 text-center text-[9px] font-black uppercase text-white sm:text-[10px] whitespace-nowrap`}
              >
                {button.label}
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 border-t border-slate-800 pt-3">
          <div className="mb-2 grid grid-cols-3 text-center text-[10px] font-black text-emerald-400">
            <span>TP1: $0.00</span>
            <span>TP2: $0.00</span>
            <span>TP3: $0.00</span>
          </div>
          <div className="relative mx-5 h-5">
            <div className="absolute left-0 right-0 top-2 h-0.5 bg-emerald-500" />
            <div className="absolute left-0 top-1.5 h-2 w-0.5 bg-rose-500" />
            <div className="absolute left-[24%] top-0.5 h-4 w-4 -translate-x-1/2 rounded-full border-2 border-emerald-300 bg-slate-700 shadow-[0_0_0_2px_rgba(16,185,129,0.35)]" />
            <div className="absolute left-1/2 top-1.5 h-2 w-0.5 bg-white" />
            <div className="absolute left-[75%] top-1.5 h-2 w-0.5 bg-white" />
            <div className="absolute right-0 top-1.5 h-2 w-0.5 bg-white" />
          </div>
          <div className="grid grid-cols-4 px-4 text-[9px] font-black uppercase">
            <span className="text-rose-400">SL</span>
            <span className="text-emerald-400">Entry</span>
            <span className="text-white">TP1</span>
            <span className="text-right text-white">TP3</span>
          </div>
        </div>

        <div className="mt-3 grid grid-cols-[1fr_1.1fr_1.1fr_1.1fr] items-center gap-1.5">
          <div className="font-black uppercase text-white">Take Profit %</div>
          <div className="border-l border-slate-600 pl-2 font-black text-white">50</div>
          <div className="bg-green-700 px-2 py-2 text-center text-[10px] font-black text-white">TP BUY</div>
          <div className="bg-red-600 px-2 py-2 text-center text-[10px] font-black text-white">TP SELL</div>
        </div>

        <div className="mt-1 grid grid-cols-4 gap-px bg-[#172333] text-center">
          <div className="py-2 font-black text-emerald-400">BUY: +$0.00</div>
          <div className="py-2 font-black text-emerald-400">SELL: +$0.00</div>
          <div className="py-2 font-black text-white">0.00 LOTS</div>
          <div className="py-2 font-black text-white">0 POS</div>
        </div>

        <div className="mt-2 text-center text-[10px] font-bold text-[#ffd21f]">
          Copyright @2026 GoldScalperNinja
        </div>
      </div>
    );
  }

  if (slug === "gsn-phoenix-grid") {
    return (
      <div className="mx-auto w-full lg:w-[385px] border-2 border-[#f7b500] bg-[#10141b] p-1 text-left font-mono text-[9px] text-white shadow-2xl shadow-gold/10 lg:mx-0">
        <div className="border-b-2 border-[#f7b500] bg-[#10141b] py-1 text-center text-[17px] font-black leading-none text-[#ffe100]">
          GSN PHOENIX GRID
        </div>

        <div className="flex items-center justify-center gap-1.5 border-b-2 border-[#f7b500] bg-white py-1.5 text-center text-[11px] font-black uppercase text-[#111827]">
          <Scale size={12} className="shrink-0 stroke-[2.6]" />
          <span>SIGNAL BIAS: NEUTRAL</span>
        </div>

        <div className="bg-[#1a2029] px-2.5 py-1.5">
          <div className="grid grid-cols-3 gap-x-3 gap-y-1 text-[10px]">
            <div className="col-span-3 grid grid-cols-2 gap-4">
              <div>
                <span className="text-white">BALANCE: </span>
                <span className="font-black text-white">$4,909.35</span>
              </div>
              <div>
                <span className="text-emerald-400">EQUITY: </span>
                <span className="font-black text-emerald-400">$4,956.51</span>
              </div>
            </div>
            <div className="text-emerald-400">
              BUY: <span className="font-black">$0.00 (0)</span>
            </div>
            <div className="text-center">
              DD: <span className="font-black">0.0%</span>
            </div>
            <div className="text-right text-emerald-400">
              SELL: <span className="font-black">$0.00 (0)</span>
            </div>
            <div className="text-emerald-400">
              NET: <span className="font-black">$0.00</span>
            </div>
            <div className="text-center">
              Max DD: <span className="font-black">0.0%</span>
            </div>
            <div className="text-right text-emerald-400">
              Today: <span className="font-black">$0.00</span>
            </div>
          </div>
        </div>

        <div className="border-y-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
          Strategy
        </div>

        <div className="grid grid-cols-3 gap-1 bg-[#10141b] p-0.5">
          {[
            { label: "NO FILTER" },
            { label: "ATR SOFT", active: true },
            { label: "ADX SOFT" },
            { label: "EMA (SONIC)" },
            { label: "ATR HARD" },
            { label: "ADX HARD" },
          ].map((item) => (
            <div
              key={item.label}
              className={`min-h-7 px-1.5 py-1 flex items-center justify-center text-center text-[10px] font-black uppercase ${item.active ? "bg-[#ffde17] text-[#111827]" : "bg-[#151b24] text-white"
                }`}
            >
              {item.label}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-px border-y-2 border-[#f7b500] bg-[#f7b500]">
          <div className="bg-[#10141b]">
            <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
              Trading
            </div>
            <div className="space-y-1.5 p-1.5">
              {[
                ["Lot:", "0.06"],
                ["Mult:", "1.20"],
                ["Dist:", "600"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[1fr_45px] items-center gap-1.5">
                  <span className="text-[10px] font-black text-white">{label}</span>
                  <span className="rounded-sm border border-slate-600 bg-[#202833] px-1.5 py-0.5 text-right font-black text-[10px] text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#10141b]">
            <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
              Hedge - Ready
            </div>
            <div className="space-y-1.5 p-1.5">
              {[
                ["Hedge Lot:", "0.10"],
                ["Hedge Mult:", "1.30"],
                ["Hedge Dist:", "600"],
              ].map(([label, value]) => (
                <div key={label} className="grid grid-cols-[1fr_45px] items-center gap-1.5">
                  <span className="text-[10px] font-black text-white">{label}</span>
                  <span className="rounded-sm border border-slate-600 bg-[#202833] px-1.5 py-0.5 text-right font-black text-[10px] text-white">
                    {value}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="border-b-2 border-[#f7b500] bg-[#111827] py-0.5 text-center text-[10px] font-black uppercase text-[#ffe100]">
          Profit Bank - Wait
        </div>

        <div className="grid grid-cols-3 gap-x-3 gap-y-1 bg-[#10141b] px-2 py-1.5 text-[10px]">
          <div>
            Bank: <span className="font-black">$0.00</span>
          </div>
          <div>
            Available: <span className="font-black">$0.00</span>
          </div>
          <div className="text-[#ffe100]">
            Harvest: <span className="font-black">WAIT</span>
          </div>
          <div>
            L3: <span className="font-black">BO / SO</span>
          </div>
          <div>
            Group: <span className="font-black">3</span>
          </div>
          <div className="text-[#ffe100]">
            Trim: <span className="font-black">WAIT</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-1 bg-[#10141b] p-1">
          <div className="flex min-h-7 items-center justify-center bg-orange-500 px-1.5 text-center text-[10px] font-black uppercase text-black cursor-pointer">
            Apply Settings
          </div>
          <div className="flex min-h-7 items-center justify-center bg-emerald-400 px-1.5 text-center text-[10px] font-black uppercase text-white cursor-pointer">
            EA: ON
          </div>
          <div className="col-span-2 grid grid-cols-3 gap-1">
            <div className="flex min-h-7 items-center justify-center bg-emerald-400 px-1.5 text-center text-[10px] font-black uppercase text-white cursor-pointer">
              BUY: ON
            </div>
            <div className="flex min-h-7 items-center justify-center bg-red-500 px-1.5 text-center text-[10px] font-black uppercase text-white cursor-pointer">
              SELL: ON
            </div>
            <div className="flex min-h-7 items-center justify-center bg-cyan-600 px-1.5 text-center text-[10px] font-black uppercase text-white cursor-pointer">
              HEDGE: ON
            </div>
          </div>
          <div className="flex min-h-7 items-center justify-center bg-red-500 px-1.5 text-center text-[10px] font-black uppercase text-white cursor-pointer">
            Close All
          </div>
          <div className="flex min-h-7 items-center justify-center bg-slate-600 px-1.5 text-center text-[10px] font-black uppercase text-white cursor-pointer">
            Last Round: OFF
          </div>
        </div>

        <div className="border-t-2 border-[#f7b500] bg-[#10141b] py-1 text-center text-[10px] font-bold text-[#ffe100]">
          Copyright @2026 GoldScalperNinja
        </div>
      </div>
    );
  }

  return null;
}
