"use client";
import React, { memo } from 'react';
import Link from "next/link";
import Image from "next/image";

export const Logo = memo(function Logo({ className, textClassName }: { className?: string, textClassName?: string }) {
    return (
        <Link href="/" className={`flex items-center gap-2 group cursor-pointer ${className}`}>
            {/* Avatar temporarily hidden — uncomment when replacement is ready
            <Image
                src="/images/thenexttrade-avatar.png"
                alt="TheNextTrade"
                width={32}
                height={32}
                className="rounded-lg group-hover:scale-105 transition-transform"
            />
            */}
            <span className={`text-lg font-extrabold tracking-tight ${textClassName || "text-gray-900 dark:text-white"}`}>
                TheNext<span className="text-primary">Trade</span>
            </span>
        </Link>
    );
});
