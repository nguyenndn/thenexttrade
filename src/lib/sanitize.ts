/**
 * Simple HTML sanitizer for user input (Vercel serverless compatible).
 * Strips all HTML tags — use for plain text fields like usernames, bios, comments.
 * For rich content from trusted admin CMS, use raw content directly.
 */
export function sanitizeInput(input: string): string {
    if (!input) return '';
    return input
        .replace(/<[^>]*>/g, '') // Strip all HTML tags
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .trim();
}
