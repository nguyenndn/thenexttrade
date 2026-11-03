"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { DollarSign, Percent } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TargetType } from "./TargetProgressTypes";

export interface TargetTypeToggleProps {
    value: TargetType;
    onChange: (type: TargetType) => void;
    className?: string;
}

export function TargetTypeToggle({ value, onChange, className }: TargetTypeToggleProps) {
    const activeStyle = "bg-white dark:bg-slate-800 text-amber-500 shadow-sm";
    const inactiveStyle = "text-gray-500 hover:text-gray-700 dark:text-gray-400";
    return (
        <div className={cn("inline-flex rounded-lg border border-gray-200 dark:border-white/10 p-0.5 bg-gray-100 dark:bg-white/5", className)}>
            <Button
                type="button" variant="ghost" size="sm" onClick={() => onChange("USD")}
                className={cn("h-6 px-2 text-xs font-semibold rounded-lg flex items-center gap-0.5 transition-colors", value === "USD" ? activeStyle : inactiveStyle)}
            >
                <DollarSign size={12} /> USD
            </Button>
            <Button
                type="button" variant="ghost" size="sm" onClick={() => onChange("PERCENT")}
                className={cn("h-6 px-2 text-xs font-semibold rounded-lg flex items-center gap-0.5 transition-colors", value === "PERCENT" ? activeStyle : inactiveStyle)}
            >
                <Percent size={12} /> Equity
            </Button>
        </div>
    );
}
