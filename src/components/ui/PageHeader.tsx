import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title?: string; // Kept for SEO/accessibility but hidden visually
    description?: string;
    children?: ReactNode; // For adding buttons, filters, etc. alongside the header
    className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4", className)}>
            {/* Left: Description only (H1 removed — sidebar already indicates current page) */}
            {description && (
                <p className="text-base text-primary font-semibold border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg px-4 py-2 w-fit">{description}</p>
            )}

            {/* Hidden H1 for SEO/Accessibility */}
            {title && <h1 className="sr-only">{title}</h1>}

            {/* Right: Action Area (Filters, Buttons) */}
            {children && (
                <div className="flex items-center justify-start lg:justify-end w-full lg:w-auto shrink-0">
                    {children}
                </div>
            )}
        </div>
    );
}
