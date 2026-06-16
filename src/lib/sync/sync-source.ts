export type CanonicalSyncSource =
  | "TNT_CONNECT"
  | "EA_SYNC"
  | "MANUAL"
  | "UNKNOWN";

export function normalizeSyncSource(value: string | null | undefined): CanonicalSyncSource {
  if (!value) return "UNKNOWN";
  const val = value.toUpperCase().trim();
  if (val === "APP" || val === "TNT" || val === "TNT_CONNECT") {
    return "TNT_CONNECT";
  }
  if (val === "EA" || val === "EA_SYNC" || val === "EA_HISTORY") {
    return "EA_SYNC";
  }
  if (val === "MANUAL") {
    return "MANUAL";
  }
  return "UNKNOWN";
}

export function getSyncSourceLabel(source: CanonicalSyncSource): string {
  switch (source) {
    case "TNT_CONNECT":
      return "TNT Connect";
    case "EA_SYNC":
      return "EA Sync";
    case "MANUAL":
      return "Manual Entry";
    default:
      return "Unknown";
  }
}

export function isAutoSyncSource(source: CanonicalSyncSource): boolean {
  return source === "TNT_CONNECT" || source === "EA_SYNC";
}
