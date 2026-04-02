import Link from "next/link";
import { Lock, GraduationCap, ArrowRight, Sparkles } from "lucide-react";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { BreadcrumbJsonLd } from "@/components/seo/BreadcrumbJsonLd";

interface LessonLockedViewProps {
    lessonTitle: string;
    levelTitle: string;
    levelOrder: number;
    moduleTitle: string;
}

export function LessonLockedView({ lessonTitle, levelTitle, levelOrder, moduleTitle }: LessonLockedViewProps) {
    return (
        <div className="min-h-screen bg-white dark:bg-[#0B0E14] text-gray-700 dark:text-white">
            <PublicHeader />

            <BreadcrumbJsonLd items={[
                { name: "Home", href: "/" },
                { name: "Academy", href: "/academy" },
                { name: levelTitle, href: "/academy" },
                { name: lessonTitle, href: "#" },
            ]} />

            <main className="pt-28 pb-20">
                <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
                    {/* Lock icon */}
                    <div className="w-20 h-20 mx-auto mb-8 rounded-2xl bg-gradient-to-br from-gray-200 to-gray-300 dark:from-white/10 dark:to-white/5 flex items-center justify-center">
                        <Lock size={32} className="text-gray-600 dark:text-gray-300" />
                    </div>

                    {/* Context */}
                    <div className="flex items-center justify-center gap-2 mb-4">
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-xs font-bold uppercase tracking-wider">
                            <GraduationCap size={14} />
                            <span>Level {levelOrder} — {levelTitle}</span>
                        </div>
                    </div>

                    <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-3">
                        {lessonTitle}
                    </h1>
                    <p className="text-gray-600 dark:text-gray-300 mb-2">
                        {moduleTitle}
                    </p>
                    <p className="text-gray-600 dark:text-gray-300 text-sm mb-10 max-w-md mx-auto">
                        This lesson is part of our premium curriculum. Create a free account to unlock all levels and track your progress.
                    </p>

                    {/* CTA */}
                    <div className="space-y-4">
                        <Link
                            href="/auth/register"
                            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-gradient-to-r from-primary to-cyan-500 text-white font-bold text-base shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:scale-105 transition-all duration-300"
                        >
                            <Sparkles size={18} />
                            <span>Sign Up Free to Unlock</span>
                        </Link>
                        <p className="text-xs text-gray-500">
                            Already have an account?{" "}
                            <Link href="/auth/login" className="text-primary hover:underline font-bold">
                                Log in
                            </Link>
                        </p>
                    </div>

                    {/* What you get */}
                    <div className="mt-16 bg-gray-50 dark:bg-white/5 rounded-2xl border border-gray-200 dark:border-white/10 p-6 text-left">
                        <h3 className="font-bold text-sm uppercase tracking-wider text-gray-500 mb-4">
                            Free Account Includes
                        </h3>
                        <div className="space-y-3">
                            {[
                                "Full access to all 11 levels of the Academy",
                                "XP rewards and achievement badges",
                                "Progress tracking across all lessons",
                                "18 professional trading tools",
                                "Trading journal and analytics",
                            ].map((feature, idx) => (
                                <div key={idx} className="flex items-center gap-3">
                                    <ArrowRight size={14} className="text-primary shrink-0" />
                                    <span className="text-sm text-gray-600 dark:text-gray-300">{feature}</span>
                                </div>
                            ))}
                        </div>
                    </div>

                    {/* Back link */}
                    <div className="mt-10">
                        <Link
                            href="/academy"
                            className="text-sm text-gray-500 hover:text-primary transition-colors"
                        >
                            ← Back to Academy
                        </Link>
                    </div>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
