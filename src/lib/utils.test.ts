import { describe, it, expect } from "vitest";
import {
    cn,
    isValidTimeZone,
    normalizeBrokerTimezone,
    parseBrokerNumber,
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
        expect(normalizeBrokerTimezone(undefined, 19800)).toBe(
            "Asia/Kolkata"
        );
        expect(normalizeBrokerTimezone(undefined, 34200)).toBe(
            "Australia/Adelaide"
        );
        // An unmapped half-hour offset must not guess a whole-hour Etc/GMT.
        expect(normalizeBrokerTimezone(undefined, 23400)).toBe(undefined);
    });
});

describe("parseBrokerNumber", () => {
    it("passes through plain numbers and finite numeric strings", () => {
        expect(parseBrokerNumber(1234.56)).toBe(1234.56);
        expect(parseBrokerNumber("1234.56")).toBe(1234.56);
        expect(parseBrokerNumber("-0.5")).toBe(-0.5);
    });

    it("handles US thousands separators", () => {
        expect(parseBrokerNumber("1,234.56")).toBe(1234.56);
        expect(parseBrokerNumber("1,234")).toBe(1234);
    });

    it("handles European decimal-comma formats", () => {
        expect(parseBrokerNumber("1234,56")).toBe(1234.56);
        expect(parseBrokerNumber("1.234,56")).toBe(1234.56);
        expect(parseBrokerNumber("1.234,56")).toBe(1234.56);
    });

    it("returns null for empty, null, undefined and junk", () => {
        expect(parseBrokerNumber(null)).toBeNull();
        expect(parseBrokerNumber(undefined)).toBeNull();
        expect(parseBrokerNumber("")).toBeNull();
        expect(parseBrokerNumber("abc")).toBeNull();
        expect(parseBrokerNumber("1.2.3")).toBeNull();
    });
});
