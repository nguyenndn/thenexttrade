/**
 * Server-side image validation with defense-in-depth security.
 *
 * - Magic bytes verification (don't trust Content-Type from client)
 * - MIME type whitelist (jpeg, png, webp only)
 * - File size limit (1 MB)
 * - File extension whitelist
 */

const MAX_FILE_SIZE = 1 * 1024 * 1024; // 1 MB

const ALLOWED_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp"]);

interface MagicSignature {
    bytes: number[];
    offset: number;
    mime: string;
}

/**
 * Known magic byte signatures for allowed image types.
 * We check the first N bytes of the file buffer against these patterns.
 */
const MAGIC_SIGNATURES: MagicSignature[] = [
    // JPEG: starts with FF D8 FF
    { bytes: [0xff, 0xd8, 0xff], offset: 0, mime: "image/jpeg" },
    // PNG: starts with 89 50 4E 47 0D 0A 1A 0A
    { bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a], offset: 0, mime: "image/png" },
    // WebP: starts with RIFF....WEBP (bytes 0-3 = RIFF, bytes 8-11 = WEBP)
    { bytes: [0x52, 0x49, 0x46, 0x46], offset: 0, mime: "image/webp" },
];

const WEBP_MARKER = [0x57, 0x45, 0x42, 0x50]; // "WEBP" at offset 8

export interface ImageValidationResult {
    valid: boolean;
    error?: string;
    detectedMime: string;
}

/**
 * Detect the true MIME type of a file by inspecting its magic bytes.
 * Returns the detected MIME or `"unknown"` if no match.
 */
function detectMimeFromBuffer(buffer: Buffer): string {
    if (buffer.length < 12) return "unknown";

    for (const sig of MAGIC_SIGNATURES) {
        const slice = buffer.subarray(sig.offset, sig.offset + sig.bytes.length);
        if (slice.length === sig.bytes.length && sig.bytes.every((b, i) => slice[i] === b)) {
            // Extra check for WebP: bytes 8-11 must be "WEBP"
            if (sig.mime === "image/webp") {
                const webpSlice = buffer.subarray(8, 12);
                if (!WEBP_MARKER.every((b, i) => webpSlice[i] === b)) {
                    continue; // RIFF header but not WebP — skip
                }
            }
            return sig.mime;
        }
    }

    return "unknown";
}

/**
 * Extract the file extension from a filename (lowercased, with dot).
 */
function getExtension(filename: string): string {
    const lastDot = filename.lastIndexOf(".");
    if (lastDot === -1) return "";
    return filename.slice(lastDot).toLowerCase();
}

/**
 * Validate an image file buffer with defense-in-depth checks:
 * 1. File size ≤ 1 MB
 * 2. File extension is in the whitelist
 * 3. Magic bytes match an allowed image type
 *
 * @param buffer  - The raw file buffer
 * @param filename - The original filename (for extension check)
 */
export function validateImageFile(
    buffer: Buffer,
    filename: string
): ImageValidationResult {
    // 1. Size check
    if (buffer.length > MAX_FILE_SIZE) {
        return {
            valid: false,
            error: `File too large (${(buffer.length / 1024 / 1024).toFixed(1)}MB). Maximum is 1MB.`,
            detectedMime: "unknown",
        };
    }

    if (buffer.length === 0) {
        return {
            valid: false,
            error: "File is empty.",
            detectedMime: "unknown",
        };
    }

    // 2. Extension check
    const ext = getExtension(filename);
    if (!ALLOWED_EXTENSIONS.has(ext)) {
        return {
            valid: false,
            error: `File type "${ext || "(none)"}" is not allowed. Accepted: JPG, PNG, WebP.`,
            detectedMime: "unknown",
        };
    }

    // 3. Magic bytes check (the real security gate)
    const detectedMime = detectMimeFromBuffer(buffer);
    if (detectedMime === "unknown") {
        return {
            valid: false,
            error: "File content does not match any supported image format. Only JPG, PNG, and WebP images are accepted.",
            detectedMime: "unknown",
        };
    }

    return { valid: true, detectedMime };
}

export { MAX_FILE_SIZE };
