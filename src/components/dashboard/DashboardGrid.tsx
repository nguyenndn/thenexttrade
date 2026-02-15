import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface DashboardGridProps {
    children: ReactNode;
    className?: string;
}

export function DashboardGrid({ children, className }: DashboardGridProps) {
    return (
        <div className={cn(
            "grid grid-cols-1 xl:grid-cols-12 gap-4",
            className
        )}>
            {children}
        </div>
    );
}

export function DashboardMain({ children, className }: DashboardGridProps) {
    return (
        <div className={cn(
            "xl:col-span-7 flex flex-col gap-4",
            className
        )}>
            {children}
        </div>
    );
}

export function DashboardSide({ children, className }: DashboardGridProps) {
    return (
        <div className={cn(
            "xl:col-span-5 grid grid-cols-1 md:grid-cols-2 xl:flex xl:flex-col gap-4",
            className
        )}>
            {children}
        </div>
    );
}
