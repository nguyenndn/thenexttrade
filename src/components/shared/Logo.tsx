import Link from 'next/link';

export const Logo = ({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) => {
    const sizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl",
        xl: "text-4xl",
    };

    return (
        <Link href="/" className={`font-outfit font-bold flex items-center gap-2 ${className}`}>
            <div className={`rounded-lg bg-gradient-to-br from-primary to-accent text-white flex items-center justify-center font-bold ${size === 'sm' ? 'w-8 h-8 text-sm' :
                size === 'md' ? 'w-10 h-10 text-xl' :
                    size === 'lg' ? 'w-12 h-12 text-2xl' :
                        'w-16 h-16 text-3xl'
                }`}>
                G
            </div>
            <span className={`${sizeClasses[size] || "text-xl"} tracking-tight hover:text-inherit`}>
                The Next<span className="text-primary"> Trade</span>
            </span>
        </Link>
    );
};
