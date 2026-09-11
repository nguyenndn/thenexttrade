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

export function formatSyncErrorMessage(
    job: {
        errorCode?: string | null;
        errorMessage?: string | null;
        message?: string | null;
    } | null | undefined
): string {
    if (!job) return "Sync failed. Please try again.";

    if (job.errorCode === "JOB_TIMEOUT") {
        return "Unable to sync trade history. Please try again or request sync support.";
    }

    if (
        job.errorCode === "INVALID_CREDENTIALS" ||
        job.errorCode === "AUTH_FAILED"
    ) {
        return "Invalid server or investor password. Please verify your credentials.";
    }

    if (job.errorCode === "USER_CANCELLED") {
        return "Sync was cancelled.";
    }

    const rawMsg = (job.errorMessage || job.message || "").trim();
    if (!rawMsg) {
        return "Unable to sync trade history. Please try again or request sync support.";
    }

    const lower = rawMsg.toLowerCase();
    // Sanitize any internal worker or system queue jargon from existing DB rows
    if (
        lower.includes("worker") ||
        lower.includes("timed out") ||
        lower.includes("timeout") ||
        lower.includes("stalled") ||
        lower.includes("pick up request")
    ) {
        return "Unable to sync trade history. Please try again or request sync support.";
    }

    if (
        lower.includes("password") ||
        lower.includes("credentials") ||
        lower.includes("auth")
    ) {
        return "Invalid server or investor password. Please verify your credentials.";
    }

    return rawMsg;
}
