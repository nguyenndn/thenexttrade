import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { GraduationCap, PlayCircle } from "lucide-react";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { getAuthUser } from "@/lib/auth-cache";
import { AcademyTree } from "@/components/academy/AcademyTree";
import { JsonLd } from "@/components/seo/JsonLd";

import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "The Trader's Ascent | TheNextTrade Academy",
    description: "Master the art of Forex trading through our structured 11-Level career path. From First Steps to Ready to Trade.",
    openGraph: {
        title: "The Trader's Ascent - Zero to Funded",
        description: "Start your professional trading journey.",
        images: ["/academy-og.jpg"],
    }
};

export default async function AcademyPage() {
    const user = await getAuthUser();
    const basePath = user ? "/dashboard/academy" : "/academy";

    const levels = await prisma.level.findMany({
        orderBy: { order: "asc" },
        select: {
            id: true, title: true, description: true, order: true, accessLevel: true,
            modules: {
                orderBy: { order: "asc" },
                select: {
                    id: true, title: true,
                    lessons: {
                        orderBy: { order: "asc" },
                        select: { id: true, slug: true }
                    },
                    _count: { select: { lessons: true } }
                }
            }
        }
    });

    const totalModules = levels.reduce((s, l) => s + l.modules.length, 0);
    const totalLessons = levels.reduce((s, l) => s + l.modules.reduce((ms, m) => ms + m._count.lessons, 0), 0);

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] text-gray-900 dark:text-white">
            <JsonLd
                type="Course"
                data={{
                    name: "The Trader's Ascent — Professional Forex Trading Academy",
                    description: `Comprehensive Forex trading career path with ${levels.length} levels, ${totalModules} modules, and ${totalLessons} lessons. From beginner fundamentals to advanced institutional strategies.`,
                    provider: {
                        "@type": "Organization",
                        name: "TheNextTrade",
                        sameAs: process.env.NEXT_PUBLIC_APP_URL
                    },
                    isAccessibleForFree: true,
                    educationalLevel: "Beginner to Advanced",
                    numberOfLessons: totalLessons,
                    hasCourseInstance: levels.map(level => ({
                        "@type": "CourseInstance",
                        name: level.title,
                        description: level.description,
                        courseMode: "Online",
                        courseWorkload: `${level.modules.length} modules`,
                    })),
                }}
            />

            {/* ── Hero Section ── */}
            <section className="pt-32 sm:pt-40 pb-5 px-6 relative overflow-hidden">
                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span>Professional Career Path</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
                        The Trader&apos;s{' '}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">
                            Ascent
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl mb-10 text-gray-500 dark:text-gray-400 max-w-2xl mx-auto leading-relaxed">
                        Master the markets step by step. From your first trade to institutional mastery.
                    </p>

                    {!user && (
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
                        >
                            <PlayCircle size={20} />
                            Start Your Journey
                        </Link>
                    )}
                </div>
            </section>

            {/* ── Tree Map ── */}
            <AcademyTree levels={levels as any} basePath={basePath} isGuest={!user} />

            <SiteFooter />
        </div>
    );
}
