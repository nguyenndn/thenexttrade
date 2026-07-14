"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button-variants";
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
    title: "Initialize Your Free Account",
    description: "Create your secure workspace in seconds, select your username, and keep your profile lightweight.",
    icon: ShieldCheck,
  },
  {
    label: "Bring trades in",
    title: "Link Trade Manager EA",
    description: "Deploy our lightweight Expert Advisor on your MT5 terminal to sync execution history in real-time.",
    icon: Download,
  },
  {
    label: "Review the data",
    title: "Extract Your Real Performance",
    description: "Uncover patterns in your win rate, drawdown, sessions, and behavior without manual calculations.",
    icon: BarChart3,
  },
  {
    label: "Improve daily",
    title: "Gamify Your Trading Discipline",
    description: "Turn metrics into habits. Use missions, rule checklists, and bias tracking to eliminate costly errors.",
    icon: NotebookPen,
  },
];

const valueCards = [
  {
    title: "100% Automated Sync",
    description: "Forget tedious Excel sheets. The moment you close a position on MT5, it is instantly analyzed.",
    icon: LineChart,
  },
  {
    title: "Psychology & Bias Logs",
    description: "Track your emotions. Detect revenge trading, FOMO, and loss aversion patterns automatically.",
    icon: CircleHelp,
  },
  {
    title: "Edge instead of noise",
    description: "We don't just show charts. We help you make one better decision before your next setup.",
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
 Your Trading Edge, Fully Automated.
 </h1>

 <p className="mx-auto mt-5 max-w-2xl text-base font-medium leading-8 text-slate-700 dark:text-slate-300 sm:text-lg">
 Connect your MT5 terminal in 60 seconds. Stop wasting time on manual spreadsheets, and start tracking your real execution edge.
 </p>

 <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
 <Link href="/auth/register" className={cn(buttonVariants({ variant: "primary", size: "smd" }), "w-full rounded-lg bg-gradient-to-r from-gold to-amber-500 hover:from-amber-500 hover:to-amber-600 border-none")}>
 Open Free Workspace
 <ArrowRight size={16} className="ml-1" />
 </Link>
 <Link href="/auth/login" className={cn(buttonVariants({ variant: "outline", size: "smd" }), "w-full rounded-lg border-dashboard hover:border-gold hover:bg-gold/5 dark:hover:bg-white/10")}>
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
 <h2 className="mt-3 text-3xl font-black text-slate-950 dark:text-white">Trade Manager EA.</h2>
 <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-amber-50/80">
 The easiest, safest way to link MetaTrader 5. It runs quietly on your chart or VPS, pushing closed positions to your secure dashboard in real time.
 </p>
 <div className="mt-6 space-y-3">
 {["Create secure account", "Add MT5 account number", "Generate Sync API key", "Deploy the EA & sync instantly"].map((item) => (
 <div key={item} className="flex items-center gap-3 text-sm font-bold text-slate-800 dark:text-white">
 <CheckCircle2 size={17} style={{ color: GOLD }} />
 {item}
 </div>
 ))}
 </div>
 <Link
 href="/auth/register"
 className="mt-7 inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-gold to-amber-500 text-white font-black px-5 py-3 text-sm transition-all duration-300 hover:from-amber-500 hover:to-amber-600 hover:scale-[1.01]"
 >
 Start Workspace Setup
 <ArrowRight size={16} />
 </Link>
 </div>
 </div>
 </div>
 </section>
 </div>
 );
}
