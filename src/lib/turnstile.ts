"use server";

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true if valid, false otherwise.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstile(
  token: string,
  ip?: string
): Promise<{ success: boolean; error?: string }> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;

  // Skip verification in development if no key configured
  if (!secretKey) {
    if (process.env.NODE_ENV !== "production") {
      return { success: true };
    }
    return { success: false, error: "Turnstile not configured" };
  }

  if (!token) {
    return { success: false, error: "Verification required" };
  }

  try {
    const body: Record<string, string> = {
      secret: secretKey,
      response: token,
    };

    if (ip) {
      body.remoteip = ip;
    }

    const res = await fetch(TURNSTILE_VERIFY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (data.success) {
      return { success: true };
    }

    return {
      success: false,
      error: "Verification failed. Please try again.",
    };
  } catch {
    // Network error — don't block user in case Cloudflare is down
    console.error("[Turnstile] Verification request failed");
    return { success: true };
  }
}
