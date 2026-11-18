import type { Metadata } from "next";
import Link from "next/link";
import { verifyMarketingUnsubscribeToken } from "@/lib/email/unsubscribe";
import { UnsubscribeClient } from "@/components/emails/UnsubscribeClient";

export const metadata: Metadata = {
    title: "Email Unsubscribe",
    description: "Manage your marketing email subscription preferences on TheNextTrade.",
    robots: {
        index: false,
        follow: false,
    },
};

interface UnsubscribePageProps {
    searchParams: Promise<{ token?: string }>;
}

export default async function UnsubscribePage({
    searchParams,
}: UnsubscribePageProps) {
    const resolved = await searchParams;
    const rawToken = typeof resolved.token === "string" ? resolved.token : "";
    const verifiedEmail = verifyMarketingUnsubscribeToken(rawToken);

    return (
        <main className="min-h-screen bg-gray-50 dark:bg-[#0B0E14] flex flex-col items-center justify-center px-4 py-12">
            <Link
                href="/"
                className="mb-6 text-xl font-black tracking-tight text-gray-900 dark:text-white"
            >
                TheNext<span className="text-gold">Trade</span>
            </Link>

            <UnsubscribeClient
                token={rawToken}
                verifiedEmail={verifiedEmail}
            />
        </main>
    );
}
