import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSystemBySlug } from "@/config/trading-systems-data";
import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TradingSystemsDetailTabs } from "@/components/trading-systems/TradingSystemsDetailTabs";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { ArrowLeft, Shield, Cpu, HelpCircle, CheckCircle, Lock, UserPlus, KeyRound, Sparkles, ShieldAlert } from "lucide-react";
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

  const displayVersion = dbProduct?.version || system.parameters.find(p => p.name.toLowerCase() === "version")?.defaultValue || "1.0.0";
  const Icon = system.icon;

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

        <div className="grid grid-cols-1 lg:grid-cols-[1.3fr_0.7fr] gap-8 items-center relative z-10">
          <div className="flex flex-col md:flex-row items-start gap-6">
            <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-gold/10 text-gold border border-gold/15">
              <Icon size={30} />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gold/10 text-gold border border-gold/20">
                  {system.platform} {system.type === "AUTO_TRADE" ? "Expert Advisor" : "Utility"}
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-400 rounded-md">
                  v{displayVersion}
                </span>
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-500 rounded-full text-[10px] font-bold border border-emerald-500/20">
                  <Shield size={10} />
                  MT5 Verified
                </span>
              </div>
              <h1 className="text-2xl md:text-4xl font-black font-heading text-gray-800 dark:text-white leading-tight">
                {system.title}
              </h1>
              <p className="mt-2 text-sm md:text-base text-gray-500 dark:text-gray-400 leading-relaxed font-medium">
                {system.longDescription}
              </p>
            </div>
          </div>
          
          <div className="w-full shrink-0">
            <TradingSystemMockPanel slug={system.slug} />
          </div>
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

function TradingSystemMockPanel({ slug }: { slug: string }) {
  if (slug === "goldscalperninja") {
    return (
      <div className="w-full max-w-sm mx-auto rounded-2xl border border-gold/20 bg-[#0B0D13] p-4 text-left font-mono text-[11px] text-gray-300 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-gold/10 rounded-full blur-xl pointer-events-none" />
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
          <span className="font-bold text-gold text-xs">EA GoldScalperNinja v3.0</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Live Stats */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-550">EA STATE:</span>
            <span className="text-emerald-400 font-bold">ACTIVE (ALGO ON)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-550">SYMBOL:</span>
            <span className="text-white">XAUUSD.mt5</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-550">D1 TREND:</span>
            <span className="text-amber-400 font-bold">UPTREND (MASTER)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">CONTROL ZONE:</span>
            <span className="text-white">2280.50 - 2315.20</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">ACTIVE BASKET:</span>
            <span className="text-sky-400 font-bold">5 BUY (0.75 Lots)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">PRUNING STATUS:</span>
            <span className="text-amber-400">Queue: 2 Orders pending</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">DAILY TARGET / LOSS:</span>
            <span className="text-white">$150.00 / -$200.00</span>
          </div>
          
          {/* Divider */}
          <div className="h-px bg-gray-800/80 my-2" />

          {/* Sizing Indicator bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-gray-555">
              <span>CURRENT DRAWDOWN</span>
              <span className="text-white">1.8%</span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-gold h-full rounded-full" style={{ width: "30%" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "trade-manager") {
    return (
      <div className="w-full max-w-sm mx-auto rounded-2xl border border-blue-500/20 bg-[#0B0D13] p-4 text-left font-mono text-[11px] text-gray-300 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-blue-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
          <span className="font-bold text-blue-400 text-xs">TRADE MANAGER PANEL</span>
          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-[9px] text-blue-400 font-bold">MANUAL</span>
        </div>

        {/* Control Interface Panel Simulation */}
        <div className="space-y-2.5">
          <div className="grid grid-cols-2 gap-2 text-center text-[10px]">
            <div className="bg-gray-900 p-1.5 rounded border border-gray-800">
              <span className="text-gray-555 block text-[9px]">LOT SIZE</span>
              <span className="text-white font-bold">[ 0.10 ]</span>
            </div>
            <div className="bg-gray-900 p-1.5 rounded border border-gray-800">
              <span className="text-gray-555 block text-[9px]">RISK LIMIT</span>
              <span className="text-blue-400 font-bold">1.0% Max</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="bg-emerald-600/90 text-white font-bold p-2 rounded text-center text-xs">
              BUY NOW
            </div>
            <div className="bg-rose-600/90 text-white font-bold p-2 rounded text-center text-xs">
              SELL NOW
            </div>
          </div>

          <div className="space-y-1.5 text-[10px]">
            <div className="flex justify-between border-b border-gray-800 pb-1">
              <span className="text-gray-555">AUTO S&R LEVEL:</span>
              <span className="text-white font-semibold">S: 2292.10 | R: 2308.40</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-1">
              <span className="text-gray-555">TREND MATRIX SCORING:</span>
              <span className="text-emerald-400 font-bold">STRONG BULLISH (+85)</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-1">
              <span className="text-gray-555">MOBILE DCA ADOPTION:</span>
              <span className="text-emerald-400">ENABLED (MAGIC 0)</span>
            </div>
            <div className="flex justify-between border-b border-gray-800 pb-1">
              <span className="text-gray-555">TRAILING TP:</span>
              <span className="text-white">5.0 Pips Distance</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (slug === "gsn-phoenix-grid") {
    return (
      <div className="w-full max-w-sm mx-auto rounded-2xl border border-emerald-500/20 bg-[#0B0D13] p-4 text-left font-mono text-[11px] text-gray-300 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-gray-800 pb-2 mb-3">
          <span className="font-bold text-emerald-400 text-xs">GSN Phoenix Grid v4.0</span>
          <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
        </div>

        {/* Live Stats */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-555">RECOVERY STATE:</span>
            <span className="text-emerald-400 font-bold">HARVESTING ACTIVE</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">ADAPTIVE RISK LEVEL:</span>
            <span className="text-amber-400">Level 1 (Harvesting Mode)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">PHOENIX PROFIT BANK:</span>
            <span className="text-emerald-400 font-bold">$124.50 (Auto-Trim ON)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">MLPS GRID SPACING:</span>
            <span className="text-white">ATR Spacing (Base 100 pt)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">HEDGE RECOVERY:</span>
            <span className="text-sky-400 font-bold">Isolated recovery Grid L2</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">CRASH PROTECTION:</span>
            <span className="text-emerald-400 font-bold">MT5 GV Persistent</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-555">EXPOSURE RATIO:</span>
            <span className="text-white">0.50 BUY vs 0.50 SELL</span>
          </div>

          {/* Divider */}
          <div className="h-px bg-gray-800/80 my-2" />

          {/* Progress bar */}
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] text-gray-555">
              <span>ACTIVE SYSTEM DRAWDOWN</span>
              <span className="text-white">2.5%</span>
            </div>
            <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
              <div className="bg-emerald-500 h-full rounded-full" style={{ width: "20%" }} />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
