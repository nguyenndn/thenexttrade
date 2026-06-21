import React from "react";
import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TRADING_SYSTEMS_DATA, getSystemBySlug } from "@/config/trading-systems-data";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowRight, Bot, SlidersHorizontal, Wrench, ShieldCheck, CheckCircle2, UserCheck, Download, Monitor } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { TradingSystemsSimulator } from "@/components/trading-systems/TradingSystemsSimulator";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trading Systems & EAs | TheNextTrade",
  description: "Unlock GoldScalperNinja MT5 EAs, Trade Managers, and custom indicators. Professional-grade execution tools for active traders.",
};

export const revalidate = 60;

const UNLOCK_STEPS = [
  { icon: UserCheck, label: "Use eligible account", desc: "Open or link a partner account with Exness, Vantage, etc." },
  { icon: ShieldCheck, label: "Submit unlock request", desc: "Request MT5 license approval via your user dashboard." },
  { icon: Download, label: "Download EA tools", desc: "Get verified MT5 compile files (.ex5) directly in your account." },
  { icon: Monitor, label: "Install on MT5", desc: "Follow our simple 5-step guide to run the EA on your terminal." },
] as const;

export default async function TradingSystemsIndexPage() {
  // Fetch active products from the DB
  const dbProducts = await prisma.eAProduct.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
  });

  // Merge database products with detailed metadata from config
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
      {/* Hero Section */}
      <div className="text-center mb-16 relative">
        <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold/10 border border-gold/20 text-gold font-black text-xs uppercase tracking-wider mb-6">
          <Bot size={14} className="animate-pulse" />
          <span>Execution Systems</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-black font-heading text-gray-800 dark:text-white mb-6 leading-tight tracking-tight">
          Elite <span className="text-gold">Trading Systems</span> for MT5
        </h1>

        <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed mb-6 font-semibold">
          Unlock Expert Advisors, Trade Managers, and custom indicators designed for gold and Forex markets to run structured risk and disciplined execution.
        </p>

        <div className="flex flex-wrap items-center justify-center gap-2.5 max-w-3xl mx-auto">
          {[
            "Free to unlock",
            "Institutional risk controls",
            "MetaTrader 5 Verified",
            "Full setup documentation"
          ].map((text, idx) => (
            <span 
              key={idx} 
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-white/60 dark:bg-[#111318]/40 border border-gray-200 dark:border-white/5 text-xs font-bold text-gray-600 dark:text-gray-400 shadow-sm"
            >
              <CheckCircle2 size={12} className="text-gold" />
              {text}
            </span>
          ))}
        </div>
      </div>

      {/* Directory Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        {systems.map((system) => {
          const Icon = system.icon;
          return (
            <div 
              key={system.slug}
              className="group relative flex flex-col justify-between rounded-3xl border border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#111318]/50 p-6 shadow-md transition-all duration-300 hover:border-gold/30 dark:hover:border-gold/25 hover:shadow-xl hover:shadow-gold/[0.02]"
            >
              <div>
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gold/10 text-gold transition-transform duration-300 group-hover:scale-105">
                    <Icon size={22} />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-gray-100 dark:bg-white/[0.05] text-gray-500 dark:text-gray-400">
                    {system.platform} {system.type === "AUTO_TRADE" ? "EA" : "Tool"}
                  </span>
                </div>

                {/* Title */}
                <h3 className="text-xl font-black text-gray-800 dark:text-white mb-2 leading-tight group-hover:text-primary transition-colors">
                  {system.title}
                </h3>

                {/* Desc */}
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-semibold mb-6">
                  {system.description}
                </p>

                {/* Quick specs */}
                <div className="border-t border-dashed border-gray-200 dark:border-white/5 pt-4 space-y-2 mb-6">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-500 dark:text-gray-500">Target Asset</span>
                    <span className="text-gray-800 dark:text-gray-300">{system.targetAsset}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-500 dark:text-gray-500">Leverage</span>
                    <span className="text-gray-800 dark:text-gray-300">{system.recommendedLeverage}</span>
                  </div>
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-gray-500 dark:text-gray-500">Setup</span>
                    <span className="text-gray-800 dark:text-gray-300">{system.setupDifficulty}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <Link href={`/trading-systems/${system.slug}`} className="w-full mt-auto">
                <Button 
                  className="w-full min-h-10 rounded-xl bg-white/90 dark:bg-white/[0.02] border border-gold/30 dark:border-gold/20 hover:border-gold hover:bg-gold hover:text-white dark:hover:bg-gold dark:hover:text-white text-gray-800 dark:text-gray-200 font-extrabold text-xs shadow-sm transition-all duration-300 flex items-center justify-center gap-2"
                >
                  View Details & Parameters
                  <ArrowRight size={12} />
                </Button>
              </Link>
            </div>
          );
        })}
      </div>

      {/* Interactive EA Performance Simulator Sandbox */}
      <div className="mb-16">
        <TradingSystemsSimulator />
      </div>

      {/* Simplified Unlock guide block */}
      <div className="relative rounded-3xl border border-gold/15 dark:border-gold/10 bg-gold/[0.02] p-8 max-w-4xl mx-auto shadow-md">
        <div className="flex items-center gap-2 mb-6 justify-center">
          <ShieldCheck size={18} className="text-gold animate-pulse" />
          <h2 className="text-lg font-black uppercase tracking-wider text-gold">
            How to Unlock & Install
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 relative">
          {UNLOCK_STEPS.map((step, idx) => {
            const StepIcon = step.icon;
            return (
              <div 
                key={step.label}
                className="flex flex-col items-center text-center p-4 bg-white/60 dark:bg-white/[0.02] border border-gray-200/50 dark:border-white/5 rounded-2xl relative"
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold/10 text-gold mb-3">
                  <StepIcon size={18} />
                </div>
                <span className="text-[9px] font-black uppercase tracking-wider text-gray-400 block mb-1">
                  Step {idx + 1}
                </span>
                <h4 className="text-xs font-black text-gray-800 dark:text-gray-200 leading-snug mb-1">
                  {step.label}
                </h4>
                <p className="text-[10px] text-gray-500 dark:text-gray-500 font-semibold leading-relaxed">
                  {step.desc}
                </p>
              </div>
            );
          })}
        </div>

        <p className="text-center mt-6 text-xs font-semibold leading-relaxed text-gray-500 dark:text-gray-500 max-w-xl mx-auto">
          These EAs are not for public download. The licenses are automatically unlocked when you connect an approved trading account under our IB broker network.
        </p>
      </div>
    </TradingSystemsPageShell>
  );
}
