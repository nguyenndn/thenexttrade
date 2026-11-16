const INTERNAL_ERROR_PATTERNS: RegExp[] = [
    /prisma\./i,
    /PrismaClient/i,
    /invocation:/i,
    /column's type/i,
    /Unique constraint failed/i,
    /Foreign key constraint/i,
    /Record to update not found/i,
    /Transaction API error/i,
    /Transaction already closed/i,
    /Can't reach database server/i,
    /bind message has \d+ parameter/i,
    /relation "[^"]+" does not exist/i,
    /column "[^"]+" does not exist/i,
    /violates (unique|foreign key|not-null|check) constraint/i,
    /\b(SELECT|INSERT INTO|UPDATE|DELETE FROM)\b[\s\S]+\b(FROM|WHERE|VALUES|SET)\b/i,
    /\b(ECONNREFUSED|ECONNRESET|ETIMEDOUT|ENOTFOUND|EACCES|ENOENT|EPERM|ERR_CHILD_PROCESS)\b/,
    /Command failed:/i,
    /--password\b/i,
    /metatrader5\.apk/i,
    /libcommon\.so/i,
    /unidbg/i,
    /mt5-native-runner/i,
    /\n\s*at\s+\S+/,
];

const INTERNAL_CONSTRUCTOR_PREFIXES = ["PrismaClient", "PostgresError", "DatabaseError"];

/**
 * Returns true if an error object or message contains raw database, ORM, CLI,
 * filesystem, or stack-trace details that must never be exposed to end users.
 */
export function isInternalError(error: unknown): boolean {
    if (!error) return false;

    if (typeof error === "object") {
        const ctorName = (error as { constructor?: { name?: string } })?.constructor?.name || "";
        if (
            INTERNAL_CONSTRUCTOR_PREFIXES.some((prefix) =>
                ctorName.startsWith(prefix)
            )
        ) {
            return true;
        }
        const code = (error as { code?: unknown })?.code;
        if (typeof code === "string" && /^P\d{4}$/.test(code)) {
            // Prisma error codes P1000..P6xxx
            return true;
        }
    }

    const raw =
        typeof error === "string"
            ? error
            : error instanceof Error
              ? error.message
              : "";

    if (!raw) return false;
    if (raw.length > 320) return true;

    return INTERNAL_ERROR_PATTERNS.some((pattern) => pattern.test(raw));
}

/**
 * Converts any caught error into a safe, concise user-facing error message.
 * Preserves clean application/validation messages while masking all Prisma, SQL,
 * filesystem, CLI, or runtime internals behind `fallback`.
 */
export function toPublicErrorMessage(
    error: unknown,
    fallback = "Server error while processing your request. Please try again."
): string {
    if (!error) return fallback;
    if (isInternalError(error)) return fallback;

    const message =
        typeof error === "string"
            ? error.trim()
            : error instanceof Error
              ? error.message.trim()
              : "";

    if (!message) return fallback;
    return message.slice(0, 280);
}
