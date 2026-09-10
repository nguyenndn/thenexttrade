import { describe, it, expect } from "vitest";
import { encryptPassword, decryptPassword } from "./crypto";

describe("crypto module (AES-256-GCM)", () => {
    it("successfully encrypts and decrypts passwords", () => {
        const password = "mySecretInvestorPass123!@#";
        const encrypted = encryptPassword(password);

        expect(encrypted).not.toBe(password);
        expect(encrypted).toContain(":");

        const decrypted = decryptPassword(encrypted);
        expect(decrypted).toBe(password);
    });

    it("generates different IVs and ciphertexts for identical inputs", () => {
        const password = "samePassword";
        const enc1 = encryptPassword(password);
        const enc2 = encryptPassword(password);

        expect(enc1).not.toBe(enc2);
        expect(decryptPassword(enc1)).toBe(password);
        expect(decryptPassword(enc2)).toBe(password);
    });

    it("throws an error when ciphertext is malformed or tampered with", () => {
        expect(() => decryptPassword("invalid-cipher")).toThrow(
            /Malformed ciphertext/
        );

        const valid = encryptPassword("validPass");
        const parts = valid.split(":");
        // Tamper with encrypted content
        const tampered = `${parts[0]}:${parts[1].slice(0, -2)}aa:${parts[2]}`;
        expect(() => decryptPassword(tampered)).toThrow();
    });
});
