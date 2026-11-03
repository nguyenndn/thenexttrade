import Image from "next/image";
import { Star, Check, Award } from "lucide-react";
import { BrokerSpecsMatrix } from "./BrokerSpecsMatrix";
import { BrokerRankingActions } from "./BrokerRankingActions";

export interface UnifiedRankingItem {
    name: string;
    desc: string;
    badge: string | null;
    badgeType: string | null;
    logo: string | null;
    initials: string;
    url: string | null;
    rating: number;
    regulation: string;
    features: string[];
    minDeposit?: string;
    maxLeverage?: string;
    marketType?: string;
    assets?: string;
    active?: boolean;
}

interface BrokerRankingCardProps {
    item: UnifiedRankingItem;
    idx: number;
    activeTab: "brokers" | "crypto";
}

export function BrokerRankingCard({
    item,
    idx,
    activeTab,
}: BrokerRankingCardProps) {
    return (
        <div className="relative flex flex-col md:flex-row lg:flex-col justify-between p-5 rounded-xl bg-white dark:bg-[#0D111C] border border-gray-200 dark:border-white/10 hover:border-gold dark:hover:border-gold/60 shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-all duration-300 group overflow-hidden md:items-center lg:items-stretch md:gap-4 lg:gap-0 h-full">
            {/* Top Badge for #1 */}
            {idx === 0 && (
                <div className="absolute top-0 right-0 md:left-0 md:right-auto lg:left-auto lg:right-0 px-3 py-1 rounded-bl-lg md:rounded-bl-none md:rounded-br-lg lg:rounded-br-none lg:rounded-bl-lg bg-gold text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                    <Award size={11} />{" "}
                    {activeTab === "brokers" ? "Editor's Choice" : "Top Volume"}
                </div>
            )}

            {/* Brand Identity */}
            <div className="flex items-center gap-3 mb-4 md:mb-0 lg:mb-4 md:w-56 lg:w-auto shrink-0 pt-2 md:pt-0 lg:pt-2">
                <div className="w-11 h-11 md:w-12 md:h-12 lg:w-11 lg:h-11 rounded-lg bg-white border border-gray-200 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
                    {item.logo ? (
                        <Image
                            src={item.logo}
                            alt={item.name}
                            width={48}
                            height={48}
                            sizes="48px"
                            className="object-contain w-full h-full"
                        />
                    ) : (
                        <span className="text-gray-800 dark:text-white font-black text-sm">
                            {item.initials}
                        </span>
                    )}
                </div>
                <div className="min-w-0 flex-1">
                    <h3 className="text-sm md:text-base lg:text-sm font-extrabold text-gray-900 dark:text-white group-hover:text-gold transition-colors truncate">
                        {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="flex items-center gap-0.5 text-yellow-500">
                            <Star
                                size={11}
                                className="fill-yellow-400 text-yellow-400"
                            />
                            <span className="text-xs font-mono tabular-nums font-bold text-gray-800 dark:text-gray-200">
                                {item.rating.toFixed(1)}
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-400 font-medium truncate">
                            · {item.regulation}
                        </span>
                    </div>
                </div>
            </div>

            {/* Metrics & Features Container */}
            <div className="flex-1 min-w-0 md:px-2 lg:px-0 w-full md:w-auto lg:w-full">
                <BrokerSpecsMatrix
                    activeTab={activeTab}
                    minDeposit={item.minDeposit}
                    maxLeverage={item.maxLeverage}
                    marketType={item.marketType}
                    assets={item.assets}
                    regulation={item.regulation}
                    rating={item.rating}
                />

                {/* Features List */}
                <ul className="space-y-1 mb-4 text-xs text-gray-600 dark:text-gray-300">
                    {item.features.slice(0, 2).map((feat, i) => (
                        <li
                            key={i}
                            className="flex items-center gap-1.5 text-[11px] font-medium"
                        >
                            <Check
                                size={12}
                                className="text-emerald-500 shrink-0"
                            />
                            <span className="truncate">{feat}</span>
                        </li>
                    ))}
                </ul>
            </div>

            {/* CTA Action Buttons */}
            <BrokerRankingActions
                url={item.url}
                activeTab={activeTab}
            />
        </div>
    );
}
