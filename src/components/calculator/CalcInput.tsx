"use client";

import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface CalcInputProps {
    label: string;
    value: number | string;
    onChange: (value: string) => void;
    type?: "number" | "text";
    step?: string;
    icon?: LucideIcon;
    suffix?: string;
    className?: string;
}

export function CalcInput({
    label,
    value,
    onChange,
    type = "number",
    step,
    icon: Icon,
    suffix,
    className,
}: CalcInputProps) {
    return (
        <div className={cn("space-y-2", className)}>
            <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                {label}
            </label>
            <div className="relative">
                {Icon && (
                    <Icon
                        size={18}
                        className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-300 pointer-events-none"
                    />
                )}
                <input
                    type={type}
                    step={step}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className={cn(
                        "w-full py-3 bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl",
                        "font-bold text-lg text-gray-700 dark:text-white",
                        "outline-none transition-all duration-200",
                        "focus:border-primary focus:ring-2 focus:ring-primary/20",
                        "hover:border-gray-300 dark:hover:border-white/20",
                        Icon ? "pl-10 pr-4" : "px-4",
                        suffix ? "pr-12" : "",
                    )}
                />
                {suffix && (
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-600 dark:text-gray-300 pointer-events-none">
                        {suffix}
                    </span>
                )}
            </div>
        </div>
    );
}
