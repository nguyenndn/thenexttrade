import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title?: string;
    description?: string;
    children?: ReactNode;
    className?: string;
    mobileFullWidthButton?: boolean;
}

export function PageHeader({ title, description, children, className, mobileFullWidthButton }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6", className)}>
            {/* Left: Gradient accent bar + text */}
            <div className="flex items-center gap-4">
                {/* Gradient Bar */}
                <div className="w-1 self-stretch min-h-[40px] rounded-full bg-gradient-to-b from-primary via-emerald-400 to-teal-500 shrink-0" />
                <div>
                    {title && (
                        <h1 className="text-xl font-bold text-gray-700 dark:text-white tracking-tight">
                            {title}
                        </h1>
                    )}
                    {description && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Right: Action Area */}
            {children && (
                <div className={cn(
                    "flex items-center justify-start sm:justify-end shrink-0",
                    mobileFullWidthButton ? "w-full sm:w-auto [&>*]:w-full [&>*]:sm:w-auto" : "w-full sm:w-auto"
                )}>
                    {children}
                </div>
            )}
        </div>
    );
}
