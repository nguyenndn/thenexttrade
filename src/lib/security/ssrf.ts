import dns from "dns";
import net from "net";
import { URL } from "url";

export function isPrivateIP(ip: string): boolean {
    // Normalize IPv6 mapped IPv4 addresses (e.g. ::ffff:127.0.0.1)
    if (ip.startsWith("::ffff:")) {
        ip = ip.substring(7);
    }

    // IPv4 Loopback (127.0.0.0/8)
    if (ip.startsWith("127.")) return true;

    // IPv4 Private (RFC 1918)
    // 10.0.0.0/8
    if (ip.startsWith("10.")) return true;
    // 172.16.0.0/12
    if (ip.startsWith("172.")) {
        const parts = ip.split(".");
        if (parts.length >= 2) {
            const secondOctet = parseInt(parts[1], 10);
            if (secondOctet >= 16 && secondOctet <= 31) return true;
        }
    }
    // 192.168.0.0/16
    if (ip.startsWith("192.168.")) return true;

    // IPv4 Link-local (169.254.0.0/16)
    if (ip.startsWith("169.254.")) return true;

    // IPv4 Broadcast/Any/Multicast
    if (ip === "0.0.0.0" || ip === "255.255.255.255" || ip.startsWith("224."))
        return true;

    // IPv6 Loopback
    if (ip === "::1" || ip === "0:0:0:0:0:0:0:1") return true;

    // IPv6 Link-local (fe80::/10)
    if (ip.toLowerCase().startsWith("fe80:")) return true;

    // IPv6 Unique Local (fc00::/7)
    if (
        ip.toLowerCase().startsWith("fc00:") ||
        ip.toLowerCase().startsWith("fd00:")
    )
        return true;

    // IPv6 Unspecified
    if (ip === "::") return true;

    return false;
}

export async function isSafeUrl(urlString: string): Promise<boolean> {
    try {
        const parsed = new URL(urlString);
        if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
            return false;
        }

        const host = parsed.hostname;
        if (!host) return false;

        // Direct IP address check
        if (net.isIP(host)) {
            return !isPrivateIP(host);
        }

        // Resolve DNS to verify all potential IP addresses
        const lookup = await dns.promises.lookup(host, { all: true });
        for (const entry of lookup) {
            if (isPrivateIP(entry.address)) {
                return false;
            }
        }

        return true;
    } catch {
        return false;
    }
}

const REDIRECT_STATUS_CODES = new Set([301, 302, 303, 307, 308]);

/**
 * Fetch a URL with manual redirect handling so every redirect hop is validated
 * against SSRF rules (preventing 301/302 redirects from a public URL to
 * 127.0.0.1, 169.254.169.254, or RFC1918 private networks).
 */
export async function safeFetchWithRedirects(
    urlString: string,
    init?: RequestInit,
    maxRedirects = 3
): Promise<Response> {
    let currentUrl = urlString;

    for (let hop = 0; hop <= maxRedirects; hop++) {
        const safe = await isSafeUrl(currentUrl);
        if (!safe) {
            throw new Error(`Unsafe URL blocked by SSRF guard: ${currentUrl}`);
        }

        const res = await fetch(currentUrl, {
            ...init,
            redirect: "manual",
        });

        if (!REDIRECT_STATUS_CODES.has(res.status)) {
            return res;
        }

        if (hop === maxRedirects) {
            throw new Error(`Too many redirects (>${maxRedirects}) for ${urlString}`);
        }

        const location = res.headers.get("location");
        if (!location) {
            throw new Error(`Redirect response (${res.status}) missing Location header`);
        }

        currentUrl = new URL(location, currentUrl).toString();
    }

    throw new Error(`Too many redirects for ${urlString}`);
}
