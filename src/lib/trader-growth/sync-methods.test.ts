import { describe, it, expect } from "vitest";
import { SUPPORTED_SYNC_METHODS, getSupportedSyncMethod } from "./sync-methods";

describe("Supported Sync Methods Registry", () => {
    it("should include TradeSync EA (MT5) as primary method", () => {
        const ea = getSupportedSyncMethod("TRADE_MANAGER_EA");
        expect(ea).toBeDefined();
        expect(ea?.label).toContain("TradeSync EA");
        expect(ea?.enabled).toBe(true);
    });

    it("should include Manual Trading Journal as fallback method", () => {
        const manual = getSupportedSyncMethod("MANUAL_JOURNAL");
        expect(manual).toBeDefined();
        expect(manual?.label).toContain("Manual");
        expect(manual?.supportsMobileSetup).toBe(true);
    });

    it("should return undefined for unsupported method ID", () => {
        const unknown = getSupportedSyncMethod("UNSUPPORTED");
        expect(unknown).toBeUndefined();
    });
});
