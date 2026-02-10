"use client";
import React, { memo } from 'react';
import Link from "next/link";
import { TrendingUp } from "lucide-react";

export const Logo = memo(function Logo({ className, textClassName }: { className?: string, textClassName?: string }) {
    return (
        <Link href="/" className={`flex items-center gap-2 group ${className}`}>
            <div className="bg-primary p-1 rounded-lg group-hover:bg-[#00b078] transition-colors">
                <TrendingUp size={20} className="text-[#0B0E14]" />
            </div>
            <span className={`text-lg font-bold tracking-tight ${textClassName || "text-gray-900 dark:text-white"}`}>
                TheNext<span className="text-primary">Trade</span>
            </span>
        </Link>
    );
});
