// Disposable / Temporary Email Domain Filter
// Blocks throwaway accounts from abusing 7-Day Free Trial and AI Quota

const DISPOSABLE_EMAIL_DOMAINS = new Set([
    "10minutemail.com",
    "10minutemail.net",
    "10minutemail.org",
    "burnermail.io",
    "crazymailing.com",
    "dispostable.com",
    "dropmail.me",
    "emailondeck.com",
    "fakeinbox.com",
    "getairmail.com",
    "getnada.com",
    "guerrillamail.biz",
    "guerrillamail.com",
    "guerrillamail.de",
    "guerrillamail.net",
    "guerrillamail.org",
    "guerrillamailblock.com",
    "inboxes.com",
    "mailinator.com",
    "mailnesia.com",
    "mintemail.com",
    "mohmal.com",
    "mytrashmail.com",
    "nada.ltd",
    "pokemail.net",
    "sharklasers.com",
    "spam4.me",
    "spambog.com",
    "temp-mail.org",
    "tempmail.com",
    "tempmail.net",
    "tempmailaddress.com",
    "throwawaymail.com",
    "tmail.ws",
    "trashmail.com",
    "trashmail.net",
    "yopmail.com",
    "yopmail.fr",
    "yopmail.net",
    "zillamail.com",
]);

/**
 * Checks if an email belongs to a known temporary/disposable email provider.
 */
export function isDisposableEmail(email: string): boolean {
    if (!email || typeof email !== "string") return false;
    const parts = email.trim().toLowerCase().split("@");
    if (parts.length !== 2) return false;
    const domain = parts[1].toLowerCase();
    return DISPOSABLE_EMAIL_DOMAINS.has(domain);
}
