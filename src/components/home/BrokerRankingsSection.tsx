"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    Star,
    Check,
    ExternalLink,
    Award,
    Landmark,
    TrendingUp,
    ArrowRight,
} from "lucide-react";
import partnersData from "@/config/partners.json";
import { HomeSectionHeading } from "@/components/home/HomeSectionHeading";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { buttonVariants } from "@/components/ui/button-variants";

interface BrokerItem {
    name: string;
    desc: string;
    badge: string | null;
    badgeType: string | null;
    logo: string | null;
    initials: string;
    url: string | null;
    rating: number;
    minDeposit: string;
    maxLeverage: string;
    regulation: string;
    features: string[];
}

interface CryptoItem {
    name: string;
    desc: string;
    badge: string | null;
    badgeType: string | null;
    logo: string | null;
    initials: string;
    url: string | null;
    rating: number;
    minDeposit: string;
    maxLeverage: string;
    regulation: string;
    features: string[];
}

interface UnifiedItem {
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
    // Broker specific
    minDeposit?: string;
    maxLeverage?: string;
    // Crypto specific
    marketType?: string;
    assets?: string;
}

export function BrokerRankingsSection() {
    const [activeTab, setActiveTab] = useState<"brokers" | "crypto">("brokers");

    const brokers: UnifiedItem[] = (partnersData.brokers.items as BrokerItem[])
        .filter((item) => (item as any).active !== false)
        .slice(0, 3)
        .map((item) => ({
            ...item,
        }));

    const cryptoExchanges: UnifiedItem[] = (
        partnersData.cryptoExchanges.items as CryptoItem[]
    )
        .filter((item) => (item as any).active !== false)
        .slice(0, 3)
        .map((item) => {
            const nameLower = item.name.toLowerCase();
            let marketType = "Spot & Derivatives";
            let assets = "300+ Assets";
            if (nameLower.includes("binance")) {
                marketType = "Spot & Futures";
                assets = "600+ Cryptos";
            } else if (nameLower.includes("bybit")) {
                marketType = "Derivatives & Spot";
                assets = "600+ Assets";
            } else if (nameLower.includes("okx")) {
                marketType = "Spot, Futures & Options";
                assets = "300+ Assets";
            }
            return {
                ...item,
                marketType,
                assets,
            };
        });

    const activeItems = activeTab === "brokers" ? brokers : cryptoExchanges;

    return (
        <div className="relative overflow-hidden bg-slate-50/50 dark:bg-transparent">
            {/* Background decoration */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />
            <div className="absolute -top-40 -right-40 w-96 h-96 bg-gold/5 rounded-full blur-3xl pointer-events-none" />

            <section className="py-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                <HomeSectionHeading
                    align="center"
                    title="Verified Infrastructure & Broker Partners"
                    highlight="Broker Partners"
                    description="Tight raw spreads, fast MT5 execution, and regulated custody. Connect to unlock TheNextTrade VIP for free."
                    className="mb-6"
                />

                {/* Tab Switcher */}
                <Tabs
                    value={activeTab}
                    onValueChange={(v) => setActiveTab(v as any)}
                    tabsId="platforms-tabs"
                    className="w-full"
                >
                    <div className="mb-6 overflow-x-auto scrollbar-hide flex justify-center">
                        <TabsList className="bg-gray-50 dark:bg-white/5 border border-dashboard rounded-xl p-1.5 gap-1 shrink-0">
                            <TabsTrigger
                                value="brokers"
                                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                <Landmark size={14} />
                                <span>CFD Brokers</span>
                            </TabsTrigger>
                            <TabsTrigger
                                value="crypto"
                                className="px-4 py-2 rounded-lg text-xs sm:text-sm font-bold whitespace-nowrap border border-transparent hover:border-dashboard dark:hover:border-white/10"
                                activeIndicatorClassName="!bg-gradient-to-r from-gold to-amber-600 shadow-md border-0"
                                activeTextClassName="!text-white"
                            >
                                <TrendingUp size={14} />
                                <span>Crypto Exchanges</span>
                            </TabsTrigger>
                        </TabsList>
                    </div>
                </Tabs>

                {/* Symmetrical 3-Column Cards Grid (1 col mobile, 1 horizontal row per item on tablet, 3 cols desktop) */}
                <div className="grid grid-cols-1 md:grid-cols-1 lg:grid-cols-3 gap-5 lg:gap-6 w-full">
                    {activeItems.map((item, idx) => (
                        <div key={item.name} className="h-full">
                            {/* Desktop Card (PC: lg+) — 100% original design as in user screenshot */}
                            <div className="hidden lg:flex relative flex-col justify-between p-5 rounded-2xl bg-white dark:bg-card border border-gray-200/80 dark:border-white/10 hover:border-gold dark:hover:border-gold/60 shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-all duration-300 group overflow-hidden h-full">
                                {/* Top Badge for #1 */}
                                {idx === 0 && (
                                    <div className="absolute top-0 right-0 px-3 py-1 rounded-bl-xl bg-gradient-to-r from-amber-500 to-gold text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                                        <Award size={11} />{" "}
                                        {activeTab === "brokers"
                                            ? "Editor's Choice"
                                            : "Top Volume"}
                                    </div>
                                )}

                                {/* Brand Identity */}
                                <div className="flex items-center gap-3 mb-4 pt-2">
                                    <div className="w-11 h-11 rounded-xl bg-white border border-gray-200/80 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                        {item.logo ? (
                                            <Image
                                                src={item.logo}
                                                alt={item.name}
                                                width={48}
                                                height={48}
                                                className="object-contain w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-gray-800 dark:text-white font-black text-sm">
                                                {item.initials}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm font-extrabold text-gray-900 dark:text-white group-hover:text-gold transition-colors truncate">
                                            {item.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="flex items-center gap-0.5 text-yellow-500">
                                                <Star
                                                    size={11}
                                                    className="fill-yellow-400 text-yellow-400"
                                                />
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                    {item.rating}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium truncate">
                                                · {item.regulation}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Metrics & Features */}
                                <div>
                                    {/* Key Metrics Strip - Single Line */}
                                    <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 mb-3.5 text-xs">
                                        {activeTab === "brokers" ? (
                                            <>
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                                                        Min Deposit:
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white truncate">
                                                        {item.minDeposit}
                                                    </span>
                                                </div>
                                                <span className="text-gray-300 dark:text-white/20">·</span>
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                                                        Max Leverage:
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white truncate">
                                                        {item.maxLeverage || "N/A"}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                                                        Type:
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white truncate">
                                                        {item.marketType}
                                                    </span>
                                                </div>
                                                <span className="text-gray-300 dark:text-white/20">·</span>
                                                <div className="flex items-center gap-1.5 min-w-0">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                                                        Assets:
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white truncate">
                                                        {item.assets}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

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
                                <div className="flex items-center gap-2 pt-3 border-t border-gray-100 dark:border-white/5">
                                    <a
                                        href={item.url || "#"}
                                        target={
                                            item.url && item.url !== "#"
                                                ? "_blank"
                                                : undefined
                                        }
                                        rel={
                                            item.url && item.url !== "#"
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        className={buttonVariants({
                                            variant: "primary",
                                            className:
                                                "flex-1 min-h-9 px-3 py-2 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-xs shadow-sm hover:shadow-md justify-center gap-1 whitespace-nowrap",
                                        })}
                                    >
                                        {activeTab === "brokers"
                                            ? "Trade Now"
                                            : "Open Exchange"}
                                        <ExternalLink size={11} />
                                    </a>
                                    <a
                                        href={
                                            activeTab === "brokers"
                                                ? "/brokers?tab=brokers"
                                                : "/brokers?tab=cryptoExchanges"
                                        }
                                        className={buttonVariants({
                                            variant: "outline",
                                            className:
                                                "min-h-9 px-3 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white justify-center whitespace-nowrap",
                                        })}
                                    >
                                        Review
                                    </a>
                                </div>
                            </div>

                            {/* Tablet & Mobile Card (< lg) — Horizontal layout on tablet, vertical on mobile */}
                            <div className="flex lg:hidden relative flex-col md:flex-row justify-between p-5 rounded-2xl bg-white dark:bg-card border border-gray-200/80 dark:border-white/10 hover:border-gold dark:hover:border-gold/60 shadow-sm hover:shadow-xl hover:shadow-gold/5 transition-all duration-300 group overflow-hidden md:items-center md:gap-4 h-full">
                                {/* Top Badge for #1 */}
                                {idx === 0 && (
                                    <div className="absolute top-0 right-0 md:left-0 md:right-auto px-3 py-1 rounded-bl-xl md:rounded-bl-none md:rounded-br-xl bg-gradient-to-r from-amber-500 to-gold text-white text-[10px] font-black uppercase tracking-wider shadow-sm flex items-center gap-1 z-10">
                                        <Award size={11} />{" "}
                                        {activeTab === "brokers"
                                            ? "Editor's Choice"
                                            : "Top Volume"}
                                    </div>
                                )}

                                {/* Left: Brand Identity */}
                                <div className="flex items-center gap-3 mb-4 md:mb-0 md:w-56 shrink-0 pt-2 md:pt-0">
                                    <div className="w-11 h-11 md:w-12 md:h-12 rounded-xl bg-white border border-gray-200/80 dark:border-white/10 flex items-center justify-center shrink-0 overflow-hidden p-1.5 shadow-sm group-hover:scale-105 transition-transform duration-300">
                                        {item.logo ? (
                                            <Image
                                                src={item.logo}
                                                alt={item.name}
                                                width={48}
                                                height={48}
                                                className="object-contain w-full h-full"
                                            />
                                        ) : (
                                            <span className="text-gray-800 dark:text-white font-black text-sm">
                                                {item.initials}
                                            </span>
                                        )}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <h3 className="text-sm md:text-base font-extrabold text-gray-900 dark:text-white group-hover:text-gold transition-colors truncate">
                                            {item.name}
                                        </h3>
                                        <div className="flex items-center gap-1.5 mt-0.5">
                                            <div className="flex items-center gap-0.5 text-yellow-500">
                                                <Star
                                                    size={11}
                                                    className="fill-yellow-400 text-yellow-400"
                                                />
                                                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                                                    {item.rating}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-gray-400 font-medium truncate">
                                                · {item.regulation}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Middle: Metrics & Features */}
                                <div className="flex-1 min-w-0 md:px-2 w-full md:w-auto">
                                    {/* Key Metrics Strip */}
                                    <div className="flex items-center justify-between gap-1.5 px-3 py-1.5 rounded-xl bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 mb-2.5 text-xs">
                                        {activeTab === "brokers" ? (
                                            <>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                                                        Min Deposit:
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white whitespace-nowrap">
                                                        {item.minDeposit}
                                                    </span>
                                                </div>
                                                <span className="text-gray-300 dark:text-white/20">·</span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                                                        Max Leverage:
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white whitespace-nowrap">
                                                        {item.maxLeverage || "N/A"}
                                                    </span>
                                                </div>
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                                                        Type:
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white whitespace-nowrap">
                                                        {item.marketType}
                                                    </span>
                                                </div>
                                                <span className="text-gray-300 dark:text-white/20">·</span>
                                                <div className="flex items-center gap-1.5 shrink-0">
                                                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider shrink-0">
                                                        Assets:
                                                    </span>
                                                    <span className="text-xs font-extrabold text-gray-800 dark:text-white whitespace-nowrap">
                                                        {item.assets}
                                                    </span>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {/* Features List */}
                                    <ul className="space-y-1 mb-4 md:mb-0 text-xs text-gray-600 dark:text-gray-300">
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

                                {/* Right: CTA Action Buttons */}
                                <div className="flex items-center gap-2 pt-3 md:pt-0 border-t md:border-t-0 md:border-l border-gray-100 dark:border-white/5 md:pl-4 w-full md:w-36 shrink-0 md:flex-col">
                                    <a
                                        href={item.url || "#"}
                                        target={
                                            item.url && item.url !== "#"
                                                ? "_blank"
                                                : undefined
                                        }
                                        rel={
                                            item.url && item.url !== "#"
                                                ? "noopener noreferrer"
                                                : undefined
                                        }
                                        className={buttonVariants({
                                            variant: "primary",
                                            className:
                                                "flex-1 md:w-full min-h-9.5 px-3.5 py-2 rounded-xl bg-gold hover:bg-amber-600 text-white font-black text-xs sm:text-sm shadow-sm hover:shadow-md justify-center gap-1.5 whitespace-nowrap",
                                        })}
                                    >
                                        {activeTab === "brokers"
                                            ? "Trade Now"
                                            : "Open Exchange"}
                                        <ExternalLink size={12} />
                                    </a>
                                    <a
                                        href={
                                            activeTab === "brokers"
                                                ? "/brokers?tab=brokers"
                                                : "/brokers?tab=cryptoExchanges"
                                        }
                                        className={buttonVariants({
                                            variant: "outline",
                                            className:
                                                "min-h-9.5 w-auto shrink-0 md:w-full px-4 py-2 rounded-xl text-xs font-bold text-gray-700 dark:text-gray-300 hover:text-gray-950 dark:hover:text-white justify-center whitespace-nowrap",
                                        })}
                                    >
                                        Review
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Bottom View All Link */}
                <div className="mt-8 flex justify-center">
                    <Link
                        href={
                            activeTab === "brokers"
                                ? "/brokers?tab=brokers"
                                : "/brokers?tab=cryptoExchanges"
                        }
                        className="group inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-gold hover:text-amber-500 transition-colors"
                    >
                        <span>
                            {activeTab === "brokers"
                                ? `Compare all ${partnersData.brokers.items.length} brokers`
                                : `Compare all ${partnersData.cryptoExchanges.items.length} crypto exchanges`}
                        </span>
                        <ArrowRight
                            size={13}
                            className="transition-transform duration-300 group-hover:translate-x-1"
                        />
                    </Link>
                </div>
            </section>
        </div>
    );
}
