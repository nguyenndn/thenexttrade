'use client';

import { TrendingUp, TrendingDown, Minus } from "lucide-react";

interface PnLDisplayProps {
    value: number | null | undefined;
    showIcon?: boolean;
    currency?: string;
    className?: string;
}

export const PnLDisplay = ({ value, showIcon = false, currency = "$", className = "" }: PnLDisplayProps) => {
    const numValue = value || 0;
    const isPositive = numValue > 0;
    const isNegative = numValue < 0;

    const colorClass = isPositive
        ? "text-primary"
        : isNegative
            ? "text-red-500"
            : "text-gray-400";

    return (
        <span className={`font-mono font-bold whitespace-nowrap flex items-center gap-1 ${colorClass} ${className}`}>
            {showIcon && (
                <>
                    {isPositive && <TrendingUp size={14} />}
                    {isNegative && <TrendingDown size={14} />}
                    {numValue === 0 && <Minus size={14} />}
                </>
            )}
            {numValue < 0 ? "-" : (numValue > 0 && showIcon ? "+" : "")}
            {currency}{Math.abs(numValue).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
        </span>
    );
};
