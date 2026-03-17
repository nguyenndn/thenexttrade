import Link from 'next/link';
import Image from 'next/image';

export const Logo = ({ className = "", size = "md" }: { className?: string; size?: "sm" | "md" | "lg" | "xl" }) => {
    const sizeClasses = {
        sm: "text-lg",
        md: "text-2xl",
        lg: "text-3xl",
        xl: "text-4xl",
    };

    const imgSizes = {
        sm: 32,
        md: 40,
        lg: 48,
        xl: 64,
    };

    return (
        <Link href="/" className={`font-outfit font-bold flex items-center gap-2 ${className}`}>
            <Image
                src="/images/thenexttrade-avatar.png"
                alt="TheNextTrade"
                width={imgSizes[size]}
                height={imgSizes[size]}
                className="rounded-lg"
            />
            <span className={`${sizeClasses[size] || "text-xl"} tracking-tight hover:text-inherit`}>
                The Next<span className="text-primary"> Trade</span>
            </span>
        </Link>
    );
};
