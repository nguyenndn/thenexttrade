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
        <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-[#0F1117] transition-colors duration-300 relative overflow-hidden">
            {/* Background Glows (Premium Aesthetic) */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-cyan-500/10 dark:bg-cyan-500/15 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 dark:bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

            <PublicHeader />
            
            <main className="flex-grow pt-24 pb-20 relative z-10 px-4">
                {children}
            </main>
            
            <SiteFooter />
        </div>
    );
}
