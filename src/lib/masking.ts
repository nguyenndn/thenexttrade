// ============================================================================
// DATA MASKING UTILITIES — Protect sensitive information in partner API responses
// ============================================================================

/**
 * Mask account number: "12345678" → "123***78"
 */
export function maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return "***";
    const first3 = accountNumber.slice(0, 3);
    const last2 = accountNumber.slice(-2);
    return `${first3}***${last2}`;
}

/**
 * Mask person name: "Nguyen Van A" → "Ng** V** A"
 * Each word gets first 1-2 chars visible, rest masked.
 */
export function maskName(name: string): string {
    if (!name) return "***";

    return name
        .split(" ")
        .map(word => {
            if (word.length <= 1) return word;
            if (word.length <= 3) return word[0] + "**";
            return word.slice(0, 2) + "**";
        })
        .join(" ");
}

/**
 * Mask email: "john.doe@gmail.com" → "jo***@gmail.com"
 */
export function maskEmail(email: string): string {
    if (!email || !email.includes("@")) return "***";
    const [local, domain] = email.split("@");
    const maskedLocal = local.length <= 2 ? local[0] + "***" : local.slice(0, 2) + "***";
    return `${maskedLocal}@${domain}`;
}
