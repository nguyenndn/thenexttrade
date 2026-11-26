import { describe, expect, it, beforeEach, afterEach, vi } from "vitest";
import { isStaleDeploymentError } from "./stale-deployment";
import {
    getServerBuildId,
    __resetServerBuildIdForTests,
} from "./build-id.server";
import { GET as getBuildIdRoute } from "@/app/api/build-id/route";

describe("Deployment Skew & Stale Asset Guard", () => {
    beforeEach(() => {
        __resetServerBuildIdForTests();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
        __resetServerBuildIdForTests();
    });

    describe("isStaleDeploymentError", () => {
        it("detects iOS Safari / Chrome WebKit module script 404 errors", () => {
            const err = new TypeError("Importing a module script failed.");
            expect(isStaleDeploymentError(err)).toBe(true);
        });

        it("detects Chromium / Firefox dynamic import chunk errors", () => {
            expect(
                isStaleDeploymentError(
                    new TypeError(
                        "Failed to fetch dynamically imported module: https://thenexttrade.app/_next/static/chunks/8492.js"
                    )
                )
            ).toBe(true);
            expect(
                isStaleDeploymentError({
                    name: "ChunkLoadError",
                    message: "Loading chunk 412 failed.",
                })
            ).toBe(true);
            expect(
                isStaleDeploymentError({
                    name: "Error",
                    message: "Loading CSS chunk 918 failed.",
                })
            ).toBe(true);
        });

        it("detects Next.js 16 stale Server Action & RSC mismatch errors", () => {
            expect(
                isStaleDeploymentError({
                    name: "UnrecognizedActionError",
                    message:
                        'Server Action "409a8b1c" was not found on the server.',
                })
            ).toBe(true);
            expect(
                isStaleDeploymentError(
                    new Error("Expected RSC navigation response to have a body")
                )
            ).toBe(true);
            expect(
                isStaleDeploymentError(
                    new TypeError(
                        "Cannot read properties of undefined (reading 'call')"
                    )
                )
            ).toBe(true);
        });

        it("returns false for ordinary runtime or application errors", () => {
            expect(isStaleDeploymentError(new Error("Invalid input"))).toBe(
                false
            );
            expect(isStaleDeploymentError(null)).toBe(false);
            expect(isStaleDeploymentError(undefined)).toBe(false);
        });
    });

    describe("GET /api/build-id", () => {
        it("returns current buildId with strict Cloudflare & browser no-store headers", async () => {
            vi.stubEnv("COOLIFY_GIT_COMMIT_SHA", "commit-abc1234");
            const res = await getBuildIdRoute();
            expect(res.status).toBe(200);
            expect(res.headers.get("Cache-Control")).toContain("no-store");
            expect(res.headers.get("Cloudflare-CDN-Cache-Control")).toBe(
                "no-store"
            );
            const body = await res.json();
            expect(body.buildId).toBe("commit-abc1234");
            expect(getServerBuildId()).toBe("commit-abc1234");
        });
    });
});
