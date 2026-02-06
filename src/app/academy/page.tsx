import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { BookOpen, TrendingUp, ShieldCheck, PlayCircle, Lock, ChevronRight } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import AcademyMap from "@/components/academy/AcademyMap";
import { getAuthUser } from "@/lib/auth-cache";

import type { Metadata } from "next";

import { JsonLd } from "@/components/seo/JsonLd";

// Academy content can be statically generated and revalidated
export const revalidate = 3600; // 1 hour

export const metadata: Metadata = {
    title: "The Trader's Ascent | GSN Academy",
    description: "Master the art of Forex trading through our structured 5-Phase career path. From Novice to Legend.",
    openGraph: {
        title: "The Trader's Ascent - Zero to Funded",
        description: "Start your professional trading journey.",
        images: ["/academy-og.jpg"],
    }
};

export default async function AcademyPage() {
    const user = await getAuthUser();

    const levels = await prisma.level.findMany({
        orderBy: { order: "asc" },
        select: {
            id: true, title: true, description: true, order: true,
            modules: {
                orderBy: { order: "asc" },
                select: {
                    id: true, title: true, description: true, // Need slug/desc for Map
                    lessons: {
                        orderBy: { order: "asc" },
                        select: { id: true, title: true, slug: true, duration: true }
                    }
                }
            }
        }
    });

    // Mock progress for now if user exists
    const userProgress = user ? { currentPhase: 1, currentModule: 2 } : null;

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117] text-gray-900 dark:text-white">
            <JsonLd
                type="Course"
                data={{
                    name: "The Trader's Ascent",
                    description: "Comprehensive Forex trading career path.",
                    provider: {
                        "@type": "Organization",
                        name: "GSN CRM",
                        sameAs: process.env.NEXT_PUBLIC_APP_URL
                    }
                }}
            />
            {/* Hero Section */}
            <section className="pt-32 sm:pt-40 pb-10 px-6 relative overflow-hidden">
                <div className="max-w-7xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00C888]/10 text-[#00C888] font-bold text-xs uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-[#00C888] animate-pulse"></span>
                        <span>Professional Career Path</span>
                    </div>

                    <h1 className="text-4xl md:text-7xl font-black mb-6 leading-tight text-gray-900 dark:text-white tracking-tight">
                        The Trader's <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#00C888] to-cyan-500">Ascent</span>
                    </h1>
                    <p className="text-lg md:text-xl mb-8 text-gray-600 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Master the markets through 5 distinct career phases. From your first trade to institutional mastery.
                    </p>
                </div>
            </section>

            {/* Galaxy Map Section */}
            <section className="relative">
                <AcademyMap levels={levels as any} userProgress={userProgress} basePath={user ? "/dashboard/academy" : "/academy"} />
            </section>

            <SiteFooter />
        </div>
    );
}
