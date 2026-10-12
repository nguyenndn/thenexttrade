import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import { QuizFlow } from "@/components/trading-style/QuizFlow";

export const metadata: Metadata = {
    title: "Know Your Trading Style — Free 3-Minute Trading Psychology Quiz | TheNextTrade",
    description:
        "Answer 14 questions and get your XAU/USD trading archetype — plus a personalised plan of courses, journaling habits and risk rules to fix your leaks.",
    alternates: {
        canonical: "/trading-style",
    },
    openGraph: {
        title: "Know Your Trading Style — Free Trading Psychology Quiz",
        description:
            "14 questions, 8 trading archetypes, one personalised plan. Free on TheNextTrade.",
        url: "/trading-style",
        siteName: "TheNextTrade",
        type: "website",
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
        <ToolsPageShell maxWidth="max-w-5xl" user={user}>
            <QuizFlow isLoggedIn={!!user} />

            <p className="mt-12 text-center text-xs text-gray-400 dark:text-gray-500">
                This assessment is for education and self-awareness — it is not
                financial advice.
            </p>
        </ToolsPageShell>
    );
}
