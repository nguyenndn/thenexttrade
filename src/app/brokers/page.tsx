
import { Metadata } from 'next';
import { PublicHeader } from '@/components/layout/PublicHeader';
import { SiteFooter } from '@/components/layout/SiteFooter';
import { DynamicFirefly as FireflyBackground } from '@/components/ui/DynamicFirefly';
import { getAuthUser } from '@/lib/auth-cache';
import BrokersClient from './BrokersClient';

export const metadata: Metadata = {
    title: "Trader's Toolkit — Brokers, Prop Firms & VPS | The Next Trade",
    description: 'Handpicked forex brokers, prop trading firms, and VPS hosting we personally use and trust.',
};

export default async function BrokersPage() {
    const user = await getAuthUser();

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14] text-gray-900 dark:text-white">
            <PublicHeader user={user} />

            <main className="flex-1 pt-32 pb-20 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--primary))_1px,transparent_1px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />
                <FireflyBackground />

                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                    <BrokersClient />
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
