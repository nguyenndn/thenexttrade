import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import SettingsPageClient from "./SettingsPageClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
    const user = await getAuthUser();

    // OPTIMIZED: Fetch user profile and system config in parallel
    const [dbUser, systemConfigRecord] = await Promise.all([
        user ? prisma.user.findUnique({
            where: { id: user.id },
            select: { name: true, email: true, image: true }
        }) : Promise.resolve(null),
        prisma.systemSetting.findUnique({
            where: { key: 'site_config' }
        })
    ]);
    // const systemConfigRecord = null;

    const savedConfig = (systemConfigRecord?.value as any) || {};

    const systemConfig = {
        maintenanceMode: savedConfig.maintenanceMode ?? false,
        userRegistration: savedConfig.userRegistration ?? true,
        siteTitle: savedConfig.siteTitle || "GSN Financial CRM"
    };

    return (
        <SettingsPageClient
            user={dbUser || { name: "", email: "", image: null }}
            initialConfig={systemConfig}
        />
    );
}
