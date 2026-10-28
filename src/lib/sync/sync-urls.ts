/**
 * Sync URL utilities
 * Centralizes URL generation for Trade Manager and EA Sync downloads/connections.
 */

export function getPublicAppOrigin(): string {
    const raw =
        process.env.NEXT_PUBLIC_SYNC_SERVER_URL?.trim() ||
        process.env.NEXT_PUBLIC_APP_URL?.trim() ||
        "";
    return raw.replace(/\/+$/, "");
}

/**
 * Returns the sync server URL for MT5 EA connections.
 * Prefers NEXT_PUBLIC_SYNC_SERVER_URL / NEXT_PUBLIC_APP_URL from env;
 * falls back to the provided origin (e.g. window.location.origin).
 */
export function getSyncServerUrl(fallbackOrigin?: string): string {
    const envUrl = getPublicAppOrigin();
    if (envUrl) return envUrl;
    if (fallbackOrigin) return fallbackOrigin.replace(/\/+$/, "");
    if (typeof window !== "undefined") return window.location.origin;
    return "https://thenexttrade.com";
}

/**
 * Returns the download URL for the EA Sync file.
 */
export function getEaSyncDownloadUrl(): string {
    return `${getPublicAppOrigin()}/downloads/GoldScalperNinja_Sync.ex5`;
}
