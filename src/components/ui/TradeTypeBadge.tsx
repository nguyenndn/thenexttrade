'use client';

interface TradeTypeBadgeProps {
    type: "BUY" | "SELL";
    className?: string;
}

export const TradeTypeBadge = ({ type, className = "" }: TradeTypeBadgeProps) => {
    const isBuy = type === "BUY";

    return (
        <span className={`
            inline-flex items-center justify-center px-2.5 py-1 rounded-lg text-xs font-bold uppercase tracking-wider
            ${isBuy
                ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20'
                : 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20'
            }
            ${className}
        `}>
            {type}
        </span>
    );
};
