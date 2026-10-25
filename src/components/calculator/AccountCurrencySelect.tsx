"use client";

import { cn } from "@/lib/utils";

import { Button } from "@/components/ui/Button";

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

export function AccountCurrencySelect({
    value,
    onChange,
    className,
}: AccountCurrencySelectProps) {
    return (
        <div role="tablist" aria-label="Account Currency" className={cn("flex flex-wrap gap-2", className)}>
            {CURRENCIES.map((c) => (
                <Button
                    key={c.code}
                    type="button"
                    variant={value === c.code ? "primary" : "outline"}
                    size="sm"
                    role="tab"
                    aria-selected={value === c.code}
                    aria-label={`${c.code} (${c.name})`}
                    onClick={() => onChange(c.code)}
                    title={c.name}
                >
                    {c.code}
                </Button>
            ))}
        </div>
    );
}

export function getCurrencySymbol(code: string): string {
    return CURRENCIES.find((c) => c.code === code)?.symbol || "$";
}
