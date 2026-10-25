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
 * Legacy "plain" credentials remain readable, but v1 decryption failures are
 * rejected so ciphertext is never sent to the worker as a password.
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
                return { ok: false, reason: "DECRYPTION_FAILED" };
            }
        }

        return { ok: false, reason: "DECRYPTION_FAILED" };
    } catch {
        return { ok: false, reason: "UNKNOWN" };
    }
}
