import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { ToolsPageShell } from "@/components/tools/ToolsPageShell";
import BrokersClient from "./BrokersClient";

export const metadata: Metadata = {
    title: "Verified Forex Brokers & Infrastructure Partners | TheNextTrade",
    description:
        "Reviews of regulated forex brokers, VPS hosting, and crypto platforms.",
    alternates: {
        canonical: "/brokers",
    },
    openGraph: {
        title: "Verified Forex Brokers & Infrastructure Partners | TheNextTrade",
        description:
            "Reviews of regulated forex brokers, VPS hosting, and crypto platforms.",
        url: "/brokers",
        siteName: "TheNextTrade",
        type: "website",
    },
    twitter: {
        card: "summary_large_image",
        title: "Verified Forex Brokers & Infrastructure Partners",
        description:
            "Reviews of regulated forex brokers, VPS hosting, and crypto platforms.",
    },
};

export const revalidate = 86400;

export default async function BrokersPage() {
    const user = await getAuthUser();

    return (
        <ToolsPageShell maxWidth="max-w-6xl" user={user}>
            <BrokersClient />
        </ToolsPageShell>
    );
}
