/**
 * Trusted client IP resolution.
 *
 * Production sits behind Cloudflare, which overwrites `cf-connecting-ip` at the
 * edge, so that header cannot be forged by the client. The remaining headers are
 * fallbacks for local/staging setups where no Cloudflare edge is in front.
 *
 * Order: cf-connecting-ip → x-real-ip → x-vercel-forwarded-for (first) →
 * x-forwarded-for (first) → fallback.
 */

export interface IpHeaderReader {
    get(name: string): string | null | undefined;
}

function firstEntry(value: string | null | undefined): string | undefined {
    return value?.split(",")[0]?.trim() || undefined;
}

export function getClientIpFromHeaders(
    headerReader: IpHeaderReader,
    fallback = "127.0.0.1"
): string {
    return (
        headerReader.get("cf-connecting-ip")?.trim() ||
        headerReader.get("x-real-ip")?.trim() ||
        firstEntry(headerReader.get("x-vercel-forwarded-for")) ||
        firstEntry(headerReader.get("x-forwarded-for")) ||
        fallback
    );
}
