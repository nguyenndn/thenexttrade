import Link from "next/link";
import DOMPurify from "isomorphic-dompurify";
import { ChevronLeft, ChevronRight, Clock, BookOpen, GraduationCap, UserPlus } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

interface PublicLessonViewProps {
    lesson: any;
    level: any;
    courseLessons: { id: string; title: string; slug: string; duration: number | null }[];
    nextLesson: { id: string; title: string; slug: string; duration: number | null } | null;
    prevLesson: { id: string; title: string; slug: string; duration: number | null } | null;
}

export function PublicLessonView({ lesson, level, courseLessons, nextLesson, prevLesson }: PublicLessonViewProps) {
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.com";
    const sanitizedContent = DOMPurify.sanitize(lesson.content);
    const currentIndex = courseLessons.findIndex(l => l.id === lesson.id);
    const wordCount = lesson.content?.replace(/<[^>]*>?/gm, '').trim().split(/\s+/).filter(Boolean).length || 0;
    const readingTime = lesson.duration || Math.max(1, Math.ceil(wordCount / 200));

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-white">
            <PublicHeader />

            {/* SEO Schemas */}
            <BreadcrumbJsonLd items={[
                { name: "Home", href: "/" },
                { name: "Academy", href: "/academy" },
                { name: level.title, href: "/academy" },
                { name: lesson.title, href: `/academy/lesson/${lesson.slug}` },
            ]} />
            <JsonLd
                type="Article"
                data={{
                    headline: lesson.title,
                    description: `${lesson.title} — ${lesson.module.title}. Free forex trading lesson from TheNextTrade Academy.`,
                    url: `${baseUrl}/academy/lesson/${lesson.slug}`,
                    author: {
                        "@type": "Organization",
                        name: "TheNextTrade",
                    },
                    isPartOf: {
                        "@type": "Course",
                        name: "The Trader's Ascent",
                        provider: { "@type": "Organization", name: "TheNextTrade" },
                    },
                    isAccessibleForFree: true,
                }}
            />

            <main className="pt-28 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-8">
                        <Link href="/academy" className="hover:text-primary transition-colors">Academy</Link>
                        <span>/</span>
                        <span className="text-gray-600 dark:text-gray-300">{level.title}</span>
                        <span>/</span>
                        <span className="text-gray-600 dark:text-gray-300">{lesson.module.title}</span>
                    </nav>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider">
                                <GraduationCap size={14} />
                                <span>Level {level.order}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500">
                                <Clock size={12} />
                                <span>{readingTime} min read</span>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2">
                            {lesson.title}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300">
                            {lesson.module.title} — Lesson {currentIndex + 1} of {courseLessons.length}
                        </p>
                    </div>

                    {/* Content */}
                    <article
                        className="prose prose-lg dark:prose-invert max-w-none mb-12
                            prose-headings:font-bold prose-headings:tracking-tight
                            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
                            prose-img:rounded-xl prose-img:shadow-lg
                            prose-code:text-primary prose-code:bg-primary/5 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md
                            prose-blockquote:border-l-primary prose-blockquote:bg-primary/5 prose-blockquote:rounded-r-xl prose-blockquote:py-1"
                        dangerouslySetInnerHTML={{ __html: sanitizedContent }}
                    />

                    {/* CTA Banner */}
                    <div className="bg-gradient-to-r from-primary/10 to-cyan-500/10 dark:from-primary/20 dark:to-cyan-500/20 border border-primary/20 rounded-2xl p-6 md:p-8 mb-12 text-center">
                        <div className="flex items-center justify-center gap-2 mb-3">
                            <UserPlus size={20} className="text-primary" />
                            <h3 className="font-bold text-lg">Track Your Progress</h3>
                        </div>
                        <p className="text-gray-600 dark:text-gray-500 mb-4 max-w-md mx-auto">
                            Sign up for free to track your learning, earn XP, and unlock achievements.
                        </p>
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
                        >
                            Create Free Account
                        </Link>
                    </div>

                    {/* Navigation */}
                    <div className="flex items-center justify-between gap-4">
                        {prevLesson ? (
                            <Link
                                href={`/academy/lesson/${prevLesson.slug}`}
                                className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors max-w-[45%]"
                            >
                                <ChevronLeft size={18} className="text-gray-500 group-hover:text-primary transition-colors shrink-0" />
                                <div className="text-left min-w-0">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Previous</div>
                                    <div className="text-sm font-bold truncate">{prevLesson.title}</div>
                                </div>
                            </Link>
                        ) : <div />}
                        {nextLesson ? (
                            <Link
                                href={`/academy/lesson/${nextLesson.slug}`}
                                className="group flex items-center gap-3 px-5 py-3 rounded-xl bg-gray-100 dark:bg-white/5 hover:bg-gray-200 dark:hover:bg-white/10 transition-colors max-w-[45%]"
                            >
                                <div className="text-right min-w-0">
                                    <div className="text-xs text-gray-500 uppercase tracking-wider">Next</div>
                                    <div className="text-sm font-bold truncate">{nextLesson.title}</div>
                                </div>
                                <ChevronRight size={18} className="text-gray-500 group-hover:text-primary transition-colors shrink-0" />
                            </Link>
                        ) : (
                            <Link
                                href="/auth/register"
                                className="flex items-center gap-2 px-5 py-3 rounded-xl bg-primary/10 text-primary font-bold hover:bg-primary/20 transition-colors"
                            >
                                <span>Sign up to continue</span>
                                <ChevronRight size={18} />
                            </Link>
                        )}
                    </div>

                    {/* Module sidebar — lessons in this module */}
                    <div className="mt-16 pt-12 border-t border-gray-200 dark:border-white/10">
                        <div className="flex items-center gap-2 mb-6">
                            <BookOpen size={18} className="text-primary" />
                            <h3 className="font-bold text-lg">{lesson.module.title}</h3>
                        </div>
                        <div className="space-y-2">
                            {courseLessons.map((l, idx) => (
                                <Link
                                    key={l.id}
                                    href={`/academy/lesson/${l.slug}`}
                                    className={`flex items-center justify-between gap-3 px-4 py-3 rounded-xl transition-colors ${
                                        l.id === lesson.id
                                            ? "bg-primary/10 text-primary font-bold"
                                            : "hover:bg-gray-100 dark:hover:bg-white/5"
                                    }`}
                                >
                                    <div className="flex items-center gap-3 min-w-0">
                                        <span className="text-xs font-bold text-gray-500 w-6 shrink-0">{idx + 1}</span>
                                        <span className="text-sm truncate">{l.title}</span>
                                    </div>
                                    {l.duration && (
                                        <span className="text-xs text-gray-500 shrink-0">{l.duration}m</span>
                                    )}
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
