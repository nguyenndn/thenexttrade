import { NextRequest, NextResponse } from "next/server";

const SERPER_API_KEY = process.env.SERPER_API_KEY;

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: "google" | "reddit" | "twitter";
}

async function serperSearch(query: string): Promise<SearchResult[]> {
    if (!SERPER_API_KEY) throw new Error("SERPER_API_KEY not configured");

    const res = await fetch("https://google.serper.dev/search", {
        method: "POST",
        headers: {
            "X-API-KEY": SERPER_API_KEY,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            q: query,
            num: 5,
        }),
    });

    if (!res.ok) {
        const err = await res.text();
        throw new Error(`Serper API failed (${res.status}): ${err}`);
    }

    const data = await res.json();
    const organic = data.organic || [];

    return organic.map((item: any) => {
        let source: SearchResult["source"] = "google";
        if (item.link?.includes("reddit.com")) source = "reddit";
        if (item.link?.includes("x.com") || item.link?.includes("twitter.com")) source = "twitter";

        return {
            title: item.title || "",
            url: item.link || "",
            snippet: item.snippet || "",
            source,
        };
    });
}

export async function POST(req: NextRequest) {
    if (!SERPER_API_KEY) {
        return NextResponse.json(
            { error: "SERPER_API_KEY is not configured. Get a free key at serper.dev" },
            { status: 500 }
        );
    }

    try {
        const { topic, primaryUrl } = await req.json();

        if (!topic || typeof topic !== "string") {
            return NextResponse.json({ error: "Topic is required" }, { status: 400 });
        }

        // Run 3 targeted searches in parallel
        const [generalResults, redditResults, twitterResults] = await Promise.all([
            serperSearch(`${topic} forex education guide`).catch(() => []),
            serperSearch(`${topic} forex site:reddit.com`).catch(() => []),
            serperSearch(`${topic} forex trading site:x.com OR site:twitter.com`).catch(() => []),
        ]);

        // Tag sources
        const allResults: SearchResult[] = [
            ...generalResults,
            ...redditResults.map(r => ({ ...r, source: "reddit" as const })),
            ...twitterResults.map(r => ({ ...r, source: "twitter" as const })),
        ];

        // Deduplicate by URL & filter out primary URL
        const seen = new Set<string>();
        const unique = allResults.filter(r => {
            const normalized = r.url.replace(/\/$/, "").toLowerCase();
            if (seen.has(normalized)) return false;
            if (primaryUrl && normalized.includes(primaryUrl.replace(/\/$/, "").toLowerCase())) return false;
            seen.add(normalized);
            return true;
        });

        // Sort: Reddit & Twitter first (diversity), then Google
        const sorted = unique.sort((a, b) => {
            const order = { reddit: 0, twitter: 1, google: 2 };
            return order[a.source] - order[b.source];
        });

        return NextResponse.json({
            topic,
            results: sorted.slice(0, 8),
            totalFound: sorted.length,
        });
    } catch (error: any) {
        console.error("[AI Search Error]", error);
        return NextResponse.json(
            { error: error.message || "Search failed" },
            { status: 500 }
        );
    }
}
