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

 const displayName = profile.name;
 const statsLine = profile.visibility.showPercentMetrics
 ? `${profile.stats.totalTrades} trades, ${Math.round(profile.stats.winRate)}% win rate.`
 : `${profile.stats.totalTrades} trades logged.`;
 const description = `${displayName}'s verified trading profile. ${statsLine}`;

 return {
 title: `${displayName} (@${username}) | TheNextTrade`,
 description,
 openGraph: {
 title: `${displayName} | TheNextTrade`,
 description,
 images: [`/api/og/trader/${username}`],
 type: "profile",
 },
 twitter: {
 card: "summary_large_image",
 title: `${displayName} | TheNextTrade`,
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
 <div className="min-h-screen bg-white dark:bg-transparent">
 <div className="max-w-4xl mx-auto px-4 py-10 md:py-16">
 <PublicProfileCard profile={profile} />
 </div>
 </div>
 );
}
