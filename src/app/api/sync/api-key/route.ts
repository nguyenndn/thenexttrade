import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import crypto from "crypto";

/**
 * GET /api/sync/api-key
 * Get user's sync API key (masked).
 */
export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { id: authUser.id },
            select: {
                syncApiKey: true,
                syncApiKeyCreatedAt: true,
            },
        });

        if (!user) {
            return NextResponse.json({ error: "User not found" }, { status: 404 });
        }

        return NextResponse.json({
            hasKey: !!user.syncApiKey,
            key: user.syncApiKey
                ? `tnt_${user.syncApiKey.slice(4, 8)}...${user.syncApiKey.slice(-4)}`
                : null,
            fullKey: user.syncApiKey, // Frontend shows full key only once after generation
            createdAt: user.syncApiKeyCreatedAt,
        });
    } catch (error) {
        console.error("Get sync API key error:", error);
        return NextResponse.json({ error: "Failed to get API key" }, { status: 500 });
    }
}

/**
 * POST /api/sync/api-key
 * Generate or regenerate user's sync API key.
 */
export async function POST() {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        // Generate new key: tnt_ prefix + 48 random hex chars = 52 chars total
        const randomPart = crypto.randomBytes(24).toString("hex");
        const syncApiKey = `tnt_${randomPart}`;

        await prisma.user.update({
            where: { id: authUser.id },
            data: {
                syncApiKey,
                syncApiKeyCreatedAt: new Date(),
            },
        });

        return NextResponse.json({
            success: true,
            key: syncApiKey,
            message: "Sync API key generated. Save it — it won't be shown in full again.",
        });
    } catch (error) {
        console.error("Generate sync API key error:", error);
        return NextResponse.json({ error: "Failed to generate API key" }, { status: 500 });
    }
}

/**
 * DELETE /api/sync/api-key
 * Revoke user's sync API key (disconnects all TNT Connect apps).
 */
export async function DELETE() {
    try {
        const supabase = await createClient();
        const { data: { user: authUser } } = await supabase.auth.getUser();
        if (!authUser) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.user.update({
            where: { id: authUser.id },
            data: {
                syncApiKey: null,
                syncApiKeyCreatedAt: null,
            },
        });

        return NextResponse.json({ success: true, message: "Sync API key revoked" });
    } catch (error) {
        console.error("Revoke sync API key error:", error);
        return NextResponse.json({ error: "Failed to revoke API key" }, { status: 500 });
    }
}
