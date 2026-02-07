import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardGridProps {
    children: ReactNode;
    className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
    return (
        <div className={cn(
            "grid grid-cols-1 xl:grid-cols-12 gap-6",
            className
        )}>
            {children}
        </div>
    );
}

export function DashboardMain({ children, className }: DashboardGridProps) {
    return (
        <div className={cn(
            "xl:col-span-7 flex flex-col gap-6",
            className
        )}>
            {children}
        </div>
    );
}

export function DashboardSide({ children, className }: DashboardGridProps) {
    return (
        <div className={cn(
            "xl:col-span-5 flex flex-col gap-6",
            className
        )}>
            {children}
        </div>
    );
}
