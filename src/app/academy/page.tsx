import { prisma } from "@/lib/prisma";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AcademyTree } from "@/components/academy/AcademyTree";
import { JsonLd } from "@/components/seo/JsonLd";
import { AcademyPublicCTA } from "@/components/academy/AcademyPublicCTA";

import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "The Trader's Ascent | TheNextTrade Academy",
    description:
        "Master the art of Forex trading through our structured 11-Level career path. From First Steps to Ready to Trade.",
    openGraph: {
        title: "The Trader's Ascent - Zero to Pro",
        description: "Start your professional trading journey.",
        images: ["/academy-og.jpg"],
    },
};

export default async function AcademyPage() {
    const basePath = "/academy";

    const levels = await prisma.level.findMany({
        orderBy: { order: "asc" },
        select: {
            id: true,
            title: true,
            description: true,
            order: true,
            accessLevel: true,
            modules: {
                orderBy: { order: "asc" },
                select: {
                    id: true,
                    title: true,
                    lessons: {
                        orderBy: { order: "asc" },
                        select: { id: true, slug: true },
                    },
                    _count: { select: { lessons: true } },
                },
            },
        },
    });

    const totalModules = levels.reduce((s, l) => s + l.modules.length, 0);
    const totalLessons = levels.reduce(
        (s, l) => s + l.modules.reduce((ms, m) => ms + m._count.lessons, 0),
        0
    );

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-transparent text-gray-700 dark:text-white">
            <JsonLd
                type="Course"
                data={{
                    name: "The Trader's Ascent — Professional Forex Trading Academy",
                    description: `Comprehensive Forex trading career path with ${levels.length} levels, ${totalModules} modules, and ${totalLessons} lessons. From beginner fundamentals to advanced institutional strategies.`,
                    provider: {
                        "@type": "Organization",
                        name: "TheNextTrade",
                        sameAs: process.env.NEXT_PUBLIC_APP_URL,
                    },
                    isAccessibleForFree: true,
                    educationalLevel: "Beginner to Advanced",
                    numberOfLessons: totalLessons,
                    hasCourseInstance: levels.map((level) => ({
                        "@type": "CourseInstance",
                        name: level.title,
                        description: level.description,
                        courseMode: "Online",
                        courseWorkload: `${level.modules.length} modules`,
                    })),
                }}
            />

            {/* ── Hero Section ── */}
            <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_70%,#f8fafc_100%)] dark:bg-none dark:bg-[#0B0E14] px-6 pt-32 pb-10 sm:pb-14">
                {/* ─ Hero Background Layers ─ */}
                <div
                    className="absolute inset-0 pointer-events-none"
                    aria-hidden="true"
                >
                    {/* Layer 1: Notebook grid */}
                    <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.035)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.035)_1px,transparent_1px)] [background-size:48px_48px] dark:bg-[linear-gradient(to_right,rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.04)_1px,transparent_1px)]" />
                    {/* Layer 2: Soft radial highlight behind title */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[300px] bg-[radial-gradient(ellipse,rgba(245,158,11,0.06)_0%,transparent_70%)] dark:bg-[radial-gradient(ellipse,rgba(245,158,11,0.03)_0%,transparent_70%)]" />
                    {/* Layer 3: Topographic ascent lines (SVG) */}
                    <svg
                        className="absolute left-1/2 top-8 -translate-x-1/2 h-[220px] w-[900px] max-w-none opacity-[0.55] dark:opacity-[0.35] sm:h-[260px]"
                        viewBox="0 0 900 260"
                        fill="none"
                        aria-hidden="true"
                    >
                        <defs>
                            <linearGradient
                                id="academyPath"
                                x1="0"
                                y1="0"
                                x2="1"
                                y2="0"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#10b981"
                                    stopOpacity="0.7"
                                />
                                <stop
                                    offset="50%"
                                    stopColor="#F59E0B"
                                    stopOpacity="0.85"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#10b981"
                                    stopOpacity="0.6"
                                />
                            </linearGradient>
                        </defs>
                        <path
                            d="M40 210 C180 120 280 170 420 90 C560 20 680 80 840 40"
                            stroke="url(#academyPath)"
                            strokeWidth="3"
                            fill="none"
                        />
                        <path
                            d="M80 230 C210 150 300 190 450 110 C590 45 700 105 860 60"
                            stroke="#F59E0B"
                            strokeOpacity="0.45"
                            strokeWidth="2.5"
                            fill="none"
                        />
                        <path
                            d="M20 250 C150 180 260 210 400 140 C540 70 660 120 880 50"
                            stroke="#10b981"
                            strokeOpacity="0.3"
                            strokeWidth="2"
                            fill="none"
                        />
                        {/* Animated path markers — dots traveling along curves */}
                        <circle r="5" fill="#F59E0B" fillOpacity="0.9">
                            <animateMotion
                                dur="8s"
                                repeatCount="indefinite"
                                path="M40 210 C180 120 280 170 420 90 C560 20 680 80 840 40"
                            />
                        </circle>
                        <circle r="4" fill="#F59E0B" fillOpacity="0.7">
                            <animateMotion
                                dur="12s"
                                repeatCount="indefinite"
                                path="M80 230 C210 150 300 190 450 110 C590 45 700 105 860 60"
                            />
                        </circle>
                        <circle r="3.5" fill="#10b981" fillOpacity="0.8">
                            <animateMotion
                                dur="10s"
                                repeatCount="indefinite"
                                path="M20 250 C150 180 260 210 400 140 C540 70 660 120 880 50"
                            />
                        </circle>
                        {/* Secondary glow dots — offset timing for organic feel */}
                        <circle r="3" fill="#F59E0B" fillOpacity="0.5">
                            <animateMotion
                                dur="8s"
                                begin="-4s"
                                repeatCount="indefinite"
                                path="M40 210 C180 120 280 170 420 90 C560 20 680 80 840 40"
                            />
                        </circle>
                        <circle r="2.5" fill="#10b981" fillOpacity="0.4">
                            <animateMotion
                                dur="10s"
                                begin="-5s"
                                repeatCount="indefinite"
                                path="M20 250 C150 180 260 210 400 140 C540 70 660 120 880 50"
                            />
                        </circle>
                    </svg>
                </div>

                <div className="max-w-5xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary font-bold text-xs uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
                        <span>Trading Academy</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight">
                        The Trader&apos;s{" "}
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-cyan-500">
                            Ascent
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl mb-6 sm:mb-10 text-gray-600 dark:text-gray-300 max-w-2xl mx-auto leading-relaxed">
                        11 levels. 30+ modules. A structured path from your
                        first trade to confident, disciplined execution.
                    </p>

                    <AcademyPublicCTA />
                </div>
            </section>

            {/* ── Gold Separator Line ── */}
            <div className="relative h-[2px]">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent dark:via-amber-500/70" />
            </div>

            {/* ── Tree Map ── */}
            <AcademyTree
                levels={levels as any}
                basePath={basePath}
                isGuest={true}
            />

            <SiteFooter />
        </div>
    );
}
