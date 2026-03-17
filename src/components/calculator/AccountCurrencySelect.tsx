"use client";

import { cn } from "@/lib/utils";

const CURRENCIES = [
    { code: "USD", symbol: "$", name: "US Dollar" },
    { code: "EUR", symbol: "€", name: "Euro" },
    { code: "GBP", symbol: "£", name: "British Pound" },
    { code: "JPY", symbol: "¥", name: "Japanese Yen" },
    { code: "AUD", symbol: "A$", name: "Australian Dollar" },
    { code: "CAD", symbol: "C$", name: "Canadian Dollar" },
    { code: "CHF", symbol: "Fr", name: "Swiss Franc" },
    { code: "NZD", symbol: "NZ$", name: "New Zealand Dollar" },
];

interface AccountCurrencySelectProps {
    value: string;
    onChange: (v: string) => void;
    className?: string;
}

export function AccountCurrencySelect({ value, onChange, className }: AccountCurrencySelectProps) {
    return (
        <div className={cn("flex flex-wrap gap-2", className)}>
            {CURRENCIES.map((c) => (
                <button
                    key={c.code}
                    type="button"
                    onClick={() => onChange(c.code)}
                    className={cn(
                        "px-3 py-2 rounded-lg text-xs font-bold transition-all border",
                        value === c.code
                            ? "bg-primary text-white border-primary shadow-sm shadow-primary/20"
                            : "bg-white dark:bg-white/5 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-white/10 hover:border-primary/50"
                    )}
                    title={c.name}
                >
                    {c.code}
                </button>
            ))}
        </div>
    );
}

export function getCurrencySymbol(code: string): string {
    return CURRENCIES.find((c) => c.code === code)?.symbol || "$";
}
