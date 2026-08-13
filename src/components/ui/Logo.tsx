"use client";
import React, { memo } from "react";
import Link from "next/link";
import Image from "next/image";

export const Logo = memo(function Logo({
    className = "",
    textClassName = "",
    size = "md",
}: {
    className?: string;
    textClassName?: string;
    size?: "sm" | "md" | "lg" | "xl";
}) {
    const iconSize =
        size === "sm"
            ? "w-7 h-7"
            : size === "lg"
            ? "w-12 h-12"
            : size === "xl"
            ? "w-14 h-14"
            : "w-9 h-9";
    const pxSize =
        size === "sm" ? 28 : size === "lg" ? 48 : size === "xl" ? 56 : 36;

    return (
        <Link
            href="/"
            className={`flex items-center gap-2.5 group cursor-pointer ${className}`}
        >
            <div className={`relative ${iconSize} shrink-0 group-hover:scale-105 transition-transform`}>
                <Image
                    src="/images/logo_sentinel_shield.png"
                    alt="TheNextTrade"
                    width={pxSize}
                    height={pxSize}
                    className="w-full h-full object-contain filter drop-shadow-[0_0_8px_rgba(0,200,136,0.35)]"
                    priority
                />
            </div>
            <span
                className={`text-xl font-black tracking-tight ${textClassName || "text-gray-900 dark:text-white"}`}
            >
                TheNext<span className="text-emerald-500 font-black">Trade</span>
            </span>
        </Link>
    );
});
