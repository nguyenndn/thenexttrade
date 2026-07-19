import { describe, it, expect } from "vitest";
import {
    cn,
    isValidTimeZone,
    normalizeBrokerTimezone,
    parseLocalEndOfDay,
    parseLocalStartOfDay,
} from "./utils";

describe("cn utility", () => {
    it("should merge class names correctly", () => {
        const result = cn("bg-red-500", "text-white");
        expect(result).toBe("bg-red-500 text-white");
    });

    it("should handle conditional class names", () => {
        const result = cn(
            "bg-red-500",
            true && "text-white",
            false && "text-black"
        );
        expect(result).toBe("bg-red-500 text-white");
    });

    it("should handle conflicts correctly using tailwind-merge", () => {
        // tailwind-merge should resolve conflict: p-4 vs p-2 -> p-2 should win if it's last
        const result = cn("p-4", "p-2");
        expect(result).toBe("p-2");
    });

    it("should handle undefined and null values", () => {
        const result = cn("bg-red-500", undefined, null, "text-white");
        expect(result).toBe("bg-red-500 text-white");
    });
});

describe("timezone date utilities", () => {
    it("falls back to a valid local date when broker timezone is invalid", () => {
        const start = parseLocalStartOfDay("2026-05-24", "Etc/GMT+37");
        const end = parseLocalEndOfDay("2026-05-24", "Etc/GMT+37");

        expect(isValidTimeZone("Etc/GMT+37")).toBe(false);
        expect(start).toBeInstanceOf(Date);
        expect(end).toBeInstanceOf(Date);
        expect(Number.isNaN(start?.getTime())).toBe(false);
        expect(Number.isNaN(end?.getTime())).toBe(false);
        expect(() => start?.toISOString()).not.toThrow();
        expect(() => end?.toISOString()).not.toThrow();
    });

    it("returns undefined for invalid date strings before callers call toISOString", () => {
        expect(parseLocalStartOfDay("not-a-date", "Etc/UTC")).toBeUndefined();
        expect(parseLocalEndOfDay("not-a-date", "Etc/UTC")).toBeUndefined();
    });

    it("normalizes bad broker timezone payloads from TNT Connect", () => {
        expect(normalizeBrokerTimezone("Etc/GMT+37", 133200)).toBe("Etc/UTC");
        expect(normalizeBrokerTimezone(undefined, 10800)).toBe("Etc/GMT-3");
        expect(normalizeBrokerTimezone(undefined, "10800")).toBe("Etc/GMT-3");
        expect(normalizeBrokerTimezone(undefined, 19800)).toBeUndefined();
    });
});
