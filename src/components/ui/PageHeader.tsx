import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
    title: string;
    description?: string;
    children?: ReactNode; // For adding buttons, filters, etc. alongside the header
    className?: string;
}

export function PageHeader({ title, description, children, className }: PageHeaderProps) {
    return (
        <div className={cn("flex flex-col xl:flex-row justify-between items-start border-b border-gray-100 dark:border-white/5 pb-8 gap-4 xl:gap-8", className)}>
            {/* Left Column: Title & Description */}
            <div className="flex flex-col gap-2 flex-1 xl:pr-4 min-w-0">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-primary rounded-full shrink-0"></div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {title}
                    </h1>
                </div>
                {description && (
                    <div className="pl-4.5">
                        <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                            {description}
                        </p>
                    </div>
                )}
            </div>

            {/* Right Column: Action Area (Filters) */}
            {children && (
                <div className="flex items-center justify-start xl:justify-end w-full xl:w-auto shrink-0 mt-2 xl:mt-0 overflow-x-auto pb-2 xl:pb-0 custom-scrollbar">
                    {children}
                </div>
            )}
        </div>
    );
}
