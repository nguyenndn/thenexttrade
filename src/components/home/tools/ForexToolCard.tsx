import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import type { ToolData } from "@/config/tools-data";
import type { ComponentType } from "react";

export interface VisualToolConfig {
    slug: string;
    Mock: ComponentType;
    categoryLabel: string;
    highlights: string[];
}

interface ForexToolCardProps {
    tool: VisualToolConfig;
    fullTool: ToolData;
}

export function ForexToolCard({ tool, fullTool }: ForexToolCardProps) {
    const MockComponent = tool.Mock;

    return (
        <Link
            href={`/tools/${tool.slug}`}
            className="group relative flex flex-col md:flex-row lg:flex-col p-4 rounded-xl bg-white dark:bg-[#0D111C] shadow-sm hover:shadow-lg hover:border-gold/50 transition-all duration-300 border border-gray-200 dark:border-white/10 overflow-hidden h-full justify-between items-stretch md:items-center lg:items-stretch gap-3.5 md:gap-6 lg:gap-4"
        >
            {/* Visual Preview Container — Mounted ONCE per tool */}
            <div className="w-full md:w-[46%] lg:w-full lg:max-w-none shrink-0 rounded-lg overflow-hidden bg-transparent">
                <MockComponent />
            </div>

            {/* Info & Metadata */}
            <div className="flex-1 flex flex-col justify-between h-full">
                <div>
                    <div className="flex items-center gap-2.5 mb-2">
                        <div className="w-7 h-7 lg:w-6 lg:h-6 rounded-lg bg-gold/10 text-gold border border-gold/20 flex items-center justify-center shrink-0 shadow-sm">
                            <fullTool.icon size={14} strokeWidth={2} />
                        </div>
                        <div>
                            <span className="block md:block lg:hidden text-[10px] font-bold uppercase tracking-wider text-gold">
                                {tool.categoryLabel}
                            </span>
                            <h3 className="text-sm md:text-base lg:text-sm font-extrabold text-gray-800 dark:text-white group-hover:text-gold transition-colors leading-tight lg:leading-snug">
                                {fullTool.title}
                            </h3>
                        </div>
                    </div>

                    <p className="text-xs md:text-sm lg:text-xs text-gray-500 dark:text-slate-400 font-medium leading-relaxed mb-3 lg:mb-4">
                        {fullTool.description}
                    </p>

                    {/* Highlights (visible on tablet, compact on mobile/desktop) */}
                    <ul className="space-y-1.5 mb-3.5 block lg:hidden">
                        {tool.highlights.map((item) => (
                            <li
                                key={item}
                                className="flex items-center gap-2 text-[11px] md:text-xs font-medium text-gray-600 dark:text-slate-300"
                            >
                                <div className="w-3.5 h-3.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                                    <Check size={9} strokeWidth={3} />
                                </div>
                                <span className="truncate">{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Bottom Action Row */}
                <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-white/10">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 lg:px-0 lg:py-0 rounded-lg text-xs font-bold text-gold bg-gold/10 lg:bg-transparent border border-gold/25 lg:border-none group-hover:gap-2.5 transition-all duration-200">
                        <span>Open Tool</span>
                        <ArrowRight
                            size={12}
                            className="group-hover:translate-x-1 transition-transform duration-200"
                        />
                    </span>
                    <span className="text-[11px] font-mono tabular-nums font-semibold text-gray-400 dark:text-slate-500">
                        100% Free · No login
                    </span>
                </div>
            </div>
        </Link>
    );
}
