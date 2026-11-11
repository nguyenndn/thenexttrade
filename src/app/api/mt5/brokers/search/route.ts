import fs from "fs";
import path from "path";
import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { rateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_CACHE_KEY_LENGTH = 64;
const MAX_CACHED_KEYS = 300;
const MAX_CACHED_SERVERS = 300;

const brokerSearchLimiter = rateLimit({
    interval: 60_000,
    uniqueTokenPerInterval: 500,
});

interface CachedServerItem {
    name: string;
    serverName: string;
    broker: string;
    company: string;
    website?: string;
    logoUrl?: string;
    isDemo: boolean;
    accessPoints?: string[];
    keywords?: string[];
    updatedAt?: string;
}

interface ServerCacheFileData {
    searchedQueries: string[];
    servers: CachedServerItem[];
}

function getCacheFilePath(): string {
    const rootDir = process["cwd"]();
    return [rootDir, "mt5-cloud-sync", "servers.cache.json"].join(path.sep);
}

function readServerCacheFile(): ServerCacheFileData {
    try {
        const filePath = getCacheFilePath();
        if (!fs.existsSync(filePath)) {
            return { searchedQueries: [], servers: [] };
        }
        const raw = fs.readFileSync(filePath, "utf8");
        const parsed = JSON.parse(raw);
        return {
            searchedQueries: Array.isArray(parsed?.searchedQueries)
                ? parsed.searchedQueries
                : [],
            servers: Array.isArray(parsed?.servers) ? parsed.servers : [],
        };
    } catch {
        return { searchedQueries: [], servers: [] };
    }
}

function writeServerCacheFile(data: ServerCacheFileData): void {
    try {
        const filePath = getCacheFilePath();
        const dir = path.dirname(filePath);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    } catch {
        // Ignore write errors in read-only environments
    }
}

function getApkCloudSyncService() {
    const runtimeLoader = new Function(
        "entryPath",
        "const mod = process.getBuiltinModule ? process.getBuiltinModule('module') : require('module'); return mod.createRequire(entryPath)(entryPath);"
    ) as (entryPath: string) => {
        CloudSyncService: { getInstance: () => any };
    };
    const rootDir = process["cwd"]();
    const modulePath = [rootDir, "mt5-cloud-sync", "index.js"].join(path.sep);
    const { CloudSyncService } = runtimeLoader(modulePath);
    return CloudSyncService.getInstance();
}

function filterServersFromCache(
    servers: CachedServerItem[],
    query: string,
    brokerFilter: string
): CachedServerItem[] {
    const qLower = query.toLowerCase().trim();
    const bLower = brokerFilter.toLowerCase().trim();

    if (!qLower && !bLower) {
        return [];
    }

    const seen = new Set<string>();
    const matched: CachedServerItem[] = [];

    for (const s of servers) {
        const name = String(s.name || s.serverName || "").trim();
        if (!name) continue;
        const key = name.toLowerCase();
        if (seen.has(key)) continue;

        const nameLower = key;
        const brokerLower = String(s.broker || "").toLowerCase();
        const companyLower = String(s.company || "").toLowerCase();
        const keywords = Array.isArray(s.keywords)
            ? s.keywords.map((k) => String(k).toLowerCase())
            : [];

        if (bLower) {
            const matchesBroker =
                nameLower.includes(bLower) ||
                brokerLower.includes(bLower) ||
                companyLower.includes(bLower) ||
                keywords.some((k) => k.includes(bLower) || bLower.includes(k));
            if (!matchesBroker) continue;
        }

        if (qLower) {
            const matchesQuery =
                nameLower.includes(qLower) ||
                brokerLower.includes(qLower) ||
                companyLower.includes(qLower) ||
                keywords.some((k) => k.includes(qLower));
            if (!matchesQuery) continue;
        }

        seen.add(key);
        matched.push(s);
    }

    return matched;
}

async function handleBrokerServerSearch(params: {
    query?: string;
    brokerFilter?: string | null;
    region?: string;
    limit?: number;
    mode?: "cache" | "live";
    force?: boolean;
}) {
    const rawQuery = (params.query || "").trim().slice(0, MAX_CACHE_KEY_LENGTH);
    const brokerFilter = (params.brokerFilter || "")
        .trim()
        .slice(0, MAX_CACHE_KEY_LENGTH);
    const region = (params.region || "VN").trim().slice(0, 16) || "VN";
    const limit = Math.min(Math.max(Number(params.limit) || 100, 1), 500);
    const mode = params.mode === "live" ? "live" : "cache";
    const force = Boolean(params.force);

    const effectiveQuery = (rawQuery || brokerFilter).slice(
        0,
        MAX_CACHE_KEY_LENGTH
    );
    const effectiveQueryLower = effectiveQuery.toLowerCase();

    // If no query is typed, return empty list (static catalog is hidden)
    if (!effectiveQuery || effectiveQuery.length < 2) {
        return {
            success: true,
            mode,
            fromCache: true,
            query: rawQuery,
            brokerFilter: brokerFilter || null,
            totalCount: 0,
            count: 0,
            servers: [],
        };
    }

    const cacheData = readServerCacheFile();
    const cachedMatches = filterServersFromCache(
        cacheData.servers,
        rawQuery,
        brokerFilter
    );
    const isQueryAlreadySearched = cacheData.searchedQueries.includes(
        effectiveQueryLower
    );

    // 1. If mode is "cache" (user is typing) OR query was already searched & cached in JSON file
    if (mode === "cache" || (isQueryAlreadySearched && cachedMatches.length > 0 && !force)) {
        const sliced = cachedMatches.slice(0, limit);
        return {
            success: true,
            mode,
            fromCache: true,
            queryCached: isQueryAlreadySearched,
            query: rawQuery,
            brokerFilter: brokerFilter || null,
            totalCount: cachedMatches.length,
            count: sliced.length,
            servers: sliced,
        };
    }

    // 2. Mode is "live" (user clicked Search button) and query is not yet in JSON cache
    const cloudSync = getApkCloudSyncService();
    const apkRes = await cloudSync.searchBrokersAndServers(effectiveQuery, region);
    const liveServersRaw = Array.isArray(apkRes?.servers) ? apkRes.servers : [];

    // Merge newly discovered servers into servers.cache.json
    const serverMap = new Map<string, CachedServerItem>();
    for (const existing of cacheData.servers) {
        const name = String(existing.name || existing.serverName || "").trim();
        if (!name || name.length > MAX_CACHE_KEY_LENGTH) continue;
        serverMap.set(name.toLowerCase(), existing);
    }

    const nowIso = new Date().toISOString();
    for (const s of liveServersRaw) {
        const name = String(s.name || s.serverName || "").trim();
        if (!name || name.length > MAX_CACHE_KEY_LENGTH) continue;
        const key = name.toLowerCase();
        const prev = serverMap.get(key);
        const prevKeywords = Array.isArray(prev?.keywords) ? prev.keywords : [];
        const nextKeywords = Array.from(
            new Set(
                [
                    ...prevKeywords,
                    effectiveQueryLower,
                    rawQuery.toLowerCase(),
                    brokerFilter.toLowerCase(),
                ]
                    .filter((k) => Boolean(k) && k.length <= MAX_CACHE_KEY_LENGTH)
            )
        ).slice(-50);

        if (serverMap.has(key)) {
            serverMap.delete(key);
        }
        serverMap.set(key, {
            name,
            serverName: name,
            broker: s.broker || s.company || prev?.broker || "",
            company: s.company || s.broker || prev?.company || "",
            website: s.website || prev?.website || "",
            logoUrl: s.logoUrl || prev?.logoUrl || "",
            isDemo: Boolean(s.isDemo) || /demo/i.test(name),
            accessPoints: Array.isArray(s.accessPoints)
                ? s.accessPoints
                : prev?.accessPoints || [],
            keywords: nextKeywords,
            updatedAt: nowIso,
        });
    }

    const sanitizedQueries = cacheData.searchedQueries.filter(
        (q): q is string =>
            typeof q === "string" &&
            q.length > 0 &&
            q.length <= MAX_CACHE_KEY_LENGTH
    );
    const dedupedQueries = sanitizedQueries.filter(
        (q) => q !== effectiveQueryLower
    );
    if (effectiveQueryLower.length <= MAX_CACHE_KEY_LENGTH) {
        dedupedQueries.push(effectiveQueryLower);
    }
    const updatedSearchedQueries = dedupedQueries.slice(-MAX_CACHED_KEYS);
    const updatedServers = Array.from(serverMap.values()).slice(
        -MAX_CACHED_SERVERS
    );

    writeServerCacheFile({
        searchedQueries: updatedSearchedQueries,
        servers: updatedServers,
    });

    const allMatched = filterServersFromCache(
        updatedServers,
        rawQuery,
        brokerFilter
    );
    const slicedServers = allMatched.slice(0, limit);

    return {
        success: true,
        mode: "live",
        fromCache: false,
        queryCached: true,
        query: rawQuery,
        brokerFilter: brokerFilter || null,
        totalCount: allMatched.length,
        count: slicedServers.length,
        servers: slicedServers,
    };
}

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        try {
            await brokerSearchLimiter.check(30, `mt5_broker_search:${user.id}`);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many search requests. Please wait a moment.",
                },
                { status: 429 }
            );
        }

        const { searchParams } = new URL(request.url);
        const query =
            searchParams.get("q") ||
            searchParams.get("query") ||
            searchParams.get("server") ||
            searchParams.get("company") ||
            "";
        const brokerFilter = searchParams.get("broker") || null;
        const region = searchParams.get("region") || "VN";
        const limit = Number(searchParams.get("limit") || 100);
        const modeParam = searchParams.get("mode");
        const mode: "cache" | "live" = modeParam === "live" ? "live" : "cache";
        const force = searchParams.get("force") === "true";

        const result = await handleBrokerServerSearch({
            query,
            brokerFilter,
            region,
            limit,
            mode,
            force,
        });
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error?.message || "Failed to search MT5 brokers and servers",
            },
            { status: 500 }
        );
    }
}

export async function POST(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json(
                { success: false, error: "Unauthorized" },
                { status: 401 }
            );
        }

        try {
            await brokerSearchLimiter.check(30, `mt5_broker_search:${user.id}`);
        } catch {
            return NextResponse.json(
                {
                    success: false,
                    error: "Too many search requests. Please wait a moment.",
                },
                { status: 429 }
            );
        }

        const body = await request.json().catch(() => ({}));
        const query =
            body.q || body.query || body.server || body.company || "";
        const brokerFilter = body.broker || body.brokerFilter || null;
        const region = body.region || "VN";
        const limit = Number(body.limit || 100);
        const mode: "cache" | "live" = body.mode === "cache" ? "cache" : "live";
        const force = Boolean(body.force);

        const result = await handleBrokerServerSearch({
            query,
            brokerFilter,
            region,
            limit,
            mode,
            force,
        });
        return NextResponse.json(result);
    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error?.message || "Failed to search MT5 brokers and servers",
            },
            { status: 500 }
        );
    }
}
