import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";

const getCachedSiteConfig = unstable_cache(
    async () => {
        const record = await prisma.systemSetting.findUnique({
            where: { key: "site_config" },
        });
        const config = (record?.value as Record<string, unknown>) || {};
        return {
            feedbackEnabled: config.feedbackEnabled ?? true,
            maintenanceMode: config.maintenanceMode ?? false,
            systemAnnouncement: (config.systemAnnouncement as string) || "",
        };
    },
    ["site-config"],
    { revalidate: 30, tags: ["site-config"] }
);

export async function GET() {
    try {
        const payload = await getCachedSiteConfig();
        return NextResponse.json(payload, {
            headers: {
                "Cache-Control": "public, max-age=30, stale-while-revalidate=60",
            },
        });
    } catch {
        return NextResponse.json({
            feedbackEnabled: true,
            maintenanceMode: false,
            systemAnnouncement: "",
        });
    }
}
