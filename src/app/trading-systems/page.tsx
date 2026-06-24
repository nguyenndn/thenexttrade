import React from "react";
import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TRADING_SYSTEMS_DATA } from "@/config/trading-systems-data";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import Link from "next/link";
import { 
  ArrowRight, 
  Bot, 
  SlidersHorizontal, 
  Wrench, 
  ShieldCheck, 
  CheckCircle2, 
  UserCheck, 
  Download, 
  Monitor,
  Sparkles,
  Zap,
  HelpCircle,
  Clock,
  Cpu
} from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/Button";
import { TradingSystemsSimulator } from "@/components/trading-systems/TradingSystemsSimulator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "MT5 Trading Systems & Expert Advisors | TheNextTrade",
  description: "Unlock EA GoldScalperNinja, Trade Manager panels, and MT5 execution tools through an eligible partner account. Built for cleaner execution, risk control, and guided setup.",
};

export const revalidate = 60;

export default async function TradingSystemsIndexPage() {
  const user = await getAuthUser();
  const isLoggedIn = !!user;

  // Determine dynamic CTA copy and URL based on authentication status
  const primaryCtaCopy = isLoggedIn ? "Check My Account Eligibility" : "Check Unlock Eligibility";
  const primaryCtaUrl = isLoggedIn 
    ? "/dashboard/accounts" 
    : "/auth/signup?next=/dashboard/accounts&source=trading_systems";

  // Fetch active products from the DB to merge download stats and version tags
  const dbProducts = await prisma.eAProduct.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Merge static technical specifications from config with DB products
  const systems = TRADING_SYSTEMS_DATA.map(staticSystem => {
    const dbMatch = dbProducts.find(
      dbProd => dbProd.slug.toLowerCase().replace(/[^a-z0-9]/g, "") === staticSystem.slug.toLowerCase().replace(/[^a-z0-9]/g, "")
    );
    return {
      ...staticSystem,
      version: dbMatch?.version || staticSystem.version || "1.0.0",
      totalDownloads: dbMatch?.totalDownloads || 0,
      isFree: dbMatch?.isFree || false,
    };
  });

  return (
    <TradingSystemsPageShell maxWidth="max-w-6xl">
      {/* Inject self-contained premium animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes border-flow-page {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -360; }
        }
        @keyframes pulse-dot {
          0% { transform: scale(0.9); opacity: 0.6; }
          50% { transform: scale(1.15); opacity: 0.3; }
          100% { transform: scale(0.9); opacity: 0.6; }
        }
        @keyframes sweep-shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-flow-page {
          stroke-dasharray: 120 240;
          animation: border-flow-page 14s linear infinite;
        }
        .animate-pulse-dot {
          animation: pulse-dot 2.5s ease-in-out infinite;
        }
        .btn-shine-sweep::after {
          content: '';
          position: absolute;
          top: 0;
          height: 100%;
          width: 55px;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.25) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-25deg);
          transition: 0.75s;
        }
        .btn-shine-sweep:hover::after {
          animation: sweep-shine 1.25s ease-in-out infinite;
        }
      `}} />

      {/* SECTION 1: HERO SECTION (Split Layout) */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-12 items-center mb-20">
        {/* Hero Left: Headline & Actions */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/25 text-gold font-black text-xs uppercase tracking-wider">
            <Bot size={13} className="animate-pulse" />
            <span>MT5 Execution Toolkit</span>
          </div>

          <h1 className="text-4xl md:text-5xl lg:text-6xl font-black font-heading text-gray-800 dark:text-white leading-tight tracking-tight">
            Unlock Cleaner <br />
            <span className="text-gold">MT5 Execution</span>
          </h1>

          <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 font-semibold leading-relaxed max-w-xl">
            Get access to EA GoldScalperNinja, Trade Manager panels, and partner MT5 tools when your trading account qualifies through TheNextTrade&apos;s partner path. Built for cleaner execution, faster risk actions, and guided setup.
          </p>

          {/* Dual CTAs */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
            <Link 
              href={primaryCtaUrl}
              className={buttonVariants({
                variant: "primary",
                className: "relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-extrabold shadow-md shadow-amber-500/20 px-8 py-3 min-h-12 rounded-xl flex items-center justify-center gap-2 btn-shine-sweep border-none transition-all duration-300"
              })}
            >
              <span className="relative z-10 text-xs uppercase tracking-wider flex items-center gap-2">
                {primaryCtaCopy}
                <Zap size={14} className="text-yellow-200" />
              </span>
            </Link>

            <a 
              href="#tools-section"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-12 rounded-xl px-6 py-3 text-xs font-black uppercase tracking-wider text-gray-700 dark:text-gray-300 transition-all flex items-center justify-center gap-1.5"
              })}
            >
              <span>View the Tools</span>
              <ArrowRight size={14} />
            </a>
          </div>

          {/* Trust Chips Grid */}
          <div className="grid grid-cols-2 gap-3 max-w-md border-t border-dashed border-gray-200 dark:border-white/5 pt-6">
            {[
              { icon: CheckCircle2, text: "Free to unlock with eligible account" },
              { icon: ShieldCheck, text: "Funds stay with your broker" },
              { icon: Monitor, text: "MT5 setup support" },
              { icon: HelpCircle, text: "No profit guarantee" }
            ].map((chip, idx) => {
              const ChipIcon = chip.icon;
              return (
                <div key={idx} className="flex items-center gap-2 text-xs font-bold text-gray-600 dark:text-gray-450">
                  <ChipIcon size={14} className="text-gold shrink-0" />
                  <span>{chip.text}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Hero Right: Stunning Interactive-style Product Visual Mockup */}
        <div className="relative w-full max-w-[430px] mx-auto lg:max-w-none rounded-3xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]/60 p-5 shadow-lg dark:shadow-[0_20px_50px_rgba(0,0,0,0.4)] overflow-hidden group/hero-visual">
          {/* Flowing laser border on visual container */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl">
            <rect
              x="0.5"
              y="0.5"
              width="calc(100% - 1px)"
              height="calc(100% - 1px)"
              rx="23"
              fill="none"
              stroke="url(#laser-grad-teaser-new)"
              strokeWidth="1.5"
              className="animate-flow-page"
            />
          </svg>

          {/* Grid mesh backdrop */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(156,163,175,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.04)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />
          
          <div className="relative z-10">
            {/* Mock Header */}
            <div className="flex items-center justify-between mb-4 border-b border-gray-200 dark:border-white/5 pb-3">
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5 shrink-0">
                  <span className="w-2 h-2 rounded-full bg-red-500/40" />
                  <span className="w-2 h-2 rounded-full bg-yellow-500/40" />
                  <span className="w-2 h-2 rounded-full bg-green-500/40" />
                </div>
                <span className="text-[10px] font-black font-mono text-gray-450 dark:text-gray-500 uppercase tracking-wider">
                  GoldScalperNinja MT5
                </span>
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-gold/10 border border-gold/25 text-[8px] font-black uppercase text-gold tracking-wider">
                <span className="w-1.5 h-1.5 rounded-full bg-gold animate-pulse-dot" />
                <span>Eligibility Required</span>
              </span>
            </div>

            {/* Glowing SVG mini chart */}
            <div className="h-14 w-full mb-4 bg-gray-50/50 dark:bg-[#0B0E14]/45 rounded-xl border border-gray-200/40 dark:border-white/5 overflow-hidden flex items-center justify-center">
              <svg viewBox="0 0 320 50" className="w-full h-full">
                <path
                  d="M 0,40 C 40,5 80,35 120,15 C 160,45 200,5 240,25 C 280,5 300,18 320,15"
                  fill="none"
                  stroke="url(#laser-grad-teaser-new)"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                />
              </svg>
            </div>

            {/* Simulated Tools Grid */}
            <div className="grid grid-cols-2 gap-2">
              {[
                { icon: Bot, name: "EA GoldScalperNinja", desc: "Automated execution support" },
                { icon: SlidersHorizontal, name: "Trade Manager", desc: "Faster risk and order controls" },
                { icon: ShieldCheck, name: "Risk Controls", desc: "Hard stop-loss settings" },
                { icon: Monitor, name: "Setup Guide", desc: "Step-by-step installation" }
              ].map((tool, idx) => {
                const ToolIcon = tool.icon;
                return (
                  <div key={idx} className="p-3 rounded-xl border border-gray-200/60 dark:border-white/5 bg-gray-50/60 dark:bg-[#151822]/60 hover:border-gold/20 transition-colors">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold/10 text-gold mb-2 border border-gold/15">
                      <ToolIcon size={14} />
                    </div>
                    <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 truncate">
                      {tool.name}
                    </h4>
                    <p className="text-[9px] text-gray-400 dark:text-gray-500 font-bold leading-tight mt-0.5">
                      {tool.desc}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: PROBLEM SECTION (Manual execution gets messy) */}
      <div className="mb-20 text-center py-10 border-y border-dashed border-gray-250/60 dark:border-white/5 relative">
        <div className="max-w-3xl mx-auto space-y-4">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-red-500/80 bg-red-500/5 dark:bg-red-500/10 border border-red-500/15 px-3 py-1 rounded-full">
            The Execution Leak
          </span>
          
          <h2 className="text-3xl font-black font-heading text-gray-800 dark:text-white leading-tight">
            Manual execution gets messy fast
          </h2>

          <p className="text-sm text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed font-semibold">
            When entries, stop loss, take profit, lot size, break-even moves, and trade review all live in separate places, mistakes become easy. TheNextTrade&apos;s MT5 toolkit helps bring execution, setup, and review into one cleaner workflow.
          </p>

          {/* Pain Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-6 text-left">
            {[
              {
                title: "Slow order setup",
                desc: "Manual inputs create hesitation during fast markets. Seconds lost typing parameters lead to bad fills or missed opportunities.",
                badge: "Hesitation Risk"
              },
              {
                title: "Inconsistent risk",
                desc: "Lot size, SL, TP, and break-even rules are easy to forget or miscalculate under psychological pressure of live trading.",
                badge: "Discipline Leak"
              },
              {
                title: "No feedback loop",
                desc: "Most tools execute trades, but do not connect back to your journal and weekly improvement plan. You repeat mistakes without knowing.",
                badge: "Data Isolation"
              }
            ].map((card, idx) => (
              <div 
                key={idx} 
                className="p-5 rounded-2xl border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-[#111318]/30 shadow-sm relative overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[8px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-red-500/10 text-red-500 border border-red-500/20">
                      {card.badge}
                    </span>
                    <span className="text-xs font-mono font-bold text-gray-300 dark:text-gray-600">0{idx + 1}</span>
                  </div>
                  <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 mb-2">
                    {card.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 3: SOLUTION SECTION (What you unlock) */}
      <div id="tools-section" className="mb-20 scroll-mt-20">
        <div className="text-center mb-10 space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-emerald-500 bg-emerald-500/5 dark:bg-emerald-500/10 border border-emerald-500/15 px-3 py-1 rounded-full">
            Execution Suite
          </span>
          <h2 className="text-3xl font-black font-heading text-gray-800 dark:text-white">
            What you unlock
          </h2>
          <p className="text-xs sm:text-sm text-gray-650 dark:text-gray-400 font-semibold max-w-xl mx-auto leading-relaxed">
            The toolkit gives qualified users access to MT5 execution tools and setup resources that support different trading styles.
          </p>
        </div>

        {/* Directory Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {systems.map((system) => {
            const Icon = system.icon;
            return (
              <div 
                key={system.slug}
                className="group relative flex flex-col justify-between rounded-3xl border border-gray-200 dark:border-white/5 bg-white/85 dark:bg-[#111318]/50 p-6 shadow-md transition-all duration-300 hover:border-gold/30 dark:hover:border-gold/25 hover:shadow-xl hover:shadow-gold/[0.02]"
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center justify-between mb-5">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-105 border border-gold/15">
                      <Icon size={20} />
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400">
                      {system.platform} {system.type === "AUTO_TRADE" ? "EA" : "Tool"}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                    {system.title}
                  </h3>

                  {/* Desc */}
                  <p className="text-xs text-gray-600 dark:text-gray-455 leading-relaxed font-semibold mb-5">
                    {system.description}
                  </p>

                  {/* Quick specs */}
                  <div className="border-t border-dashed border-gray-200 dark:border-white/5 pt-4 space-y-2 mb-6 text-[11px] font-bold">
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-500">Target Asset</span>
                      <span className="text-gray-850 dark:text-gray-300">{system.targetAsset}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-500">Leverage</span>
                      <span className="text-gray-850 dark:text-gray-300">{system.recommendedLeverage}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500 dark:text-gray-500">Setup Difficulty</span>
                      <span className="text-gray-850 dark:text-gray-300">{system.setupDifficulty}</span>
                    </div>
                  </div>
                </div>

                {/* Action Button */}
                <Link href={`/trading-systems/${system.slug}`} className="w-full mt-auto">
                  <Button 
                    className="w-full min-h-10 rounded-xl bg-white/90 dark:bg-white/[0.02] border border-gold/30 dark:border-gold/20 hover:border-gold hover:bg-gold hover:text-white dark:hover:bg-gold dark:hover:text-white text-gray-850 dark:text-gray-200 font-extrabold text-xs shadow-sm transition-all duration-300 flex items-center justify-center gap-2"
                  >
                    <span>View {system.title.split(" EA")[0]}</span>
                    <ArrowRight size={12} />
                  </Button>
                </Link>
              </div>
            );
          })}
        </div>
      </div>

      {/* SECTION 4: INTEGRATION WORKFLOW (Why TNT) */}
      <div className="mb-20 rounded-3xl border border-gray-200 dark:border-white/5 bg-gray-50/50 dark:bg-[#111318]/25 p-6 sm:p-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-48 h-48 bg-gradient-to-br from-gold/5 to-transparent rounded-full blur-2xl pointer-events-none" />
        
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.2fr] gap-8 items-center relative z-10">
          <div className="space-y-4">
            <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gold block">
              The Feedback Loop
            </span>
            <h3 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white leading-tight">
              Execution is only useful when you learn from it
            </h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
              The tools help you execute. TheNextTrade helps you review what happened. Sync your trades, read the patterns, and use weekly coach reports to turn execution history into one clear next action.
            </p>
            
            <div className="pt-2">
              <Link 
                href="/auth/signup?source=trading_systems_workflow"
                className={buttonVariants({
                  variant: "primary",
                  className: "text-xs font-black uppercase tracking-wider px-6 py-2.5 min-h-11 rounded-xl bg-primary hover:bg-[#00B078] text-white transition-all shadow-md flex items-center justify-center gap-1.5"
                })}
              >
                <span>Start the Workflow</span>
                <Zap size={14} />
              </Link>
            </div>
          </div>

          {/* Workflow Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {[
              {
                step: "01",
                title: "Execute",
                desc: "Use EA tools or Trade Manager to support cleaner MT5 execution."
              },
              {
                step: "02",
                title: "Sync",
                desc: "Bring your MT5 history into TheNextTrade through TNT Connect or EA Sync."
              },
              {
                step: "03",
                title: "Improve",
                desc: "Use journal analytics and coach reports to spot leaks and decide what to fix next."
              }
            ].map((step, idx) => (
              <div key={idx} className="p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]/40 shadow-inner flex flex-col justify-between">
                <span className="text-base font-mono font-black text-gold block mb-2">{step.step}</span>
                <div>
                  <h4 className="text-xs font-black text-gray-800 dark:text-gray-250 mb-1">
                    {step.title}
                  </h4>
                  <p className="text-[10px] text-gray-500 dark:text-gray-455 font-bold leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* SECTION 5: UNLOCK FLOW SECTION (How access works) */}
      <div className="mb-20 relative rounded-3xl border border-gold/20 dark:border-gold/15 bg-gold/[0.02] p-8 max-w-4xl mx-auto shadow-md">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-10 space-y-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold border border-gold/15 mb-2">
            <ShieldCheck size={20} className="animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 dark:text-white">
            How access works
          </h2>
          <p className="text-xs sm:text-sm text-gray-650 dark:text-gray-400 font-semibold leading-relaxed">
            The toolkit is free to unlock, but it is not a public download. Access depends on account eligibility through the partner path.
          </p>
        </div>

        {/* 4-Step Unlock Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {[
            { icon: UserCheck, title: "Create TNT account", desc: "This gives you the workspace where unlock requests, downloads, and setup guides live." },
            { icon: Monitor, title: "Connect partner account", desc: "Use a supported broker account under the approved partner path." },
            { icon: ShieldCheck, title: "Submit unlock request", desc: "The system or admin checks your account eligibility." },
            { icon: Download, title: "Download & install", desc: "Approved users can access the EA/tool files and setup instructions from the dashboard." }
          ].map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <div 
                key={idx}
                className="flex flex-col items-center text-center p-4 bg-white dark:bg-[#1E2028]/20 border border-gray-200/70 dark:border-white/5 rounded-2xl relative"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gold/10 text-gold mb-3 border border-gold/15">
                  <StepIcon size={16} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Step {idx + 1}
                </span>
                <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 leading-snug mb-1">
                  {step.title}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-450 font-bold leading-normal">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 pt-6 border-t border-dashed border-gold/20 text-center space-y-4">
          <Link 
            href={primaryCtaUrl}
            className={buttonVariants({
              variant: "primary",
              className: "inline-flex items-center justify-center gap-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-xs font-black uppercase tracking-wider shadow-sm hover:from-amber-600 border-none"
            })}
          >
            <span>{primaryCtaCopy}</span>
            <ArrowRight size={13} />
          </Link>

          <p className="text-[10px] font-semibold leading-relaxed text-gray-500 dark:text-gray-450 max-w-xl mx-auto italic">
            Your trading funds remain in your own broker account. TheNextTrade does not custody user funds.
          </p>
        </div>
      </div>

      {/* SECTION 6: TOOLKIT FEATURE SHOWCASE */}
      <div className="mb-20 space-y-6">
        <div className="text-center space-y-3">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-gold bg-gold/5 dark:bg-gold/10 border border-gold/15 px-3 py-1 rounded-full">
            MT5 Toolkit Features
          </span>
          <h2 className="text-2xl sm:text-3xl font-black font-heading text-gray-800 dark:text-white">
            See what each MT5 tool actually does
          </h2>
          <p className="text-xs sm:text-sm text-gray-650 dark:text-gray-400 font-semibold max-w-2xl mx-auto leading-relaxed">
            Compare the EA, Trade Manager, and partner toolkit by function, unlock path, and practical execution benefit. No performance projections.
          </p>
        </div>

        <TradingSystemsSimulator />
      </div>

      {/* SECTION 7: OBJECTION HANDLING FAQ */}
      <div className="mb-20 rounded-3xl border border-gray-200 dark:border-white/5 bg-white/70 dark:bg-[#111318]/30 p-6 sm:p-8 shadow-sm">
        <h3 className="text-xl font-black text-gray-800 dark:text-white mb-6 uppercase tracking-wider flex items-center gap-2 border-b border-dashed border-gray-200 dark:border-white/5 pb-4">
          <HelpCircle size={20} className="text-gold" />
          Frequently Asked Questions
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              q: "Is this free?",
              a: "The toolkit can be unlocked for free when your account qualifies through the approved partner path. It is not a public download for every visitor."
            },
            {
              q: "Do I need to deposit money into TheNextTrade?",
              a: "No. Your funds stay in your own broker account. TheNextTrade provides the workspace, setup path, and tool access."
            },
            {
              q: "Does the EA guarantee profit?",
              a: "No. No EA or trading system can guarantee profit. These tools are built to support execution and risk control, not remove market risk."
            },
            {
              q: "What is the difference between EA GoldScalperNinja and Trade Manager?",
              a: "EA GoldScalperNinja is an automated MT5 Expert Advisor workflow. Trade Manager is a manual execution assistant that helps with lot size, stop loss, take profit, break-even, and order management."
            },
            {
              q: "Can beginners use it?",
              a: "Beginners can follow the setup guide, but they should start with small risk and understand the Academy risk lessons first. The tools support execution; they do not replace trading discipline."
            },
            {
              q: "Where do I install the files?",
              a: "Approved users get step-by-step MT5 installation instructions from their dashboard, including where to place EA or indicator files."
            }
          ].map((faq, idx) => (
            <div key={idx} className="space-y-1.5 p-4 bg-gray-50/40 dark:bg-[#151822]/20 rounded-2xl border border-gray-200/50 dark:border-white/5">
              <h4 className="text-sm font-black text-gray-800 dark:text-gray-200 flex items-start gap-1.5">
                <span className="text-gold">Q:</span>
                {faq.q}
              </h4>
              <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold leading-relaxed pl-4 border-l border-gold/20">
                {faq.a}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* SECTION 8: FINAL CTA SECTION */}
      <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-gradient-to-br from-white via-gold/[0.02] to-amber-50/40 dark:from-[#1E2028]/45 dark:via-gold/[0.01] dark:to-[#111318]/25 p-8 sm:p-10 text-center shadow-lg mb-10">
        <div className="absolute inset-0 bg-[radial-gradient(#f59e0b_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-[0.03] pointer-events-none" />
        
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="mx-auto inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.25em] text-gold">
            <Sparkles size={11} className="animate-pulse" />
            Ready when you are
          </div>

          <h2 className="text-3xl font-black font-heading text-gray-800 dark:text-white leading-tight">
            Ready to see if your account qualifies?
          </h2>

          <p className="text-sm sm:text-base text-gray-650 dark:text-gray-400 font-semibold max-w-2xl mx-auto leading-relaxed">
            Create your TheNextTrade account, connect your MT5 account, and check whether you can unlock the MT5 execution toolkit.
          </p>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row justify-center gap-3.5 pt-2">
            <Link 
              href={primaryCtaUrl}
              className={buttonVariants({
                variant: "primary",
                className: "relative overflow-hidden bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 text-white font-extrabold px-8 py-3 min-h-12 rounded-xl flex items-center justify-center gap-2 border-none shadow-md"
              })}
            >
              <span>{primaryCtaCopy}</span>
              <Zap size={15} className="text-yellow-200" />
            </Link>

            <a 
              href="#tools-section"
              className={buttonVariants({
                variant: "outline",
                className: "min-h-12 rounded-xl px-7 py-3 text-sm font-black text-gray-800 dark:text-white"
              })}
            >
              Browse Trading Systems
            </a>
          </div>

          <div className="text-[10px] font-semibold text-gray-450 dark:text-gray-500 pt-3">
            No custody. No profit guarantee. Built for traders who want cleaner execution and better review.
          </div>
        </div>
      </div>

    </TradingSystemsPageShell>
  );
}
