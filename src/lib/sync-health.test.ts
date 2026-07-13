import { describe, it, expect } from "vitest";
import { computeSyncHealth } from "./sync-health";

describe("computeSyncHealth", () => {
  it("should categorize manual accounts as unsupported with Log Trade action", () => {
    const res = computeSyncHealth({
      status: "APPROVED",
      syncSource: "MANUAL",
      lastHeartbeat: null,
      appLastHeartbeat: null,
      lastSync: null,
      totalTrades: 10,
      resyncRequest: null,
    });
    expect(res.status).toBe("unsupported");
    expect(res.primaryAction.label).toBe("Log Trade");
  });

  it("should categorize connected accounts without trades and recent heartbeat as no_trades_yet", () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60).toISOString(); // 1 hour ago
    const res = computeSyncHealth({
      status: "APPROVED",
      syncSource: "EA_SYNC",
      lastHeartbeat: recentDate,
      appLastHeartbeat: null,
      lastSync: null,
      totalTrades: 0,
      resyncRequest: null,
    });
    expect(res.status).toBe("no_trades_yet");
    expect(res.primaryAction.action).toBe("sync_first_trades");
  });

  it("should categorize connected accounts without trades and no heartbeat as disconnected (setup sync)", () => {
    const res = computeSyncHealth({
      status: "APPROVED",
      syncSource: "EA_SYNC",
      lastHeartbeat: null,
      appLastHeartbeat: null,
      lastSync: null,
      totalTrades: 0,
      resyncRequest: null,
    });
    expect(res.status).toBe("disconnected");
    expect(res.primaryAction.action).toBe("open_sync_setup");
  });

  it("should categorize accounts with trades and no recent heartbeat as disconnected (reconnect)", () => {
    const res = computeSyncHealth({
      status: "APPROVED",
      syncSource: "EA_SYNC",
      lastHeartbeat: null,
      appLastHeartbeat: null,
      lastSync: new Date().toISOString(),
      totalTrades: 15,
      resyncRequest: null,
    });
    expect(res.status).toBe("disconnected");
    expect(res.primaryAction.action).toBe("reconnect");
  });

  it("should categorize accounts with trades and stale heartbeat (> 6 hours) as stale", () => {
    const staleDate = new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(); // 8 hours ago
    const res = computeSyncHealth({
      status: "APPROVED",
      syncSource: "EA_SYNC",
      lastHeartbeat: staleDate,
      appLastHeartbeat: null,
      lastSync: staleDate,
      totalTrades: 15,
      resyncRequest: null,
    });
    expect(res.status).toBe("stale");
    expect(res.primaryAction.action).toBe("reconnect");
  });

  it("should categorize accounts with trades and recent heartbeat as healthy", () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(); // 2 hours ago
    const res = computeSyncHealth({
      status: "APPROVED",
      syncSource: "EA_SYNC",
      lastHeartbeat: recentDate,
      appLastHeartbeat: null,
      lastSync: recentDate,
      totalTrades: 42,
      resyncRequest: null,
    });
    expect(res.status).toBe("healthy");
    expect(res.primaryAction.action).toBe("view_dashboard");
  });

  it("should catch missing trade data connections (received > 0 but imported 0)", () => {
    const recentDate = new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(); // 2 hours ago
    const res = computeSyncHealth({
      status: "APPROVED",
      syncSource: "EA_SYNC",
      lastHeartbeat: recentDate,
      appLastHeartbeat: null,
      lastSync: recentDate,
      totalTrades: 42,
      resyncRequest: null,
      latestSyncHistory: {
        tradesReceived: 5,
        tradesImported: 0,
        tradesSkipped: 5,
        createdAt: recentDate,
      },
    });
    expect(res.status).toBe("missing_trade_data");
  });
});
