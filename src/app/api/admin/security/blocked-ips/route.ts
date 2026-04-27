import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { blockIP } from "@/lib/security-logger";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security/blocked-ips
 * List all blocked IPs.
 */
export async function GET() {
  const auth = await requireAdmin();
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
  const auth = await requireAdmin();
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

    // Validate IP format (basic)
    const ipTrimmed = ip.trim();
    if (ipTrimmed.length < 7 || ipTrimmed.length > 45) {
      return NextResponse.json(
        { error: "Invalid IP address" },
        { status: 400 }
      );
    }

    await blockIP({
      ip: ipTrimmed,
      reason,
      blockedBy: auth.user.id,
      durationMinutes: durationMinutes || undefined,
    });

    return NextResponse.json({ ok: true, message: `IP ${ipTrimmed} blocked` });
  } catch (error) {
    console.error("[Block IP] Error:", error);
    return NextResponse.json(
      { error: "Failed to block IP" },
      { status: 500 }
    );
  }
}
