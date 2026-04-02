"use client";

import { useState, useEffect, useCallback } from "react";
import { RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";

const CURRENCIES = ["USD", "EUR", "GBP", "JPY", "AUD", "CAD", "CHF", "NZD"];

const PAIR_MAP: Record<string, string> = {};
CURRENCIES.forEach((base) => {
    CURRENCIES.forEach((quote) => {
        if (base !== quote) {
            PAIR_MAP[`${base}/${quote}`] = `${base}${quote}=X`;
        }
    });
});

interface StrengthData {
    currency: string;
    strength: number;
    pairsCount: number;
}

export function CurrencyHeatMap() {
    const [data, setData] = useState<StrengthData[]>([]);
    const [loading, setLoading] = useState(false);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

    const fetchStrength = useCallback(async () => {
        setLoading(true);
        try {
            // Fetch pairs where USD is base: USDJPY, USDCHF, USDCAD
            // And pairs where USD is quote: EURUSD, GBPUSD, AUDUSD, NZDUSD
            const pairs = [
                "EURUSD=X", "GBPUSD=X", "USDJPY=X", "USDCHF=X", "AUDUSD=X", "USDCAD=X", "NZDUSD=X",
                "EURGBP=X", "EURJPY=X", "EURCHF=X", "EURAUD=X", "EURCAD=X", "EURNZD=X",
                "GBPJPY=X", "GBPCHF=X", "GBPAUD=X", "GBPCAD=X", "GBPNZD=X",
                "CHFJPY=X", "AUDJPY=X", "NZDJPY=X", "CADJPY=X",
                "AUDNZD=X", "AUDCAD=X", "AUDCHF=X",
                "NZDCAD=X", "NZDCHF=X", "CADCHF=X",
            ];

            const res = await fetch(`/api/tools/rates?symbols=${pairs.join(",")}`);
            const result = await res.json();

            if (!result.success) return;

            // Calculate currency strength from change %
            const strengthMap: Record<string, number[]> = {};
            CURRENCIES.forEach((c) => { strengthMap[c] = []; });

            result.rates.forEach((rate: any) => {
                const symbol = rate.symbol.replace("=X", "");
                const base = symbol.substring(0, 3);
                const quote = symbol.substring(3, 6);
                const pct = rate.changePercent || 0;

                if (strengthMap[base]) strengthMap[base].push(pct);
                if (strengthMap[quote]) strengthMap[quote].push(-pct);
            });

            const strengths: StrengthData[] = CURRENCIES.map((c) => {
                const values = strengthMap[c];
                const avg = values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0;
                return { currency: c, strength: avg, pairsCount: values.length };
            }).sort((a, b) => b.strength - a.strength);

            setData(strengths);
            setLastUpdate(new Date());
        } catch (err) {
            console.error("Heat map error:", err);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchStrength();
        const interval = setInterval(fetchStrength, 120000);
        return () => clearInterval(interval);
    }, [fetchStrength]);

    const maxAbs = Math.max(...data.map((d) => Math.abs(d.strength)), 0.01);

    const FLAGS: Record<string, string> = {
        USD: "🇺🇸", EUR: "🇪🇺", GBP: "🇬🇧", JPY: "🇯🇵",
        AUD: "🇦🇺", CAD: "🇨🇦", CHF: "🇨🇭", NZD: "🇳🇿",
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    {lastUpdate && `Updated: ${lastUpdate.toLocaleTimeString()}`}
                </div>
                <button
                    onClick={fetchStrength}
                    disabled={loading}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-sm font-bold text-gray-600 dark:text-gray-300 hover:border-primary/50 transition-all"
                >
                    <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
                    Refresh
                </button>
            </div>

            <div className="space-y-3">
                {data.map((item, idx) => (
                    <div key={item.currency} className="flex items-center gap-4">
                        <div className="w-16 flex items-center gap-2">
                            <span className="text-lg">{FLAGS[item.currency]}</span>
                            <span className="font-bold text-sm text-gray-900 dark:text-white">{item.currency}</span>
                        </div>
                        <div className="flex-1 relative h-8">
                            <div className="absolute inset-0 bg-gray-100 dark:bg-white/5 rounded-lg" />
                            <div className="absolute top-0 bottom-0 left-1/2 w-px bg-gray-300 dark:bg-white/20 z-10" />
                            <div
                                className={cn(
                                    "absolute top-0.5 bottom-0.5 rounded-md transition-all z-20",
                                    item.strength >= 0 ? "bg-green-500" : "bg-red-500"
                                )}
                                style={{
                                    left: item.strength >= 0 ? "50%" : `${50 - (Math.abs(item.strength) / maxAbs) * 50}%`,
                                    width: `${(Math.abs(item.strength) / maxAbs) * 50}%`,
                                }}
                            />
                        </div>
                        <div className={cn(
                            "w-20 text-right font-bold text-sm",
                            item.strength > 0 ? "text-green-600 dark:text-green-400" :
                            item.strength < 0 ? "text-red-600 dark:text-red-400" :
                            "text-gray-400"
                        )}>
                            {item.strength > 0 ? "+" : ""}{item.strength.toFixed(3)}%
                        </div>
                        <div className="w-8 text-center text-xs font-bold text-gray-400">
                            #{idx + 1}
                        </div>
                    </div>
                ))}
            </div>

            {data.length === 0 && !loading && (
                <div className="text-center py-12 text-gray-400">
                    Click Refresh to load currency strength data
                </div>
            )}
        </div>
    );
}
