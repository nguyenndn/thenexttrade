import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { unblockIP } from "@/lib/security-logger";

export const dynamic = "force-dynamic";

/**
 * DELETE /api/admin/security/blocked-ips/[id]
 * Unblock an IP address by record ID.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const { id } = await params;

  try {
    // Find the blocked IP record
    const record = await prisma.blockedIP.findUnique({
      where: { id },
      select: { ip: true },
    });

    if (!record) {
      return NextResponse.json(
        { error: "Blocked IP not found" },
        { status: 404 }
      );
    }

    await unblockIP(record.ip, auth.user.id);

    return NextResponse.json({
      ok: true,
      message: `IP ${record.ip} unblocked`,
    });
  } catch (error) {
    console.error("[Unblock IP] Error:", error);
    return NextResponse.json(
      { error: "Failed to unblock IP" },
      { status: 500 }
    );
  }
}
