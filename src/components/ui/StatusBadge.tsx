'use client';

interface StatusBadgeProps {
    status: "OPEN" | "CLOSED" | "PENDING" | string;
    className?: string;
}

export const StatusBadge = ({ status, className = "" }: StatusBadgeProps) => {
    const s = status.toUpperCase();

    let styles = "bg-gray-100 text-gray-600 border-gray-200"; // Default

    if (s === "OPEN" || s === "RUNNING") {
        styles = "bg-green-500/10 text-green-600 dark:text-green-400 border-green-500/20 animate-pulse";
    } else if (s === "CLOSED" || s === "COMPLETED") {
        styles = "bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-500 border-gray-200 dark:border-white/10";
    } else if (s === "PENDING") {
        styles = "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20";
    }

    return (
        <span className={`
            inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border
            ${styles}
            ${className}
        `}>
            <div className={`w-1.5 h-1.5 rounded-full mr-1.5 ${s === 'OPEN' ? 'bg-current animate-pulse' : 'bg-current'}`}></div>
            {status}
        </span>
    );
};
