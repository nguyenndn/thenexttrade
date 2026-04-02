"use client";

import { useState, useCallback, useEffect } from "react";
import { ArrowUpDown, RefreshCw, ChevronDown, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

const CURRENCIES = [
    // ── Major Currencies ──
    { code: "USD", name: "US Dollar", flag: "🇺🇸", group: "Major" },
    { code: "EUR", name: "Euro", flag: "🇪🇺", group: "Major" },
    { code: "GBP", name: "British Pound", flag: "🇬🇧", group: "Major" },
    { code: "JPY", name: "Japanese Yen", flag: "🇯🇵", group: "Major" },
    { code: "CHF", name: "Swiss Franc", flag: "🇨🇭", group: "Major" },
    // ── Minor Currencies ──
    { code: "AUD", name: "Australian Dollar", flag: "🇦🇺", group: "Minor" },
    { code: "CAD", name: "Canadian Dollar", flag: "🇨🇦", group: "Minor" },
    { code: "NZD", name: "New Zealand Dollar", flag: "🇳🇿", group: "Minor" },
    // ── Exotic Currencies ──
    { code: "SGD", name: "Singapore Dollar", flag: "🇸🇬", group: "Exotic" },
    { code: "HKD", name: "Hong Kong Dollar", flag: "🇭🇰", group: "Exotic" },
    { code: "SEK", name: "Swedish Krona", flag: "🇸🇪", group: "Exotic" },
    { code: "NOK", name: "Norwegian Krone", flag: "🇳🇴", group: "Exotic" },
    { code: "DKK", name: "Danish Krone", flag: "🇩🇰", group: "Exotic" },
    { code: "PLN", name: "Polish Zloty", flag: "🇵🇱", group: "Exotic" },
    { code: "TRY", name: "Turkish Lira", flag: "🇹🇷", group: "Exotic" },
    { code: "MXN", name: "Mexican Peso", flag: "🇲🇽", group: "Exotic" },
    { code: "ZAR", name: "South African Rand", flag: "🇿🇦", group: "Exotic" },
    { code: "BRL", name: "Brazilian Real", flag: "🇧🇷", group: "Exotic" },
    { code: "CNH", name: "Chinese Yuan", flag: "🇨🇳", group: "Exotic" },
    { code: "INR", name: "Indian Rupee", flag: "🇮🇳", group: "Exotic" },
    { code: "KRW", name: "South Korean Won", flag: "🇰🇷", group: "Exotic" },
];

function getCurrencyInfo(code: string) {
    return CURRENCIES.find((c) => c.code === code);
}

function getCurrencySymbol(code: string) {
    const symbols: Record<string, string> = {
        USD: "$", EUR: "€", GBP: "£", JPY: "¥", CHF: "Fr",
        AUD: "A$", CAD: "C$", NZD: "NZ$",
        SGD: "S$", HKD: "HK$", SEK: "kr", NOK: "kr", DKK: "kr",
        PLN: "zł", TRY: "₺", MXN: "MX$", ZAR: "R",
        BRL: "R$", CNH: "¥", INR: "₹", KRW: "₩",
    };
    return symbols[code] || code;
}

function CurrencyDropdown({
    label,
    value,
    onChange,
}: {
    label: string;
    value: string;
    onChange: (code: string) => void;
}) {
    const info = getCurrencyInfo(value);
    return (
        <div className="space-y-2">
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {label}
            </label>
            <DropdownMenu className="block w-full">
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        className="w-full px-4 py-3.5 h-auto rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all text-gray-700 dark:text-white flex items-center justify-between"
                    >
                        <span className="font-bold text-base flex items-center gap-2">
                            {info?.flag} {info?.code} - {info?.name}
                        </span>
                        <ChevronDown size={16} className="text-gray-600 shrink-0" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="max-h-[360px] overflow-y-auto" style={{ minWidth: '280px' }}>
                    {(["Major", "Minor", "Exotic"] as const).map((group) => {
                        const groupCurrencies = CURRENCIES.filter((c) => c.group === group);
                        return (
                            <div key={group}>
                                <div className="px-3 py-1.5 text-[10px] font-bold text-gray-500 uppercase tracking-widest sticky top-0 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-white/5">
                                    {group} Currencies
                                </div>
                                {groupCurrencies.map((c) => (
                                    <DropdownMenuItem
                                        key={c.code}
                                        onClick={() => onChange(c.code)}
                                        className={cn(
                                            "flex items-center justify-between gap-3 px-3 py-2",
                                            value === c.code && "bg-primary/10 text-primary font-semibold"
                                        )}
                                    >
                                        <span>{c.flag} {c.code} — {c.name}</span>
                                        {value === c.code && <Check size={14} className="text-primary shrink-0" />}
                                    </DropdownMenuItem>
                                ))}
                            </div>
                        );
                    })}
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}

export function CurrencyConverter() {
    const [from, setFrom] = useState("USD");
    const [to, setTo] = useState("EUR");
    const [amount, setAmount] = useState(1000);
    const [result, setResult] = useState<{ rate: number; converted: number } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const convert = useCallback(async () => {
        if (from === to) {
            setResult({ rate: 1, converted: amount });
            return;
        }
        setLoading(true);
        setError("");
        try {
            const res = await fetch(`/api/tools/convert?from=${from}&to=${to}&amount=${amount}`);
            const data = await res.json();
            if (data.success) {
                setResult({ rate: data.rate, converted: data.converted });
            } else {
                setError(data.error || "Failed to fetch rate");
            }
        } catch {
            setError("Network error");
        } finally {
            setLoading(false);
        }
    }, [from, to, amount]);

    // Auto-convert on mount + when inputs change
    useEffect(() => {
        const debounce = setTimeout(() => { convert(); }, 300);
        return () => clearTimeout(debounce);
    }, [convert]);

    const swap = () => {
        setFrom(to);
        setTo(from);
        setResult(null);
    };

    const toCurrency = getCurrencyInfo(to);
    const toSymbol = getCurrencySymbol(to);
    const inverseRate = result && result.rate > 0 ? (1 / result.rate) : 0;

    return (
        <div className="grid lg:grid-cols-2 gap-6">
            {/* ── Left Panel: Conversion Form ── */}
            <div className="space-y-6">
                <h3 className="text-lg font-black text-gray-800 dark:text-white">Conversion</h3>

                {/* Amount */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Amount</label>
                    <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3.5 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none font-bold text-lg text-gray-700 dark:text-white transition-all hover:border-gray-300 dark:hover:border-white/20"
                    />
                </div>

                {/* From Currency */}
                <CurrencyDropdown
                    label="From Currency"
                    value={from}
                    onChange={(v) => { setFrom(v); setResult(null); }}
                />

                {/* Swap Button */}
                <div className="flex justify-center">
                    <button
                        type="button"
                        onClick={swap}
                        className="p-3 rounded-full bg-primary text-white hover:bg-primary/80 transition-all shadow-lg shadow-primary/25"
                    >
                        <ArrowUpDown size={20} />
                    </button>
                </div>

                {/* To Currency */}
                <CurrencyDropdown
                    label="To Currency"
                    value={to}
                    onChange={(v) => { setTo(v); setResult(null); }}
                />
            </div>

            {/* ── Right Panel: Result ── */}
            <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary via-teal-500 to-cyan-600 p-6 md:p-8 flex flex-col justify-between min-h-[400px]">
                {/* Decorative glows */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full blur-[60px] -mr-12 -mt-12 pointer-events-none" />
                <div className="absolute bottom-0 left-0 w-40 h-40 bg-cyan-400/20 rounded-full blur-[50px] -ml-10 -mb-10 pointer-events-none" />
                <div className="absolute top-1/2 right-1/4 w-32 h-32 bg-teal-300/10 rounded-full blur-[40px] pointer-events-none" />

                {/* Result Content */}
                <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center">
                    <p className="text-xs font-bold text-white/60 uppercase tracking-[0.2em] mb-4">
                        Converted Amount
                    </p>

                    {loading ? (
                        <RefreshCw size={32} className="text-white/60 animate-spin" />
                    ) : result ? (
                        <>
                            <p className="text-5xl md:text-6xl font-black text-white tracking-tight font-mono">
                                {toSymbol}{result.converted.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                            </p>
                            <p className="text-white/60 mt-3 text-sm font-medium">
                                1 {from} = {result.rate.toFixed(4)} {to}
                            </p>
                            <div className="mt-3 px-3 py-1 rounded-full bg-white/15 border border-white/20 text-[10px] font-bold text-white/80 uppercase tracking-wider">
                                Live Rates
                            </div>
                        </>
                    ) : error ? (
                        <p className="text-white/70 font-bold">{error}</p>
                    ) : (
                        <p className="text-white/40 text-lg font-medium">Enter amount to convert</p>
                    )}
                </div>

                {/* Rate Details */}
                {result && (
                    <div className="relative z-10 mt-6 space-y-2">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center justify-between border border-white/10">
                            <span className="text-sm text-white/70 font-medium">Exchange Rate</span>
                            <span className="font-black text-white text-lg font-mono">{result.rate.toFixed(4)}</span>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl px-5 py-3 flex items-center justify-between border border-white/10">
                            <span className="text-sm text-white/70 font-medium">Inverse Rate</span>
                            <span className="font-black text-white text-lg font-mono">{inverseRate.toFixed(4)}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
