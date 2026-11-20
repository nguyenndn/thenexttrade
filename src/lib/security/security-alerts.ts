// ============================================================================
// SECURITY ALERTS → TELEGRAM
// ============================================================================
//
// Sends high-signal security events to a private Telegram chat so the owner
// finds out about attacks (blocked IPs, failed auth bursts, cron failures)
// within seconds instead of discovering them in the admin panel days later.
//
// Deliberately standalone: this module imports nothing from security-logger,
// so security-logger can call it without a circular dependency.
//
// Configuration (both must be set, otherwise this module is a no-op):
//   SECURITY_ALERT_TELEGRAM_BOT_TOKEN — token from @BotFather
//   SECURITY_ALERT_TELEGRAM_CHAT_ID   — your chat / group id
// ============================================================================

const TELEGRAM_API_BASE = "https://api.telegram.org";
const SEND_TIMEOUT_MS = 5_000;
const DEDUPE_WINDOW_MS = 15 * 60 * 1000; // one alert per type+IP per 15 min
const MAX_ALERTS_PER_HOUR = 30;

/**
 * High-volume noise is intentionally excluded:
 *   RATE_LIMIT / LOGIN_FAILED / BOT_BLOCKED happen constantly under normal
 *   bot traffic and would drown the channel. They stay in the DB.
 */
const ALERTABLE_TYPES = new Set<string>([
    "IP_BLOCKED",
    "IP_UNBLOCKED",
    "AUTH_FAILED",
    "TURNSTILE_FAILED",
    "CRON_FAILED",
]);

export interface SecurityAlertEvent {
    type: string;
    ip: string;
    userAgent?: string | null;
    path?: string | null;
    detail?: string | null;
    userId?: string | null;
}

// Per-process state. Serverless instances each keep their own copy, which only
// means the effective throttle can be looser — never that alerts are lost.
const lastSentAt = new Map<string, number>();
let hourlyWindowStart = 0;
let hourlyCount = 0;

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}

function isThrottled(key: string): boolean {
    const now = Date.now();

    const last = lastSentAt.get(key);
    if (last !== undefined && now - last < DEDUPE_WINDOW_MS) return true;

    if (now - hourlyWindowStart >= 60 * 60 * 1000) {
        hourlyWindowStart = now;
        hourlyCount = 0;
    }
    if (hourlyCount >= MAX_ALERTS_PER_HOUR) return true;

    // Keep the map from growing without bound in long-lived processes.
    if (lastSentAt.size > 500) {
        for (const [mapKey, sentAt] of lastSentAt) {
            if (now - sentAt >= DEDUPE_WINDOW_MS) lastSentAt.delete(mapKey);
        }
    }

    lastSentAt.set(key, now);
    hourlyCount += 1;
    return false;
}

function formatMessage(event: SecurityAlertEvent): string {
    const lines = [
        "<b>Security Alert</b>",
        `<b>Type:</b> ${escapeHtml(event.type)}`,
        `<b>IP:</b> ${escapeHtml(event.ip)}`,
    ];

    if (event.path) lines.push(`<b>Path:</b> ${escapeHtml(event.path)}`);
    if (event.detail) lines.push(`<b>Detail:</b> ${escapeHtml(event.detail)}`);
    if (event.userId) lines.push(`<b>User:</b> ${escapeHtml(event.userId)}`);
    if (event.userAgent) {
        lines.push(`<b>UA:</b> ${escapeHtml(event.userAgent.slice(0, 200))}`);
    }

    lines.push(`<b>Time:</b> ${new Date().toISOString()}`);
    return lines.join("\n");
}

/**
 * Send a security alert to Telegram. Never throws and never rejects.
 * Returns true when a message was actually delivered.
 */
export async function sendSecurityAlert(
    event: SecurityAlertEvent
): Promise<boolean> {
    const token = process.env.SECURITY_ALERT_TELEGRAM_BOT_TOKEN;
    const chatId = process.env.SECURITY_ALERT_TELEGRAM_CHAT_ID;
    if (!token || !chatId) return false;
    if (!ALERTABLE_TYPES.has(event.type)) return false;
    if (isThrottled(`${event.type}:${event.ip}`)) return false;

    try {
        const res = await fetch(
            `${TELEGRAM_API_BASE}/bot${token}/sendMessage`,
            {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: formatMessage(event),
                    parse_mode: "HTML",
                    disable_web_page_preview: true,
                }),
                signal: AbortSignal.timeout(SEND_TIMEOUT_MS),
                cache: "no-store",
            }
        );
        return res.ok;
    } catch {
        // Alerting must never break the caller — the DB log already has the event.
        return false;
    }
}
