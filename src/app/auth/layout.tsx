import { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, BarChart3, Brain, ShieldCheck, Sparkles } from "lucide-react";
import { ThemeToggleSwitch } from "@/components/ui/ThemeToggleSwitch";

export const metadata: Metadata = {
  title: {
    template: "%s | TheNextTrade",
    default: "Authentication | TheNextTrade",
  },
  description: "Sign in or create an account to access TheNextTrade tools, academy, and journal.",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const features = [
    {
      title: "Decision Edge",
      description: "See the habits behind every win, loss, and missed setup.",
      icon: BarChart3,
      tone: "text-emerald-500 bg-emerald-500/10 border-emerald-500/15",
    },
    {
      title: "Psychology Control",
      description: "Build discipline with cleaner reviews and focused routines.",
      icon: Brain,
      tone: "text-amber-500 bg-amber-500/10 border-amber-500/20",
    },
    {
      title: "Secure Trader Hub",
      description: "Track accounts, journals, and progress in one protected space.",
      icon: ShieldCheck,
      tone: "text-slate-700 bg-slate-900/5 border-slate-900/10 dark:text-slate-200 dark:bg-white/[0.08] dark:border-white/10",
    },
  ];

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-[#F7F4EC] text-slate-800 dark:bg-[#090805] dark:text-white p-4 font-outfit relative overflow-hidden transition-colors duration-300">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(255,255,255,0.72)_34%,rgba(16,185,129,0.10)_100%)] dark:bg-[linear-gradient(135deg,rgba(180,118,26,0.20)_0%,rgba(9,8,5,0.92)_42%,rgba(16,185,129,0.08)_100%)]" />

      <div className="relative z-10 flex w-full max-w-7xl items-center justify-center gap-10 lg:justify-between lg:gap-16">

        {/* LEFT: Form Section */}
        <div className="w-full lg:w-[480px] shrink-0">
          <div className="flex flex-row items-center justify-between gap-4 py-4">
            <Link 
              href="/" 
              className="group inline-flex items-center gap-2 rounded-full border border-amber-900/10 bg-white/60 px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm shadow-amber-900/5 backdrop-blur hover:border-amber-500/35 hover:text-slate-950 dark:border-white/10 dark:bg-white/[0.06] dark:text-slate-300 dark:hover:border-amber-300/35 dark:hover:text-white transition-colors"
            >
              <ArrowLeft size={16} className="transition-transform group-hover:-translate-x-1" />
              <span>Back to Home</span>
            </Link>
            <div className="flex items-center gap-4">
              <ThemeToggleSwitch />
            </div>
          </div>
          {children}
        </div>

        {/* RIGHT: Content/Features (Hidden on mobile) */}
        <div className="hidden lg:flex flex-1 flex-col max-w-2xl">
          <div className="mb-8 inline-flex w-fit items-center gap-2 rounded-full border border-amber-500/25 bg-white/55 px-4 py-2 text-sm font-bold text-amber-700 shadow-sm shadow-amber-900/5 backdrop-blur dark:bg-white/[0.06] dark:text-amber-300">
            <Sparkles size={16} />
            Premium trading command center
          </div>

          <h2 className="whitespace-nowrap text-[42px] font-black leading-[1.08] tracking-normal text-slate-950 dark:text-white">
            Build Your Trading{" "}
            <span className="bg-[linear-gradient(90deg,#B7791F,#F7C948,#10B981)] bg-clip-text text-transparent">
              Edge
            </span>
          </h2>
          <p className="mt-6 max-w-lg text-lg leading-8 text-slate-600 dark:text-slate-300">
            Stop guessing and start improving with a focused space for journaling, psychology, account tracking, and strategy review.
          </p>

          <div className="mt-10 flex flex-col gap-4">
            {features.map((feature) => {
              const Icon = feature.icon;

              return (
                <div
                  key={feature.title}
                  className="group flex items-center gap-5 rounded-lg border border-white/70 bg-white/70 p-5 shadow-[0_18px_60px_rgba(88,64,27,0.10)] backdrop-blur transition-all hover:-translate-y-0.5 hover:border-amber-400/40 hover:bg-white/85 dark:border-white/10 dark:bg-white/[0.06] dark:shadow-none dark:hover:border-amber-300/25"
                >
                  <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border ${feature.tone}`}>
                    <Icon size={24} />
                  </div>
                  <div>
                    <h3 className="text-lg font-extrabold text-slate-900 dark:text-white">{feature.title}</h3>
                    <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-300">{feature.description}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="mt-8 grid min-h-[96px] grid-cols-3 overflow-hidden rounded-lg border border-amber-900/10 bg-white/75 text-center text-slate-900 shadow-[0_24px_80px_rgba(88,64,27,0.12)] backdrop-blur dark:border-amber-300/15 dark:bg-slate-950 dark:text-white dark:shadow-[0_24px_80px_rgba(0,0,0,0.35)]">
            <div className="flex flex-col items-center justify-center border-r border-amber-900/10 px-5 py-4 dark:border-white/10">
              <p className="text-2xl font-black text-amber-600 dark:text-amber-300">24/7</p>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Journal access</p>
            </div>
            <div className="flex flex-col items-center justify-center border-r border-amber-900/10 px-5 py-4 dark:border-white/10">
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-300">Edge</p>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Progress system</p>
            </div>
            <div className="flex flex-col items-center justify-center px-5 py-4">
              <p className="text-2xl font-black text-amber-600 dark:text-amber-300">Pro</p>
              <p className="mt-1 text-xs font-semibold text-slate-600 dark:text-slate-300">Tools ready</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
