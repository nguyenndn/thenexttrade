import Link from "next/link";
import Image from "next/image";

export const Logo = ({
    className = "",
    size = "md",
}: {
    className?: string;
    size?: "sm" | "md" | "lg" | "xl";
}) => {
    const sizeClasses = {
        sm: "text-lg",
        md: "text-xl",
        lg: "text-2xl",
        xl: "text-3xl",
    };

    const imgSizes = {
        sm: 28,
        md: 36,
        lg: 48,
        xl: 56,
    };

    return (
        <Link
            href="/"
            className={`font-outfit font-black flex items-center gap-2.5 ${className}`}
        >
            <div
                className="relative shrink-0"
                style={{ width: imgSizes[size], height: imgSizes[size] }}
            >
                <Image
                    src="/images/logo_sentinel_shield.png"
                    alt="TheNextTrade"
                    width={imgSizes[size]}
                    height={imgSizes[size]}
                    className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,200,136,0.35)]"
                    priority
                />
            </div>
            <span
                className={`${sizeClasses[size] || "text-xl"} font-black tracking-tight hover:text-inherit text-gray-900 dark:text-white`}
            >
                TheNext<span className="text-emerald-500">Trade</span>
            </span>
        </Link>
    );
};
