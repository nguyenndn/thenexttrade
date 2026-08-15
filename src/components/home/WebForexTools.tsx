import { Wrench, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import { ALL_TOOLS } from "@/config/tools-data";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";

// Import custom preview mockups
import { LotSizeMock } from "./tools-previews/LotSizeMock";
import { RiskRewardMock } from "./tools-previews/RiskRewardMock";
import { PipValueMock } from "./tools-previews/PipValueMock";

const VISUAL_TOOLS = [
    {
        slug: "position-size-calculator",
        Mock: LotSizeMock,
    },
    {
        slug: "risk-reward-calculator",
        Mock: RiskRewardMock,
    },
    {
        slug: "pip-value-calculator",
        Mock: PipValueMock,
    },
];

export function WebForexTools() {
    return (
        <div className="relative overflow-hidden border-t border-dashboard bg-gray-50/50 dark:bg-transparent">
            {/* Dot pattern bg - same as Quote/Reviews section but Gold themed */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />

            <section className="py-6 sm:py-8 max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <FadeIn delay={0.1} direction="up">
                    <HomeSectionHeading
                        align="center"
                        title="Trading Calculators"
                        highlight="Calculators"
                        description="Free pro calculators, live data, and visualizers. No signup required."
                        icon={Wrench}
                        className="mb-8"
                    />

                    {/* Premium Tools Grid - 3 Columns */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {VISUAL_TOOLS.map((tool) => {
                            const fullTool = ALL_TOOLS.find(
                                (t) => t.slug === tool.slug
                            );
                            if (!fullTool) return null;

                            return (
                                <Link
                                    key={tool.slug}
                                    href={`/tools/${tool.slug}`}
                                    className="group relative flex flex-col p-2.5 rounded-xl bg-white dark:bg-card shadow-sm hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300 border border-gray-200/80 dark:border-white/10 overflow-hidden h-full justify-between"
                                >
                                    <div>
                                        {/* Visual Preview Half */}
                                        <div className="rounded-xl overflow-hidden bg-transparent mb-3.5">
                                            <tool.Mock />
                                        </div>

                                        {/* Info Half */}
                                        <div className="px-2 pb-1">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className={`w-6 h-6 rounded-lg ${fullTool.iconBg} flex items-center justify-center shrink-0`}
                                                >
                                                    <fullTool.icon
                                                        size={13}
                                                        strokeWidth={2}
                                                    />
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
                                        <ArrowRight
                                            size={12}
                                            className="group-hover:translate-x-0.5 transition-transform duration-300"
                                        />
                                    </div>
                                </Link>
                            );
                        })}
                    </div>

                    {/* Centered Link - unified for all devices */}
                    <div className="mt-8 flex justify-center sm:mt-10">
                        <Link
                            href="/tools"
                            className="group inline-flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-gold transition-colors duration-300 hover:text-amber-600 dark:hover:text-amber-300"
                        >
                            View all {ALL_TOOLS.length} tools
                            <ArrowRight
                                size={13}
                                className="transition-transform duration-300 group-hover:translate-x-1"
                            />
                        </Link>
                    </div>
                </FadeIn>
            </section>
        </div>
    );
}
