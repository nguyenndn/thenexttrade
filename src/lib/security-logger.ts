import { prisma } from "@/lib/prisma";

// ============================================================================
// SECURITY EVENT TYPES
// ============================================================================

export const SECURITY_EVENT_TYPES = {
  RATE_LIMIT: "RATE_LIMIT",
  BOT_BLOCKED: "BOT_BLOCKED",
  LOGIN_FAILED: "LOGIN_FAILED",
  TURNSTILE_FAILED: "TURNSTILE_FAILED",
  AUTH_FAILED: "AUTH_FAILED",
  CRON_FAILED: "CRON_FAILED",
  IP_BLOCKED: "IP_BLOCKED",
  IP_UNBLOCKED: "IP_UNBLOCKED",
} as const;

export type SecurityEventType =
  (typeof SECURITY_EVENT_TYPES)[keyof typeof SECURITY_EVENT_TYPES];

// ============================================================================
// LOG SECURITY EVENT (fire-and-forget)
// ============================================================================

interface SecurityEventData {
  type: SecurityEventType;
  ip: string;
  userAgent?: string | null;
  path?: string | null;
  detail?: string | null;
  userId?: string | null;
}

/**
 * Log a security event to the database.
 * Fire-and-forget — never blocks the caller.
 */
export async function logSecurityEvent(data: SecurityEventData): Promise<void> {
  try {
    await prisma.securityLog.create({
      data: {
        type: data.type,
        ip: data.ip,
        userAgent: data.userAgent ?? null,
        path: data.path ?? null,
        detail: data.detail ?? null,
        userId: data.userId ?? null,
      },
    });
  } catch {
    // Silent fail — security logging should never break the app
    console.error("[SecurityLog] Failed to write event:", data.type);
  }
}

// ============================================================================
// IP BLOCK CHECK
// ============================================================================

/**
 * Check if an IP address is currently blocked.
 * Returns true if blocked (not expired), false otherwise.
 */
export async function isIPBlocked(ip: string): Promise<boolean> {
  try {
    const blocked = await prisma.blockedIP.findUnique({
      where: { ip },
      select: { expiresAt: true },
    });

    if (!blocked) return false;

    // If expiresAt is null, it's a permanent block
    if (!blocked.expiresAt) return true;

    // Check if block has expired
    if (blocked.expiresAt < new Date()) {
      // Auto-cleanup expired block
      await prisma.blockedIP.delete({ where: { ip } }).catch(() => {});
      return false;
    }

    return true;
  } catch {
    // On error, don't block — fail open
    return false;
  }
}

// ============================================================================
// ADMIN: BLOCK / UNBLOCK IP
// ============================================================================

export async function blockIP(data: {
  ip: string;
  reason?: string;
  blockedBy?: string;
  durationMinutes?: number; // null = permanent
}): Promise<void> {
  const expiresAt = data.durationMinutes
    ? new Date(Date.now() + data.durationMinutes * 60 * 1000)
    : null;

  await prisma.blockedIP.upsert({
    where: { ip: data.ip },
    update: {
      reason: data.reason ?? null,
      blockedBy: data.blockedBy ?? null,
      expiresAt,
    },
    create: {
      ip: data.ip,
      reason: data.reason ?? null,
      blockedBy: data.blockedBy ?? null,
      expiresAt,
    },
  });

  // Log the block event
  await logSecurityEvent({
    type: SECURITY_EVENT_TYPES.IP_BLOCKED,
    ip: data.ip,
    detail: `Blocked by admin. Reason: ${data.reason || "N/A"}. Duration: ${data.durationMinutes ? `${data.durationMinutes}m` : "permanent"}`,
    userId: data.blockedBy,
  });
}

export async function unblockIP(
  ip: string,
  unblockedBy?: string
): Promise<void> {
  await prisma.blockedIP.delete({ where: { ip } }).catch(() => {});

  await logSecurityEvent({
    type: SECURITY_EVENT_TYPES.IP_UNBLOCKED,
    ip,
    detail: `Unblocked by admin`,
    userId: unblockedBy,
  });
}
