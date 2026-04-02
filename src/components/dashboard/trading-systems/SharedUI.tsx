"use client";

import { SVGProps } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

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
        <Button
            variant="ghost"
            onClick={onClick}
            className={cn(
                "group relative flex items-center h-auto justify-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                active
                    ? "bg-white dark:bg-[#1E2028] text-gray-900 dark:text-white shadow-sm border border-primary/30 hover:bg-white dark:hover:bg-[#1E2028]"
                    : "text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-transparent border border-transparent"
            )}
        >
            <Icon size={16} className={cn("transition-colors", active ? "text-primary" : "opacity-50 group-hover:opacity-80")} />
            <span>{label}</span>
            {count !== undefined && count > 0 && (
                <span className={cn(
                    "flex items-center justify-center min-w-[18px] h-[18px] rounded-full text-[10px] font-extrabold px-1 transition-colors",
                    active
                        ? "bg-primary/10 text-primary"
                        : "bg-gray-100 dark:bg-white/5 text-gray-400"
                )}>
                    {count}
                </span>
            )}
        </Button>
    );
}
