import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title?: string;
    description?: string;
    children?: ReactNode;
    className?: string;
    mobileFullWidthButton?: boolean;
    accentColor?: "gold" | "primary";
}

export function PageHeader({
    title,
    description,
    children,
    className,
    mobileFullWidthButton,
    accentColor = "gold",
}: PageHeaderProps) {
    return (
        <div
            id="onborda-page-header"
            className={cn(
                "flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-2",
                className
            )}
        >
            {/* Left: Gradient accent bar + text */}
            <div className="flex items-center gap-4">
                {/* Gradient Bar */}
                <div
                    className={cn(
                        "w-1 self-stretch min-h-[40px] rounded-full shrink-0",
                        accentColor === "gold"
                            ? "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                            : "bg-gradient-to-b from-primary via-emerald-400 to-teal-500"
                    )}
                />
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
                <div
                    className={cn(
                        "flex items-center justify-start sm:justify-end shrink-0",
                        mobileFullWidthButton
                            ? "w-full sm:w-auto [&>*]:w-full [&>*]:sm:w-auto"
                            : "w-full sm:w-auto"
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
