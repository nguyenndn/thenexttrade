export type CanonicalSyncSource =
    "EA_SYNC" | "APP" | "MANUAL" | "WINDOWS_IMPORT" | "UNKNOWN";

export function normalizeSyncSource(
    value: string | null | undefined
): CanonicalSyncSource {
    if (!value) return "UNKNOWN";
    const val = value.toUpperCase().trim();
    if (val === "EA" || val === "EA_SYNC" || val === "EA_HISTORY") {
        return "EA_SYNC";
    }
    if (val === "APP" || val === "TNT_CONNECT" || val === "TNT" || val === "CONNECT") {
        return "APP";
    }
    if (val === "MANUAL") {
        return "MANUAL";
    }
    if (val === "WINDOWS_IMPORT" || val === "VPS_SYNC" || val === "VPS") {
        return "WINDOWS_IMPORT";
    }
    return "UNKNOWN";
}

export function getSyncSourceLabel(source: CanonicalSyncSource): string {
    switch (source) {
        case "EA_SYNC":
        case "APP":
        case "WINDOWS_IMPORT":
            return "Trade Manager";
        case "MANUAL":
            return "Manual Entry";
        default:
            return "Unknown";
    }
}

export function isAutoSyncSource(source: CanonicalSyncSource): boolean {
    return source === "EA_SYNC" || source === "APP" || source === "WINDOWS_IMPORT";
}
