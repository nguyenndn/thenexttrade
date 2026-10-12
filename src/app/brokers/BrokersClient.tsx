"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
    Building2,
    Star,
    ChevronRight,
    ExternalLink,
    Bitcoin,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { buttonVariants } from "@/components/ui/button-variants";
import { ReviewBadge } from "./ReviewModal";
import partnersData from "@/config/partners.json";

const CATEGORIES = [
    {
        key: "brokers",
        label: "CFD Brokers",
        icon: Building2,
        data: partnersData.brokers,
        cta: "Open Account",
        depositLabel: "Min Deposit",
        gridCols: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3", // 9 brokers -> 3 rows x 3 columns (3x3 grid)
    },
    {
        key: "cryptoExchanges",
        label: "Crypto",
        icon: Bitcoin,
        data: partnersData.cryptoExchanges,
        cta: "Start Trading",
        depositLabel: "Min Deposit",
        gridCols: "grid-cols-1 md:grid-cols-3 lg:grid-cols-3", // 3 crypto exchanges -> 1 row x 3 columns
    },
];

function StarRating({ rating }: { rating: number }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className="flex">
                {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                        key={star}
                        size={14}
                        className={
                            star <= Math.floor(rating)
                                ? "fill-amber-400 text-amber-400"
                                : star <= rating
                                    ? "fill-amber-400/50 text-amber-400"
                                    : "fill-gray-200 dark:fill-gray-700 text-gray-200 dark:text-gray-700"
                        }
                    />
                ))}
            </div>
            <span className="text-sm font-bold text-gray-700 dark:text-white">
                {rating}
            </span>
        </div>
    );
}

function PartnerCard({
    item,
    ctaLabel,
    depositLabel,
}: {
    item: (typeof CATEGORIES)[number]["data"]["items"][number];
    ctaLabel: string;
    depositLabel: string;
}) {
    const hasUrl = item.url && item.url !== "#";

    return (
        <div className="group bg-white/80 dark:bg-[#151925]/80 rounded-lg border border-gray-200 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-gold/40 hover:shadow-[0_12px_32px_rgba(245,158,11,0.08)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-300 overflow-hidden flex flex-col backdrop-blur-sm relative h-full">
            {/* Header: Logo + Info inline */}
            <div className="p-5 pb-4 flex items-center gap-4">
                <div
                    className={`w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden p-1 ${item.logo
                            ? "bg-white border border-gray-100 dark:border-white/10 shadow-sm"
                            : `bg-gradient-to-br ${item.color} text-white text-base font-black shadow-lg`
                        }`}
                >
                    {item.logo ? (
                        <Image
                            src={item.logo}
                            alt={item.name}
                            width={56}
                            height={56}
                            className="object-contain w-full h-full p-1"
                        />
                    ) : (
                        item.initials
                    )}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white truncate tracking-tight">
                            {item.name}
                        </h3>
                        {(item as any).badge && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 dark:bg-gold/15 text-amber-600 dark:text-gold border border-amber-500/20 dark:border-gold/30 shrink-0">
                                {(item as any).badge}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {item.rating && <StarRating rating={item.rating} />}
                        {(item as any).review && (
                            <ReviewBadge
                                item={
                                    {
                                        ...item,
                                        review: (item as any).review,
                                    } as any
                                }
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* Specs Bar */}
            {(item.minDeposit || item.maxLeverage || item.regulation) &&
                (() => {
                    const specCount = [
                        item.minDeposit,
                        item.maxLeverage,
                        item.regulation,
                    ].filter(Boolean).length;
                    const gridCols =
                        specCount === 1
                            ? "grid-cols-1"
                            : specCount === 2
                                ? "grid-cols-2"
                                : "grid-cols-3";
                    return (
                        <div
                            className={`grid ${gridCols} divide-x divide-gray-200 dark:divide-white/[0.06] bg-gray-50/60 dark:bg-white/[0.02] border-y border-gray-200 dark:border-white/[0.06]`}
                        >
                            {item.minDeposit && (
                                <div className="py-3 px-2 text-center">
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                                        {depositLabel}
                                    </div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-white mt-0.5 truncate">
                                        {item.minDeposit}
                                    </div>
                                </div>
                            )}
                            {item.maxLeverage && (
                                <div className="py-3 px-2 text-center">
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                                        Leverage
                                    </div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-white mt-0.5 truncate">
                                        {item.maxLeverage}
                                    </div>
                                </div>
                            )}
                            {item.regulation && (
                                <div className="py-3 px-2 text-center">
                                    <div className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">
                                        Regulation
                                    </div>
                                    <div className="text-sm font-bold text-gray-800 dark:text-white mt-0.5 truncate" title={item.regulation}>
                                        {item.regulation}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })()}

            {/* Features */}
            {item.features && item.features.length > 0 && (
                <div className="p-5 pt-4 flex-1">
                    <ul className="space-y-2.5">
                        {item.features.map((feature, i) => (
                            <li
                                key={i}
                                className="flex items-start gap-2.5 text-sm text-gray-600 dark:text-gray-300"
                            >
                                <span className="w-4 h-4 rounded-full bg-amber-500/10 dark:bg-gold/15 flex items-center justify-center shrink-0 mt-0.5">
                                    <ChevronRight
                                        size={12}
                                        className="text-amber-600 dark:text-gold"
                                    />
                                </span>
                                <span className="leading-snug">{feature}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {/* CTA */}
            <div className="px-5 pb-5 mt-auto">
                {hasUrl ? (
                    <a
                        href={item.url!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={buttonVariants({
                            variant: "gold",
                            size: "smd",
                            className:
                                "w-full font-bold hover:scale-[1.01] active:scale-[0.99] transition-transform shadow-sm flex items-center justify-center gap-1.5",
                        })}
                    >
                        <span>{ctaLabel}</span>
                        <ExternalLink size={13} />
                    </a>
                ) : (
                    <button
                        disabled
                        className={buttonVariants({
                            variant: "outline",
                            size: "smd",
                            className:
                                "w-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold cursor-not-allowed",
                        })}
                    >
                        Coming Soon
                    </button>
                )}
            </div>
        </div>
    );
}

export default function BrokersClient() {
    const searchParams = useSearchParams();
    const validTabs = CATEGORIES.map((c) => c.key);
    const tabFromUrl = searchParams.get("tab");
    const [activeTab, setActiveTab] = useState(
        tabFromUrl && validTabs.includes(tabFromUrl) ? tabFromUrl : "brokers"
    );

    return (
        <>
            {/* Hero */}
            <div className="text-center mb-6 sm:mb-10">
                <h1 className="text-4xl md:text-6xl font-black text-gray-800 dark:text-white mb-4 sm:mb-5 leading-tight tracking-tight">
                    Verified{" "}
                    <span className="text-gold">
                        Broker Partners
                    </span>
                </h1>
                <p className="text-base sm:text-lg text-gray-600 dark:text-gray-400 max-w-4xl mx-auto leading-relaxed">
                    Raw spreads, low-latency MT5 execution, and regulated custody. Connect via verified partner paths.
                </p>
            </div>

            {/* Tabs - same style as /tools page */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                tabsId="brokers-page"
            >
                <div className="mb-8 overflow-x-auto scrollbar-hide flex sm:justify-center">
                    <TabsList className="bg-gray-50/80 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-lg p-1.5 gap-1 shrink-0 backdrop-blur-sm">
                        {CATEGORIES.map((cat) => {
                            const Icon = cat.icon;
                            return (
                                <TabsTrigger
                                    key={cat.key}
                                    value={cat.key}
                                    className="px-4 py-2.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10"
                                    activeIndicatorClassName="!bg-gold shadow-md border-0"
                                    activeTextClassName="!text-white"
                                >
                                    <Icon size={15} />
                                    <span>{cat.label}</span>
                                </TabsTrigger>
                            );
                        })}
                    </TabsList>
                </div>

                {/* Tab content panels */}
                {CATEGORIES.map((cat) => (
                    <TabsContent key={cat.key} value={cat.key}>
                        <div className={`grid ${cat.gridCols} gap-6`}>
                            {cat.data.items
                                .filter(
                                    (item) => (item as any).active !== false
                                )
                                .map((item) => (
                                    <PartnerCard
                                        key={item.name}
                                        item={item}
                                        ctaLabel={cat.cta}
                                        depositLabel={cat.depositLabel}
                                    />
                                ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </>
    );
}
