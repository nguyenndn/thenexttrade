import Link from "next/link";
import type { Metadata } from "next";
import {
  ArrowRight,
  BadgeCheck,
  Bot,
  CheckCircle2,
  Download,
  KeyRound,
  ShieldCheck,
  Sparkles,
  Wrench,
  SlidersHorizontal,
} from "lucide-react";

import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TradingSystemsTabbedGuide } from "@/components/trading-systems/TradingSystemsTabbedGuide";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { buttonVariants } from "@/components/ui/Button";
import { TRADING_SYSTEMS_DATA } from "@/config/trading-systems-data";

export const metadata: Metadata = {
  title: "MT5 Trading Systems & Expert Advisors | TheNextTrade",
  description:
    "Unlock EA GoldScalperNinja, Trade Manager, and MT5 Expert Advisors through an eligible partner account. Pure execution support with zero custody risk.",
};

export const revalidate = 60;

const TOOL_CARDS = [
  {
    slug: "goldscalperninja",
    title: "EA GoldScalperNinja",
    label: "Automated EA",
    positioning: "Automated MT5 execution for XAUUSD with D1 Trend Master filtering and Smart Sequence Pruning.",
    bullets: [
      "D1 Trend Master control zone",
      "Smart Sequence Pruning recovery",
      "News, daily limit, and safe-close controls",
      "Remote ON/OFF from MT5 mobile",
    ],
    ctaLabel: "Unlock GoldScalperNinja",
    accentClass: "from-amber-500/10 via-orange-500/5 to-transparent border-amber-500/20 hover:border-amber-500/40",
    colorRgb: "245, 158, 11",
    icon: Bot,
  },
  {
    slug: "trade-manager",
    title: "GSN Trade Manager",
    label: "Manual Control",
    positioning: "An MT5 execution panel with built-in trading journal sync, faster entries, SL, TP, break-even, and semi-auto DCA grids.",
    bullets: [
      "SL, TP, BE, and partial-close controls",
      "Built-in trade journal sync (direct API)",
      "Multi-timeframe trend scoring matrix",
      "Semi-auto DCA with mobile trade adoption",
    ],
    ctaLabel: "Unlock Trade Manager",
    accentClass: "from-blue-500/8 via-cyan-500/4 to-transparent border-blue-500/20 hover:border-blue-500/40",
    colorRgb: "59, 130, 246",
    icon: SlidersHorizontal,
  },
  {
    slug: "gsn-phoenix-grid",
    title: "GSN Phoenix Grid",
    label: "Advanced Grid EA",
    positioning: "Advanced XAUUSD grid and hedge recovery system for traders who understand exposure, multipliers, and drawdown.",
    bullets: [
      "Adaptive Survival grid logic",
      "Phoenix Profit Bank trimming",
      "Hedge Protection and Recovery DCA",
      "MLPS trend and volatility filters",
    ],
    ctaLabel: "Unlock Phoenix Grid",
    accentClass: "from-emerald-500/8 via-teal-500/4 to-transparent border-emerald-500/20 hover:border-emerald-500/40",
    colorRgb: "16, 185, 129",
    icon: Bot,
  },
] as const;

export default async function TradingSystemsIndexPage() {
  const user = await getAuthUser();
  const isLoggedIn = !!user;

  const primaryCtaCopy = isLoggedIn ? "Check My Account" : "Check Unlock Eligibility";
  const primaryCtaUrl = isLoggedIn
    ? "/dashboard/accounts"
    : "/auth/signup?next=/dashboard/accounts&source=trading_systems";

  // Query database to ensure stats/versions stay synced behind the scenes if needed
  const dbProducts = await prisma.eAProduct.findMany({
    where: { isActive: true },
  });

  const systems = TOOL_CARDS.map((card) => {
    const dbMatch = dbProducts.find(
      (dbProd) =>
        dbProd.slug.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        card.slug.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );

    const configMatch = TRADING_SYSTEMS_DATA.find(
      (s) =>
        s.slug.toLowerCase().replace(/[^a-z0-9]/g, "") ===
        card.slug.toLowerCase().replace(/[^a-z0-9]/g, ""),
    );

    let rawVersion = dbMatch?.version || configMatch?.version || "1.0.0";
    if (rawVersion.startsWith("v")) {
      rawVersion = rawVersion.substring(1);
    }

    return {
      ...card,
      version: rawVersion,
    };
  });

  return (
    <TradingSystemsPageShell maxWidth="max-w-7xl">
      {/* Block 1: Hero Section */}
      <section className="mb-10 grid items-center gap-12 lg:grid-cols-[1.15fr_0.85fr] pt-4">
        <div className="space-y-6 text-left">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3.5 py-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-gold">
            <Sparkles size={12} className="fill-gold/25" />
            Verified MT5 Expert Advisors
          </div>

          <div className="space-y-4">
            <h1 className="font-heading text-4xl font-black leading-tight tracking-tight text-gray-900 dark:text-white sm:text-5xl lg:text-[48px]">
              MT5 Expert Advisors you can unlock with an{" "}
              <span className="bg-gradient-to-r from-amber-500 to-yellow-400 bg-clip-text text-transparent dark:from-gold dark:to-amber-300">
                eligible partner account
              </span>
            </h1>
            <p className="max-w-2xl text-sm font-medium leading-relaxed text-gray-550 dark:text-gray-400 sm:text-base">
              Access EA GoldScalperNinja, GSN Phoenix Grid, and Trade Manager after your account qualifies. TheNextTrade keeps downloads, setup steps, and updates inside your dashboard.
            </p>
          </div>

          <div className="flex flex-col gap-3.5 sm:flex-row pt-2">
            <Link
              href={primaryCtaUrl}
              className={buttonVariants({
                variant: "primary",
                className:
                  "min-h-12 rounded-xl border-none bg-gold px-7 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-gold/20 hover:bg-amber-600 transition-all duration-200 active:scale-[0.98]",
              })}
            >
              {primaryCtaCopy}
              <ArrowRight size={15} />
            </Link>
            <a
              href="#available-tools"
              className={buttonVariants({
                variant: "outline",
                className:
                  "min-h-12 rounded-xl border-gold/25 bg-white/70 px-7 text-xs font-black uppercase tracking-wider text-gray-800 hover:border-gold/45 hover:text-gold dark:bg-white/[0.03] dark:text-white transition-all duration-200 active:scale-[0.98]",
              })}
            >
              Compare EAs
              <ArrowRight size={15} className="rotate-90" />
            </a>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-2 border-t border-dashed border-gray-200 pt-5 text-xs font-bold text-gray-500 dark:border-white/5 dark:text-gray-400">
            {[
              "Eligible partner account required",
              "Funds stay with your broker",
              "No profit guarantee",
            ].map((item) => (
              <span key={item} className="inline-flex items-center gap-1.5">
                <CheckCircle2 size={14} className="text-gold shrink-0" />
                {item}
              </span>
            ))}
          </div>
        </div>

        {/* Hero Right Column: MT5 Toolkit Preview Console */}
        <div className="rounded-[2.5rem] border border-gold/15 bg-white/60 p-5 shadow-xl shadow-gold/[0.03] dark:border-white/5 dark:bg-[#111318]/45 relative">
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-gold/5 rounded-full blur-[50px] pointer-events-none"></div>

          <div className="rounded-[2rem] border border-gray-200/60 bg-gray-50/70 p-5 dark:border-white/5 dark:bg-[#151822]/80 space-y-5 backdrop-blur-md relative z-10">
            {/* Header of Console */}
            <div className="flex items-center justify-between border-b border-dashed border-gray-200 pb-3.5 dark:border-white/5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/85" />
                <span className="h-2.5 w-2.5 rounded-full bg-yellow-450/85" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-450/85" />
              </div>
              <span className="rounded-full border border-gold/20 bg-gold/10 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-gold">
                MT5 Toolkit Status
              </span>
            </div>

            {/* Main Console Layout */}
            <div className="space-y-4">
              {/* Tool List */}
              <div className="space-y-2">
                {systems.map((tool, idx) => {
                  const ToolIcon = tool.icon;
                  return (
                    <div key={tool.title} className="p-3 bg-white dark:bg-card rounded-xl border border-gray-200/60 dark:border-white/5 flex items-center justify-between shadow-sm">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-[10px] font-mono font-bold text-gold shrink-0">0{idx + 1}</span>
                        <div className="min-w-0 flex items-center gap-2">
                          <ToolIcon size={13} className="text-gold shrink-0" />
                          <h4 className="text-xs font-black text-gray-800 dark:text-white leading-none truncate">{tool.title}</h4>
                        </div>
                      </div>
                      <span className="text-[9px] font-bold text-gray-400 dark:text-gray-500">v{tool.version}</span>
                    </div>
                  );
                })}
              </div>

              {/* Status Checklist */}
              <div className="p-3 bg-white/40 dark:bg-white/[0.01] rounded-2xl border border-dashed border-gray-200 dark:border-white/5 space-y-2">
                {[
                  { label: "Account submitted", status: "Active" },
                  { label: "Eligibility check", status: "Verified" },
                  { label: "Download unlocked", status: "Ready" }
                ].map((step) => (
                  <div key={step.label} className="flex items-center justify-between text-[11px]">
                    <span className="font-semibold text-gray-655 dark:text-gray-400">{step.label}</span>
                    <span className="font-black text-emerald-500 dark:text-emerald-400 flex items-center gap-1">
                      <BadgeCheck size={12} className="shrink-0" />
                      {step.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom Strip */}
            <div className="border-t border-dashed border-gray-200 pt-3.5 dark:border-white/5 flex justify-around text-center text-[10px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <ShieldCheck size={14} className="text-gold shrink-0" />
                <span>MT5 Native</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Wrench size={14} className="text-gold shrink-0" />
                <span>Dashboard Sync</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Block 2: Product Chooser */}
      <section id="available-tools" className="mb-12 scroll-mt-24">
        <div className="mb-10 max-w-3xl text-left">
          <span className="mb-3 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-gold/10 px-3.5 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-gold">
            <Bot size={12} />
            EA & Utility Suite
          </span>
          <h2 className="font-heading text-3xl font-black text-gray-900 dark:text-white sm:text-4xl">
            Choose your MT5 Expert Advisor
          </h2>
          <p className="mt-3 text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
            Select the EA that aligns with your execution style: automated support, manual overlay panels, or partner utilities.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-3 items-stretch">
          {systems.map((system) => {
            const Icon = system.icon;
            const hasGlow = system.colorRgb;

            return (
              <article
                key={system.slug}
                style={hasGlow ? {
                  '--glow-color': system.colorRgb
                } as React.CSSProperties : undefined}
                className={`flex h-full flex-col rounded-[2rem] border bg-gradient-to-br p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 ${system.accentClass
                  } hover:shadow-[0_15px_40px_rgba(var(--glow-color,197,160,89),0.08)] dark:bg-[#111318]/45 relative overflow-hidden`}
              >
                {/* Visual Glow Ornament inside Card */}
                <div className="absolute -top-12 -right-12 w-24 h-24 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl pointer-events-none"></div>

                <div className="mb-5 flex items-start justify-between gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-white/80 bg-white/90 text-gold shadow-sm dark:border-white/5 dark:bg-white/[0.04]">
                    <Icon size={20} className="stroke-[2.5]" />
                  </div>
                  <span className="rounded-full border border-white/80 bg-white/90 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-gray-500 dark:border-white/5 dark:bg-white/[0.04] dark:text-gray-400 shadow-sm">
                    {system.label}
                  </span>
                </div>

                <div className="flex-1 space-y-5 flex flex-col justify-between">
                  <div className="space-y-3">
                    <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                      {system.title}
                    </h3>
                    <p className="text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400 min-h-[40px]">
                      {system.positioning}
                    </p>

                    <div className="space-y-2.5 pt-2 border-t border-dashed border-gray-200 dark:border-white/5">
                      {system.bullets.map((bullet) => (
                        <div key={bullet} className="flex items-center gap-2 text-xs font-medium text-gray-600 dark:text-gray-300">
                          <CheckCircle2 size={13} className="text-gold shrink-0" />
                          <span>{bullet}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Buttons pushed strictly to the bottom */}
                  <div className="mt-6 flex flex-col gap-2 pt-2 border-t border-dashed border-gray-200 dark:border-white/5">
                    <Link
                      href={primaryCtaUrl}
                      className={buttonVariants({
                        variant: "primary",
                        className:
                          "min-h-11 rounded-xl border-none bg-gold text-xs font-black uppercase tracking-wider text-white shadow-md shadow-gold/15 hover:bg-amber-600 transition-all duration-200 active:scale-[0.98]",
                      })}
                    >
                      {system.ctaLabel}
                      <ArrowRight size={14} />
                    </Link>

                    <Link
                      href={`/trading-systems/${system.slug}`}
                      className="inline-flex min-h-9 items-center justify-center gap-1.5 rounded-xl text-[11px] font-black uppercase tracking-wider text-gold hover:text-amber-600 hover:bg-gold/5 transition-all duration-200"
                    >
                      View Details
                      <ArrowRight size={13} />
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* Block 3 & 4: Tabbed Guide (Access & Installation) */}
      <TradingSystemsTabbedGuide primaryCtaUrl={primaryCtaUrl} />

      {/* Block 5: Final CTA + Risk Note */}
      <section className="mb-4 rounded-[2.5rem] border border-gold/15 bg-white/85 dark:bg-[#0F1117] p-8 text-center shadow-xl shadow-gold/[0.02] relative overflow-hidden sm:p-12 transition-colors duration-300">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.06),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(245,158,11,0.08),transparent_70%)] pointer-events-none"></div>
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent"></div>

        <div className="relative z-10 max-w-3xl mx-auto space-y-6">
          <span className="inline-flex items-center gap-2 rounded-full border border-gold/25 bg-gold/10 px-3.5 py-1.5 text-[9px] font-black uppercase tracking-[0.2em] text-gold animate-pulse">
            Dashboard Access
          </span>
          <h2 className="font-heading text-2xl sm:text-3xl md:text-[32px] font-black tracking-tight text-gray-900 dark:text-white leading-tight">
            Ready to check your MT5 access?
          </h2>
          <h3 className="sr-only">Verify partner eligibility to unlock expert advisors</h3>
          <p className="text-sm font-medium leading-relaxed text-gray-500 dark:text-gray-400 sm:text-base">
            Create a free account or open your dashboard to check whether your MT5 account qualifies for EA and Trade Manager access.
          </p>

          <div className="flex flex-col gap-3.5 sm:flex-row justify-center pt-2">
            <Link
              href={primaryCtaUrl}
              className={buttonVariants({
                variant: "primary",
                className:
                  "min-h-12 rounded-xl border-none bg-gold px-8 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-gold/20 hover:bg-amber-600 transition-all active:scale-[0.98]",
              })}
            >
              {isLoggedIn ? "Check My Account" : "Create Account & Check"}
              <ArrowRight size={15} />
            </Link>
            <Link
              href="/brokers"
              className={buttonVariants({
                variant: "outline",
                className:
                  "min-h-12 rounded-xl border-gray-350 dark:border-white/15 bg-white/40 dark:bg-transparent px-8 text-xs font-black uppercase tracking-wider text-gray-800 dark:text-white hover:border-gold/30 hover:bg-gold/5 dark:hover:border-white/30 dark:hover:bg-white/[0.05] transition-all active:scale-[0.98]",
              })}
            >
              View Supported Brokers
              <ArrowRight size={15} />
            </Link>
          </div>

          <div className="border-t border-dashed border-gray-200 dark:border-white/5 pt-5 max-w-xl mx-auto">
            <p className="text-xs font-medium leading-relaxed text-gray-450 dark:text-gray-500">
              MT5 Expert Advisors support execution and workflow. They do not guarantee profit, and your funds stay with your broker.
            </p>
          </div>
        </div>
      </section>
    </TradingSystemsPageShell>
  );
}
