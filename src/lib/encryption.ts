import crypto from "crypto";

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const TAG_POSITION = SALT_LENGTH + IV_LENGTH;
const ENCRYPTED_POSITION = TAG_POSITION + TAG_LENGTH;

function getKey(): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || "fallback_secret_key_for_dev_mode_only_123456";
  return crypto.scryptSync(secret, "salt", 32);
}

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(IV_LENGTH);
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || "fallback_secret_key_for_dev_mode_only_123456", salt, 32);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  
  const encrypted = Buffer.concat([cipher.update(text, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  
  return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
}

export function decrypt(encryptedText: string): string {
  try {
    const stringValue = Buffer.from(encryptedText, "base64");
    const salt = stringValue.subarray(0, SALT_LENGTH);
    const iv = stringValue.subarray(SALT_LENGTH, TAG_POSITION);
    const tag = stringValue.subarray(TAG_POSITION, ENCRYPTED_POSITION);
    const encrypted = stringValue.subarray(ENCRYPTED_POSITION);
    
    const key = crypto.scryptSync(process.env.ENCRYPTION_SECRET || process.env.JWT_SECRET || "fallback_secret_key_for_dev_mode_only_123456", salt, 32);
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    
    return decipher.update(encrypted) + decipher.final("utf8");
  } catch (error) {
    console.error("Decryption error:", error);
    return "";
  }
}
