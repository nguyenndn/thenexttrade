import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps
    extends React.InputHTMLAttributes<HTMLInputElement> {
    error?: string;
    label?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps & { startIcon?: React.ReactNode; endIcon?: React.ReactNode }>(
    ({ className, type, error, label, id, startIcon, endIcon, ...props }, ref) => {
        return (
            <div className="w-full">
                {label && (
                    <label htmlFor={id} className="label pb-1">
                        <span className="label-text font-medium text-base-content/80 text-sm">{label}</span>
                    </label>
                )}
                <div className="relative">
                    {startIcon && (
                        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none z-10">
                            {startIcon}
                        </div>
                    )}
                    <input
                        id={id}
                        type={type}
                        className={cn(
                            "w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all",
                            "placeholder:text-gray-400 dark:placeholder:text-gray-600 placeholder:font-normal",
                            "text-gray-900 dark:text-white font-medium",
                            startIcon ? "pl-10" : "",
                            endIcon ? "pr-10" : "",
                            error ? "border-red-500 focus:border-red-500 focus:ring-red-500/50" : "",
                            className
                        )}
                        ref={ref}
                        {...props}
                    />
                    {endIcon && (
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 z-10">
                            {endIcon}
                        </div>
                    )}
                </div>
                {error && (
                    <label className="label pt-1">
                        <span className="label-text-alt text-error text-xs">{error}</span>
                    </label>
                )}
            </div>
        );
    }
);
Input.displayName = "Input";

export { Input };
