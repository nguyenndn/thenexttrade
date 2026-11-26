import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { TradingSystemItem } from "./mt5-suite-data";

interface MT5SystemCardProps {
    item: TradingSystemItem;
}

/**
 * Interactive card linking directly from the homepage MT5 Systems grid
 * to a system's canonical detail page.
 */
export function MT5SystemCard({ item }: MT5SystemCardProps) {
    const Icon = item.icon;

    return (
        <Link
            href={item.href}
            className="group relative flex flex-col justify-between h-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#0D111C] p-5 shadow-sm hover:border-gold/50 hover:shadow-md transition-all duration-300"
        >
            <div>
                <div className="flex items-center justify-between gap-2">
                    <div
                        className={`h-9 w-9 rounded-lg border flex items-center justify-center shrink-0 transition-transform duration-300 group-hover:scale-105 ${item.iconColor}`}
                    >
                        <Icon size={17} strokeWidth={2} aria-hidden="true" />
                    </div>
                    <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border whitespace-nowrap ${item.tagColor}`}
                    >
                        {item.tag}
                    </span>
                </div>

                <h3 className="text-sm sm:text-base font-black text-gray-900 dark:text-white group-hover:text-gold transition-colors mt-3.5 mb-1.5">
                    {item.title}
                </h3>

                <p className="text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                    {item.desc}
                </p>
            </div>

            <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-gold group-hover:gap-2 transition-all duration-200">
                    <span>View System</span>
                    <ArrowRight
                        size={12}
                        className="group-hover:translate-x-0.5 transition-transform duration-200"
                        aria-hidden="true"
                    />
                </span>
                <span className="text-[11px] tabular-nums font-semibold text-gray-400 dark:text-slate-500">
                    MT5 · $0 Fee
                </span>
            </div>
        </Link>
    );
}
