/**
 * Sync URL utilities
 * Centralizes URL generation for TNT Connect and EA Sync downloads/connections.
 */

export function getPublicAppOrigin(): string {
  return process.env.NEXT_PUBLIC_APP_URL || "";
}

/**
 * Returns the sync server URL for MT5 EA connections.
 * Prefers NEXT_PUBLIC_APP_URL; falls back to the provided origin (e.g. window.location.origin).
 */
export function getSyncServerUrl(fallbackOrigin?: string): string {
  const envUrl = getPublicAppOrigin();
  if (envUrl) return envUrl;
  if (fallbackOrigin) return fallbackOrigin;
  if (typeof window !== "undefined") return window.location.origin;
  return "";
}

/**
 * Returns the download URL for the TNT Connect installer.
 */
export function getTntConnectDownloadUrl(): string {
  return `${getPublicAppOrigin()}/downloads/tnt-connect-setup.exe`;
}

/**
 * Returns the download URL for the EA Sync file.
 */
export function getEaSyncDownloadUrl(): string {
  return `${getPublicAppOrigin()}/downloads/GoldScalperNinja_Sync.ex5`;
}
