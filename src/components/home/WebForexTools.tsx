import { Wrench } from "lucide-react";
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
    shortTitle: "Market Hours",
    description: "See which forex markets and stock exchanges are currently open. Times shown in your timezone."
  },
  {
    slug: "position-size-calculator",
    Mock: LotSizeMock,
    shortTitle: "Lot Size Optimizer",
    description: "Find the optimal trade volume for your account size and risk tolerance."
  },
  {
    slug: "fibonacci-calculator",
    Mock: FibonacciMock,
    shortTitle: "Fibonacci Calculator",
    description: "Calculate Fibonacci retracement and extension levels for price action."
  },
  {
    slug: "margin-calculator",
    Mock: MarginMock,
    shortTitle: "Margin Calculator",
    description: "Calculate the required margin to open a leveraged forex position."
  },
  {
    slug: "correlation-matrix",
    Mock: CorrelationMock,
    shortTitle: "Correlation Matrix",
    description: "See how currency pairs move together. Use correlations to diversify risk and find opportunities."
  },
  {
    slug: "leverage-calculator",
    Mock: LeverageMock,
    shortTitle: "Leverage Calculator",
    description: "Understand your leverage exposure and calculate effective ratio."
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
            {VISUAL_TOOLS.map((tool) => (
              <Link
                key={tool.slug}
                href={`/tools/${tool.slug}`}
                className="group relative bg-white dark:bg-[#1E2028] rounded-2xl p-2.5 shadow-sm hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300 border border-gray-200/80 dark:border-white/5 flex flex-col gap-4 overflow-hidden"
              >
                {/* Visual Preview Half */}
                <div className="rounded-xl overflow-hidden bg-transparent">
                  <tool.Mock />
                </div>

                {/* Info Half */}
                <div className="px-1.5 pb-2 flex-1 flex flex-col">
                  <h3 className="text-base font-extrabold text-gray-800 dark:text-white group-hover:text-cyan-600 dark:group-hover:text-cyan-400 transition-colors leading-snug">
                    {tool.shortTitle}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mt-1.5">
                    {tool.description}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </FadeIn>
      </section>
    </div>
  );
}
