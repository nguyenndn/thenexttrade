import { prisma } from "@/lib/prisma";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { AcademyTree } from "@/components/academy/AcademyTree";
import { JsonLd } from "@/components/seo/JsonLd";
import { AcademyPublicCTA } from "@/components/academy/AcademyPublicCTA";
import { getAuthUser } from "@/lib/auth-cache";
import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import { PlayCircle, ArrowRight, Users } from "lucide-react";

import type { Metadata } from "next";

export const revalidate = 3600;

export const metadata: Metadata = {
    title: "The Trader's Ascent | TheNextTrade Academy",
    description:
        "12 structured levels from liquidity models to risk math and execution discipline. The zero-fluff forex curriculum built for consistent funded traders.",
    alternates: {
        canonical: "/academy",
    },
    openGraph: {
        title: "The Trader's Ascent - Zero to Pro",
        description: "Market structure, liquidity mechanics, and cold risk math.",
        url: "/academy",
        siteName: "TheNextTrade",
        images: ["/academy-og.jpg"],
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "The Trader's Ascent | TheNextTrade Academy",
        description: "Market structure, liquidity mechanics, and cold risk math.",
        images: ["/academy-og.jpg"],
    },
};

export default async function AcademyPage() {
    const user = await getAuthUser();
    const isLoggedIn = !!user;
    const basePath = isLoggedIn ? "/dashboard/academy" : "/academy";

    const [levels, userProgress] = await Promise.all([
        prisma.level.findMany({
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
                            select: {
                                id: true,
                                slug: true,
                                title: true,
                                duration: true,
                            },
                        },
                        _count: { select: { lessons: true } },
                    },
                },
            },
        }),
        user
            ? prisma.userProgress.findMany({
                  where: { userId: user.id, isCompleted: true },
                  select: { lessonId: true },
              })
            : Promise.resolve([]),
    ]);

    const completedLessonIds = userProgress.map((p) => p.lessonId);

    const totalModules = levels.reduce((s, l) => s + l.modules.length, 0);
    const totalLessons = levels.reduce(
        (s, l) => s + l.modules.reduce((ms, m) => ms + m._count.lessons, 0),
        0
    );

    return (
        <div className="min-h-screen flex flex-col bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-white">
            <JsonLd
                type="Course"
                data={{
                    name: "The Trader's Ascent — Professional Forex Trading Academy",
                    description: `Structured Forex execution curriculum with ${levels.length} levels, ${totalModules} modules, and ${totalLessons} lessons. From liquidity fundamentals to risk mathematics and systematic discipline.`,
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
            <section className="relative overflow-hidden bg-[linear-gradient(180deg,#fffaf0_0%,#ffffff_60%,#fbfaf6_100%)] dark:bg-none dark:bg-[#0B0E14] px-6 pt-32 pb-10 sm:pb-14">
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
                    <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold font-bold text-xs uppercase tracking-wider mb-6">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span>Trading Academy</span>
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black mb-6 leading-tight tracking-tight text-gray-900 dark:text-white font-heading">
                        The Trader&apos;s{" "}
                        <span className="text-amber-600 dark:text-gold">
                            Ascent
                        </span>
                    </h1>
                    <p className="text-lg md:text-xl mb-6 sm:mb-10 text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed tabular-nums">
                        <span className="font-bold text-gray-900 dark:text-white font-mono tabular-nums">{levels.length}</span> levels.{" "}
                        <span className="font-bold text-gray-900 dark:text-white font-mono tabular-nums">{totalModules}</span> modules.{" "}
                        <span className="font-bold text-gray-900 dark:text-white font-mono tabular-nums">{totalLessons}</span> lessons built on market structure, liquidity mechanics, and disciplined risk math.
                    </p>

                    <AcademyPublicCTA isLoggedIn={isLoggedIn} />
                </div>
            </section>

            {/* ── Gold Separator Line ── */}
            <div className="relative h-[2px]">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-amber-400 to-transparent dark:via-amber-500/70" />
            </div>

            {/* ── Academy Tree (Visual Map with Gamified Module Quest Modal — Full-Bleed Edge-to-Edge) ── */}
            <AcademyTree
                levels={levels}
                basePath={basePath}
                isGuest={!isLoggedIn}
                completedLessonIds={completedLessonIds}
            />

            {/* ── Bottom Banner CTA ── */}
            <section className="px-4 sm:px-6 py-12 max-w-6xl mx-auto">
                <div className="rounded-xl p-8 sm:p-10 border border-gold/15 bg-white dark:bg-[#1E2028] shadow-sm relative overflow-hidden">
                    <div className="relative z-10 flex flex-col lg:flex-row items-center justify-between gap-6 text-center lg:text-left">
                        <div className="space-y-2 max-w-xl">
                            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                                Master Market Structure &amp; Risk Math
                            </h2>
                            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                                {isLoggedIn
                                    ? "Continue through the curriculum at your pace or connect with 12,000+ traders in our official community."
                                    : "Access structured levels from liquidity models to disciplined execution. Free to start, no paywalls."}
                            </p>
                        </div>

                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto shrink-0">
                            <Link
                                href={isLoggedIn ? "/dashboard/academy" : "/auth/login"}
                                className={buttonVariants({
                                    variant: "primary",
                                    className:
                                        "w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 rounded-lg bg-gold hover:bg-amber-600 text-white text-sm font-extrabold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap animate-btn-shine group",
                                })}
                            >
                                <PlayCircle size={16} className="shrink-0" />
                                <span>{isLoggedIn ? "Continue Learning" : "Explore Curriculum"}</span>
                                <ArrowRight size={16} className="shrink-0 group-hover:translate-x-0.5 transition-transform duration-300" />
                            </Link>
                            <Link
                                href="/community"
                                className={buttonVariants({
                                    variant: "outline",
                                    className:
                                        "w-full sm:w-auto h-11 sm:h-12 px-6 sm:px-8 rounded-lg border-gray-300 dark:border-white/15 bg-transparent hover:border-gold hover:text-amber-600 dark:hover:text-gold text-gray-800 dark:text-white text-sm font-extrabold shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-normal sm:whitespace-nowrap group",
                                })}
                            >
                                <Users size={16} className="shrink-0 text-amber-500 dark:text-gold" />
                                <span>Join Community Free</span>
                            </Link>
                        </div>
                    </div>
                </div>
            </section>

            <SiteFooter />
        </div>
    );
}
