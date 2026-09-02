import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getBaseUrl, absoluteUrl } from "./url";

describe("Dynamic URL utilities", () => {
    const originalEnv = process.env;

    beforeEach(() => {
        process.env = { ...originalEnv };
    });

    afterEach(() => {
        process.env = originalEnv;
    });

    it("should use NEXT_PUBLIC_APP_URL when defined", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://customdomain.io/";
        expect(getBaseUrl()).toBe("https://customdomain.io");
        expect(absoluteUrl("/tools/pip-calculator")).toBe(
            "https://customdomain.io/tools/pip-calculator"
        );
    });

    it("should use APP_URL when NEXT_PUBLIC_APP_URL is not defined", () => {
        delete process.env.NEXT_PUBLIC_APP_URL;
        process.env.APP_URL = "https://app.tradinghub.net";
        expect(getBaseUrl()).toBe("https://app.tradinghub.net");
        expect(absoluteUrl("knowledge")).toBe(
            "https://app.tradinghub.net/knowledge"
        );
    });

    it("should return absolute URLs unchanged in absoluteUrl", () => {
        expect(absoluteUrl("https://external.com/image.png")).toBe(
            "https://external.com/image.png"
        );
    });

    it("should handle empty or root paths", () => {
        process.env.NEXT_PUBLIC_APP_URL = "https://mytrade.com";
        expect(absoluteUrl("")).toBe("https://mytrade.com");
        expect(absoluteUrl("/")).toBe("https://mytrade.com/");
    });
});
