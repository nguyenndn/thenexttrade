import ProfileClient from "./ProfileClient";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function PublicProfilePage() {
    const user = await getAuthUser();

    if (!user) {
        return (
            <div className="py-8 text-center text-gray-600 dark:text-gray-300">
                <p>Please log in to access profile settings.</p>
            </div>
        );
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: {
            username: true,
            isPublicProfile: true,
            showTradeScore: true,
            showBadges: true,
            showPairStats: true,
            showSessionStats: true,
            profileHeadline: true,
        },
    });

    const settings = profile || {
        username: null,
        isPublicProfile: false,
        showTradeScore: false,
        showBadges: true,
        showPairStats: true,
        showSessionStats: true,
        profileHeadline: null,
    };

    return <ProfileClient initialSettings={settings} />;
}
