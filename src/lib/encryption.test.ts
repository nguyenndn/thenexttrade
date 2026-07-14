import { afterEach, describe, expect, it } from "vitest";
import crypto from "crypto";
import { decrypt, DecryptionError, encrypt, EncryptionConfigError } from "./encryption";

const ORIGINAL_SECRET = process.env.ENCRYPTION_SECRET;
const ORIGINAL_LEGACY_SECRET = process.env.AI_LEGACY_ENCRYPTION_SECRET;

afterEach(() => {
  if (ORIGINAL_SECRET === undefined) delete process.env.ENCRYPTION_SECRET;
  else process.env.ENCRYPTION_SECRET = ORIGINAL_SECRET;

  if (ORIGINAL_LEGACY_SECRET === undefined) delete process.env.AI_LEGACY_ENCRYPTION_SECRET;
  else process.env.AI_LEGACY_ENCRYPTION_SECRET = ORIGINAL_LEGACY_SECRET;
});

function legacyEncrypt(text: string, secret: string): string {
  const salt = crypto.randomBytes(64);
  const iv = crypto.randomBytes(16);
  const key = crypto.scryptSync(secret, salt, 32);
  const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  return Buffer.concat([salt, iv, cipher.getAuthTag(), encrypted]).toString("base64");
}

describe("credential encryption", () => {
  it("round-trips with the per-record salt", () => {
    process.env.ENCRYPTION_SECRET = "primary-secret-that-is-at-least-32-bytes-long";
    const encrypted = encrypt("sk-test-secret");
    expect(decrypt(encrypted)).toBe("sk-test-secret");
  });

  it("decrypts a legacy per-record-salt payload only with explicit migration secret", () => {
    process.env.ENCRYPTION_SECRET = "new-primary-secret-that-is-at-least-32-bytes";
    process.env.AI_LEGACY_ENCRYPTION_SECRET = "legacy-secret-that-is-at-least-32-bytes";
    const encrypted = legacyEncrypt("legacy-key", process.env.AI_LEGACY_ENCRYPTION_SECRET);
    expect(decrypt(encrypted)).toBe("legacy-key");
  });

  it("rejects missing primary secret", () => {
    delete process.env.ENCRYPTION_SECRET;
    expect(() => encrypt("secret")).toThrow(EncryptionConfigError);
  });

  it("rejects an invalid ciphertext", () => {
    process.env.ENCRYPTION_SECRET = "primary-secret-that-is-at-least-32-bytes-long";
    expect(() => decrypt("not-a-valid-ciphertext")).toThrow(DecryptionError);
  });
});
