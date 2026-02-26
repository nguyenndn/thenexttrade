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
                ? 'bg-primary/10 text-[#00C888] dark:text-[#00C888] border border-primary/20'
                : 'bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20'
            }
            ${className}
        `}>
            {type}
        </span>
    );
};
