import { NextRequest, NextResponse } from "next/server";
import { isIP } from "node:net";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";
import { blockIP } from "@/lib/security-logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security/blocked-ips
 * List all blocked IPs.
 */
export async function GET() {
    const auth = await requireSuperAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const blocked = await prisma.blockedIP.findMany({
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json({ blockedIPs: blocked });
    } catch (error) {
        console.error("[Blocked IPs] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch blocked IPs" },
            { status: 500 }
        );
    }
}

/**
 * POST /api/admin/security/blocked-ips
 * Block an IP address.
 * Body: { ip: string, reason?: string, durationMinutes?: number }
 */
export async function POST(request: NextRequest) {
    const auth = await requireSuperAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const { ip, reason, durationMinutes } = body;

        if (!ip || typeof ip !== "string") {
            return NextResponse.json(
                { error: "IP address is required" },
                { status: 400 }
            );
        }

        // Validate IP format (IPv4 or IPv6)
        const ipTrimmed = ip.trim();
        if (isIP(ipTrimmed) === 0) {
            return NextResponse.json(
                { error: "Invalid IPv4 or IPv6 address" },
                { status: 400 }
            );
        }

        const callerIp =
            request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
            request.headers.get("x-real-ip")?.trim();
        if (
            ipTrimmed === "127.0.0.1" ||
            ipTrimmed === "::1" ||
            ipTrimmed === "0.0.0.0" ||
            (callerIp && ipTrimmed === callerIp)
        ) {
            return NextResponse.json(
                { error: "Cannot block loopback or your own IP address" },
                { status: 400 }
            );
        }

        await blockIP({
            ip: ipTrimmed,
            reason,
            blockedBy: auth.user.id,
            durationMinutes: durationMinutes || undefined,
        });

        return NextResponse.json({
            ok: true,
            message: `IP ${ipTrimmed} blocked`,
        });
    } catch (error) {
        console.error("[Block IP] Error:", error);
        return NextResponse.json(
            { error: "Failed to block IP" },
            { status: 500 }
        );
    }
}
