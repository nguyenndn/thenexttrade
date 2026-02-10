"use client";
import React, { memo } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

interface SectionHeaderProps {
    title: string;
    subtitle?: string;
    align?: 'left' | 'center';
    linkHref?: string;
    linkText?: string;
    className?: string; // Allow passing extra classes
}

export const SectionHeader = memo(function SectionHeader({
    title,
    subtitle,
    align = 'left',
    linkHref,
    linkText = 'View All',
    className = ''
}: SectionHeaderProps) {

    if (align === 'center') {
        return (
            <div className={`text-center mb-12 ${className}`}>
                {subtitle && (
                    <span className="text-primary font-bold tracking-widest uppercase text-xs mb-3 block">
                        {subtitle}
                    </span>
                )}
                <h2 className="text-3xl md:text-4xl font-bold font-heading text-gray-900 dark:text-white tracking-tight flex items-center justify-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full block"></span>
                    {title}
                </h2>
            </div>
        );
    }

    return (
        <div className={`flex items-end justify-between mb-8 ${className}`}>
            <div>
                <h2 className="text-2xl md:text-3xl font-bold font-heading text-gray-900 dark:text-white flex items-center gap-3">
                    <span className="w-1.5 h-8 bg-primary rounded-full block"></span>
                    {title}
                </h2>
                {subtitle && (
                    <p className="text-gray-500 dark:text-gray-400 mt-2 ml-5 text-sm">
                        {subtitle}
                    </p>
                )}
            </div>

            {linkHref && (
                <Link
                    href={linkHref}
                    className="flex items-center gap-1 text-sm font-bold text-primary hover:gap-2 transition-all"
                >
                    {linkText} <ArrowRight size={16} />
                </Link>
            )}
        </div>
    );
});
