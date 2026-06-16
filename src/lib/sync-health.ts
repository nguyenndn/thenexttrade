import { normalizeSyncSource, type CanonicalSyncSource } from "@/lib/sync/sync-source";

/**
 * Sync Health — Server helper to compute account sync status.
 *
 * Produces a human-readable SyncHealth object from TradingAccount
 * and SyncHistory data. Used by account cards and dashboard banners.
 */

// Thresholds
const STALE_HEARTBEAT_HOURS = 6;
const STALE_SYNC_HOURS = 24;

export type SyncHealthStatus =
 | "healthy"
 | "no_trades_yet"
 | "stale"
 | "disconnected"
 | "missing_trade_data"
 | "sync_error"
 | "unsupported";

export type SyncSource = CanonicalSyncSource;

export type SyncHealthAction =
 | "open_sync_setup"
 | "sync_first_trades"
 | "reconnect"
 | "view_dashboard"
 | "contact_support";

export interface SyncHealth {
 status: SyncHealthStatus;
 label: string;
 description: string;
 source: SyncSource;
 lastHeartbeatAt: string | null;
 lastSyncAt: string | null;
 totalTrades: number;
 primaryAction: {
 label: string;
 href?: string;
 action?: SyncHealthAction;
 };
}

interface SyncHealthInput {
 // From TradingAccount
 status: string;
 syncSource: string;
 lastHeartbeat: Date | string | null;
 appLastHeartbeat: Date | string | null;
 lastSync: Date | string | null;
 totalTrades: number;
 resyncRequest: string | null;
 // From latest SyncHistory (optional)
 latestSyncHistory?: {
 tradesReceived: number;
 tradesImported: number;
 tradesSkipped: number;
 createdAt: Date | string;
 } | null;
}

function hoursSince(date: Date | string | null): number | null {
 if (!date) return null;
 const d = typeof date === "string" ? new Date(date) : date;
 return (Date.now() - d.getTime()) / (1000 * 60 * 60);
}

function resolveSource(syncSource: string): CanonicalSyncSource {
 return normalizeSyncSource(syncSource);
}

export function computeSyncHealth(input: SyncHealthInput): SyncHealth {
 const source = resolveSource(input.syncSource);

 // Best heartbeat = most recent between lastHeartbeat and appLastHeartbeat
 const heartbeatDate = newerDate(input.lastHeartbeat, input.appLastHeartbeat);
 const heartbeatHours = hoursSince(heartbeatDate);
 const syncHours = hoursSince(input.lastSync);

 const lastHeartbeatAt = heartbeatDate
 ? (typeof heartbeatDate === "string" ? heartbeatDate : heartbeatDate.toISOString())
 : null;
 const lastSyncAt = input.lastSync
 ? (typeof input.lastSync === "string" ? input.lastSync : input.lastSync.toISOString())
 : null;

 const base = {
 source,
 lastHeartbeatAt,
 lastSyncAt,
 totalTrades: input.totalTrades,
 };

 // 1. Unsupported: manual-only accounts don't use sync
 if (source === "MANUAL") {
 return {
 ...base,
 status: "unsupported",
 label: "Manual Entry",
 description: "This account uses manual trade logging.",
 primaryAction: {
 label: "Log Trade",
 href: "/dashboard/journal/new",
 },
 };
 }

 // 2. No trades yet
 if (input.totalTrades === 0) {
 // Has heartbeat but no trades — waiting for first sync
 if (heartbeatHours !== null && heartbeatHours < STALE_HEARTBEAT_HOURS) {
 return {
 ...base,
 status: "no_trades_yet",
 label: "Connected — No Trades Yet",
 description: "Your account is connected. Close a trade in MT5 to sync your first data.",
 primaryAction: {
 label: "Sync First Trades",
 action: "sync_first_trades",
 },
 };
 }

 // No heartbeat and no trades — needs setup
 return {
 ...base,
 status: "disconnected",
 label: "Not Connected",
 description: source === "TNT_CONNECT"
 ? "Open TNT Connect to link your MT5 account."
 : "Install the EA on your MT5 chart to start syncing.",
 primaryAction: {
 label: "Setup Sync",
 action: "open_sync_setup",
 },
 };
 }

 // 3. Has trades — check freshness
 // Disconnected: no heartbeat at all or very old
 if (heartbeatHours === null || heartbeatHours > STALE_HEARTBEAT_HOURS * 4) {
 return {
 ...base,
 status: "disconnected",
 label: "Disconnected",
 description: source === "TNT_CONNECT"
 ? "TNT Connect hasn't sent a signal. Please reopen the app."
 : "EA hasn't sent a heartbeat. Check if MT5 is running.",
 primaryAction: {
 label: "Reconnect",
 action: "reconnect",
 },
 };
 }

 // Stale: heartbeat exists but getting old
 if (heartbeatHours > STALE_HEARTBEAT_HOURS) {
 return {
 ...base,
 status: "stale",
 label: "Stale Connection",
 description: `Last signal was ${Math.round(heartbeatHours)} hours ago. Check if MT5 is still running.`,
 primaryAction: {
 label: "Reconnect",
 action: "reconnect",
 },
 };
 }

 // Missing trade data: sync occurred but imported 0
 if (input.latestSyncHistory) {
 const { tradesReceived, tradesImported } = input.latestSyncHistory;
 if (tradesReceived > 0 && tradesImported === 0) {
 return {
 ...base,
 status: "missing_trade_data",
 label: "Sync Issue",
 description: `Received ${tradesReceived} trades but none were imported. They may be duplicates or have missing data.`,
 primaryAction: {
 label: "View Dashboard",
 action: "view_dashboard",
 href: "/dashboard",
 },
 };
 }
 }

 // 4. Healthy
 return {
 ...base,
 status: "healthy",
 label: "Connected",
 description: syncHours !== null
 ? `Last sync ${Math.round(syncHours)} hours ago. ${input.totalTrades} trades synced.`
 : `${input.totalTrades} trades synced.`,
 primaryAction: {
 label: "Dashboard",
 action: "view_dashboard",
 href: "/dashboard",
 },
 };
}

function newerDate(
 a: Date | string | null,
 b: Date | string | null
): Date | string | null {
 if (!a && !b) return null;
 if (!a) return b;
 if (!b) return a;
 const da = typeof a === "string" ? new Date(a) : a;
 const db = typeof b === "string" ? new Date(b) : b;
 return da > db ? a : b;
}
