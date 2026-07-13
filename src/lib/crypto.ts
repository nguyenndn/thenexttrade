import crypto from "crypto";

const ENCRYPTION_KEY = process.env.MT5_IMPORT_ENCRYPTION_KEY || "";

export function encryptPassword(text: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("Invalid MT5_IMPORT_ENCRYPTION_KEY length. Must be exactly 32 characters.");
  }
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text, "utf8", "hex");
  encrypted += cipher.final("hex");
  const authTag = cipher.getAuthTag().toString("hex");
  return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decryptPassword(ciphertext: string): string {
  if (!ENCRYPTION_KEY || ENCRYPTION_KEY.length !== 32) {
    throw new Error("Invalid MT5_IMPORT_ENCRYPTION_KEY length. Must be exactly 32 characters.");
  }
  const [ivHex, encryptedHex, authTagHex] = ciphertext.split(":");
  if (!ivHex || !encryptedHex || !authTagHex) {
    throw new Error("Malformed ciphertext payload.");
  }
  const iv = Buffer.from(ivHex, "hex");
  const authTag = Buffer.from(authTagHex, "hex");
  const decipher = crypto.createDecipheriv("aes-256-gcm", Buffer.from(ENCRYPTION_KEY), iv);
  decipher.setAuthTag(authTag);
  let decrypted = decipher.update(encryptedHex, "hex", "utf8");
  decrypted += decipher.final("utf8");
  return decrypted;
}
