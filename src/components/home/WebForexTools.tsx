import { Wrench, ChevronRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import { ALL_TOOLS } from "@/config/tools-data";

export function WebForexTools() {
  return (
    <section className="py-8 relative overflow-hidden border-t border-gray-200 dark:border-white/10 bg-gradient-to-br from-slate-50/80 via-gray-50/50 to-slate-50/60 dark:from-[#0B0E14] dark:via-[#0F1117] dark:to-[#0B0E14]">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2]" />

      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn delay={0.1} direction="up">
          {/* Card */}
          <div className="relative rounded-2xl overflow-hidden shadow-lg dark:shadow-2xl dark:shadow-black/20">
            {/* Gradient top border */}
            <div className="h-1 bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400" />

            <div className="bg-white dark:bg-[#1a1f2e] p-4 sm:p-5">
              {/* Header */}
              <div className="flex items-start justify-between gap-3 mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-cyan-100 dark:bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 flex items-center justify-center">
                    <Wrench size={20} strokeWidth={2.5} />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-800 dark:text-white">Web Forex <span className="text-cyan-600 dark:text-cyan-400">Tools</span></h2>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Free pro calculators, live data, and visualizers — no signup.</p>
                  </div>
                </div>
                <Link
                  href="/tools"
                  className="text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:opacity-80 transition-colors flex items-center gap-1 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1.5 rounded-lg whitespace-nowrap flex-shrink-0"
                >
                  View all {ALL_TOOLS.length} tools →
                </Link>
              </div>

              {/* Tools Grid — 2 rows x 4 cols */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
                {ALL_TOOLS.slice(0, 8).map((tool) => (
                  <Link
                    key={tool.slug}
                    href={`/tools/${tool.slug}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.04] border border-gray-100 dark:border-white/[0.06] hover:border-cyan-300 dark:hover:border-cyan-500/30 hover:shadow-md dark:hover:shadow-none hover:-translate-y-0.5 transition-all duration-200 group"
                  >
                    <div className={`w-9 h-9 rounded-lg ${tool.iconBg} flex items-center justify-center flex-shrink-0`}>
                      <tool.icon size={16} strokeWidth={2.5} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors truncate">{tool.shortTitle}</p>
                      <p className="text-[10px] text-gray-500 dark:text-slate-500 truncate">{tool.description}</p>
                    </div>
                    <ChevronRight size={14} className="text-gray-400 dark:text-slate-600 group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors flex-shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </FadeIn>
      </div>
    </section>
  );
}
