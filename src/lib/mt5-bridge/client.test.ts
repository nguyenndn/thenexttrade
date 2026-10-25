import { describe, it, expect, vi, beforeEach } from "vitest";
import { encryptPassword, decryptPassword } from "@/lib/crypto";

describe("MT5 Cloud Direct Bridge Security & Payload Validation", () => {
    beforeEach(() => {
        vi.restoreAllMocks();
    });

    it("encrypts and decrypts MT5 passwords using AES-256-GCM without leaking plaintext", () => {
        const masterPass = "HfmLive#2026!Secret";
        const encrypted = encryptPassword(masterPass);
        expect(encrypted).not.toContain(masterPass);
        expect(encrypted.split(":")).toHaveLength(3);
        const decrypted = decryptPassword(encrypted);
        expect(decrypted).toBe(masterPass);
    });

    it("produces distinct ciphertexts with random IVs for the same MT5 password", () => {
        const pass = "SameTraderPass99";
        const c1 = encryptPassword(pass);
        const c2 = encryptPassword(pass);
        expect(c1).not.toBe(c2);
        expect(decryptPassword(c1)).toBe(pass);
        expect(decryptPassword(c2)).toBe(pass);
    });

    it("throws on malformed ciphertext payloads", () => {
        expect(() => decryptPassword("invalid-ciphertext")).toThrow(
            "Malformed ciphertext payload."
        );
    });
});
