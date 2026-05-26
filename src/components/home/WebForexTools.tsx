import { Wrench, ChevronRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import { ALL_TOOLS } from "@/config/tools-data";

export function WebForexTools() {
  return (
    <section className="pt-6 pb-16 relative overflow-hidden bg-gradient-to-br from-slate-50/50 via-white to-slate-50/50 dark:from-[#0B0E14] dark:via-[#0F1117] dark:to-[#0B0E14]">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--cyan-500))_1.2px,transparent_1.2px)] [background-size:32px_32px] opacity-[0.05] dark:opacity-[0.03] pointer-events-none" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn delay={0.1} direction="up">
          {/* Header */}
          <div className="relative flex flex-col items-center text-center max-w-full mb-10 pb-4 border-b border-gray-200/60 dark:border-white/5">
            <h2 className="text-3xl md:text-4xl font-black text-gray-800 dark:text-white mb-2 tracking-tight">
              Trading <span className="text-cyan-600 dark:text-cyan-400">Calculators</span>
            </h2>
            <p className="text-xs text-gray-500 dark:text-slate-400 font-medium">
              Free pro calculators, live data, and visualizers — no signup.
            </p>
            <Link
              href="/tools"
              className="mt-4 sm:mt-0 sm:absolute sm:right-0 sm:top-1/2 sm:-translate-y-1/2 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:opacity-80 transition-colors flex items-center gap-1.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3.5 py-1.5 rounded-lg whitespace-nowrap"
            >
              View all {ALL_TOOLS.length} tools →
            </Link>
          </div>

          {/* Tools Grid — 2 rows x 4 cols, cardless floating design */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {ALL_TOOLS.slice(0, 8).map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="flex items-center gap-3 p-3.5 rounded-2xl bg-white/85 dark:bg-white/[0.03] border border-amber-200/60 dark:border-amber-500/15 hover:border-cyan-300 dark:hover:border-cyan-500/20 hover:shadow-md dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-300 group"
              >
                <div className={`w-9 h-9 rounded-lg ${tool.iconBg} flex items-center justify-center flex-shrink-0 shadow-sm`}>
                  <tool.icon size={16} strokeWidth={2.5} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-base font-bold text-gray-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">{tool.shortTitle}</p>
                  <p className="text-xs text-gray-500 dark:text-slate-400 truncate mt-0.5">{tool.description}</p>
                </div>
                <ChevronRight size={14} className="text-gray-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0 group-hover:translate-x-0.5 transition-transform" />
              </Link>
            ))}
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
