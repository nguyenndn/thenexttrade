import { afterEach, describe, expect, it, vi } from "vitest";
import {
    getIndexNowKey,
    getIndexNowKeyLocation,
    notifyIndexNow,
} from "./indexnow";

describe("IndexNow GEO/AI-Search Ping Utility", () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it("returns a valid hexadecimal key and keyLocation URL", () => {
        const key = getIndexNowKey();
        expect(key).toMatch(/^[a-zA-Z0-9-]{8,128}$/);
        expect(getIndexNowKeyLocation("https://thenexttrade.app/")).toBe(
            "https://thenexttrade.app/indexnow-key.txt"
        );
    });

    it("skips IndexNow HTTP calls on localhost", async () => {
        const fetchSpy = vi.spyOn(globalThis, "fetch");
        const res = await notifyIndexNow(
            ["http://localhost:3500/articles/test"],
            { baseUrl: "http://localhost:3500" }
        );
        expect(res.submitted).toBe(false);
        expect(res.skippedReason).toBe("local-host-skipped");
        expect(fetchSpy).not.toHaveBeenCalled();
    });

    it("deduplicates same-host URLs and posts valid IndexNow payload in production", async () => {
        const fetchSpy = vi
            .spyOn(globalThis, "fetch")
            .mockResolvedValueOnce(new Response(null, { status: 202 }));

        const res = await notifyIndexNow(
            [
                "https://thenexttrade.app/articles/risk-math",
                "https://thenexttrade.app/articles/risk-math",
                "https://evil.example.com/phish",
            ],
            {
                baseUrl: "https://thenexttrade.app",
                allowNonProd: true,
            }
        );

        expect(res.submitted).toBe(true);
        expect(res.status).toBe(202);
        expect(res.urlCount).toBe(1);
        expect(fetchSpy).toHaveBeenCalledTimes(1);

        const [, init] = fetchSpy.mock.calls[0]!;
        const payload = JSON.parse(String(init?.body));
        expect(payload.host).toBe("thenexttrade.app");
        expect(payload.keyLocation).toBe(
            "https://thenexttrade.app/indexnow-key.txt"
        );
        expect(payload.urlList).toEqual([
            "https://thenexttrade.app/articles/risk-math",
        ]);
    });
});
