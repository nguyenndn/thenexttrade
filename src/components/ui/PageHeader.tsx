import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title?: string; // Kept for SEO/accessibility but hidden visually
    description?: string;
    children?: ReactNode; // For adding buttons, filters, etc. alongside the header
    className?: string;
    mobileFullWidthButton?: boolean; // When true, children take full width on mobile
}

export function PageHeader({ title, description, children, className, mobileFullWidthButton }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4", className)}>
            {/* Left: Description — fullwidth bg on mobile, w-fit on sm+ */}
            {description && (
                <p className="text-base text-primary font-semibold border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-lg sm:rounded-none sm:rounded-r-lg px-4 py-2 w-full sm:w-fit">{description}</p>
            )}

            {/* Hidden H1 for SEO/Accessibility */}
            {title && <h1 className="sr-only">{title}</h1>}

            {/* Right: Action Area (Filters, Buttons) */}
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
