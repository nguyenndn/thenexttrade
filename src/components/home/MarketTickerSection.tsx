'use client';

import { useState, useEffect } from 'react';
import { useTheme } from '@/components/providers/ThemeProvider';
import { getMarketData } from '@/app/actions/get-market-data';
import { TrendingUp, TrendingDown, ArrowRight, Activity } from 'lucide-react';

interface MarketItem {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
    currency?: string;
    isOpen: boolean;
}

export function MarketTickerSection({ initialData }: { initialData?: MarketItem[] }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const [tickerData, setTickerData] = useState<MarketItem[]>(initialData || []);
    const [loading, setLoading] = useState(!initialData || initialData.length === 0);

    // Initial Mock Data (Optional, kept for immediate render if server action slow)
    // But mostly we rely on initialData or fetch
    const MOCK_DATA: MarketItem[] = [
        { symbol: "EUR/USD", name: "Euro", price: 1.0845, change: 0.0012, changePercent: 0.11, isOpen: true },
        { symbol: "XAU/USD", name: "Gold", price: 2345.50, change: 12.50, changePercent: 0.54, isOpen: true },
        { symbol: "BTC/USD", name: "Bitcoin", price: 67500, change: 1200, changePercent: 1.80, isOpen: true },
    ];

    useEffect(() => {
        const fetchData = async () => {
            const result = await getMarketData();
            if (result.success && result.data.length > 0) {
                setTickerData(result.data);
            } else {
                console.warn("Using Mock Data for Market Ticker (Fetch Failed)");
                if (tickerData.length === 0) setTickerData(MOCK_DATA);
            }
            setLoading(false);
        };

        // If no initial data, fetch immediately
        if (!initialData || initialData.length === 0) {
            fetchData();
        }

        const interval = setInterval(fetchData, 60000); // Poll every minute
        return () => clearInterval(interval);
    }, []);

    // Don't render loading state, just wait or show nothing to avoid layout shift
    if (loading && tickerData.length === 0) return null;

    // Helper for decimals
    const getDecimals = (symbol: string) => {
        if (symbol.includes("JPY")) return 3;
        if (["USOIL", "XAU/USD", "Gold", "Oil"].some(s => symbol.includes(s))) return 2;
        if (["BTC", "ETH"].some(s => symbol.includes(s))) return 2;
        if (symbol.includes("USD") || symbol.includes("EUR")) return 5;
        return 2;
    };

    // Helper for Icon Colors (approximated based on symbol)
    const getIconColor = (symbol: string) => {
        if (symbol.includes("XAU") || symbol.includes("Gold")) return "text-yellow-500 bg-yellow-500/10";
        if (symbol.includes("BTC")) return "text-orange-500 bg-orange-500/10";
        if (symbol.includes("ETH")) return "text-indigo-500 bg-indigo-500/10";
        if (symbol.includes("Oil") || symbol.includes("CL=F")) return "text-gray-500 bg-gray-500/10";
        if (symbol.includes("SPX")) return "text-green-600 bg-green-600/10";
        if (symbol.includes("EUR")) return "text-blue-500 bg-blue-500/10";
        if (symbol.includes("JPY")) return "text-red-500 bg-red-500/10";
        if (symbol.includes("GBP")) return "text-indigo-500 bg-indigo-500/10";
        return "text-gray-500 bg-gray-500/10";
    };

    // Triple data for smooth infinite loop
    const displayData = [...tickerData, ...tickerData, ...tickerData];

    return (
        <section className="relative w-full overflow-hidden bg-white/50 dark:bg-[#0B0E14]/80 backdrop-blur-md border-y border-gray-200 dark:border-white/10">

            {/* Gradient Fade Masks */}
            <div className="absolute left-0 top-0 bottom-0 w-24 bg-gradient-to-r from-white dark:from-[#0B0E14] to-transparent z-10 pointer-events-none"></div>
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-l from-white dark:from-[#0B0E14] to-transparent z-10 pointer-events-none"></div>

            <div className="flex py-3 pause-on-hover px-4">
                {/*  We need a specific width for the marquee animation to work flawlessly, 
                      or just use overflow-x-auto if CSS animation is tricky with variable width.
                      Here using the existing 'animate-marquee' class. 
                  */}
                <div className="flex animate-marquee items-center gap-8 whitespace-nowrap">
                    {displayData.map((item, idx) => {
                        const isPositive = item.change >= 0;
                        const decimals = getDecimals(item.symbol);
                        const iconClass = getIconColor(item.symbol);

                        return (
                            <div
                                key={`${item.symbol}-${idx}`}
                                className="group flex items-center gap-3 cursor-pointer transition-opacity hover:opacity-80"
                            >
                                {/* Symbol Badge */}
                                <div className={`flex items-center gap-2 px-2.5 py-1 rounded-full ${iconClass} border border-transparent group-hover:border-current transition-colors`}>
                                    {/* Simple Dot or Icon */}
                                    <Activity size={12} className="opacity-70" />
                                    <span className="text-xs font-bold tracking-tight">{item.symbol}</span>
                                </div>

                                {/* Price Info */}
                                <div className="flex flex-col">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-sm font-mono font-bold text-gray-900 dark:text-gray-100">
                                            {item.price.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}
                                        </span>
                                        <span className={`flex items-center text-[10px] font-bold ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
                                            {isPositive ? <TrendingUp size={10} className="mr-0.5" /> : <TrendingDown size={10} className="mr-0.5" />}
                                            {Math.abs(item.changePercent).toFixed(2)}%
                                        </span>
                                    </div>
                                </div>

                                {/* Divider between items (optional, using gap instead) */}
                                {/* <div className="h-4 w-[1px] bg-gray-200 dark:bg-white/10 ml-2"></div> */}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
