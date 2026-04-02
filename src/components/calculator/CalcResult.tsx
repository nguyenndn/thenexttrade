"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

/* ─── Primary Result: Gradient hero card ─── */
interface CalcResultPrimaryProps {
    label: string;
    value: string;
    unit?: string;
    className?: string;
}

export function CalcResultPrimary({ label, value, unit, className }: CalcResultPrimaryProps) {
    return (
        <div
            className={cn(
                "relative overflow-hidden rounded-2xl p-6",
                "bg-gradient-to-br from-primary to-teal-500",
                "shadow-lg shadow-primary/25",
                className,
            )}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-[40px] -mr-8 -mt-8 pointer-events-none" />
            <div className="absolute bottom-0 left-0 w-20 h-20 bg-white/10 rounded-full blur-[30px] -ml-4 -mb-4 pointer-events-none" />

            <div className="relative z-10">
                <p className="text-xs font-bold text-white/70 uppercase tracking-wider mb-2">
                    {label}
                </p>
                <div className="flex items-baseline gap-2">
                    <span className="text-3xl md:text-4xl font-black text-white tracking-tight">
                        {value}
                    </span>
                    {unit && (
                        <span className="text-base font-semibold text-white/70">
                            {unit}
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}

/* ─── Secondary Result Card ─── */
interface CalcResultCardProps {
    label: string;
    value: string;
    valueColor?: string;
    className?: string;
}

export function CalcResultCard({ label, value, valueColor, className }: CalcResultCardProps) {
    return (
        <div
            className={cn(
                "rounded-xl p-4 text-center",
                "bg-gray-50 dark:bg-white/5",
                "border border-gray-200 dark:border-white/10",
                "hover:border-primary/30 transition-colors duration-200",
                className,
            )}
        >
            <p className="text-[10px] font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider mb-1">
                {label}
            </p>
            <p className={cn("text-xl md:text-2xl font-black", valueColor || "text-gray-900 dark:text-white")}>
                {value}
            </p>
        </div>
    );
}

/* ─── Result Grid Wrapper ─── */
interface CalcResultGridProps {
    children: ReactNode;
    cols?: 2 | 3 | 4;
    className?: string;
}

export function CalcResultGrid({ children, cols = 2, className }: CalcResultGridProps) {
    const colClass = {
        2: "grid-cols-2",
        3: "grid-cols-3",
        4: "grid-cols-2 sm:grid-cols-4",
    }[cols];

    return (
        <div className={cn("grid gap-3", colClass, className)}>
            {children}
        </div>
    );
}
