import Link from "next/link";
import { ArrowRight, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function AboutUsSection() {
  return (
    <div className="relative overflow-hidden border-y border-amber-200/70 bg-white">
      {/* Background decorative grids and gradients */}
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:56px_56px]" />
      <div className="absolute inset-0 pointer-events-none bg-[linear-gradient(118deg,rgba(245,158,11,0.12)_0%,rgba(255,251,235,0.82)_24%,transparent_48%,rgba(20,184,166,0.08)_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-amber-400/70 to-transparent" />

      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16">
        <div className="relative overflow-hidden rounded-[28px] border border-amber-300/70 bg-white/90 p-6 sm:p-8 lg:p-10 shadow-[0_26px_70px_rgba(120,72,0,0.12)]">
          {/* Top highlight bar */}
          <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-amber-500 via-yellow-300 to-emerald-400" />
          
          {/* Main Layout: Horizontal layout on desktop */}
          <div className="flex flex-col lg:flex-row lg:items-center gap-8 xl:gap-12 justify-between">
            
            {/* Left Column: Story text and header */}
            <div className="flex-1 min-w-0">
              <div className="mb-2.5 inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.25em] text-amber-600 dark:text-gold/90 select-none">
                <Sparkles size={11} className="opacity-80 text-amber-600 dark:text-gold/90" />
                Founder note
              </div>

              <h2 className="mt-6 text-3xl sm:text-4xl font-black tracking-tight text-gray-900 leading-tight">
                Built from losses,
                <span className="block text-amber-500">rebuilt into a system.</span>
              </h2>

              <p className="mt-6 text-sm sm:text-base leading-7 text-gray-650 max-w-xl">
                After years of losses, scattered learning, and chasing shortcuts, I built TheNextTrade as a practical
                trading workspace: sync your trades, review what happened, and turn each week into one clear next action.
              </p>
            </div>

            {/* Right Column: Quote panel and CTA Buttons */}
            <div className="flex-shrink-0 flex flex-col gap-5 w-full lg:w-[480px]">
              {/* Quote block */}
              <div className="relative rounded-2xl border border-amber-200 bg-amber-50/70 p-5">
                <Quote size={18} className="absolute -top-2 left-4 text-amber-500" />
                <p className="pl-3 text-sm leading-relaxed text-gray-700 italic">
                  From hard lessons to building the tools every trader deserves.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row lg:flex-col gap-3 w-full">
                <Link href="/about" className="flex-1 lg:w-full">
                  <Button className="w-full min-h-11 rounded-xl bg-amber-500 px-5 text-sm font-black text-white hover:bg-amber-600 shadow-[0_14px_30px_rgba(245,158,11,0.22)] flex items-center justify-center animate-btn-shine">
                    Read My Story <ArrowRight size={16} className="ml-1" />
                  </Button>
                </Link>
                <Link
                  href="/auth/signup?source=about-brand-story"
                  className="flex-1 lg:w-full inline-flex min-h-11 items-center justify-center rounded-xl border border-amber-200 bg-white px-5 text-sm font-extrabold text-gray-800 transition-colors hover:border-amber-400 hover:text-amber-600 text-center"
                >
                  Start Free Journal
                </Link>
              </div>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
