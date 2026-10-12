import { describe, it, expect } from "vitest";
import {
    generateSyncApiKey,
    maskSyncApiKey,
    isValidSyncApiKey,
    normalizeSyncApiKey,
    generateApiKey,
    maskApiKey,
    SYNC_API_KEY_REGEX,
    CROCKFORD_BASE32_ALPHABET,
} from "./api-key";

describe("Sync API Key Generator & Utilities (TNT-XXXX-XXXX-XXXX)", () => {
    describe("Alphabet properties", () => {
        it("has exactly 32 distinct characters for zero modulo bias with 5-bit mask", () => {
            expect(CROCKFORD_BASE32_ALPHABET).toHaveLength(32);
            const uniqueChars = new Set(CROCKFORD_BASE32_ALPHABET);
            expect(uniqueChars.size).toBe(32);
        });

        it("excludes easily confused characters I, L, O, and offensive U from generation", () => {
            const forbiddenInGen = ["I", "L", "O", "U"];
            for (const char of forbiddenInGen) {
                expect(CROCKFORD_BASE32_ALPHABET).not.toContain(char);
            }
        });
    });

    describe("generateSyncApiKey()", () => {
        it("generates an exact 18-character license-format key with TNT- prefix (TNT-XXXX-XXXX-XXXX)", () => {
            const key = generateSyncApiKey();
            expect(key).toHaveLength(18);
            expect(key.startsWith("TNT-")).toBe(true);
            expect(SYNC_API_KEY_REGEX.test(key)).toBe(true);
        });

        it("contains only Crockford Base32 characters in newly generated keys", () => {
            const forbiddenChars = ["I", "L", "O", "U", "i", "l", "o", "u"];

            for (let i = 0; i < 200; i++) {
                const key = generateSyncApiKey();
                expect(key).toHaveLength(18);
                for (const char of forbiddenChars) {
                    expect(key).not.toContain(char);
                }
            }
        });

        it("has 3 hyphen-delimited chunks after TNT prefix (4 chars each)", () => {
            const key = generateSyncApiKey();
            const parts = key.split("-");
            expect(parts).toHaveLength(4);
            expect(parts[0]).toBe("TNT");
            expect(parts[1]).toHaveLength(4);
            expect(parts[2]).toHaveLength(4);
            expect(parts[3]).toHaveLength(4);
        });

        it("generates unique keys with zero collisions across 1,000 iterations", () => {
            const generated = new Set<string>();
            const iterations = 1000;

            for (let i = 0; i < iterations; i++) {
                const key = generateSyncApiKey();
                expect(generated.has(key)).toBe(false);
                generated.add(key);
            }

            expect(generated.size).toBe(iterations);
        });
    });

    describe("isValidSyncApiKey()", () => {
        it("accepts user's chosen example key: TNT-8K2P-9WL4-7ZR1", () => {
            expect(isValidSyncApiKey("TNT-8K2P-9WL4-7ZR1")).toBe(true);
        });

        it("accepts valid 17-character license keys", () => {
            expect(isValidSyncApiKey("TNT-2345-6789-ABCD")).toBe(true);
            expect(isValidSyncApiKey("TNT-EFGH-JKMN-PQRS")).toBe(true);
            expect(isValidSyncApiKey("TNT-TUVW-XYZ2-3456")).toBe(true);
            expect(isValidSyncApiKey("TNT-0000-1111-2222")).toBe(true);
        });

        it("accepts lowercase TNT keys with surrounding whitespace", () => {
            expect(isValidSyncApiKey("  tnt-8k2p-9wl4-7zr1  ")).toBe(true);
        });

        it("rejects malformed keys or wrong lengths", () => {
            expect(isValidSyncApiKey("TNT-8K2P-9WL4")).toBe(false); // Too short
            expect(isValidSyncApiKey("TNT-8K2P-9WL4-7ZR1-EXTRA")).toBe(false); // Too long
            expect(isValidSyncApiKey("ABC-8K2P-9WL4-7ZR1")).toBe(false); // Wrong prefix
            expect(isValidSyncApiKey("TNT_8K2P_9WL4_7ZR1")).toBe(false); // Underscores instead of hyphens
            expect(isValidSyncApiKey("TNT-8K2P-9WL4-7ZR!")).toBe(false); // Special char
            expect(isValidSyncApiKey("")).toBe(false);
            expect(isValidSyncApiKey(null)).toBe(false);
            expect(isValidSyncApiKey(undefined)).toBe(false);
        });
    });

    describe("normalizeSyncApiKey()", () => {
        it("trims whitespace and uppercases TNT-prefixed keys", () => {
            expect(normalizeSyncApiKey("  tnt-8k2p-9wm4-7zr2  ")).toBe(
                "TNT-8K2P-9WM4-7ZR2"
            );
            expect(normalizeSyncApiKey("TNT-8K2P-9WM4-7ZR2")).toBe(
                "TNT-8K2P-9WM4-7ZR2"
            );
        });

        it("normalizes ambiguous characters (O -> 0, I -> 1, L -> 1) for error-free trader input", () => {
            // Typing 'O' instead of '0', or 'I'/'L' instead of '1'
            expect(normalizeSyncApiKey("TNT-8KOP-9WL4-7ZRI")).toBe(
                "TNT-8K0P-9W14-7ZR1"
            );
        });

        it("preserves legacy keys while trimming whitespace", () => {
            expect(normalizeSyncApiKey("  tnt_abcdef1234567890  ")).toBe(
                "tnt_abcdef1234567890"
            );
            expect(normalizeSyncApiKey("  legacy_key_123  ")).toBe(
                "legacy_key_123"
            );
        });

        it("returns null for empty or nullish inputs", () => {
            expect(normalizeSyncApiKey("")).toBe(null);
            expect(normalizeSyncApiKey("   ")).toBe(null);
            expect(normalizeSyncApiKey(null)).toBe(null);
            expect(normalizeSyncApiKey(undefined)).toBe(null);
        });
    });

    describe("maskSyncApiKey()", () => {
        it("masks TNT keys as TNT-XXXX-****-XXXX in uppercase", () => {
            expect(maskSyncApiKey("TNT-8K2P-9WL4-7ZR1")).toBe(
                "TNT-8K2P-****-7ZR1"
            );
            expect(maskSyncApiKey("  tnt-8k2p-9wl4-7zr1  ")).toBe(
                "TNT-8K2P-****-7ZR1"
            );
        });

        it("masks legacy keys as prefix...suffix", () => {
            expect(maskSyncApiKey("tnt_a1b2c3d4e5f6g7h8")).toBe(
                "tnt_a1b2...g7h8"
            );
        });

        it("handles null, undefined, or empty values safely", () => {
            expect(maskSyncApiKey(null)).toBe("");
            expect(maskSyncApiKey(undefined)).toBe("");
            expect(maskSyncApiKey("")).toBe("");
            expect(maskSyncApiKey("short")).toBe("****");
        });
    });

    describe("Backward Compatibility Aliases", () => {
        it("generateApiKey() delegates to generateSyncApiKey()", () => {
            const key = generateApiKey();
            expect(key).toHaveLength(18);
            expect(key.startsWith("TNT-")).toBe(true);
        });

        it("maskApiKey() delegates to maskSyncApiKey()", () => {
            expect(maskApiKey("TNT-8K2P-9WL4-7ZR1")).toBe(
                "TNT-8K2P-****-7ZR1"
            );
        });
    });
});
