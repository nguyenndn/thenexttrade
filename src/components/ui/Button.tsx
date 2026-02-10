import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'accent' | 'ghost' | 'link' | 'outline' | 'destructive';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const buttonVariants = ({
  variant = 'primary',
  size = 'md',
  className = ''
}: {
  variant?: ButtonProps['variant'],
  size?: ButtonProps['size'],
  className?: string
}) => {
  const baseStyles = "inline-flex items-center justify-center gap-2 border-none font-bold transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0F1117] disabled:opacity-50 disabled:pointer-events-none rounded-xl";

  const variants = {
    primary: "bg-primary hover:bg-[#00B078] text-white shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5",
    secondary: "bg-[#2F80ED] hover:bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 hover:-translate-y-0.5",
    accent: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/30 hover:-translate-y-0.5",
    ghost: "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5",
    link: "text-primary underline-offset-4 hover:underline",
    outline: "border-2 border-gray-200 dark:border-white/10 hover:border-primary hover:text-primary bg-transparent",
    destructive: "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 hover:-translate-y-0.5",
  };

  const sizes = {
    sm: "text-xs px-4 py-2 h-auto",
    md: "text-sm px-8 py-3 h-auto",
    lg: "text-base px-10 py-4 h-auto",
    icon: "h-10 w-10 p-0",
  };

  return cn(baseStyles, variants[variant || 'primary'], sizes[size || 'md'], className);
};

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={buttonVariants({ variant, size, className })}
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
