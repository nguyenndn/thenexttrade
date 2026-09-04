import { NextResponse } from "next/server";

const ALLOWED_CONTENT_TYPES = new Set([
    "image/png",
    "image/jpeg",
    "image/webp",
]);

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return new NextResponse("Missing url parameter", { status: 400 });
    }

    let parsedUrl: URL;
    try {
        parsedUrl = new URL(url);
    } catch {
        return new NextResponse("Invalid URL", { status: 400 });
    }

    if (
        parsedUrl.protocol !== "https:" ||
        parsedUrl.hostname !== "s3.tradingview.com" ||
        !url.startsWith("https://s3.tradingview.com/")
    ) {
        return new NextResponse(
            "Forbidden - Only TradingView snapshot URLs are permitted",
            { status: 403 }
        );
    }

    try {
        const response = await fetch(url, {
            redirect: "error",
            headers: {
                "User-Agent":
                    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
                Accept: "image/png,image/jpeg,image/webp",
            },
        });

        if (!response.ok) {
            console.error(`Status ${response.status} fetching ${url}`);
            return new NextResponse("Failed to fetch image", {
                status: response.status,
            });
        }

        const rawContentType = response.headers.get("content-type") || "";
        const mimeType = rawContentType.split(";")[0].trim().toLowerCase();

        if (!ALLOWED_CONTENT_TYPES.has(mimeType)) {
            return new NextResponse(
                "Forbidden - Unsupported or prohibited image content type",
                { status: 415 }
            );
        }

        const arrayBuffer = await response.arrayBuffer();

        const headers = new Headers();
        headers.set("Content-Type", mimeType);
        headers.set("X-Content-Type-Options", "nosniff");
        headers.set("Content-Security-Policy", "default-src 'none'");
        headers.set("Cache-Control", "public, max-age=31536000, immutable");
        headers.set("Access-Control-Allow-Origin", "*");

        return new NextResponse(arrayBuffer, {
            status: 200,
            headers,
        });
    } catch (error) {
        console.error("Proxy image error:", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
