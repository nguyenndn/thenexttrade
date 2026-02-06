import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { AccountSettingsTabs } from "@/components/profile/AccountSettingsTabs";

// User account settings require auth - keep dynamic
export const dynamic = "force-dynamic";

export default async function AccountSettingsPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // 2. Get Profile
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id }
    });

    return (
        <AccountSettingsTabs user={user} profile={profile} />
    );
}
