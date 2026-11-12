/**
 * Simple HTML sanitizer for user input (Vercel serverless compatible).
 * Strips all HTML tags — use for plain text fields like usernames, bios, comments.
 * For rich content from trusted admin CMS, use raw content directly.
 */
export function sanitizeInput(input: string): string {
    if (!input) return "";
    return input
        .replace(/<[^>]*>/g, "") // Strip all HTML tags
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#x27;")
        .trim();
}

const NAMED_HTML_ENTITIES: Record<string, string> = {
    nbsp: " ",
    amp: "&",
    lt: "<",
    gt: ">",
    quot: '"',
    apos: "'",
};

/**
 * Converts rich-text HTML (e.g. admin Rich Text Editor output) into a plain-text
 * preview string for React text nodes. Tags are removed, block boundaries become
 * spaces, and common entities are decoded. Safe on server and client (no DOM).
 * Do NOT pass the result to dangerouslySetInnerHTML.
 */
export function htmlToPlainText(html: string | null | undefined): string {
    if (!html) return "";
    return html
        .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, " ")
        .replace(/<br\s*\/?>/gi, " ")
        .replace(/<\/(p|div|li|h[1-6]|blockquote|tr)>/gi, " ")
        .replace(/<[^>]*>/g, "")
        .replace(/&#x([0-9a-f]+);/gi, (_, hex: string) =>
            String.fromCodePoint(parseInt(hex, 16))
        )
        .replace(/&#(\d+);/g, (_, dec: string) =>
            String.fromCodePoint(parseInt(dec, 10))
        )
        .replace(/&([a-z]+);/gi, (match, name: string) =>
            NAMED_HTML_ENTITIES[name.toLowerCase()] ?? match
        )
        .replace(/\s+/g, " ")
        .trim();
}
