"use client";

import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Zap,
  Brain,
  Gamepad2,
  BarChart3,
  MonitorSmartphone,
  RefreshCw,
  TrendingUp,
  Check,
  X,
  Sparkles,
  ChevronRight,
} from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";

/* ------------------------------------------------------------------ */
/*  BENEFITS                                                           */
/* ------------------------------------------------------------------ */
const BENEFITS = [
  {
    icon: Zap,
    title: "Auto Sync",
    description: "Connect MT5 once — trades flow in automatically. No manual entry, no missed trades.",
    gradient: "from-amber-500 to-orange-500",
  },
  {
    icon: Brain,
    title: "AI Reports",
    description: "Weekly AI-generated reviews with actionable insights. Spot patterns you can't see manually.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    icon: Gamepad2,
    title: "Gamified Missions",
    description: "Earn XP, climb the leaderboard and unlock badges. Make self-improvement addictive.",
    gradient: "from-purple-500 to-pink-500",
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    description: "Win rate, P&L, risk metrics, profit factor and trade calendar. Know your numbers.",
    gradient: "from-primary to-[#00A570]",
  },
];

/* ------------------------------------------------------------------ */
/*  HOW IT WORKS                                                       */
/* ------------------------------------------------------------------ */
const STEPS = [
  {
    step: 1,
    icon: MonitorSmartphone,
    title: "Connect Your Account",
    description: "Add your MT5 account in 60 seconds. Download TNT Connect or attach our EA.",
    gradient: "from-blue-500 to-cyan-500",
  },
  {
    step: 2,
    icon: RefreshCw,
    title: "Auto-Sync Your Trades",
    description: "Every trade is imported automatically in real-time. No manual entry needed.",
    gradient: "from-primary to-[#00A570]",
  },
  {
    step: 3,
    icon: TrendingUp,
    title: "Get Insights & Improve",
    description: "AI reports, metrics and gamified missions guide you to better trading habits.",
    gradient: "from-amber-500 to-orange-500",
  },
];

/* ------------------------------------------------------------------ */
/*  PRICING                                                            */
/* ------------------------------------------------------------------ */
const FREE_FEATURES = [
  { name: "1 Trading Account", ok: true },
  { name: "Basic Dashboard", ok: true },
  { name: "Trade Journal", ok: true },
  { name: "Leaderboard Access", ok: true },
  { name: "AI Reports", ok: false },
  { name: "Missions & XP", ok: false },
];
const PRO_FEATURES = [
  { name: "Unlimited Accounts", ok: true },
  { name: "Full Dashboard", ok: true },
  { name: "Trade Journal", ok: true },
  { name: "Leaderboard Access", ok: true },
  { name: "AI Reports", ok: true },
  { name: "Missions & XP", ok: true },
];

/* ================================================================== */
/*  COMPONENT                                                          */
/* ================================================================== */
export function PublicGetStarted() {
  return (
    <>
      {/* ─── Hero ─── */}
      <section className="relative pt-28 pb-20 md:pt-36 md:pb-28 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.06] dark:opacity-[0.08]" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[150px] pointer-events-none" />

        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeIn delay={0.1}>
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/5 dark:bg-primary/10 border border-primary/20 text-xs font-bold text-primary uppercase tracking-wider mb-6">
              <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
              Free Trading Journal
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-gray-900 dark:text-white tracking-tight leading-[1.1] mb-6">
              Track.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00A570]">Analyze.</span>{" "}
              Improve.
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto mb-8 leading-relaxed">
              The all-in-one trading journal that auto-syncs your MT5 trades, generates AI reports, and turns improvement into a game.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/auth/signup"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gradient-to-r from-primary to-[#00A570] text-white text-base font-black rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transform hover:scale-[1.02] transition-all duration-300 group"
              >
                Start Free <ArrowRight size={18} strokeWidth={3} className="group-hover:translate-x-0.5 transition-transform" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 text-base font-bold rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all"
              >
                See How It Works <ChevronDown size={16} />
              </a>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ─── Benefits ─── */}
      <section className="py-20 border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-[1100px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white text-center mb-14">
              Everything you need to{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00A570]">trade better</span>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {BENEFITS.map((b, i) => {
              const Icon = b.icon;
              return (
                <FadeIn key={b.title} delay={0.1 + i * 0.1} direction="up">
                  <div className="group p-6 rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02] hover:shadow-lg hover:-translate-y-1 transition-all duration-300">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${b.gradient} flex items-center justify-center mb-4 shadow-sm`}>
                      <Icon size={22} className="text-white" strokeWidth={2.5} />
                    </div>
                    <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2">{b.title}</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{b.description}</p>
                  </div>
                </FadeIn>
              );
            })}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section id="how-it-works" className="py-20 bg-gray-50/50 dark:bg-[#0F1117] border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-[1000px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white text-center mb-14">
              Up and running in{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00A570]">3 simple steps</span>
            </h2>
          </FadeIn>

          <div className="relative">
            <div className="hidden md:block absolute top-14 left-[16.67%] right-[16.67%] h-[2px] bg-gradient-to-r from-blue-500/30 via-primary/30 to-amber-500/30" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <FadeIn key={s.step} delay={0.1 + i * 0.15} direction="up">
                    <div className="flex flex-col items-center text-center">
                      <div className={`relative w-24 h-24 rounded-2xl bg-gradient-to-br ${s.gradient} flex items-center justify-center mb-6 shadow-lg`}>
                        <Icon size={36} className="text-white" strokeWidth={2} />
                        <div className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white dark:bg-[#0B0E14] border-2 border-gray-200 dark:border-white/20 flex items-center justify-center text-xs font-black text-gray-700 dark:text-white">
                          {s.step}
                        </div>
                      </div>
                      <h3 className="text-lg font-black text-gray-800 dark:text-white mb-2">{s.title}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 leading-relaxed max-w-[260px]">{s.description}</p>
                    </div>
                  </FadeIn>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-20 border-t border-gray-200 dark:border-white/[0.06]">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn delay={0.1}>
            <h2 className="text-3xl md:text-4xl font-black text-gray-900 dark:text-white text-center mb-4">Simple, transparent pricing</h2>
            <p className="text-base text-gray-500 dark:text-gray-400 text-center max-w-lg mx-auto mb-14">
              Start free. Upgrade to Pro by trading with our partner brokers — no credit card needed.
            </p>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Free */}
            <FadeIn delay={0.1} direction="up">
              <div className="rounded-2xl p-8 border border-gray-200 dark:border-white/10 bg-white dark:bg-white/[0.02]">
                <h3 className="text-lg font-black text-gray-800 dark:text-white mb-1">Free</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">$0</span>
                  <span className="text-sm text-gray-400">/ forever</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Get started with the essentials.</p>
                <ul className="space-y-3 mb-8">
                  {FREE_FEATURES.map((f) => (
                    <li key={f.name} className="flex items-center gap-2.5">
                      {f.ok ? <Check size={14} className="text-primary shrink-0" strokeWidth={3} /> : <X size={14} className="text-gray-300 dark:text-gray-600 shrink-0" strokeWidth={2} />}
                      <span className={`text-sm ${f.ok ? "text-gray-700 dark:text-gray-300 font-medium" : "text-gray-400 dark:text-gray-600"}`}>{f.name}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/auth/signup" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 transition-all group">
                  Start Free <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </FadeIn>
            {/* Pro */}
            <FadeIn delay={0.2} direction="up">
              <div className="relative rounded-2xl p-8 bg-gradient-to-b from-primary/5 to-primary/0 dark:from-primary/10 dark:to-primary/0 border border-primary/30 shadow-lg shadow-primary/5">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 px-3 py-1 rounded-full bg-primary text-white text-[10px] font-black uppercase tracking-wider">
                  <Sparkles size={10} /> Most Popular
                </div>
                <h3 className="text-lg font-black text-gray-800 dark:text-white mb-1">Pro</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">Free</span>
                  <span className="text-sm text-gray-400">/ via partner brokers</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Trade with our partners and unlock Pro automatically.</p>
                <ul className="space-y-3 mb-8">
                  {PRO_FEATURES.map((f) => (
                    <li key={f.name} className="flex items-center gap-2.5">
                      <Check size={14} className="text-primary shrink-0" strokeWidth={3} />
                      <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{f.name}</span>
                    </li>
                  ))}
                </ul>
                <Link href="/brokers" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-bold bg-primary text-white hover:bg-primary/90 shadow-md shadow-primary/20 transition-all group">
                  Learn How to Get Pro <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-20 relative overflow-hidden bg-gradient-to-b from-[#0B0E14] to-[#0d1117]">
        <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.08]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
        <div className="max-w-[700px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
          <FadeIn delay={0.1}>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-black text-white mb-4 leading-tight">
              Start your trading journal today<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-[#00A570]">— it&apos;s free</span>
            </h2>
            <p className="text-base md:text-lg text-gray-400 mb-8 max-w-lg mx-auto">
              Join traders who are already improving their performance with AI-powered insights.
            </p>
            <Link
              href="/auth/signup"
              className="inline-flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-primary to-[#00A570] text-white text-lg font-black rounded-xl shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/35 transform hover:scale-[1.03] transition-all duration-300 group"
            >
              Create Free Account <ArrowRight size={20} strokeWidth={3} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <p className="mt-4 text-xs text-gray-500">No credit card required · Free forever · Upgrade anytime</p>
          </FadeIn>
        </div>
      </section>
    </>
  );
}
