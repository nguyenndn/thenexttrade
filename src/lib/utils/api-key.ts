import { randomBytes } from "crypto";

export function generateApiKey(): string {
    // Generate 24 random bytes = 48 hex characters
    // Plus 5 hyphens = 53 characters total (Fits in 64 char limit)
    const bytes = randomBytes(24);
    const key = bytes.toString("hex");

    // Format: xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx-xxxx
    return key.match(/.{1,8}/g)?.join("-") || key;
}

export function maskApiKey(apiKey: string): string {
    if (apiKey.length < 12) return "****";
    return `${apiKey.substring(0, 8)}...${apiKey.substring(apiKey.length - 4)}`;
}
