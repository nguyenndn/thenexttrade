"use client";

import { PIP_VALUES } from "@/lib/calculators";

interface CurrencyPairSelectProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export function CurrencyPairSelect({ value, onChange, className }: CurrencyPairSelectProps) {
    // Sort pairs alphabetically
    const pairs = Object.keys(PIP_VALUES).sort();

    return (
        <div className="relative">
            <select
                value={value}
                onChange={(e) => onChange(e.target.value)}
                className={`block w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 focus:border-primary focus:bg-white dark:focus:bg-[#1E2028] transition-all font-medium outline-none appearance-none cursor-pointer text-gray-900 dark:text-white ${className}`}
            >
                {pairs.map((pair) => (
                    <option key={pair} value={pair}>
                        {pair}
                    </option>
                ))}
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6" /></svg>
            </div>
        </div>
    );
}
