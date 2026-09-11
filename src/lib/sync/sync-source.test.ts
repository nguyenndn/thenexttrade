import { describe, it, expect } from "vitest";
import { formatSyncErrorMessage, normalizeSyncSource } from "./sync-source";

describe("sync-source formatting & error handling", () => {
    it("formats JOB_TIMEOUT as concise and friendly", () => {
        const msg = formatSyncErrorMessage({
            errorCode: "JOB_TIMEOUT",
            errorMessage: "Sync timed out: No worker available to pick up request. Click Sync to try again or request Support Sync.",
        });
        expect(msg).toBe("Unable to sync trade history. Please try again or request sync support.");
    });

    it("sanitizes legacy strings with worker/timeout jargon even without JOB_TIMEOUT errorCode", () => {
        const msg = formatSyncErrorMessage({
            errorMessage: "Waiting for background worker to pick up request.",
        });
        expect(msg).toBe("Unable to sync trade history. Please try again or request sync support.");
    });

    it("formats INVALID_CREDENTIALS cleanly", () => {
        const msg = formatSyncErrorMessage({
            errorCode: "INVALID_CREDENTIALS",
            errorMessage: "MetaTrader5 connection authorization failed with code 4001",
        });
        expect(msg).toBe("Invalid server or investor password. Please verify your credentials.");
    });

    it("formats USER_CANCELLED cleanly", () => {
        const msg = formatSyncErrorMessage({
            errorCode: "USER_CANCELLED",
        });
        expect(msg).toBe("Sync was cancelled.");
    });

    it("handles null / undefined / empty gracefully", () => {
        expect(formatSyncErrorMessage(null)).toBe("Sync failed. Please try again.");
        expect(formatSyncErrorMessage(undefined)).toBe("Sync failed. Please try again.");
        expect(formatSyncErrorMessage({ errorMessage: "" })).toBe("Unable to sync trade history. Please try again or request sync support.");
    });

    it("normalizes canonical sync sources correctly", () => {
        expect(normalizeSyncSource("EA_SYNC")).toBe("EA_SYNC");
        expect(normalizeSyncSource("APP")).toBe("APP");
        expect(normalizeSyncSource("MANUAL")).toBe("MANUAL");
        expect(normalizeSyncSource("WINDOWS_IMPORT")).toBe("WINDOWS_IMPORT");
        expect(normalizeSyncSource("UNKNOWN_METHOD")).toBe("UNKNOWN");
    });
});
