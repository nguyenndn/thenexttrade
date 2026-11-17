import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title?: string;
    description?: string;
    children?: ReactNode;
    className?: string;
    mobileFullWidthButton?: boolean;
    hideDescriptionOnMobile?: boolean;
    showOnMobile?: boolean;
    accentColor?: "gold" | "primary";
}

export function PageHeader({
    title,
    description,
    children,
    className,
    mobileFullWidthButton,
    hideDescriptionOnMobile = false,
    showOnMobile = false,
    accentColor = "gold",
}: PageHeaderProps) {
    const hideEntireWrapperOnMobile = !showOnMobile && !children;

    return (
        <div
            id="onborda-page-header"
            className={cn(
                hideEntireWrapperOnMobile
                    ? "hidden md:flex md:flex-row md:items-center justify-between gap-4 mb-2 page-header-mobile-empty"
                    : cn(
                          "flex flex-col md:flex-row md:items-center justify-between gap-2 md:gap-4",
                          showOnMobile ? "mb-2" : "mb-0 md:mb-2"
                      ),
                className
            )}
        >
            {/* Left: Gradient accent bar + text (hidden on < md unless showOnMobile) */}
            <div
                className={cn(
                    showOnMobile ? "flex" : "hidden md:flex",
                    "items-center gap-3 sm:gap-4 min-w-0"
                )}
            >
                {/* Gradient Bar */}
                <div
                    className={cn(
                        "w-1 self-stretch min-h-[32px] sm:min-h-[40px] rounded-full shrink-0",
                        accentColor === "gold"
                            ? "bg-gradient-to-b from-amber-400 via-amber-500 to-amber-600 shadow-[0_0_8px_rgba(245,158,11,0.25)]"
                            : "bg-gradient-to-b from-primary via-emerald-400 to-teal-500"
                    )}
                />
                <div className="min-w-0">
                    {title && (
                        <h1 className="text-lg sm:text-xl font-bold text-gray-700 dark:text-white tracking-tight">
                            {title}
                        </h1>
                    )}
                    {description && (
                        <p
                            className={cn(
                                "text-xs sm:text-sm text-gray-600 dark:text-gray-300 mt-0.5 line-clamp-1 sm:line-clamp-none",
                                hideDescriptionOnMobile && "hidden sm:block"
                            )}
                        >
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Right: Action Area */}
            {children && (
                <div
                    className={cn(
                        "flex items-center justify-start md:justify-end shrink-0",
                        mobileFullWidthButton
                            ? "w-full md:w-auto [&>*]:w-full [&>*]:md:w-auto"
                            : "w-full md:w-auto"
                    )}
                >
                    {children}
                </div>
            )}
        </div>
    );
}
