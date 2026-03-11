import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

const SETTINGS_KEY = "ea_settings";

const defaultSettings = {
    maintenanceMode: false,
    autoApproveLicenses: false,
    adminAlertEmail: "",
    sendUserWelcomeEmail: true,
    telegramEnabled: false,
    telegramBotToken: "",
    telegramChatId: "",
};

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const setting = await prisma.systemSetting.findUnique({
            where: { key: SETTINGS_KEY },
        });

        if (!setting) {
            return NextResponse.json(defaultSettings);
        }

        return NextResponse.json({ ...defaultSettings, ...(setting.value as Record<string, any>) });
    } catch (error) {
        console.error("GET EA Settings Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        // Security: Filter out any fields that are not in defaultSettings
        const cleanData = Object.keys(defaultSettings).reduce((acc: Record<string, any>, key) => {
            if (key in body) {
                acc[key] = body[key];
            } else {
                acc[key] = defaultSettings[key as keyof typeof defaultSettings];
            }
            return acc;
        }, {}) as typeof defaultSettings;

        const updated = await prisma.systemSetting.upsert({
            where: { key: SETTINGS_KEY },
            update: { value: cleanData },
            create: {
                key: SETTINGS_KEY,
                value: cleanData,
            },
        });

        return NextResponse.json({ success: true, data: updated.value });
    } catch (error) {
        console.error("PUT EA Settings Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
