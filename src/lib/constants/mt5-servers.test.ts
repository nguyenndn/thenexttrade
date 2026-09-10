import { describe, it, expect } from "vitest";
import { filterMt5Servers, getServersForBroker, POPULAR_MT5_SERVERS } from "./mt5-servers";

describe("filterMt5Servers", () => {
    it("returns default top servers when query is empty", () => {
        const result = filterMt5Servers("");
        expect(result.length).toBeGreaterThan(0);
        expect(result.length).toBeLessThanOrEqual(50);
    });

    it("filters servers by partial server name (case-insensitive)", () => {
        const result = filterMt5Servers("startrader");
        expect(result.length).toBeGreaterThan(0);
        expect(result.some((s) => s.name.toLowerCase().includes("startrader"))).toBe(true);
    });

    it("filters servers by broker name", () => {
        const result = filterMt5Servers("exness");
        expect(result.length).toBeGreaterThan(0);
        expect(result.every((s) => s.name.toLowerCase().includes("exness") || s.broker?.toLowerCase().includes("exness"))).toBe(true);
    });

    it("returns empty array for non-matching query", () => {
        const result = filterMt5Servers("nonexistent_broker_xyz_123");
        expect(result).toEqual([]);
    });

    it("includes servers from user screenshot (e.g. 1xTrade, 4xCube, AAAFx)", () => {
        const names = POPULAR_MT5_SERVERS.map((s) => s.name);
        expect(names).toContain("1xTrade-Server");
        expect(names).toContain("4xCube-MT5");
        expect(names).toContain("AAAFx-5 Demo");
    });

    it("contains over 1,300 crawled servers including boundary items", () => {
        expect(POPULAR_MT5_SERVERS.length).toBeGreaterThanOrEqual(1300);
        const names = POPULAR_MT5_SERVERS.map((s) => s.name);
        expect(names).toContain("ZuperiorFX-Server");
        expect(names).toContain("ZeroMarkets-1");
        expect(names).toContain("ZealCapitalMarketSC-Demo");
    });
});

describe("getServersForBroker", () => {
    it("returns all servers when broker is null, undefined, or empty", () => {
        expect(getServersForBroker(null).length).toBe(POPULAR_MT5_SERVERS.length);
        expect(getServersForBroker(undefined).length).toBe(POPULAR_MT5_SERVERS.length);
        expect(getServersForBroker("").length).toBe(POPULAR_MT5_SERVERS.length);
    });

    it("filters strictly by EXNESS", () => {
        const servers = getServersForBroker("EXNESS");
        expect(servers.length).toBeGreaterThanOrEqual(140);
        expect(servers.every((s) => s.name.toLowerCase().includes("exness") || s.broker?.toLowerCase().includes("exness"))).toBe(true);
    });

    it("filters strictly by VANTAGE", () => {
        const servers = getServersForBroker("VANTAGE");
        expect(servers.length).toBeGreaterThanOrEqual(40);
        expect(servers.every((s) => s.name.toLowerCase().includes("vantage") || s.broker?.toLowerCase().includes("vantage"))).toBe(true);
    });

    it("filters strictly by VTMARKETS", () => {
        const servers = getServersForBroker("VTMARKETS");
        expect(servers.length).toBeGreaterThanOrEqual(8);
        expect(servers.every((s) => s.name.toLowerCase().includes("vtmarket") || s.broker?.toLowerCase().includes("vtmarket"))).toBe(true);
    });

    it("filters strictly by ULTIMAMARKETS", () => {
        const servers = getServersForBroker("ULTIMAMARKETS");
        expect(servers.length).toBeGreaterThanOrEqual(4);
        expect(servers.every((s) => s.name.toLowerCase().includes("ultima") || s.broker?.toLowerCase().includes("ultima"))).toBe(true);
    });
});

