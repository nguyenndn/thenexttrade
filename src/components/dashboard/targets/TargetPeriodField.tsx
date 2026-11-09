"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { TargetTypeToggle } from "./TargetTypeToggle";
import type { TargetType } from "./TargetProgressTypes";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

export interface TargetPeriodFieldProps {
    id: string;
    label: string;
    targetType: TargetType;
    onTypeChange: (type: TargetType) => void;
    value: string;
    onValueChange: (val: string) => void;
    helperText: string;
    presets: number[];
    currency?: string;
    enabled?: boolean;
    onToggleEnabled?: (enabled: boolean) => void;
}

export function TargetPeriodField({
    id,
    label,
    targetType,
    onTypeChange,
    value,
    onValueChange,
    helperText,
    presets,
    currency = "USD",
    enabled = true,
    onToggleEnabled,
}: TargetPeriodFieldProps) {
    const showToggle = enabled !== undefined && onToggleEnabled !== undefined;

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between">
                {showToggle ? (
                    <label htmlFor={`${id}-toggle`} className="inline-flex items-center gap-2.5 cursor-pointer select-none group">
                        <input
                            id={`${id}-toggle`}
                            type="checkbox"
                            checked={enabled}
                            onChange={(e) => onToggleEnabled(e.target.checked)}
                            className="sr-only peer"
                        />
                        <span
                            aria-hidden="true"
                            className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out peer-focus-visible:ring-2 peer-focus-visible:ring-amber-500/40 ${
                                enabled
                                    ? "bg-gold shadow-sm shadow-amber-500/25"
                                    : "bg-gray-200 dark:bg-white/15 group-hover:bg-gray-300 dark:group-hover:bg-white/25"
                            }`}
                        >
                            <span
                                className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out ${
                                    enabled ? "translate-x-4" : "translate-x-0"
                                }`}
                            />
                        </span>
                        <span
                            className={`text-xs font-bold uppercase tracking-wider transition-colors ${
                                enabled ? "text-gray-800 dark:text-white" : "text-gray-500 dark:text-gray-400"
                            }`}
                        >
                            {label}
                        </span>
                    </label>
                ) : (
                    <label htmlFor={id} className="text-xs font-bold uppercase tracking-wider text-gray-500">
                        {label}
                    </label>
                )}
                <TargetTypeToggle value={targetType} onChange={onTypeChange} currency={currency} />
            </div>
            <PremiumInput
                id={id}
                type="number"
                step="any"
                min="0"
                value={value}
                onChange={(e) => onValueChange(e.target.value)}
                helperText={helperText}
            />
            <div className="flex flex-wrap gap-1.5 pt-1">
                {presets.map((preset) => (
                    <Button
                        key={preset}
                        variant="outline"
                        size="sm"
                        type="button"
                        onClick={() => onValueChange(String(preset))}
                        className="h-6 px-2 text-xs font-mono rounded-lg"
                    >
                        {targetType === "USD" ? formatDashboardCurrency(preset, currency, { fractionDigits: 0 }) : `${preset}%`}
                    </Button>
                ))}
            </div>
        </div>
    );
}
