import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Bot } from "lucide-react";

import { buttonVariants } from "@/components/ui/button-variants";

export interface TradingSystemCardData {
    id: string;
    name: string;
    typeLabel: string;
    version: string;
    platform: string;
    description: string;
    bullets: string[];
    thumbnail: string | null;
    href: string;
    ctaLabel: string;
}

export function TradingSystemCard({ system }: { system: TradingSystemCardData }) {
    return (
        <article className="group relative flex flex-col overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]/60 transition-all duration-300 hover:shadow-xl hover:border-gold/40">
            <Link
                href={system.href}
                aria-label={`View ${system.name}`}
                className="relative block aspect-video w-full overflow-hidden border-b border-gray-200 dark:border-white/10 bg-[#0E1118] focus:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
                {system.thumbnail ? (
                    <Image
                        src={system.thumbnail}
                        alt={system.name}
                        fill
                        sizes="(min-width: 1280px) 600px, (min-width: 768px) 50vw, 100vw"
                        className="object-contain transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                ) : (
                    <div className="flex h-full w-full items-center justify-center text-gold/60">
                        <Bot size={48} />
                    </div>
                )}
                <span className="absolute left-3.5 top-3.5 rounded-lg border border-white/10 bg-black/80 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white/95 shadow-md backdrop-blur-md">
                    {system.typeLabel}
                </span>
            </Link>

            <div className="flex flex-1 flex-col justify-between p-6 sm:p-7">
                <div className="space-y-4">
                    <div>
                        <div className="mb-2 flex items-center gap-1.5 font-mono text-[11px] tabular-nums tracking-wide text-gray-500 dark:text-gray-400">
                            <span>v{system.version}</span>
                            <span>•</span>
                            <span>{system.platform}</span>
                        </div>
                        <h3 className="font-heading text-xl font-black text-gray-900 dark:text-white">
                            {system.name}
                        </h3>
                        {system.description && (
                            <p className="mt-2.5 line-clamp-3 text-xs font-medium leading-relaxed text-gray-600 dark:text-gray-400">
                                {system.description}
                            </p>
                        )}
                    </div>

                    {system.bullets.length > 0 && (
                        <ul className="space-y-2 border-t border-dashed border-gray-200 pt-4 dark:border-white/10">
                            {system.bullets.map((bullet) => (
                                <li
                                    key={bullet}
                                    className="flex items-start gap-2 text-xs font-medium text-gray-700 dark:text-gray-300"
                                >
                                    <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-gold" />
                                    <span>{bullet}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>

                <div className="mt-7 border-t border-gray-200 pt-4 dark:border-white/10">
                    <Link
                        href={system.href}
                        className={buttonVariants({
                            variant: "gold",
                            className:
                                "w-full h-10 px-4 items-center justify-center gap-2 text-xs sm:text-sm font-black uppercase tracking-wider",
                        })}
                    >
                        <span>{system.ctaLabel}</span>
                        <ArrowRight size={14} className="shrink-0" />
                    </Link>
                </div>
            </div>
        </article>
    );
}

