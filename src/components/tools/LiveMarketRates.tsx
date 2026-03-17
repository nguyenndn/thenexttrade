"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { RefreshCw, TrendingUp, TrendingDown, Search, Info } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface RateData {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
}

type Category = "all" | "majors" | "crosses" | "metals" | "indices" | "crypto";

interface PairDef {
    symbol: string;
    name: string;
    category: Category;
}

const ALL_PAIRS: PairDef[] = [
    // ── Majors (12) ──
    { symbol: "EURUSD=X", name: "EUR/USD", category: "majors" },
    { symbol: "GBPUSD=X", name: "GBP/USD", category: "majors" },
    { symbol: "USDJPY=X", name: "USD/JPY", category: "majors" },
    { symbol: "USDCHF=X", name: "USD/CHF", category: "majors" },
    { symbol: "AUDUSD=X", name: "AUD/USD", category: "majors" },
    { symbol: "USDCAD=X", name: "USD/CAD", category: "majors" },
    { symbol: "NZDUSD=X", name: "NZD/USD", category: "majors" },
    { symbol: "USDSGD=X", name: "USD/SGD", category: "majors" },
    { symbol: "USDHKD=X", name: "USD/HKD", category: "majors" },
    { symbol: "USDNOK=X", name: "USD/NOK", category: "majors" },
    { symbol: "USDSEK=X", name: "USD/SEK", category: "majors" },
    { symbol: "USDTRY=X", name: "USD/TRY", category: "majors" },
    // ── Crosses (14) ──
    { symbol: "EURGBP=X", name: "EUR/GBP", category: "crosses" },
    { symbol: "EURJPY=X", name: "EUR/JPY", category: "crosses" },
    { symbol: "GBPJPY=X", name: "GBP/JPY", category: "crosses" },
    { symbol: "EURCHF=X", name: "EUR/CHF", category: "crosses" },
    { symbol: "AUDJPY=X", name: "AUD/JPY", category: "crosses" },
    { symbol: "CADJPY=X", name: "CAD/JPY", category: "crosses" },
    { symbol: "EURAUD=X", name: "EUR/AUD", category: "crosses" },
    { symbol: "GBPAUD=X", name: "GBP/AUD", category: "crosses" },
    { symbol: "AUDNZD=X", name: "AUD/NZD", category: "crosses" },
    { symbol: "CHFJPY=X", name: "CHF/JPY", category: "crosses" },
    { symbol: "GBPCHF=X", name: "GBP/CHF", category: "crosses" },
    { symbol: "GBPCAD=X", name: "GBP/CAD", category: "crosses" },
    { symbol: "EURCAD=X", name: "EUR/CAD", category: "crosses" },
    { symbol: "EURNZD=X", name: "EUR/NZD", category: "crosses" },
    // ── Metals & Commodities (12) ──
    { symbol: "GC=F", name: "XAU/USD", category: "metals" },
    { symbol: "SI=F", name: "XAG/USD", category: "metals" },
    { symbol: "PL=F", name: "XPT/USD", category: "metals" },
    { symbol: "PA=F", name: "XPD/USD", category: "metals" },
    { symbol: "HG=F", name: "Copper", category: "metals" },
    { symbol: "CL=F", name: "WTI Oil", category: "metals" },
    { symbol: "BZ=F", name: "Brent Oil", category: "metals" },
    { symbol: "NG=F", name: "Natural Gas", category: "metals" },
    { symbol: "ZW=F", name: "Wheat", category: "metals" },
    { symbol: "ZC=F", name: "Corn", category: "metals" },
    { symbol: "ZS=F", name: "Soybean", category: "metals" },
    { symbol: "KC=F", name: "Coffee", category: "metals" },
    // ── Indices (12) ──
    { symbol: "^GSPC", name: "S&P 500", category: "indices" },
    { symbol: "^IXIC", name: "Nasdaq", category: "indices" },
    { symbol: "^DJI", name: "Dow Jones", category: "indices" },
    { symbol: "^GDAXI", name: "DAX 40", category: "indices" },
    { symbol: "^FTSE", name: "FTSE 100", category: "indices" },
    { symbol: "^N225", name: "Nikkei 225", category: "indices" },
    { symbol: "^HSI", name: "Hang Seng", category: "indices" },
    { symbol: "^FCHI", name: "CAC 40", category: "indices" },
    { symbol: "^STOXX50E", name: "Euro Stoxx 50", category: "indices" },
    { symbol: "^AXJO", name: "ASX 200", category: "indices" },
    { symbol: "^RUT", name: "Russell 2000", category: "indices" },
    { symbol: "^VIX", name: "VIX", category: "indices" },
    // ── Crypto (12) ──
    { symbol: "BTC-USD", name: "BTC/USD", category: "crypto" },
    { symbol: "ETH-USD", name: "ETH/USD", category: "crypto" },
    { symbol: "SOL-USD", name: "SOL/USD", category: "crypto" },
    { symbol: "XRP-USD", name: "XRP/USD", category: "crypto" },
    { symbol: "BNB-USD", name: "BNB/USD", category: "crypto" },
    { symbol: "ADA-USD", name: "ADA/USD", category: "crypto" },
    { symbol: "DOGE-USD", name: "DOGE/USD", category: "crypto" },
    { symbol: "AVAX-USD", name: "AVAX/USD", category: "crypto" },
    { symbol: "DOT-USD", name: "DOT/USD", category: "crypto" },
    { symbol: "MATIC-USD", name: "MATIC/USD", category: "crypto" },
    { symbol: "LINK-USD", name: "LINK/USD", category: "crypto" },
    { symbol: "LTC-USD", name: "LTC/USD", category: "crypto" },
];

const CATEGORIES: { id: Category | "all"; label: string }[] = [
    { id: "all", label: "All" },
    { id: "majors", label: "Majors" },
    { id: "crosses", label: "Crosses" },
    { id: "metals", label: "Metals" },
    { id: "indices", label: "Indices" },
    { id: "crypto", label: "Crypto" },
];

function getDecimals(symbol: string): number {
    if (symbol.startsWith("^")) return 2; // Indices
    if (symbol.includes("BTC") || symbol.includes("ETH") || symbol.includes("BNB")) return 2;
    if (symbol.includes("SOL") || symbol.includes("XRP") || symbol.includes("ADA") || symbol.includes("DOGE")) return 4;
    if (symbol.includes("AVAX") || symbol.includes("DOT") || symbol.includes("MATIC") || symbol.includes("LINK") || symbol.includes("LTC")) return 2;
    if (symbol.includes("JPY")) return 3;
    if (symbol.includes("GC=") || symbol.includes("SI=") || symbol.includes("PL=") || symbol.includes("PA=")) return 2;
    if (symbol.includes("CL=") || symbol.includes("BZ=") || symbol.includes("NG=") || symbol.includes("HG=")) return 2;
    if (symbol.includes("ZW=") || symbol.includes("ZC=") || symbol.includes("ZS=") || symbol.includes("KC=")) return 2;
    return 5;
}

export function LiveMarketRates() {
    const [rates, setRates] = useState<Record<string, RateData>>({});
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [search, setSearch] = useState("");
    const [activeCategory, setActiveCategory] = useState("all");

    const fetchRates = useCallback(async () => {
        setLoading(true);
        try {
            const allSymbols = ALL_PAIRS.map((s) => s.symbol);
            const res = await fetch(`/api/tools/rates?symbols=${allSymbols.join(",")}`);
            const data = await res.json();
            if (data.success) {
                const map: Record<string, RateData> = {};
                data.rates.forEach((r: RateData) => { map[r.symbol] = r; });
                setRates(map);
                setLastUpdate(new Date());
            }
        } catch (err) {
            console.error("Failed to fetch rates:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRates();
        const interval = setInterval(fetchRates, 60000);
        return () => clearInterval(interval);
    }, [fetchRates]);

    const filteredPairs = useMemo(() => {
        return ALL_PAIRS.filter((pair) => {
            const matchesCategory = activeCategory === "all" || pair.category === activeCategory;
            const matchesSearch = !search || pair.name.toLowerCase().includes(search.toLowerCase());
            return matchesCategory && matchesSearch;
        });
    }, [activeCategory, search]);

    return (
        <div className="space-y-6">
            {/* ── Toolbar: Search + Filters + Refresh ── */}
            <div className="space-y-4">
                <div className="flex items-center gap-3 flex-wrap">
                    {/* Search */}
                    <div className="relative flex-1 min-w-[200px]">
                        <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search pairs..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl text-sm font-medium text-gray-900 dark:text-white outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all"
                        />
                    </div>

                    {/* Last updated + Refresh */}
                    <div className="flex items-center gap-3 shrink-0">
                        {lastUpdate && (
                            <span className="text-xs text-gray-400 hidden sm:inline">
                                {lastUpdate.toLocaleTimeString()}
                            </span>
                        )}
                        <button
                            onClick={fetchRates}
                            disabled={loading}
                            className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-primary/50 transition-all"
                        >
                            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                            <span className="hidden sm:inline">Refresh</span>
                        </button>
                    </div>
                </div>

                {/* Category Filters */}
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={cn(
                                "relative px-4 py-2 rounded-lg text-xs font-bold border transition-colors z-10",
                                activeCategory === cat.id
                                    ? "text-white border-transparent"
                                    : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-primary/50"
                            )}
                        >
                            {activeCategory === cat.id && (
                                <motion.div
                                    layoutId="activeFilter"
                                    className="absolute inset-0 bg-primary rounded-lg shadow-sm shadow-primary/20 -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            {cat.label}
                        </button>
                    ))}
                </div>
            </div>


            {/* ── Rate Cards Grid ── */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {filteredPairs.map((pair) => {
                    const rate = rates[pair.symbol];
                    const decimals = getDecimals(pair.symbol);
                    const isUp = rate && rate.changePercent > 0;
                    const isDown = rate && rate.changePercent < 0;

                    return (
                        <div
                            key={pair.symbol}
                            className={cn(
                                "relative rounded-xl border p-4 transition-all hover:scale-[1.02]",
                                "bg-white dark:bg-white/5",
                                isUp
                                    ? "border-green-500/30 hover:border-green-500/50"
                                    : isDown
                                    ? "border-red-500/30 hover:border-red-500/50"
                                    : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                            )}
                        >
                            {/* Pair Name */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                                    {pair.name}
                                </span>
                                {rate && (
                                    isUp ? <TrendingUp size={14} className="text-green-500" />
                                    : isDown ? <TrendingDown size={14} className="text-red-500" />
                                    : null
                                )}
                            </div>

                            {/* Price */}
                            <p className={cn(
                                "text-xl font-black font-mono mb-1",
                                isUp ? "text-green-600 dark:text-green-400"
                                    : isDown ? "text-red-600 dark:text-red-400"
                                    : "text-gray-900 dark:text-white"
                            )}>
                                {rate ? rate.price.toFixed(decimals) : "—"}
                            </p>

                            {/* Change % */}
                            <p className={cn(
                                "text-xs font-bold",
                                isUp ? "text-green-600 dark:text-green-400"
                                    : isDown ? "text-red-600 dark:text-red-400"
                                    : "text-gray-400"
                            )}>
                                {rate
                                    ? `${rate.changePercent > 0 ? "+" : ""}${rate.changePercent.toFixed(2)}%`
                                    : "Loading..."
                                }
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Empty State */}
            {filteredPairs.length === 0 && (
                <div className="text-center py-12 text-gray-400">
                    <p className="font-bold">No pairs found</p>
                    <p className="text-sm mt-1">Try adjusting your search or filter</p>
                </div>
            )}

            {/* Note */}
            <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                <Info size={14} className="shrink-0 text-primary/60" />
                <span>Change % reflects <span className="font-semibold text-gray-500 dark:text-gray-400">24-hour daily change</span>. Some pairs may not update when markets are closed.</span>
            </div>
        </div>
    );
}
