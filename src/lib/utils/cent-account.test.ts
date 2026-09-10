import { describe, it, expect } from "vitest";
import { isCentAccount, isCentSymbol, normalizeLotSize } from "./cent-account";

describe("cent-account utilities", () => {
    describe("isCentAccount", () => {
        it("detects cent account by currency USC or CENT", () => {
            expect(isCentAccount({ currency: "USC" })).toBe(true);
            expect(isCentAccount({ currency: "usc" })).toBe(true);
            expect(isCentAccount({ currency: "CENT" })).toBe(true);
            expect(isCentAccount({ currency: "EU_CENT" })).toBe(true);
            expect(isCentAccount({ currency: "USD" })).toBe(false);
        });

        it("detects cent account by server name containing cent", () => {
            expect(isCentAccount({ server: "Exness-MT5Cent" })).toBe(true);
            expect(isCentAccount({ server: "Exness-RealCent2" })).toBe(true);
            expect(isCentAccount({ server: "Exness-Real15" })).toBe(false);
        });

        it("detects cent account by accountType containing cent", () => {
            expect(isCentAccount({ accountType: "CENT" })).toBe(true);
            expect(isCentAccount({ accountType: "PRO_CENT" })).toBe(true);
            expect(isCentAccount({ accountType: "STANDARD" })).toBe(false);
        });
    });

    describe("isCentSymbol", () => {
        it("identifies cent symbol suffixes", () => {
            expect(isCentSymbol("XAUUSDc")).toBe(true);
            expect(isCentSymbol("EURUSDc")).toBe(true);
            expect(isCentSymbol("GBPUSD.c")).toBe(true);
            expect(isCentSymbol("USDJPY_c")).toBe(true);
        });

        it("does not falsely identify non-cent symbols", () => {
            expect(isCentSymbol("XAUUSD")).toBe(false);
            expect(isCentSymbol("EURUSD")).toBe(false);
            expect(isCentSymbol("USDC")).toBe(false);
            expect(isCentSymbol("USDCUSD")).toBe(false);
            expect(isCentSymbol(null)).toBe(false);
            expect(isCentSymbol("")).toBe(false);
        });
    });

    describe("normalizeLotSize", () => {
        it("converts 100 cent lots to 1 standard lot", () => {
            expect(normalizeLotSize(100, { isCent: true })).toBe(1);
            expect(normalizeLotSize(1063.65, { isCent: true })).toBe(10.6365);
            expect(normalizeLotSize(50, { symbol: "XAUUSDc" })).toBe(0.5);
            expect(normalizeLotSize(100, { currency: "USC" })).toBe(1);
        });

        it("leaves standard lots untouched", () => {
            expect(normalizeLotSize(1.5, { isCent: false })).toBe(1.5);
            expect(normalizeLotSize(10, { symbol: "XAUUSD" })).toBe(10);
            expect(normalizeLotSize(0, { isCent: true })).toBe(0);
        });
    });
});
