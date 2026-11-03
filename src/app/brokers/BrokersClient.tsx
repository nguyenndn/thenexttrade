"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import Image from "next/image";
import {
    Building2,
    Star,
    Check,
    ExternalLink,
    Bitcoin,
} from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { ReviewBadge } from "./ReviewModal";
import { BrokerSpecsMatrix } from "@/components/home/broker-rankings/BrokerSpecsMatrix";
import partnersData from "@/config/partners.json";

interface PartnerReview {
    summary: string;
    pros: string[];
    cons: string[];
    bestFor: string;
    verdict: string;
}

interface PartnerItem {
    name: string;
    desc?: string;
    badge?: string | null;
    badgeType?: string | null;
    logo: string | null;
    initials: string;
    color: string;
    url: string | null;
    rating: number;
    minDeposit?: string;
    maxLeverage?: string;
    regulation?: string;
    features: string[];
    active?: boolean;
    review?: PartnerReview;
}

const CATEGORIES = [
    {
        key: "brokers",
        label: "CFD Brokers",
        icon: Building2,
        data: partnersData.brokers as { items: PartnerItem[] },
        cta: "Open Account",
        gridCols: "grid-cols-1 md:grid-cols-2 lg:grid-cols-3",
    },
    {
        key: "cryptoExchanges",
        label: "Crypto",
        icon: Bitcoin,
        data: partnersData.cryptoExchanges as { items: PartnerItem[] },
        cta: "Start Trading",
        gridCols: "grid-cols-1 md:grid-cols-3 lg:grid-cols-3",
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
            <span className="text-sm font-bold font-mono tabular-nums text-gray-700 dark:text-white">
                {rating.toFixed(1)}
            </span>
        </div>
    );
}

function PartnerCard({
    item,
    ctaLabel,
    categoryKey,
}: {
    item: PartnerItem;
    ctaLabel: string;
    categoryKey: string;
}) {
    const hasUrl = item.url && item.url !== "#";
    const isCrypto = categoryKey === "cryptoExchanges";
    const nameLower = item.name.toLowerCase();
    const marketType = nameLower.includes("binance")
        ? "Spot & Futures"
        : nameLower.includes("bybit")
            ? "Derivatives & Spot"
            : nameLower.includes("okx")
                ? "Spot, Futures & Options"
                : "Spot & Derivatives";
    const assets =
        nameLower.includes("binance") || nameLower.includes("bybit")
            ? "600+ Assets"
            : "300+ Assets";

    return (
        <div className="group bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 hover:border-amber-500/40 dark:hover:border-gold/40 hover:shadow-[0_12px_32px_rgba(245,158,11,0.08)] dark:hover:shadow-[0_12px_32px_rgba(0,0,0,0.35)] transition-all duration-300 overflow-hidden flex flex-col relative h-full">
            {/* Header: Logo + Info inline */}
            <div className="p-5 pb-4 flex items-center gap-4 border-b border-gray-200 dark:border-white/[0.06]">
                <div
                    className={`w-14 h-14 rounded-lg flex-shrink-0 flex items-center justify-center overflow-hidden p-1 ${
                        item.logo
                            ? "bg-white border border-gray-200 dark:border-white/10 shadow-sm"
                            : "bg-gold/10 text-gold border border-gold/20 text-base font-black shadow-sm"
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
                        <h3 className="text-lg font-bold text-gray-800 dark:text-white group-hover:text-gold transition-colors truncate tracking-tight">
                            {item.name}
                        </h3>
                        {item.badge && (
                            <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-[10px] font-bold tracking-wide uppercase bg-amber-500/10 dark:bg-gold/15 text-amber-600 dark:text-gold border border-amber-500/20 dark:border-gold/30 shrink-0">
                                {item.badge}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-2.5 flex-wrap">
                        {item.rating && <StarRating rating={item.rating} />}
                        {item.review && (
                            <ReviewBadge
                                item={{
                                    ...item,
                                    review: item.review,
                                }}
                            />
                        )}
                    </div>
                </div>
            </div>

            {/* 2x2 Specs Matrix + Features (Synced with Homepage BrokerRankingCard) */}
            <div className="p-5 pt-4 flex-1 flex flex-col justify-between">
                <div>
                    {item.regulation && (
                        <BrokerSpecsMatrix
                            activeTab={isCrypto ? "crypto" : "brokers"}
                            minDeposit={item.minDeposit}
                            maxLeverage={item.maxLeverage}
                            marketType={marketType}
                            assets={assets}
                            regulation={item.regulation}
                            rating={item.rating}
                        />
                    )}

                    {item.features && item.features.length > 0 && (
                        <ul className="space-y-2">
                            {item.features.map((feature, i) => (
                                <li
                                    key={i}
                                    className="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-300"
                                >
                                    <Check
                                        size={14}
                                        className="text-emerald-500 shrink-0 mt-0.5"
                                    />
                                    <span className="leading-snug font-medium">{feature}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>

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
                    <Button
                        disabled
                        variant="outline"
                        size="smd"
                        className="w-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-bold cursor-not-allowed"
                    >
                        Coming Soon
                    </Button>
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

            {/* Tabs */}
            <Tabs
                value={activeTab}
                onValueChange={setActiveTab}
                tabsId="brokers-page"
            >
                <div className="mb-8 overflow-x-auto scrollbar-hide flex sm:justify-center">
                    <TabsList className="bg-gray-100 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-1.5 gap-1 shrink-0">
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
                                .filter((item) => item.active !== false)
                                .map((item) => (
                                    <PartnerCard
                                        key={item.name}
                                        item={item}
                                        ctaLabel={cat.cta}
                                        categoryKey={cat.key}
                                    />
                                ))}
                        </div>
                    </TabsContent>
                ))}
            </Tabs>
        </>
    );
}
