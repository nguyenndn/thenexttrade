"use client";

import Link from "next/link";
import {
 ArrowRight,
 BarChart3,
 CheckCircle2,
 ClipboardCheck,
 CircleHelp,
 Crown,
 Download,
 LineChart,
 NotebookPen,
 ShieldCheck,
 Target,
} from "lucide-react";

const GOLD = "#EAB308";

const launchSteps = [
 {
 label: "Create workspace",
 title: "Sign up and set your trading identity",
 description: "Create a free account, choose your username, and keep your profile lightweight.",
 icon: ShieldCheck,
 },
 {
 label: "Bring trades in",
 title: "Sync with TNT Connect or EA Sync",
 description: "Use the guided setup to choose the sync method that fits your MT5 workflow.",
 icon: Download,
 },
 {
 label: "Review the data",
 title: "Understand what actually happened",
 description: "See win rate, P&L, profit factor, score, symbols, sessions, and trading behavior.",
 icon: BarChart3,
 },
 {
 label: "Improve daily",
 title: "Turn the review into one next action",
 description: "Use missions, daily check-ins, and weekly reviews to keep improvement practical.",
 icon: NotebookPen,
 },
];

const valueCards = [
 {
 title: "No spreadsheet cleanup",
 description: "Sync trades and focus on the review instead of copying rows manually.",
 icon: LineChart,
 },
 {
 title: "Metrics you can explain",
 description: "Every important KPI should be clear enough for a trader to trust.",
 icon: CircleHelp,
 },
 {
 title: "Edge instead of noise",
 description: "The goal is not more dashboards. It is one better decision before the next trade.",
 icon: Target,
 },
];

export function PublicGetStarted() {
 return (
 <div className="relative overflow-hidden bg-[#F7F4EC] text-slate-950 dark:bg-transparent dark:text-white">
 {/* Premium brand background exactly like /about */}
 <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(255,255,255,0.72)_34%,rgba(16,185,129,0.10)_100%)] dark:bg-[linear-gradient(135deg,rgba(43,35,68,0.60)_0%,rgba(25,52,81,0.46)_48%,rgba(6,69,79,0.38)_100%)] pointer-events-none" />

 <section className="relative z-10 px-4 pb-16 pt-28 sm:px-6 lg:px-8">
 <div className="mx-auto max-w-[1180px]">
 <div className="mx-auto max-w-4xl text-center">
 <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/20 bg-white/80 px-4 py-2 text-xs font-black uppercase tracking-[0.18em] text-gold shadow-sm dark:border-gold/30 dark:bg-white/5 dark:text-gold/90">
 <Crown size={15} />
 Start here
 </div>

 <h1 className="text-4xl font-black tracking-tight sm:text-5xl md:text-6xl">
 Build your trading workspace before your next setup.
 </h1>

 <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-slate-700 dark:text-slate-300 sm:text-lg">
 The fastest path is simple: create the account, sync your trades, review the numbers, then improve one behavior at a time.
 </p>

 <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
 <Link
 href="/auth/signup"
 className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-gold to-amber-500 text-white font-black px-8 py-3 text-sm shadow-xl shadow-gold/10 hover:from-amber-500 hover:to-amber-600 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300"
 >
 Start Free
 <ArrowRight size={17} />
 </Link>
 <Link
 href="/auth/login"
 className="inline-flex min-h-12 items-center justify-center rounded-full border border-gold/15 bg-white px-8 py-3 text-sm font-black text-slate-950 shadow-sm transition hover:border-gold/45 hover:bg-gold/5 dark:bg-white/5 dark:text-white dark:hover:bg-white/10"
 >
 I already have an account
 </Link>
 </div>
 </div>

 <div className="mt-12 grid gap-4 lg:grid-cols-4">
 {launchSteps.map((step, index) => {
 const Icon = step.icon;
 return (
 <div
 key={step.title}
 className="rounded-lg border-2 border-gold/10 bg-white/95 p-5 shadow-md shadow-gold/5 backdrop-blur transition-all duration-300 hover:border-gold/30 hover:shadow-lg dark:border-white/[0.06] dark:bg-white/[0.03] dark:hover:border-gold/20"
 >
 <div className="mb-5 flex items-center justify-between">
 <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-gold/10 text-gold ring-1 ring-gold/20 dark:bg-gold/10 dark:text-gold dark:ring-gold/30">
 <Icon size={21} />
 </div>
 <span className="text-xs font-black text-gold">0{index + 1}</span>
 </div>
 <div className="text-[10px] font-black uppercase tracking-[0.16em] text-gold">{step.label}</div>
 <h2 className="mt-2 text-lg font-black text-slate-950 dark:text-white">{step.title}</h2>
 <p className="mt-3 text-sm leading-6 text-slate-600 dark:text-slate-300">{step.description}</p>
 </div>
 );
 })}
 </div>

 <div className="mt-8 grid gap-4 lg:grid-cols-[1.1fr_0.9fr]">
 <div className="rounded-lg border border-gold/10 bg-white p-6 shadow-xl shadow-gold/5 dark:border-white/[0.06] dark:bg-white/[0.03]">
 <div className="flex items-center gap-3">
 <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-gold text-white">
 <ClipboardCheck size={22} />
 </div>
 <div>
 <h2 className="text-xl font-black">What happens after signup?</h2>
 <p className="text-sm text-slate-500 dark:text-slate-300">You will be guided into the exact next step.</p>
 </div>
 </div>

 <div className="mt-6 grid gap-3 sm:grid-cols-3">
 {valueCards.map((card) => {
 const Icon = card.icon;
 return (
 <div key={card.title} className="rounded-lg border border-dashboard bg-slate-50 p-4 dark:bg-white/[0.04]">
 <Icon className="text-gold" size={20} />
 <h3 className="mt-4 text-sm font-black">{card.title}</h3>
 <p className="mt-2 text-xs leading-5 text-slate-500 dark:text-slate-300">{card.description}</p>
 </div>
 );
 })}
 </div>
 </div>

 <div className="rounded-lg border border-gold/30 bg-gradient-to-br from-amber-500/[0.06] to-gold/[0.03] dark:from-gold/[0.04] dark:to-transparent dark:bg-[#0E1118] p-6 text-slate-950 dark:text-white shadow-xl shadow-gold/5 dark:shadow-black/20">
 <div className="text-xs font-black uppercase tracking-[0.18em] text-gold">Recommended path</div>
 <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">TNT Connect first.</h2>
 <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-amber-50/80">
 For most Windows MT5 users, TNT Connect is the easiest way to test the product. EA Sync remains available for advanced MT5 and VPS workflows.
 </p>
 <div className="mt-6 space-y-3">
 {["Create account", "Add MT5 account number", "Generate Sync API key", "Sync first period"].map((item) => (
 <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-white">
 <CheckCircle2 size={17} style={{ color: GOLD }} />
 {item}
 </div>
 ))}
 </div>
 <Link
 href="/auth/signup"
 className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-amber-500 text-white font-black px-5 py-3 text-sm transition-all duration-300 hover:from-amber-500 hover:to-amber-600 hover:scale-[1.01]"
 >
 Set up my workspace
 <ArrowRight size={16} />
 </Link>
 </div>
 </div>
 </div>
 </section>
 </div>
 );
}
