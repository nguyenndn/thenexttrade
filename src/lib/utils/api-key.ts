import { randomBytes } from "crypto";

/**
 * Standard Crockford Base32 alphabet (32 characters):
 * 0-9 and A-Z excluding confusing letters (I, L, O) and U (to prevent accidental words).
 * - Exactly 32 characters (2^5) -> perfectly maps to 5 bits (`bytes[i] & 0x1f`) with zero bias.
 * - Entropy: 32^12 = 1.15 x 10^18 combinations (60 bits).
 */
export const CROCKFORD_BASE32_ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";

/**
 * Generate a concise, secure Sync API Key following the License Key format:
 * Format: TNT-XXXX-XXXX-XXXX (18 characters total: 3 prefix + 3 hyphens + 12 body)
 *
 * Characteristics:
 * - 60 bits of cryptographic entropy
 * - Zero modulo bias (256 is an exact multiple of 32)
 * - Fits comfortably inside the MetaTrader 5 EA parameters dialog without truncation
 */
export function generateSyncApiKey(): string {
    const bytes = randomBytes(12);
    let chars = "";

    for (let i = 0; i < 12; i++) {
        // Zero bias: 32 elements & 0x1f (0..31)
        chars += CROCKFORD_BASE32_ALPHABET[bytes[i] & 0x1f];
    }

    const chunk1 = chars.slice(0, 4);
    const chunk2 = chars.slice(4, 8);
    const chunk3 = chars.slice(8, 12);

    return `TNT-${chunk1}-${chunk2}-${chunk3}`;
}

/**
 * Mask a Sync API key for safe UI display.
 * - TNT format: TNT-XXXX-****-XXXX
 * - Legacy format: tnt_8f9c...1e2f
 */
export function maskSyncApiKey(apiKey: string | null | undefined): string {
    if (!apiKey) return "";

    const trimmed = apiKey.trim();

    // New format: TNT-XXXX-XXXX-XXXX
    if (trimmed.toUpperCase().startsWith("TNT-") && trimmed.length >= 17) {
        const upper = trimmed.toUpperCase();
        const parts = upper.split("-");
        if (parts.length === 4) {
            return `${parts[0]}-${parts[1]}-****-${parts[3]}`;
        }
        return `${upper.slice(0, 8)}-****-${upper.slice(-4)}`;
    }

    // Legacy format (e.g. tnt_hex or random hex)
    if (trimmed.length > 12) {
        return `${trimmed.slice(0, 8)}...${trimmed.slice(-4)}`;
    }

    return "****";
}

/**
 * Legacy per-account API key generator (retained for backward compatibility).
 */
export function generateApiKey(): string {
    return generateSyncApiKey();
}

/**
 * Mask legacy API key.
 */
export function maskApiKey(apiKey: string): string {
    return maskSyncApiKey(apiKey);
}

/**
 * License Key format regex: TNT-XXXX-XXXX-XXXX (17 characters).
 */
export const SYNC_API_KEY_REGEX =
    /^TNT-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

/**
 * Normalize incoming Sync API Key:
 * - Trims whitespace
 * - If key begins with TNT- (case-insensitive):
 *   - Uppercases it
 *   - Maps visually ambiguous characters: O -> 0, I -> 1, L -> 1
 * - Preserves legacy keys intact
 */
export function normalizeSyncApiKey(
    key: string | null | undefined
): string | null {
    if (!key) return null;
    const trimmed = key.trim();
    if (!trimmed) return null;

    if (trimmed.toUpperCase().startsWith("TNT-")) {
        const upper = trimmed.toUpperCase();
        const prefix = upper.slice(0, 4); // "TNT-"
        const body = upper.slice(4).replace(/O/g, "0").replace(/[IL]/g, "1");
        return `${prefix}${body}`;
    }

    return trimmed;
}

/**
 * Check if a key matches the TNT License Key format after normalization.
 */
export function isValidSyncApiKey(key: string | null | undefined): boolean {
    if (!key) return false;
    const normalized = normalizeSyncApiKey(key);
    if (!normalized) return false;
    return SYNC_API_KEY_REGEX.test(normalized);
}
