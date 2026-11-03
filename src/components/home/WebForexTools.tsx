import { Wrench, ArrowRight } from "lucide-react";
import { FadeIn } from "@/components/ui/FadeIn";
import Link from "next/link";
import { ALL_TOOLS } from "@/config/tools-data";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { LotSizeMock } from "./tools-previews/LotSizeMock";
import { RiskRewardMock } from "./tools-previews/RiskRewardMock";
import { PipValueMock } from "./tools-previews/PipValueMock";
import { ForexToolCard, type VisualToolConfig } from "./tools/ForexToolCard";

const VISUAL_TOOLS: VisualToolConfig[] = [
    {
        slug: "position-size-calculator",
        Mock: LotSizeMock,
        categoryLabel: "Risk Management",
        highlights: [
            "Account balance & risk % modeling",
            "Standard, mini & micro lot sizing",
            "Calculate exact lots before pressing buy",
        ],
    },
    {
        slug: "risk-reward-calculator",
        Mock: RiskRewardMock,
        categoryLabel: "Trade Visualizer",
        highlights: [
            "Visual TP / SL target price mapping",
            "Automated R:R & break-even win rate",
            "Know your risk math before entry",
        ],
    },
    {
        slug: "pip-value-calculator",
        Mock: PipValueMock,
        categoryLabel: "Valuation Engine",
        highlights: [
            "Live pricing for Forex, Gold & Indices",
            "Exact dollar value per pip movement",
            "Never guess your dollar exposure",
        ],
    },
];

export function WebForexTools() {
    return (
        <div id="tools-preview" className="relative overflow-hidden border-t border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-transparent">
            {/* Dot pattern bg - Gold themed */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <FadeIn delay={0.1} direction="up">
                    <div className="mb-8 flex flex-col items-center">
                        <HomeSectionHeading
                            align="center"
                            title="Know your risk before you enter"
                            highlight="risk"
                            description="Amateur traders guess their position size; professional traders calculate it. Model lot size, pip values, and drawdown odds before taking execution."
                            icon={Wrench}
                        />
                        <div className="mt-3">
                            <Link
                                href="/tools"
                                className="group inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-gold hover:text-amber-500 transition-colors"
                            >
                                <span>View all {ALL_TOOLS.length} tools</span>
                                <ArrowRight
                                    size={13}
                                    className="transition-transform duration-300 group-hover:translate-x-1"
                                />
                            </Link>
                        </div>
                    </div>

                    {/* Premium Tools Grid: Unified Responsive Layout */}
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 md:gap-5 lg:gap-5">
                        {VISUAL_TOOLS.map((tool) => {
                            const fullTool = ALL_TOOLS.find(
                                (t) => t.slug === tool.slug
                            );
                            if (!fullTool) return null;

                            return (
                                <div key={tool.slug} className="h-full">
                                    <ForexToolCard tool={tool} fullTool={fullTool} />
                                </div>
                            );
                        })}
                    </div>
                </FadeIn>
            </section>
        </div>
    );
}
