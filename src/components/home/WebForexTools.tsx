import { Wrench, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import { ALL_TOOLS } from "@/config/tools-data";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

// Import custom preview mockups
import { MarketHoursMock } from "./tools-previews/MarketHoursMock";
import { LotSizeMock } from "./tools-previews/LotSizeMock";
import { FibonacciMock } from "./tools-previews/FibonacciMock";
import { MarginMock } from "./tools-previews/MarginMock";
import { CorrelationMock } from "./tools-previews/CorrelationMock";
import { LeverageMock } from "./tools-previews/LeverageMock";

const VISUAL_TOOLS = [
  {
    slug: "market-hours",
    Mock: MarketHoursMock,
  },
  {
    slug: "position-size-calculator",
    Mock: LotSizeMock,
  },
  {
    slug: "fibonacci-calculator",
    Mock: FibonacciMock,
  },
  {
    slug: "margin-calculator",
    Mock: MarginMock,
  },
  {
    slug: "correlation-matrix",
    Mock: CorrelationMock,
  },
  {
    slug: "leverage-calculator",
    Mock: LeverageMock,
  }
];

export function WebForexTools() {
  return (
    <div className="relative overflow-hidden bg-gradient-to-br from-slate-50/50 via-white to-slate-50/50 dark:from-[#0B0E14] dark:via-[#0F1117] dark:to-[#0B0E14] border-t border-gray-200 dark:border-white/10">
      {/* Background dot pattern */}
      <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--cyan-500))_1.2px,transparent_1.2px)] [background-size:40px_40px] opacity-[0.08] dark:opacity-[0.04] pointer-events-none" />

      <section className="py-8 sm:py-12 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <FadeIn delay={0.1} direction="up">
          <HomeSectionHeading
            align="center"
            eyebrow="Free tools"
            title="Trading Calculators"
            highlight="Calculators"
            description="Free pro calculators, live data, and visualizers. No signup required."
            icon={Wrench}
            linkHref="/tools"
            linkText={`View all ${ALL_TOOLS.length} tools`}
            className="mb-10"
          />

          {/* Premium Tools Grid - 3 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {VISUAL_TOOLS.map((tool) => {
              const fullTool = ALL_TOOLS.find((t) => t.slug === tool.slug);
              if (!fullTool) return null;

              return (
                <Link
                  key={tool.slug}
                  href={`/tools/${tool.slug}`}
                  className="group relative flex flex-col p-2.5 rounded-2xl bg-white dark:bg-[#1E2028] shadow-sm hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300 border border-gray-200/80 dark:border-white/5 overflow-hidden h-full justify-between"
                >
                  <div>
                    {/* Visual Preview Half */}
                    <div className="rounded-xl overflow-hidden bg-transparent mb-3.5">
                      <tool.Mock />
                    </div>

                    {/* Info Half */}
                    <div className="px-2 pb-1">
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-6 h-6 rounded-md ${fullTool.iconBg} flex items-center justify-center shrink-0`}>
                          <fullTool.icon size={13} strokeWidth={2} />
                        </div>
                        <h3 className="text-sm font-extrabold text-gray-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                          {fullTool.title}
                        </h3>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-4">
                        {fullTool.description}
                      </p>
                    </div>
                  </div>

                  <div className="px-2 pb-2 flex items-center gap-1.5 text-xs font-bold text-cyan-600 dark:text-cyan-400 group-hover:gap-2.5 transition-all">
                    <span>Open Tool</span>
                    <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform duration-300" />
                  </div>
                </Link>
              );
            })}
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
