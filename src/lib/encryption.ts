import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

export class EncryptionConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EncryptionConfigError";
  }
}

export class DecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DecryptionError";
  }
}

function getPrimarySecret(): string {
  const secret = process.env.ENCRYPTION_SECRET?.trim();
  if (!secret) {
    throw new EncryptionConfigError("ENCRYPTION_SECRET is required");
  }
  if (Buffer.byteLength(secret, "utf8") < 32) {
    throw new EncryptionConfigError("ENCRYPTION_SECRET must contain at least 32 bytes");
  }
  return secret;
}

function deriveKey(secret: string, salt: Buffer): Buffer {
  return crypto.scryptSync(secret, salt, 32);
}

function decryptWithSecret(encryptedText: string, secret: string): string {
  const stringValue = Buffer.from(encryptedText, "base64");
  if (stringValue.length <= ENCRYPTED_POSITION) {
    throw new DecryptionError("Encrypted payload is malformed");
  }

  const salt = stringValue.subarray(0, SALT_LENGTH);
  const iv = stringValue.subarray(SALT_LENGTH, TAG_POSITION);
  const tag = stringValue.subarray(TAG_POSITION, ENCRYPTED_POSITION);
  const encrypted = stringValue.subarray(ENCRYPTED_POSITION);
  const key = deriveKey(secret, salt);
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(encrypted, undefined, "utf8") + decipher.final("utf8");
}

export function encrypt(text: string): string {
  if (!text || text.trim() === "") {
    throw new Error("Cannot encrypt empty string");
  }
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(getPrimarySecret(), salt);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

export function decrypt(encryptedText: string): string {
  if (!encryptedText || encryptedText.trim() === "") {
    throw new DecryptionError("Encrypted payload is empty");
  }

  const primarySecret = getPrimarySecret();
  try {
    return decryptWithSecret(encryptedText, primarySecret);
  } catch (primaryError) {
    const legacySecret = process.env.AI_LEGACY_ENCRYPTION_SECRET?.trim();
    if (legacySecret && legacySecret !== primarySecret) {
      try {
        return decryptWithSecret(encryptedText, legacySecret);
      } catch {
        // Report one stable error without leaking secret or cipher details.
      }
    }
    const message = primaryError instanceof DecryptionError
      ? primaryError.message
      : "Credential cannot be decrypted with the configured key";
    throw new DecryptionError(message);
  }
}
