'use client';

import React from 'react';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';


export default function LegalLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-slate-900 transition-colors duration-300 text-gray-900 dark:text-gray-100">
            <PublicHeader />
            <main className="flex-grow pt-32 pb-10">
                <div className="container mx-auto px-4 max-w-4xl h-full">
                    <div className="bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-gray-200 dark:border-slate-700 p-8 md:p-12 prose dark:prose-invert prose-headings:text-gray-900 dark:prose-headings:text-gray-100 prose-strong:text-gray-900 dark:prose-strong:text-gray-100 max-w-none transition-colors duration-300">
                        {children}
                    </div>
                </div>
            </main>
            <SiteFooter />
        </div>
    );
}
