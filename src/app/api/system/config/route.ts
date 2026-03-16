import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    try {
        const record = await prisma.systemSetting.findUnique({
            where: { key: "site_config" },
        });

        const config = (record?.value as Record<string, unknown>) || {};

        return NextResponse.json({
            feedbackEnabled: config.feedbackEnabled ?? true,
            maintenanceMode: config.maintenanceMode ?? false,
            requireEmailVerification: config.requireEmailVerification ?? false,
            systemAnnouncement: (config.systemAnnouncement as string) || "",
        });
    } catch {
        return NextResponse.json({
            feedbackEnabled: true,
            maintenanceMode: false,
            requireEmailVerification: false,
            systemAnnouncement: "",
        });
    }
}
