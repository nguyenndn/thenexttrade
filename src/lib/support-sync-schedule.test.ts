import { describe, expect, it } from "vitest";
import { getNextSupportSyncAt } from "./support-sync-schedule";

describe("getNextSupportSyncAt", () => {
    it("schedules the upcoming Saturday at 10:00 UTC", () => {
        const now = new Date("2026-10-21T12:00:00.000Z"); // Wednesday
        expect(getNextSupportSyncAt(now).toISOString()).toBe(
            "2026-10-24T10:00:00.000Z"
        );
    });

    it("uses the same Saturday before the 10:00 UTC cutoff", () => {
        const now = new Date("2026-10-24T09:59:59.000Z"); // Saturday
        expect(getNextSupportSyncAt(now).toISOString()).toBe(
            "2026-10-24T10:00:00.000Z"
        );
    });

    it("rolls to the next week after the cutoff", () => {
        const now = new Date("2026-10-24T10:00:00.000Z"); // Saturday
        expect(getNextSupportSyncAt(now).toISOString()).toBe(
            "2026-10-31T10:00:00.000Z"
        );
    });
});
