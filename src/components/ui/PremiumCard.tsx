import React from 'react';
import { cn } from '@/lib/utils';

export interface PremiumCardProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'glass' | 'highlight';
    glow?: boolean;
}

const PremiumCard = React.forwardRef<HTMLDivElement, PremiumCardProps>(
    ({ className, variant = 'default', glow = false, children, ...props }, ref) => {
        return (
            <div
                ref={ref}
                className={cn(
                    "relative overflow-hidden transition-all duration-500",
                    "hover:shadow-md transition-shadow",
                    // Base shapes
                    "rounded-xl border",

                    // Default Variant (Solid)
                    variant === 'default' && [
                        "bg-white dark:bg-[#1E2028]",
                        "border-gray-100 dark:border-white/5",
                        "shadow-sm hover:shadow-md"
                    ],

                    // Glass Variant (Blur)
                    variant === 'glass' && [
                        "bg-white/80 dark:bg-[#151925]/80 backdrop-blur-xl",
                        "border-gray-200 dark:border-white/10",
                        "shadow-lg"
                    ],

                    // Highlight Variant (e.g., Preview Panel)
                    // Highlight Variant (e.g., Preview Panel)
                    variant === 'highlight' && [
                        "bg-[#151925] text-white", // Default to dark for premium feel? No, user wants light in light mode.
                        // Let's make it responsive.
                        "bg-white dark:bg-[#151925]",
                        "text-gray-900 dark:text-white",
                        "border-gray-200 dark:border-white/10",
                        "shadow-2xl"
                    ],

                    className
                )}
                {...props}
            >
                {/* Optional Glow Effect for Highlights */}
                {glow && (
                    <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-[80px] pointer-events-none animate-pulse" />
                )}

                {/* Content Z-Index */}
                <div className="relative z-10 h-full">
                    {children}
                </div>
            </div>
        );
    }
);
PremiumCard.displayName = "PremiumCard";

export { PremiumCard };
