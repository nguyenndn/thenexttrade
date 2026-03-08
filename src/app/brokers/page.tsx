
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ShieldCheck } from 'lucide-react';
import { DynamicFirefly as FireflyBackground } from '@/components/ui/DynamicFirefly';
import { buttonVariants } from '@/components/ui/Button';

export const metadata: Metadata = {
    title: 'Trusted Forex Brokers | The Next Trade',
    description: 'Compare and choose the best forex brokers for your trading journey. Trusted, regulated, and reviewed.',
};

import { getBrokers } from '@/app/actions/brokers';
import { getAuthUser } from '@/lib/auth-cache';

// Removed DEFAULT_BROKERS fallback to ensure strict DB rendering

export default async function BrokersPage() {
    const user = await getAuthUser();

    // Fetch from DB
    const { data: dbBrokers } = await getBrokers();

    // Use DB data strictly
    const brokers = dbBrokers || [];

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-[#0F1117]">
            {/* Wrapper for Firefly Effect & Grid */}
            <div className="relative overflow-hidden">
                {/* Background Effects */}
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none"></div>
                <FireflyBackground />

                <PublicHeader user={user} />

                <div className="pt-32 sm:pt-40 pb-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto relative z-10">
                    {/* Header */}
                    <div className="text-center mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-6 border border-primary/20 animate-in fade-in slide-in-from-bottom-4">
                            <ShieldCheck size={16} />
                            <span>Verified Partners</span>
                        </div>
                        <h1 className="text-4xl md:text-6xl font-black text-gray-900 dark:text-white mb-6 tracking-tight animate-in fade-in slide-in-from-bottom-5">
                            Top <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-teal-400">Trusted Brokers</span>
                        </h1>
                        <p className="text-lg md:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed animate-in fade-in slide-in-from-bottom-6">
                            We have tested and reviewed the best forex brokers in the market to help you choose the right partner for your trading journey.
                        </p>
                    </div>

                    {/* Brokers Grid or Empty State */}
                    {brokers.length === 0 ? (
                        <div className="text-center py-20 bg-white/50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                            <ShieldCheck size={48} className="mx-auto text-gray-300 dark:text-gray-600 mb-4" />
                            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Trusted Brokers Listed Yet</h3>
                            <p className="text-gray-500 dark:text-gray-400">Our team is currently reviewing and verifying partners. Please check back soon.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {brokers.map((broker: any, index: number) => (
                                <div key={broker.id || index} className="bg-white/80 dark:bg-[#1E2028]/80 backdrop-blur-sm rounded-xl p-8 shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-shadow group hover:shadow-md">
                                    <div className="flex items-center justify-between mb-6">
                                        <div className="w-16 h-16 rounded-xl bg-gray-50 dark:bg-white/5 p-2 flex items-center justify-center">
                                            {/* eslint-disable-next-line @next/next/no-img-element */}
                                            <img src={broker.logo} alt={broker.name} className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex items-center gap-1 bg-yellow-50 dark:bg-yellow-900/20 px-3 py-1 rounded-full">
                                            <span className="text-yellow-500">★</span>
                                            <span className="font-bold text-gray-900 dark:text-white">{broker.rating}</span>
                                        </div>
                                    </div>

                                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">{broker.name}</h3>
                                    <p className="text-gray-500 dark:text-gray-400 mb-6 line-clamp-2 min-h-[48px]">
                                        {broker.summary || broker.description}
                                    </p>

                                    <ul className="space-y-3 mb-8 min-h-[100px]">
                                        {broker.features?.slice(0, 3).map((feature: string, i: number) => (
                                            <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                                                <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                                                {feature}
                                            </li>
                                        ))}
                                    </ul>

                                    <a
                                        href={broker.affiliateUrl || broker.url || '#'}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className={`${buttonVariants({ variant: 'primary' })} w-full text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:scale-105 active:scale-95 transition-all border-none`}
                                        style={{ backgroundColor: 'hsl(var(--primary))', color: 'white' }}
                                    >
                                        Open Account
                                    </a>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
