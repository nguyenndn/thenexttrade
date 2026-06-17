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
 <div className="flex flex-col min-h-screen bg-[#F7F4EC] dark:bg-transparent transition-colors duration-300 relative overflow-hidden">
 <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(245,158,11,0.16)_0%,rgba(255,255,255,0.72)_34%,rgba(16,185,129,0.10)_100%)] dark:bg-[linear-gradient(135deg,rgba(43,35,68,0.60)_0%,rgba(25,52,81,0.46)_48%,rgba(6,69,79,0.38)_100%)] pointer-events-none" />

 <PublicHeader />
 
 <main className="flex-grow pt-24 pb-20 relative z-10 px-4">
 {children}
 </main>
 
 <SiteFooter />
 </div>
 );
}
