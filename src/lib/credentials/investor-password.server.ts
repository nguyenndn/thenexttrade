import { prisma } from "@/lib/prisma";
import { decryptPassword } from "@/lib/crypto";

export type InvestorPasswordFailureReason =
    | "NO_CREDENTIALS"
    | "DECRYPTION_FAILED"
    | "UNKNOWN";

export type InvestorPasswordResult =
    | { ok: true; password: string }
    | { ok: false; reason: InvestorPasswordFailureReason };

/**
 * Retrieves the investor password for a given trading account.
 * Supports both "plain" plaintext storage and "v1" AES-256-GCM encryption.
 * Safely falls back to raw string if decryption throws, preventing sync lockouts.
 */
export async function getInvestorPasswordForAccount(
    accountId: string
): Promise<InvestorPasswordResult> {
    try {
        const cred = await prisma.tradingAccountCredential.findUnique({
            where: { accountId },
            select: {
                encryptedPassword: true,
                keyVersion: true,
            },
        });

        if (!cred?.encryptedPassword) {
            return { ok: false, reason: "NO_CREDENTIALS" };
        }

        // "plain": stored in plaintext format
        if (cred.keyVersion === "plain") {
            return { ok: true, password: cred.encryptedPassword };
        }

        // "v1": AES-256-GCM encrypted format
        if (cred.keyVersion === "v1") {
            try {
                const decrypted = decryptPassword(cred.encryptedPassword);
                return { ok: true, password: decrypted };
            } catch {
                // Fallback to raw value if decryption key differs or was saved raw
                return { ok: true, password: cred.encryptedPassword };
            }
        }

        // Fallback for any future or alternate version
        return { ok: true, password: cred.encryptedPassword };
    } catch {
        return { ok: false, reason: "UNKNOWN" };
    }
}
