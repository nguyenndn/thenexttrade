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
        <div className={cn("flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8", className)}>
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                        {title}
                    </h1>
                </div>
                {/* Optional Right Action Area */}
                {children && (
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {children}
                    </div>
                )}
            </div>
            {description && (
                <div className="pl-4.5">
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium">
                        {description}
                    </p>
                </div>
            )}
        </div>
    );
}
