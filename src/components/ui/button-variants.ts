import { cn } from "@/lib/utils";

export type ButtonVariant =
    | "primary"
    | "secondary"
    | "accent"
    | "ghost"
    | "link"
    | "outline"
    | "destructive";
export type ButtonSize = "sm" | "md" | "lg" | "icon" | "smd";

export function buttonVariants({
    variant = "primary",
    size = "md",
    className = "",
}: {
    variant?: ButtonVariant;
    size?: ButtonSize;
    className?: string;
}) {
    const baseStyles =
        "inline-flex items-center justify-center gap-2 border border-transparent font-bold transition-all duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0F1117] disabled:opacity-50 disabled:pointer-events-none rounded-xl";
    const variants: Record<ButtonVariant, string> = {
        primary:
            "bg-primary hover:bg-[#00B078] text-white shadow-lg hover:shadow-primary/25",
        secondary:
            "bg-[#2F80ED] hover:bg-[#2563EB] text-white shadow-lg shadow-blue-500/30",
        accent: "bg-cyan-500 hover:bg-cyan-600 text-white shadow-lg shadow-cyan-500/30",
        ghost: "text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5",
        link: "text-primary underline-offset-4 hover:underline",
        outline:
            "border-dashboard hover:border-gray-300 dark:hover:border-white/20 text-gray-700 dark:text-gray-300 bg-transparent hover:bg-gray-50 dark:hover:bg-white/5",
        destructive:
            "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30",
    };
    const sizes: Record<ButtonSize, string> = {
        sm: "text-xs px-3 py-1.5 h-auto",
        smd: "text-xs px-4 h-9",
        md: "text-sm px-6 py-2.5 h-auto",
        lg: "text-base px-8 py-3 h-auto",
        icon: "h-10 w-10 p-0",
    };

    return cn(baseStyles, variants[variant], sizes[size], className);
}
