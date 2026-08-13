import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

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

// The Telegram bot token is a secret — never ship the raw value to the
// browser. A placeholder is returned instead; on save, a placeholder value is
// treated as "keep the stored token unchanged".
const MASKED_TOKEN = "••••••••••••••••";

export async function GET() {
    try {
        const auth = await requireAdmin();
        if (auth instanceof NextResponse) return auth;

        const setting = await prisma.systemSetting.findUnique({
            where: { key: SETTINGS_KEY },
        });

        if (!setting) {
            return NextResponse.json(defaultSettings);
        }

        const merged = {
            ...defaultSettings,
            ...(setting.value as Record<string, any>),
        };
        if (merged.telegramBotToken) {
            merged.telegramBotToken = MASKED_TOKEN;
        }

        return NextResponse.json(merged);
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
        const auth = await requireAdmin();
        if (auth instanceof NextResponse) return auth;

        const body = await request.json();

        // Security: only accept keys that exist in defaultSettings, but MERGE
        // with the currently stored value. The old logic reset any missing key
        // to its default, so a partial PUT silently wiped stored config.
        const existing = ((await prisma.systemSetting.findUnique({
            where: { key: SETTINGS_KEY },
        }))?.value ?? {}) as Record<string, any>;

        const cleanData: Record<string, any> = {
            ...defaultSettings,
            ...existing,
        };
        for (const key of Object.keys(defaultSettings)) {
            if (key in body) {
                cleanData[key] = body[key];
            }
        }

        // If the client sent back the masked placeholder, keep the real token.
        if (
            cleanData.telegramBotToken === MASKED_TOKEN &&
            existing.telegramBotToken
        ) {
            cleanData.telegramBotToken = existing.telegramBotToken;
        }

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
