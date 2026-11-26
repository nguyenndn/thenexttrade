import fs from "node:fs";
import path from "node:path";

let cachedBuildId: string | null = null;

/**
 * Resolves the current Next.js deployment build ID once per server process
 * and caches it in memory (zero disk/DB overhead on subsequent calls).
 */
export function getServerBuildId(): string {
    if (cachedBuildId) return cachedBuildId;

    const envId =
        process.env.NEXT_BUILD_ID ||
        process.env.COOLIFY_GIT_COMMIT_SHA ||
        process.env.VERCEL_GIT_COMMIT_SHA ||
        process.env.GITHUB_SHA;
    if (envId && envId.trim()) {
        cachedBuildId = envId.trim();
        return cachedBuildId;
    }

    try {
        const buildIdPath = path.join(process.cwd(), ".next", "BUILD_ID");
        if (fs.existsSync(buildIdPath)) {
            const raw = fs.readFileSync(buildIdPath, "utf8").trim();
            if (raw) {
                cachedBuildId = raw;
                return cachedBuildId;
            }
        }
    } catch {
        /* ignore fs read failure and fall back */
    }

    cachedBuildId =
        process.env.NODE_ENV === "production" ? "prod-runtime" : "dev";
    return cachedBuildId;
}

/** Reset helper for unit tests only */
export function __resetServerBuildIdForTests(): void {
    cachedBuildId = null;
}
