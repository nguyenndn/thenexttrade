import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface EmptyStateProps {
    icon: LucideIcon;
    title?: string;
    description: string;
    action?: ReactNode; // Optional button to create/add item
    className?: string; // Additional classes for customizing height/padding
}

export function EmptyState({ icon: Icon, title, description, action, className }: EmptyStateProps) {
    return (
        <div className={cn("flex flex-col items-center justify-center p-8 md:p-12 text-center", className)}>
            <div className="w-16 h-16 bg-gray-50 dark:bg-white/5 rounded-xl flex items-center justify-center mb-4">
                <Icon size={32} className="text-gray-600 dark:text-gray-300 opacity-80" strokeWidth={1.5} />
            </div>
            {title && (
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {title}
                </h3>
            )}
            <p className="text-sm text-gray-600 dark:text-gray-300 font-medium max-w-sm">
                {description}
            </p>
            {action && (
                <div className="mt-6">
                    {action}
                </div>
            )}
        </div>
    );
}
