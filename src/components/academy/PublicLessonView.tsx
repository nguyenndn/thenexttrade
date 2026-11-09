import Link from "next/link";
import { buttonVariants } from "@/components/ui/button-variants";
import {
    ChevronLeft,
    ChevronRight,
    Clock,
    BookOpen,
    GraduationCap,
    UserPlus,
    Lock,
} from "lucide-react";
import DOMPurify from "isomorphic-dompurify";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { JsonLd } from "@/components/seo/JsonLd";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

interface LessonNavItem {
    id: string;
    title: string;
    slug: string;
    duration: number | null;
}

interface PublicLessonViewProps {
    lesson: {
        id: string;
        title: string;
        slug: string;
        content: string;
        duration?: number | null;
        sourceUrls?: string[] | null;
        module: {
            title: string;
        };
    };
    level: {
        title: string;
        order: number;
    };
    courseLessons: LessonNavItem[];
    nextLesson: LessonNavItem | null;
    prevLesson: LessonNavItem | null;
    isPremiumLocked?: boolean;
}

export function PublicLessonView({
    lesson,
    level,
    courseLessons,
    nextLesson,
    prevLesson,
    isPremiumLocked,
}: PublicLessonViewProps) {
    const baseUrl =
        process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.io";
    const currentIndex = courseLessons.findIndex((l) => l.id === lesson.id);
    const wordCount =
        lesson.content
            ?.replace(/<[^>]*>?/gm, "")
            .trim()
            .split(/\s+/)
            .filter(Boolean).length || 0;
    const readingTime =
        lesson.duration || Math.max(1, Math.ceil(wordCount / 200));

    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-white">
            <PublicHeader />

            {/* SEO Schemas */}
            <BreadcrumbJsonLd
                items={[
                    { name: "Home", href: "/" },
                    { name: "Academy", href: "/academy" },
                    { name: level.title, href: "/academy" },
                    {
                        name: lesson.title,
                        href: `/academy/lesson/${lesson.slug}`,
                    },
                ]}
            />
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
                        provider: {
                            "@type": "Organization",
                            name: "TheNextTrade",
                        },
                    },
                    isAccessibleForFree: true,
                    citation: lesson.sourceUrls || [],
                }}
            />

            <main className="pt-28 pb-20">
                <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Breadcrumb */}
                    <nav
                        aria-label="Breadcrumb"
                        className="flex items-center gap-2 text-xs sm:text-sm font-medium bg-white dark:bg-[#1E2028] rounded-xl px-4 py-3 mb-8 shadow-sm border border-gray-200 dark:border-white/10 overflow-x-auto whitespace-nowrap scrollbar-hide"
                    >
                        <BookOpen
                            size={14}
                            className="text-amber-600 dark:text-gold shrink-0"
                        />
                        <Link
                            href="/academy"
                            className="text-gray-600 dark:text-gray-300 hover:text-amber-600 dark:hover:text-gold transition-colors shrink-0"
                        >
                            Academy
                        </Link>
                        <ChevronRight
                            size={14}
                            className="text-gray-300 dark:text-gray-600 shrink-0"
                        />
                        <span className="text-gray-600 dark:text-gray-300 shrink-0">
                            {level.title}
                        </span>
                        <ChevronRight
                            size={14}
                            className="text-gray-300 dark:text-gray-600 shrink-0"
                        />
                        <span className="text-amber-600 dark:text-gold font-semibold min-w-0 truncate">
                            {lesson.title}
                        </span>

                        {isPremiumLocked && (
                            <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-lg bg-gold/10 text-amber-600 dark:text-gold border border-gold/20 ml-auto shrink-0">
                                <Lock size={10} />
                                Premium
                            </span>
                        )}
                    </nav>

                    {/* Header */}
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-3">
                            <div className="flex items-center gap-2 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-wider bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold font-mono tabular-nums">
                                {isPremiumLocked ? (
                                    <Lock size={14} />
                                ) : (
                                    <GraduationCap size={14} />
                                )}
                                <span>Level {level.order}</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums">
                                <Clock size={12} className="text-amber-600 dark:text-gold" />
                                <span>{readingTime} min read</span>
                            </div>
                        </div>
                        <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-2 text-gray-900 dark:text-white font-heading">
                            {lesson.title}
                        </h1>
                        <p className="text-gray-600 dark:text-gray-300 tabular-nums">
                            {lesson.module.title} — Lesson{" "}
                            <span className="font-mono font-bold tabular-nums">{currentIndex + 1}</span> of{" "}
                            <span className="font-mono font-bold tabular-nums">{courseLessons.length}</span>
                        </p>
                    </div>

                    {/* Content */}
                    <div
                        className={`relative ${isPremiumLocked ? "max-h-[36rem] overflow-hidden mb-0" : "mb-10"}`}
                    >
                        <article
                            className="p-6 lg:p-8 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm prose prose-base dark:prose-invert max-w-none prose-headings:font-bold prose-headings:tracking-tight prose-h2:text-xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:pb-2 prose-h2:border-b prose-h2:border-gray-200 dark:prose-h2:border-white/10 prose-h3:text-lg prose-h3:mt-6 prose-h3:mb-3 prose-p:leading-relaxed prose-p:text-gray-600 dark:prose-p:text-gray-300 prose-a:text-amber-600 dark:prose-a:text-gold prose-a:no-underline hover:prose-a:underline prose-a:font-semibold prose-img:rounded-lg prose-img:shadow-md prose-img:mx-auto prose-blockquote:border-l-gold prose-blockquote:bg-gray-50 dark:prose-blockquote:bg-[#151925] prose-blockquote:rounded-r-lg prose-blockquote:py-1 prose-blockquote:px-2 prose-li:text-gray-600 dark:prose-li:text-gray-300 prose-strong:text-gray-700 dark:prose-strong:text-white prose-pre:bg-gray-800 prose-pre:text-gray-100 prose-pre:rounded-lg prose-pre:p-5 prose-pre:text-sm prose-pre:leading-relaxed prose-pre:overflow-x-auto prose-code:bg-gray-100 dark:prose-code:bg-white/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-lg prose-code:text-sm prose-code:font-semibold prose-code:text-gray-800 dark:prose-code:text-gray-200 [&_pre_code]:bg-transparent [&_pre_code]:p-0 [&_pre_code]:text-gray-100 [&_pre_code]:font-mono [&_table]:block [&_table]:w-max [&_table]:max-w-full [&_table]:overflow-x-auto [&_table]:whitespace-nowrap [&_table]:border-collapse [&_th]:bg-gray-50 dark:[&_th]:bg-[#151925] [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-bold [&_th]:border [&_th]:border-gray-200 dark:[&_th]:border-white/10 [&_td]:px-4 [&_td]:py-2 [&_td]:border [&_td]:border-gray-200 dark:[&_td]:border-white/10 [&_figure]:text-center [&_figure]:my-8 [&_figcaption]:text-center [&_figcaption]:text-sm [&_figcaption]:text-gray-500 dark:[&_figcaption]:text-gray-400 [&_figcaption]:mt-3"
                            dangerouslySetInnerHTML={{
                                __html: DOMPurify.sanitize(lesson.content),
                            }}
                        />
                        {/* References & Sources */}
                        {lesson.sourceUrls && lesson.sourceUrls.length > 0 && (
                            <div className="mt-8 p-6 bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl mb-12">
                                <h4 className="text-xs font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-4 uppercase tracking-wider">
                                    <BookOpen
                                        size={14}
                                        className="text-amber-600 dark:text-gold"
                                    />
                                    <span>References &amp; Sources</span>
                                </h4>
                                <ul className="space-y-3">
                                    {lesson.sourceUrls.map(
                                        (url: string, index: number) => {
                                            let domain = url;
                                            try {
                                                domain = new URL(url).hostname;
                                            } catch {}
                                            return (
                                                <li
                                                    key={index}
                                                    className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 dark:text-gray-400"
                                                >
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
                                                    <span className="font-semibold text-gray-500 font-mono tabular-nums">
                                                        [{index + 1}]
                                                    </span>
                                                    <a
                                                        href={url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-amber-600 dark:text-gold hover:underline font-bold truncate transition-colors"
                                                    >
                                                        {domain}
                                                    </a>
                                                    <span className="text-gray-400 dark:text-gray-600 truncate max-w-[200px] sm:max-w-[400px] hidden sm:inline">
                                                        ({url})
                                                    </span>
                                                </li>
                                            );
                                        }
                                    )}
                                </ul>
                            </div>
                        )}
                        {isPremiumLocked && (
                            <div className="absolute flex items-end justify-center pb-8 bottom-0 left-0 right-0 h-64 bg-gradient-to-t from-white via-white/90 dark:from-[#0B0E14] dark:via-[#0B0E14]/90 to-transparent pointer-events-none" />
                        )}
                    </div>

                    {isPremiumLocked && (
                        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-8 mb-12 text-center shadow-xl relative z-10 mt-[-4rem]">
                            <div className="w-14 h-14 mx-auto mb-5 rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20">
                                <Lock size={24} className="text-amber-600 dark:text-gold" />
                            </div>
                            <h3 className="font-black text-2xl mb-3 tracking-tight text-gray-900 dark:text-white">
                                Unlock Professional Material
                            </h3>
                            <p className="text-gray-600 dark:text-gray-300 mb-8 max-w-lg mx-auto leading-relaxed tabular-nums">
                                You have reached the advanced curriculum. Register
                                for a free account to continue reading this
                                lesson and gain full access to all 12 levels of
                                the Academy.
                            </p>
                            <Link
                                href="/auth/signup"
                                className={buttonVariants({
                                    variant: "primary",
                                    className:
                                        "px-8 py-3.5 rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold text-base shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
                                })}
                            >
                                <GraduationCap size={18} />
                                <span>Sign Up Free to Unlock</span>
                            </Link>
                            <p className="text-sm mt-5 text-gray-500">
                                Already a member?{" "}
                                <Link
                                    href="/auth/login"
                                    className="text-amber-600 dark:text-gold hover:underline font-bold transition-colors"
                                >
                                    Log in here
                                </Link>
                            </p>
                        </div>
                    )}

                    {/* Standard CTA Banner (only if not locked) */}
                    {!isPremiumLocked && (
                        <div className="bg-white dark:bg-[#1E2028] border border-gold/25 rounded-xl p-6 md:p-8 mb-12 text-center shadow-sm">
                            <div className="flex items-center justify-center gap-2 mb-3">
                                <UserPlus size={20} className="text-amber-600 dark:text-gold" />
                                <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                    Track Your Progress
                                </h3>
                            </div>
                            <p className="text-gray-600 dark:text-gray-400 mb-5 max-w-md mx-auto">
                                Sign up for free to track your learning, earn
                                Edge XP, and unlock level milestones.
                            </p>
                            <Link
                                href="/auth/signup"
                                className={buttonVariants({
                                    variant: "primary",
                                    className:
                                        "px-6 py-3 rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold shadow-lg shadow-amber-500/25 hover:shadow-amber-500/40",
                                })}
                            >
                                Create Free Account
                            </Link>
                        </div>
                    )}

                    {/* Navigation */}
                    {!isPremiumLocked && (
                        <div className="flex items-center justify-between gap-4">
                            {prevLesson ? (
                                <Link
                                    href={`/academy/lesson/${prevLesson.slug}`}
                                    className={buttonVariants({
                                        variant: "outline",
                                        className:
                                            "group flex items-center gap-3 px-5 py-3 h-auto rounded-lg bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 hover:border-gold/40 max-w-[45%]",
                                    })}
                                >
                                    <ChevronLeft
                                        size={18}
                                        className="text-gray-500 group-hover:text-amber-600 dark:group-hover:text-gold transition-colors shrink-0"
                                    />
                                    <div className="text-left min-w-0">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">
                                            Previous
                                        </div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {prevLesson.title}
                                        </div>
                                    </div>
                                </Link>
                            ) : (
                                <div />
                            )}
                            {nextLesson ? (
                                <Link
                                    href={`/academy/lesson/${nextLesson.slug}`}
                                    className={buttonVariants({
                                        variant: "outline",
                                        className:
                                            "group flex items-center gap-3 px-5 py-3 h-auto rounded-lg bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 hover:border-gold/40 max-w-[45%]",
                                    })}
                                >
                                    <div className="text-right min-w-0">
                                        <div className="text-xs text-gray-500 uppercase tracking-wider">
                                            Next
                                        </div>
                                        <div className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                            {nextLesson.title}
                                        </div>
                                    </div>
                                    <ChevronRight
                                        size={18}
                                        className="text-gray-500 group-hover:text-amber-600 dark:group-hover:text-gold transition-colors shrink-0"
                                    />
                                </Link>
                            ) : (
                                <Link
                                    href="/auth/signup"
                                    className={buttonVariants({
                                        variant: "primary",
                                        className:
                                            "flex items-center gap-2 px-5 py-3 rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold",
                                    })}
                                >
                                    <span>Sign up to continue</span>
                                    <ChevronRight size={18} />
                                </Link>
                            )}
                        </div>
                    )}

                    {/* Module sidebar — lessons in this module */}
                    {!isPremiumLocked && (
                        <div className="mt-16 p-6 rounded-xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm">
                            <div className="flex items-center justify-between gap-2 mb-5">
                                <div className="flex items-center gap-2">
                                    <BookOpen size={18} className="text-amber-600 dark:text-gold" />
                                    <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                                        {lesson.module.title}
                                    </h3>
                                </div>
                                <span className="px-2.5 py-1 rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-xs font-mono tabular-nums font-bold text-gray-600 dark:text-gray-300">
                                    {courseLessons.length} Lessons
                                </span>
                            </div>
                            <div className="space-y-2">
                                {courseLessons.map((l, idx) => (
                                    <Link
                                        key={l.id}
                                        href={`/academy/lesson/${l.slug}`}
                                        className={`flex items-center justify-between gap-3 px-4 py-3 rounded-lg border transition-colors ${
                                            l.id === lesson.id
                                                ? "bg-gold/10 border-gold/30 text-amber-600 dark:text-gold font-bold"
                                                : "bg-gray-50/80 dark:bg-[#151925] border-gray-200 dark:border-white/10 hover:border-gold/30 text-gray-700 dark:text-gray-200"
                                        }`}
                                    >
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-xs font-bold font-mono tabular-nums text-gray-500 w-6 shrink-0">
                                                {idx + 1}
                                            </span>
                                            <span className="text-sm truncate">
                                                {l.title}
                                            </span>
                                        </div>
                                        {l.duration && (
                                            <span className="text-xs font-mono tabular-nums text-gray-500 shrink-0">
                                                {l.duration}m
                                            </span>
                                        )}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
