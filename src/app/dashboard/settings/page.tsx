import { redirect } from "next/navigation";
import { AccountSettingsTabs } from "@/components/profile/AccountSettingsTabs";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import SettingsClient from "./SettingsClient";

// User settings should be dynamic due to auth requirements
export const dynamic = "force-dynamic";

export default async function SettingsPage() {
    return <SettingsLoader />;
}

async function SettingsLoader() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // OPTIMIZED: Fetch profile in parallel (though user is already cached)
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id }
    });

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-200 dark:border-white/10 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Account Settings
                        </h1>
                    </div>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Update your profile details and security.
                </p>
            </div>

            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-6 md:p-8 shadow-sm">
                <AccountSettingsTabs user={user} profile={profile} />
            </div>
        </div>
    );
}
