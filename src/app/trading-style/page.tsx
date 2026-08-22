import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { QuizFlow } from "@/components/trading-style/QuizFlow";
import { BarChart3, BrainCircuit, Clock, Sparkles } from "lucide-react";

export const metadata: Metadata = {
    title: "Know Your Trading Style — Free 3-Minute Trading Psychology Quiz | TheNextTrade",
    description:
        "Answer 14 questions and get your XAU/USD trading archetype — plus a personalised plan of courses, journaling habits and risk rules to fix your leaks.",
    openGraph: {
        title: "Know Your Trading Style — Free Trading Psychology Quiz",
        description:
            "14 questions, 8 trading archetypes, one personalised plan. Free on TheNextTrade.",
    },
    keywords: [
        "trading style quiz",
        "trading psychology test",
        "XAUUSD trading archetype",
        "know your style",
        "trading self assessment",
        "forex personality test",
        "gold trading psychology",
        "TheNextTrade quiz",
    ],
};

export default async function TradingStylePage() {
    const user = await getAuthUser();

    return (
        <div className="min-h-screen bg-[#FFFDF9] text-gray-700 dark:bg-[#0B0D14] dark:text-white overflow-hidden relative">
            {/* Background Dotted Canvas Pattern & Glows */}
            <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:20px_20px] dark:bg-[radial-gradient(#1e2235_1px,transparent_1px)] pointer-events-none opacity-80" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-amber-500/[0.07] dark:bg-amber-500/[0.08] rounded-full blur-[140px] pointer-events-none" />
            <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-amber-500/5 dark:bg-amber-500/10 rounded-full blur-[140px] pointer-events-none" />

            <PublicHeader user={user} />

            <main className="relative z-10 pt-28 sm:pt-32 md:pt-36 pb-16 sm:pb-24">
                <div className="px-4 sm:px-6 mx-auto max-w-5xl">
                    <QuizFlow isLoggedIn={!!user} />

                    <p className="mt-12 text-center text-xs text-gray-400 dark:text-gray-500">
                        This assessment is for education and self-awareness — it
                        is not financial advice.
                    </p>
                </div>
            </main>

            <SiteFooter />
        </div>
    );
}
