import { NextRequest, NextResponse } from "next/server";

const SERPER_API_KEY = process.env.SERPER_API_KEY;

interface SearchResult {
    title: string;
    url: string;
    snippet: string;
    source: "google" | "reddit" | "twitter" | "youtube";
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
        const [educationResults, forumResults, socialResults] = await Promise.all([
            // Primary: Educational articles from forex learning sites
            serperSearch(`${topic} forex trading explained tutorial`).catch(() => []),
            // Secondary: Community discussions (Reddit, forums)
            serperSearch(`${topic} forex site:reddit.com OR site:forexfactory.com`).catch(() => []),
            // Tertiary: Quick insights from X/Twitter
            serperSearch(`${topic} forex site:x.com OR site:twitter.com`).catch(() => []),
        ]);

        // Tag sources with smart detection
        const detectSource = (url: string, fallback: SearchResult["source"]): SearchResult["source"] => {
            if (url.includes("youtube.com") || url.includes("youtu.be")) return "youtube";
            if (url.includes("reddit.com")) return "reddit";
            if (url.includes("x.com") || url.includes("twitter.com")) return "twitter";
            return fallback;
        };

        const allResults: SearchResult[] = [
            ...educationResults.map(r => ({ ...r, source: detectSource(r.url, "google") })),
            ...forumResults.map(r => ({ ...r, source: detectSource(r.url, "reddit") })),
            ...socialResults.map(r => ({ ...r, source: detectSource(r.url, "twitter") })),
        ];

        // Deduplicate by URL & filter out primary URL + unscrapeble sites
        const BLOCKED_DOMAINS = ["tiktok.com", "instagram.com"];
        const seen = new Set<string>();
        const unique = allResults.filter(r => {
            const normalized = r.url.replace(/\/$/, "").toLowerCase();
            if (BLOCKED_DOMAINS.some(d => normalized.includes(d))) return false;
            if (seen.has(normalized)) return false;
            if (primaryUrl && normalized.includes(primaryUrl.replace(/\/$/, "").toLowerCase())) return false;
            seen.add(normalized);
            return true;
        });

        // Sort: Educational articles first, then YouTube, then Reddit, then Twitter
        const sorted = unique.sort((a, b) => {
            const order: Record<string, number> = { google: 0, youtube: 1, reddit: 2, twitter: 3 };
            return (order[a.source] ?? 4) - (order[b.source] ?? 4);
        });

        return NextResponse.json({
            topic,
            results: sorted.slice(0, 10),
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
