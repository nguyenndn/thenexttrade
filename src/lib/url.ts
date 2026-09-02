/**
 * Dynamic Application URL resolution utilities.
 * Environment-driven: supports any domain via NEXT_PUBLIC_APP_URL / APP_URL.
 */

/**
 * Returns the base URL of the application based on environment variables.
 * Priority:
 * 1. NEXT_PUBLIC_APP_URL (Configured in .env / deployment platform)
 * 2. APP_URL (Server-side environment variable)
 * 3. Client-side window.location.origin (if running in browser)
 * 4. Fallback: http://localhost:3000 (development) or https://thenexttrade.com (production)
 */
export function getBaseUrl(): string {
    const rawUrl =
        process.env.NEXT_PUBLIC_APP_URL ||
        process.env.APP_URL ||
        (typeof window !== "undefined" && window.location?.origin
            ? window.location.origin
            : process.env.NODE_ENV === "development"
              ? "http://localhost:3000"
              : "https://thenexttrade.com");

    return rawUrl.replace(/\/+$/, "");
}

/**
 * Constructs an absolute URL from a given path using the dynamically resolved base URL.
 */
export function absoluteUrl(path: string = ""): string {
    if (!path) return getBaseUrl();
    if (path.startsWith("http://") || path.startsWith("https://")) {
        return path;
    }
    const cleanPath = path.startsWith("/") ? path : `/${path}`;
    return `${getBaseUrl()}${cleanPath}`;
}
