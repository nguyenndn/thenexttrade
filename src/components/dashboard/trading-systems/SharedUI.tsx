"use client";

import { SVGProps } from "react";
import { cn } from "@/lib/utils";

export const CustomBotIcon = ({ size = 24, className, ...props }: { size?: number | string } & SVGProps<SVGSVGElement>) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        {...props}
    >
        <path d="M12 8V4H8"></path>
        <rect width="16" height="12" x="4" y="8" rx="2"></rect>
        <path d="M2 14h2"></path>
        <path d="M20 14h2"></path>
        <path d="M15 13v2"></path>
        <path d="M9 13v2"></path>
    </svg>
);

export interface FilterTabProps {
    label: string;
    icon: any;
    count?: number;
    active: boolean;
    onClick: () => void;
}

export function FilterTab({ label, icon: Icon, count, active, onClick }: FilterTabProps) {
    return (
        <button
            onClick={onClick}
            className={cn(
                "group relative flex-1 flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl text-sm font-bold transition-all duration-300",
                active
                    ? "bg-white dark:bg-[#1E2028] text-gray-900 dark:text-white shadow-[0_4px_20px_-2px_rgba(0,0,0,0.1)] dark:shadow-[0_4px_20px_-4px_rgba(0,200,136,0.15)] ring-1 ring-black/5 dark:ring-white/10 scale-100"
                    : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-200 hover:bg-black/5 dark:hover:bg-white/5 active:scale-95"
            )}
        >
            <Icon size={18} className={cn("transition-colors duration-300", active ? "text-primary scale-110" : "opacity-60 group-hover:opacity-100")} />
            <span className="whitespace-nowrap">{label}</span>
            {count !== undefined && count > 0 && (
                <span className={cn(
                    "ml-1 flex items-center justify-center min-w-[20px] h-5 rounded-full text-[10px] font-extrabold px-1.5 transition-all duration-300",
                    active
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-200 dark:bg-white/10 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300"
                )}>
                    {count}
                </span>
            )}
        </button>
    );
}
