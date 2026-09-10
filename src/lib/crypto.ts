import crypto from "crypto";

function getKeyBuffer(): Buffer {
    const rawKey =
        process.env.MT5_IMPORT_ENCRYPTION_KEY ||
        process.env.NEXTAUTH_SECRET ||
        process.env.SUPABASE_SERVICE_ROLE_KEY ||
        "thenexttrade-mt5-cloud-sync-key-2026";
    return crypto.createHash("sha256").update(rawKey).digest();
}

export function encryptPassword(text: string): string {
    const key = getKeyBuffer();
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv("aes-256-gcm", key, iv);
    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");
    const authTag = cipher.getAuthTag().toString("hex");
    return `${iv.toString("hex")}:${encrypted}:${authTag}`;
}

export function decryptPassword(ciphertext: string): string {
    const key = getKeyBuffer();
    const [ivHex, encryptedHex, authTagHex] = ciphertext.split(":");
    if (!ivHex || !encryptedHex || !authTagHex) {
        throw new Error("Malformed ciphertext payload.");
    }
    const iv = Buffer.from(ivHex, "hex");
    const authTag = Buffer.from(authTagHex, "hex");
    const decipher = crypto.createDecipheriv("aes-256-gcm", key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encryptedHex, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
