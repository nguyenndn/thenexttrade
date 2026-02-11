
import { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { ShieldCheck } from 'lucide-react';
import { DynamicFirefly as FireflyBackground } from '@/components/ui/DynamicFirefly';

export const metadata: Metadata = {
    title: 'Trusted Forex Brokers | The Next Trade',
    description: 'Compare and choose the best forex brokers for your trading journey. Trusted, regulated, and reviewed.',
};

import { getBrokers } from '@/app/actions/brokers';
import { getAuthUser } from '@/lib/auth-cache';

// Default Data (Fallback if DB is empty)
const DEFAULT_BROKERS = [
    {
        id: "default-1",
        name: "Exness",
        rating: 5.0,
        logo: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Exness_logo.png",
        url: "#",
        summary: "Instant withdrawals, low spreads, and infinite leverage.",
        features: ["Unlimited Leverage", "Instant Withdrawals", "Raw Spread Account"],
        affiliateUrl: "#"
    },
    {
        id: "default-2",
        name: "IC Markets",
        rating: 4.9,
        logo: "https://yt3.googleusercontent.com/ytc/AIdro_n4n7l3q8J9I1z5Z5Q6t8k7mL8n9o0p1q2r3s4t=s900-c-k-c0x00ffffff-no-rj",
        url: "#",
        summary: "True ECN broker with raw spreads and fast execution.",
        features: ["True ECN", "Raw Spreads from 0.0", "Fast Execution"],
        affiliateUrl: "#"
    },
    {
        id: "default-3",
        name: "XM",
        rating: 4.8,
        logo: "https://yt3.googleusercontent.com/ytc/AIdro_kX4j5l6m7n8o9p0q1r2s3t4u5v6w7x8y9z0=s900-c-k-c0x00ffffff-no-rj",
        url: "#",
        summary: "Global broker with bonus programs and excellent education.",
        features: ["$30 No Deposit Bonus", "Low Spreads", "Rebates"],
        affiliateUrl: "#"
    },
];

export default async function BrokersPage() {
    const user = await getAuthUser();

    // Fetch from DB
    const { data: dbBrokers } = await getBrokers();

    // Use DB data if exists, else fallback
    const brokers = (dbBrokers && dbBrokers.length > 0) ? dbBrokers : DEFAULT_BROKERS;

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

                    {/* Brokers Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {brokers.map((broker: any, index: number) => (
                            <div key={broker.id || index} className="bg-white/80 dark:bg-[#1E2028]/80 backdrop-blur-sm rounded-3xl p-8 shadow-sm border border-gray-100 dark:border-white/5 hover:border-primary transition-all duration-300 group hover:-translate-y-1 hover:shadow-xl">
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
                                    className="block w-full text-center py-3 px-6 bg-primary hover:bg-[#00B078] text-white font-bold rounded-xl transition-colors shadow-lg shadow-primary/20"
                                >
                                    Open Account
                                </a>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <SiteFooter />
        </main>
    );
}
