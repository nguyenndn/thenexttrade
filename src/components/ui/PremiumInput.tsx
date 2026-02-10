import React from 'react';
import { cn } from '@/lib/utils';
import { LucideIcon } from 'lucide-react';

export interface PremiumInputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
    icon?: LucideIcon;
}

const PremiumInput = React.forwardRef<HTMLInputElement, PremiumInputProps>(
    ({ className, type, error, label, id, icon: Icon, ...props }, ref) => {
        return (
            <div className="w-full space-y-2">
                {label && (
                    <label
                        htmlFor={id}
                        className="block text-xs font-bold text-gray-400 uppercase tracking-wider"
                    >
                        {label}
                    </label>
                )}
                <div className="relative group transition-all duration-300">
                    {Icon && (
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Icon
                                size={16}
                                className="text-gray-400 group-focus-within:text-primary transition-colors duration-300"
                            />
                        </div>
                    )}
                    <input
                        id={id}
                        type={type}
                        aria-invalid={!!error}
                        aria-describedby={error ? `${id}-error` : undefined}
                        className={cn(
                            "w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-sm outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:border-primary transition-all",
                            "placeholder:text-gray-400 dark:placeholder:text-gray-500 placeholder:font-normal",
                            "text-gray-900 dark:text-white font-medium",
                            Icon ? "pl-9" : "",
                            error ? "border-red-500 focus-visible:border-red-500 focus-visible:ring-red-500/50" : "",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                </div>
                {error && (
                    <p
                        id={`${id}-error`}
                        role="alert"
                        className="text-red-500 text-xs font-bold animate-in slide-in-from-top-1"
                    >
                        {error}
                    </p>
                )}
            </div>
        );
    }
);
PremiumInput.displayName = "PremiumInput";

export { PremiumInput };
