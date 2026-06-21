import React from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getSystemBySlug } from "@/config/trading-systems-data";
import { TradingSystemsPageShell } from "@/components/trading-systems/TradingSystemsPageShell";
import { TradingSystemsSimulator } from "@/components/trading-systems/TradingSystemsSimulator";
import { TradingSystemsParamsTable } from "@/components/trading-systems/TradingSystemsParamsTable";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { ArrowLeft, Shield, Cpu, HelpCircle, CheckCircle, Lock, UserPlus, KeyRound } from "lucide-react";
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

        <div className="flex flex-col md:flex-row items-start md:items-center gap-6 relative z-10">
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
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed font-semibold max-w-3xl">
              {system.longDescription}
            </p>
          </div>
        </div>
      </div>

      {/* Dynamic Performance & Risk Playground */}
      <div className="mb-8">
        <TradingSystemsSimulator initialSlug={system.slug} />
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8">
        
        {/* Left Column: Strategy Specs, Logic, FAQs */}
        <div className="space-y-8">
          
          {/* Spec Grid */}
          <div className="rounded-3xl border border-gray-200 dark:border-white/5 bg-white/60 dark:bg-[#111318]/30 p-6 shadow-sm">
            <h3 className="text-base font-black text-gray-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Cpu size={16} className="text-gold" />
              Core Specifications
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Target Instrument", value: system.targetAsset },
                { label: "Execution Style", value: system.strategyStyle },
                { label: "Setup Difficulty", value: system.setupDifficulty },
                { label: "Recommended Leverage", value: system.recommendedLeverage },
              ].map((spec) => (
                <div key={spec.label} className="p-3 bg-white/40 dark:bg-[#151822]/40 rounded-xl border border-gray-100 dark:border-white/5">
                  <span className="text-[10px] font-black uppercase text-gray-400 dark:text-gray-500 block mb-1">
                    {spec.label}
                  </span>
                  <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                    {spec.value}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Operational Logic */}
          <div className="rounded-3xl border border-gray-200 dark:border-white/5 bg-white/60 dark:bg-[#111318]/30 p-6 shadow-sm">
            <h3 className="text-base font-black text-gray-800 dark:text-white mb-4 uppercase tracking-wider flex items-center gap-2">
              <Shield size={16} className="text-gold" />
              Operational Logic
            </h3>

            <ul className="space-y-3.5">
              {system.logic.map((item, idx) => (
                <li key={idx} className="flex items-start gap-3">
                  <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[10px] font-bold mt-0.5">
                    {idx + 1}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                    {item}
                  </p>
                </li>
              ))}
            </ul>
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

        {/* Right Column: Parameters Table & CTAs */}
        <div className="space-y-8">
          
          {/* CTA Widget */}
          <div className="rounded-3xl border border-gold/25 dark:border-gold/15 bg-gold/[0.03] dark:bg-gold/[0.01] p-6 shadow-md relative overflow-hidden">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-xl pointer-events-none" />

            <div className="flex items-center gap-2 mb-4">
              <Lock size={16} className="text-gold animate-pulse" />
              <h3 className="text-sm font-black uppercase tracking-wider text-gold">
                Unlock License
              </h3>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed font-semibold mb-6">
              This system is fully compiled and ready to download. You can unlock your MT5 account license key by connecting a verified broker account under our partner network.
            </p>

            {isLoggedIn ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                  <CheckCircle size={16} />
                  <span>You are signed in</span>
                </div>
                <Link href="/dashboard/accounts" className="block w-full">
                  <Button className="w-full min-h-11 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-sm shadow-md transition-all flex items-center justify-center gap-2">
                    <KeyRound size={16} />
                    Link Partner Account
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/auth/signup" className="flex-1">
                  <Button className="w-full min-h-11 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-xs shadow-md transition-all flex items-center justify-center gap-2">
                    <UserPlus size={14} />
                    Register Free
                  </Button>
                </Link>
                <Link href="/auth/login" className="flex-1">
                  <Button variant="outline" className="w-full min-h-11 rounded-xl bg-white/90 dark:bg-white/[0.03] border border-gold/30 dark:border-gold/20 text-gray-800 dark:text-gray-200 font-black text-xs transition-all flex items-center justify-center gap-2">
                    Sign In
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Parameter Table */}
          <TradingSystemsParamsTable parameters={system.parameters} />
        </div>

      </div>
    </TradingSystemsPageShell>
  );
}
