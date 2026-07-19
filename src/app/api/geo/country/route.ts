import { NextResponse } from "next/server";
import { getGeoFromHeaders } from "@/lib/analytics";

function isPublicIp(ip: string) {
    return !(
        ip === "::1" ||
        ip === "127.0.0.1" ||
        ip.startsWith("10.") ||
        ip.startsWith("192.168.") ||
        /^172\.(1[6-9]|2\d|3[0-1])\./.test(ip)
    );
}

function getClientIp(headers: Headers) {
    const forwardedFor = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    return (
        headers.get("cf-connecting-ip") ||
        headers.get("x-real-ip") ||
        forwardedFor ||
        null
    );
}

async function getCountryFromIp(ip: string) {
    if (!isPublicIp(ip)) return null;

    try {
        const res = await fetch(
            `https://api.country.is/${encodeURIComponent(ip)}`,
            {
                cache: "no-store",
                headers: {
                    accept: "application/json",
                    "user-agent": "TheNextTrade/1.0",
                },
                signal: AbortSignal.timeout(3500),
            }
        );

        if (!res.ok) return null;

        const data = (await res.json()) as { country?: string };
        const country = data.country?.trim().toUpperCase();
        return country && /^[A-Z]{2}$/.test(country) ? country : null;
    } catch {
        return null;
    }
}

async function getCountryFromPublicIp() {
    try {
        const res = await fetch("https://api.country.is/", {
            cache: "no-store",
            headers: {
                accept: "application/json",
                "user-agent": "TheNextTrade/1.0",
            },
            signal: AbortSignal.timeout(3500),
        });

        if (!res.ok) return null;

        const data = (await res.json()) as { country?: string };
        const country = data.country?.trim().toUpperCase();
        return country && /^[A-Z]{2}$/.test(country) ? country : null;
    } catch {
        return null;
    }
}

export async function GET(request: Request) {
    const geo = getGeoFromHeaders(request.headers);
    const headerCountry = geo.country?.toUpperCase();

    if (headerCountry && headerCountry !== "XX") {
        return NextResponse.json({
            country: headerCountry,
            source: "ip-header",
        });
    }

    const clientIp = getClientIp(request.headers);
    const ipCountry = clientIp ? await getCountryFromIp(clientIp) : null;

    if (ipCountry) {
        return NextResponse.json({ country: ipCountry, source: "ip-lookup" });
    }

    const publicIpCountry = await getCountryFromPublicIp();

    return NextResponse.json({
        country: publicIpCountry,
        source: publicIpCountry ? "public-ip-lookup" : "unknown",
    });
}
