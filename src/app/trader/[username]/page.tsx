import { Metadata } from "next";
import { notFound } from "next/navigation";
import { getPublicProfileData } from "@/lib/profile-queries";
import { PublicProfileCard } from "@/components/profile/PublicProfileCard";

export const dynamic = "force-dynamic";

type Params = Promise<{ username: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
    const { username } = await params;
    const profile = await getPublicProfileData(username);

    if (!profile) {
        return { title: "Profile Not Found | TheNextTrade" };
    }

    const description = `${profile.name}'s verified trading profile. ${profile.stats.totalTrades} trades, ${Math.round(profile.stats.winRate)}% win rate.`;

    return {
        title: `${profile.name} (@${username}) | TheNextTrade`,
        description,
        openGraph: {
            title: `${profile.name} | TheNextTrade`,
            description,
            images: [`/api/og/trader/${username}`],
            type: "profile",
        },
        twitter: {
            card: "summary_large_image",
            title: `${profile.name} | TheNextTrade`,
            description,
            images: [`/api/og/trader/${username}`],
        },
    };
}

export default async function TraderProfilePage({ params }: { params: Params }) {
    const { username } = await params;
    const profile = await getPublicProfileData(username);

    if (!profile) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0F1117]">
            <div className="max-w-3xl mx-auto px-4 py-12 md:py-20">
                <PublicProfileCard profile={profile} />
            </div>
        </div>
    );
}
