"use client";

import React from 'react';
import { Loader2 } from 'lucide-react';
import { ButtonSizeContext } from '@/components/providers/AdminButtonSizeProvider';
import { buttonVariants, ButtonSize, ButtonVariant } from './button-variants';

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: ButtonVariant;
    size?: ButtonSize;
    isLoading?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'primary', size, isLoading, children, ...props }, ref) => {
        const contextSize = React.useContext(ButtonSizeContext);
        const activeSize = (size === undefined || size === 'md' || size === 'sm') && contextSize ? contextSize : (size || 'md');

        return (
            <button
                ref={ref}
                className={buttonVariants({ variant, size: activeSize, className })}
                disabled={isLoading || props.disabled}
                {...props}
            >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                {children}
            </button>
        );
    }
);
Button.displayName = "Button";

export { Button };
