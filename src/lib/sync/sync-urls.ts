/**
 * Sync URL utilities
 * Centralizes URL generation for Trade Manager and EA Sync downloads/connections.
 */

export const CANONICAL_MAIN_SERVER_URL = "https://thenexttrade.app";

export const CANONICAL_BACKUP_SERVER_URLS = [
    "https://raw.githubusercontent.com/",
    "https://api.github.com",
] as const;

export interface Mt5WebRequestServerEntry {
    id: string;
    role: "MAIN" | "BACKUP";
    label: string;
    url: string;
}

function isLocalhostUrl(url: string): boolean {
    return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?(\/|$)/i.test(
        url.trim()
    );
}

export function getPublicAppOrigin(): string {
    const candidates = [
        process.env.NEXT_PUBLIC_SYNC_SERVER_URL?.trim(),
        process.env.NEXT_PUBLIC_APP_URL?.trim(),
    ];

    for (const candidate of candidates) {
        if (candidate && !isLocalhostUrl(candidate)) {
            return candidate.replace(/\/+$/, "");
        }
    }

    return CANONICAL_MAIN_SERVER_URL;
}

/**
 * Returns the canonical production sync server URL for MT5 EA WebRequest configuration.
 * Always resolves to the public production domain (https://thenexttrade.app) rather than
 * leaking localhost dev ports into MT5 terminal instructions.
 */
export function getSyncServerUrl(fallbackOrigin?: string): string {
    const envUrl = getPublicAppOrigin();
    if (envUrl && !isLocalhostUrl(envUrl)) {
        return envUrl;
    }
    if (fallbackOrigin && !isLocalhostUrl(fallbackOrigin)) {
        return fallbackOrigin.replace(/\/+$/, "");
    }
    return CANONICAL_MAIN_SERVER_URL;
}

export function getMt5WebRequestServers(): Mt5WebRequestServerEntry[] {
    const mainUrl = getSyncServerUrl();
    return [
        {
            id: "main",
            role: "MAIN",
            label: "Main Server (Primary License & Trade Sync)",
            url: mainUrl,
        },
        {
            id: "backup-raw",
            role: "BACKUP",
            label: "Backup Server 1 (GitHub Raw Failover)",
            url: CANONICAL_BACKUP_SERVER_URLS[0],
        },
        {
            id: "backup-api",
            role: "BACKUP",
            label: "Backup Server 2 (GitHub API Failover)",
            url: CANONICAL_BACKUP_SERVER_URLS[1],
        },
    ];
}

/**
 * Returns the download URL for the EA Sync file.
 */
export function getEaSyncDownloadUrl(): string {
    return `${getPublicAppOrigin()}/downloads/GoldScalperNinja_Sync.ex5`;
}
