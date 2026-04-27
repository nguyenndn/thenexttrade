import { NextRequest, NextResponse } from "next/server";
import { logSecurityEvent, type SecurityEventType } from "@/lib/security-logger";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/internal/security-log
 * Internal-only endpoint for middleware to log security events.
 *
 * GET /api/internal/security-log?action=blocked-ips
 * Returns list of currently blocked IPs for middleware sync.
 */
export async function POST(request: NextRequest) {
  const internalHeader = request.headers.get("x-internal-security");
  if (internalHeader !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await request.json();

    await logSecurityEvent({
      type: body.type as SecurityEventType,
      ip: body.ip || "unknown",
      userAgent: body.userAgent,
      path: body.path,
      detail: body.detail,
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  const internalHeader = request.headers.get("x-internal-security");
  if (internalHeader !== "1") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const action = request.nextUrl.searchParams.get("action");

  if (action === "blocked-ips") {
    try {
      const blocked = await prisma.blockedIP.findMany({
        where: {
          OR: [
            { expiresAt: null }, // permanent
            { expiresAt: { gt: new Date() } }, // not expired
          ],
        },
        select: { ip: true },
      });

      return NextResponse.json({ ips: blocked.map((b) => b.ip) });
    } catch {
      return NextResponse.json({ ips: [] });
    }
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
