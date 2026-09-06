import { Wrench, ArrowRight, Check } from "lucide-react";
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
        <div className="relative overflow-hidden border-t border-dashboard bg-gray-50/50 dark:bg-transparent">
            {/* Dot pattern bg - same as Quote/Reviews section but Gold themed */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />

            <section className="py-6 sm:py-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <FadeIn delay={0.1} direction="up">
                    <div className="mb-8 flex flex-col items-center">
                        <HomeSectionHeading
                            align="center"
                            title="Institutional Risk Calculators"
                            highlight="Risk Calculators"
                            description="Know your exact dollar risk and pip valuation before entering the market. 100% free, zero signup."
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

                    {/* Premium Tools Grid:
                        - Mobile: 1-column cards
                        - Tablet: 1 horizontal card per row (md:grid-cols-1)
                        - PC: 3-column original cards (lg:grid-cols-3 gap-5)
                    */}
                    <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-6 md:gap-5 lg:gap-5">
                        {VISUAL_TOOLS.map((tool) => {
                            const fullTool = ALL_TOOLS.find(
                                (t) => t.slug === tool.slug
                            );
                            if (!fullTool) return null;

                            return (
                                <div key={tool.slug} className="h-full">
                                    {/* Desktop View (PC: lg+) — Exact original design as requested */}
                                    <Link
                                        href={`/tools/${tool.slug}`}
                                        className="hidden lg:flex group relative flex-col p-2.5 rounded-xl bg-white dark:bg-card shadow-sm hover:shadow-lg hover:border-cyan-500/30 transition-all duration-300 border border-gray-200/80 dark:border-white/10 overflow-hidden h-full justify-between"
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

                                    {/* Tablet & Mobile View (< lg) — Horizontal layout on tablet, vertical on mobile */}
                                    <Link
                                        href={`/tools/${tool.slug}`}
                                        className="flex lg:hidden group relative flex-col md:flex-row p-2.5 md:p-3.5 rounded-2xl bg-white dark:bg-card shadow-sm hover:shadow-lg hover:border-gold/40 transition-all duration-300 border border-gray-200/80 dark:border-white/10 overflow-hidden h-full justify-between items-stretch md:items-center gap-3 md:gap-6"
                                    >
                                        {/* Visual Preview Half */}
                                        <div className="w-full md:w-[46%] md:max-w-xs shrink-0 rounded-xl overflow-hidden bg-transparent mb-0">
                                            <tool.Mock />
                                        </div>

                                        {/* Info Half */}
                                        <div className="flex-1 flex flex-col justify-between px-2 md:px-2 pb-1 h-full py-0.5">
                                            <div>
                                                <div className="flex items-center gap-2.5 mb-2">
                                                    <div
                                                        className={`w-7 h-7 rounded-lg ${fullTool.iconBg} flex items-center justify-center shrink-0 shadow-sm`}
                                                    >
                                                        <fullTool.icon
                                                            size={14}
                                                            strokeWidth={2}
                                                        />
                                                    </div>
                                                    <div>
                                                        <span className="block text-[10px] font-bold uppercase tracking-wider text-gold">
                                                            {tool.categoryLabel}
                                                        </span>
                                                        <h3 className="text-sm md:text-base font-extrabold text-gray-800 dark:text-white group-hover:text-gold transition-colors leading-tight">
                                                            {fullTool.title}
                                                        </h3>
                                                    </div>
                                                </div>
                                                <p className="text-xs md:text-sm text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-3">
                                                    {fullTool.description}
                                                </p>

                                                {/* Feature Highlights */}
                                                <ul className="space-y-1.5 mb-3.5">
                                                    {tool.highlights.map((item) => (
                                                        <li
                                                            key={item}
                                                            className="flex items-center gap-2 text-[11px] md:text-xs font-medium text-gray-600 dark:text-slate-300"
                                                        >
                                                            <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                                                <Check
                                                                    size={9}
                                                                    strokeWidth={3}
                                                                />
                                                            </div>
                                                            <span className="truncate">
                                                                {item}
                                                            </span>
                                                        </li>
                                                    ))}
                                                </ul>
                                            </div>

                                            {/* Bottom Action Row */}
                                            <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-white/5">
                                                <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-gold bg-gold/10 border border-gold/25 group-hover:bg-gold group-hover:text-white group-hover:border-gold transition-all duration-200">
                                                    <span>Launch Tool</span>
                                                    <ArrowRight
                                                        size={12}
                                                        className="group-hover:translate-x-1 transition-transform duration-200"
                                                    />
                                                </span>
                                                <span className="text-[11px] font-semibold text-gray-400 dark:text-slate-500">
                                                    100% Free · No login
                                                </span>
                                            </div>
                                        </div>
                                    </Link>
                                </div>
                            );
                        })}
                    </div>
                </FadeIn>
            </section>
        </div>
    );
}
