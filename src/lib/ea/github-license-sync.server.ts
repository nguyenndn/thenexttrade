import { prisma } from "@/lib/prisma";
import { generateApiKey } from "@/lib/utils/api-key";
import { AccountStatus, Prisma } from "@prisma/client";
import {
    buildCsvRowKey,
    normalizeAccountNumber,
    normalizeBrokerKey,
} from "@/lib/trading-account-identity";

export interface GitHubSyncResult {
    success: boolean;
    synced: boolean;
    skipped?: boolean;
    totalActiveAccounts?: number;
    commitSha?: string;
    error?: string;
}

interface CsvLicenseRow {
    account: string;
    startDate: string;
    endDate: string;
    status: string;
    note: string;
    /** Optional for backward compatibility with legacy broker-less rows. */
    broker: string;
}

function formatDateYmd(date: Date | null | undefined, fallback: string): string {
    if (!date || Number.isNaN(date.getTime())) return fallback;
    return date.toISOString().slice(0, 10);
}

function sanitizeCsvField(value: string | null | undefined): string {
    if (!value) return "";
    return value
        .replace(/[\r\n,]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();
}

/**
 * Grants EAProductAccess for all active EA products (all 3 EAs) to a verified trading account.
 * Because 1 Trading Account License unlocks all EAs in the ecosystem, this keeps Admin EA Farm
 * and User Detail views completely unified.
 */
export async function grantAllEasForTradingAccount(
    params: {
        userId: string;
        tradingAccountId: string;
    },
    db: Prisma.TransactionClient = prisma
): Promise<void> {
    const { userId, tradingAccountId } = params;
    try {
        const activeProducts = await db.eAProduct.findMany({
            where: { isActive: true },
            select: { id: true },
        });

        const now = new Date();
        for (const product of activeProducts) {
            const scopeKey = `${userId}:${product.id}:ACCOUNT:${tradingAccountId}`;
            await db.eAProductAccess.upsert({
                where: { scopeKey },
                create: {
                    userId,
                    productId: product.id,
                    tradingAccountId,
                    scopeKey,
                    status: "GRANTED",
                    source: "IB_VERIFIED",
                    startsAt: now,
                },
                update: {
                    tradingAccountId,
                    status: "GRANTED",
                    source: "IB_VERIFIED",
                    expiresAt: null,
                },
            });
        }
    } catch (error) {
        console.error("grantAllEasForTradingAccount non-fatal error:", error);
    }
}

/**
 * Ensures that a corresponding TradingAccount exists for the given (userId, broker, accountNumber)
 * and has a unique per-account License Key (`TradingAccount.apiKey` in TNT-XXXX-XXXX-XXXX format).
 * When `isApproved` is true, also unlocks all active EAs for that trading account.
 */
export async function ensureTradingAccountLicenseKey(
    params: {
        userId: string;
        broker: string;
        accountNumber: string;
        isApproved?: boolean;
        approvedBy?: string;
    },
    db: Prisma.TransactionClient = prisma
): Promise<{ tradingAccountId: string; licenseKey: string }> {
    const { userId, broker, accountNumber, isApproved, approvedBy } = params;
    const cleanAccountNumber = String(accountNumber).trim();
    const cleanBroker = String(broker).trim();
    const cleanBrokerKey = normalizeBrokerKey(cleanBroker);

    // A login is only unique inside one broker, so match on both. Broker
    // columns are free-text display names, so compare normalized keys in JS.
    const candidates = await db.tradingAccount.findMany({
        where: {
            userId,
            accountNumber: cleanAccountNumber,
        },
        select: {
            id: true,
            apiKey: true,
            broker: true,
            ibAttribution: true,
        },
        take: 25,
    });

    const brokerMatch = cleanBrokerKey
        ? candidates.find(
              (candidate) =>
                  normalizeBrokerKey(candidate.broker) === cleanBrokerKey
          )
        : undefined;
    // Legacy row created before broker capture: adopt only when it is the
    // sole record for this login.
    const legacyOnlyMatch =
        !brokerMatch &&
        candidates.length === 1 &&
        !normalizeBrokerKey(candidates[0].broker)
            ? candidates[0]
            : undefined;
    const existing = brokerMatch ?? legacyOnlyMatch;

    if (existing) {
        const licenseKey = existing.apiKey || generateApiKey();
        const isAlreadyConfirmed =
            existing.ibAttribution === "VERIFIED" ||
            existing.ibAttribution === "CONFIRMED";
        const needsUpdate =
            !existing.apiKey ||
            (!existing.broker && cleanBroker) ||
            (isApproved && !isAlreadyConfirmed);

        if (needsUpdate) {
            await db.tradingAccount.update({
                where: { id: existing.id },
                data: {
                    ...(!existing.apiKey ? { apiKey: licenseKey, apiKeyCreatedAt: new Date() } : {}),
                    ...(!existing.broker && cleanBroker ? { broker: cleanBroker } : {}),
                    ...(isApproved
                        ? {
                              ibAttribution: "CONFIRMED",
                              ibAttributionSource: "EA_LICENSE_APPROVED",
                              ibAttributionAt: new Date(),
                              ...(approvedBy ? { ibAttributionBy: approvedBy } : {}),
                          }
                        : {}),
                },
            });
        }

        if (isApproved) {
            await grantAllEasForTradingAccount(
                {
                    userId,
                    tradingAccountId: existing.id,
                },
                db
            );
        }

        return { tradingAccountId: existing.id, licenseKey };
    }

    const licenseKey = generateApiKey();
    const created = await db.tradingAccount.create({
        data: {
            userId,
            name: `${cleanBroker} #${cleanAccountNumber}`,
            broker: cleanBroker,
            accountNumber: cleanAccountNumber,
            platform: "MT5",
            accountType: "REAL",
            currency: "USD",
            apiKey: licenseKey,
            apiKeyCreatedAt: new Date(),
            status: "PENDING",
            ...(isApproved
                ? {
                      ibAttribution: "CONFIRMED",
                      ibAttributionSource: "EA_LICENSE_APPROVED",
                      ibAttributionAt: new Date(),
                      ...(approvedBy ? { ibAttributionBy: approvedBy } : {}),
                  }
                : {}),
        },
        select: {
            id: true,
        },
    });

    if (isApproved) {
        await grantAllEasForTradingAccount(
            {
                userId,
                tradingAccountId: created.id,
            },
            db
        );
    }

    return { tradingAccountId: created.id, licenseKey };
}

/**
 * Parses existing `accounts.csv` content into a map keyed by
 * `broker::account` (or `acct::account` for legacy rows without a broker).
 * The broker column is optional so both the legacy 5-column file and the new
 * 6-column file parse correctly.
 */
export function parseAccountsCsv(csvContent: string): Map<string, CsvLicenseRow> {
    const map = new Map<string, CsvLicenseRow>();
    const lines = csvContent.split(/\r?\n/);

    let hasBrokerColumn = false;
    let brokerIndex = -1;
    let noteIndex = 4;

    for (let i = 0; i < lines.length; i++) {
        const rawLine = lines[i].trim();
        if (!rawLine) continue;

        // Header line
        if (i === 0 && rawLine.toLowerCase().startsWith("account,")) {
            const headers = rawLine
                .split(",")
                .map((header) => header.trim().toLowerCase());
            brokerIndex = headers.indexOf("broker");
            hasBrokerColumn = brokerIndex >= 0;
            const headerNoteIndex = headers.indexOf("note");
            if (headerNoteIndex >= 0) noteIndex = headerNoteIndex;
            continue;
        }

        const parts = rawLine.split(",");
        if (parts.length < 4) continue;

        const account = parts[0].trim();
        if (!account) continue;

        const broker = hasBrokerColumn
            ? (parts[brokerIndex] || "").trim()
            : "";
        const note = hasBrokerColumn
            ? parts
                  .slice(
                      noteIndex,
                      brokerIndex > noteIndex ? brokerIndex : undefined
                  )
                  .join(" ")
                  .trim()
            : parts.slice(4).join(" ").trim();

        map.set(buildCsvRowKey(account, broker), {
            account,
            startDate: parts[1]?.trim() || "2024-01-01",
            endDate: parts[2]?.trim() || "2099-12-31",
            status: parts[3]?.trim() || "active",
            note,
            broker,
        });
    }

    return map;
}

/**
 * Serializes the merged license map back to standard `accounts.csv` format
 * compatible with both legacy `AccountValidator.mqh` and `GSN_EA_License.mqh`.
 * `note` stays in column 4 so legacy 5-column readers keep working; `broker`
 * is appended as an optional 6th column.
 */
export function serializeAccountsCsv(rowsMap: Map<string, CsvLicenseRow>): string {
    const header = "account,start_date,end_date,status,note,broker";
    const lines: string[] = [header];

    for (const row of rowsMap.values()) {
        lines.push(
            [
                sanitizeCsvField(row.account),
                sanitizeCsvField(row.startDate),
                sanitizeCsvField(row.endDate),
                sanitizeCsvField(row.status),
                sanitizeCsvField(row.note),
                sanitizeCsvField(row.broker),
            ].join(",")
        );
    }

    return `${lines.join("\n")}\n`;
}

/**
 * Removes a login from the CSV. With a broker only that broker's row is
 * removed; without one, every row for the account number is removed.
 */
function removeCsvAccount(
    rowsMap: Map<string, CsvLicenseRow>,
    accountNumber: string | null | undefined,
    broker?: string | null
): void {
    const account = normalizeAccountNumber(accountNumber);
    if (!account) return;

    if (broker && normalizeBrokerKey(broker)) {
        rowsMap.delete(buildCsvRowKey(account, broker));
        return;
    }

    for (const [key, row] of Array.from(rowsMap.entries())) {
        if (normalizeAccountNumber(row.account) === account) {
            rowsMap.delete(key);
        }
    }
}

/**
 * Synchronizes all EA licenses from the Web Database to the GitHub backup `accounts.csv`
 * while preserving any pre-existing manual VIP rows in the GitHub file.
 */
export async function syncLicensesToGitHubBackup(options?: {
    removedAccountNumber?: string;
    /** When set, only this broker's CSV row is removed. */
    removedBroker?: string;
}): Promise<GitHubSyncResult> {
    const token = process.env.GITHUB_TOKEN?.trim();
    const repo = (process.env.GITHUB_LICENSE_REPO || "nguyenndn/ea-accounts").trim();
    const filePath = (process.env.GITHUB_LICENSE_PATH || "accounts.csv").trim();
    const branch = (process.env.GITHUB_LICENSE_BRANCH || "main").trim();

    if (!token) {
        return {
            success: false,
            synced: false,
            skipped: true,
            error: "GITHUB_TOKEN is not configured (GitHub backup sync skipped).",
        };
    }

    try {
        const apiUrl = `https://api.github.com/repos/${repo}/contents/${filePath}`;

        // 1. Fetch existing accounts.csv from GitHub (to get current SHA and preserve legacy rows)
        const getRes = await fetch(`${apiUrl}?ref=${encodeURIComponent(branch)}`, {
            method: "GET",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "TheNextTrade-LicenseSync",
            },
            cache: "no-store",
        });

        let currentSha: string | undefined;
        let existingCsv =
            "account,start_date,end_date,status,note,broker\n";

        if (getRes.ok) {
            const fileData = (await getRes.json()) as {
                sha?: string;
                content?: string;
                encoding?: string;
            };
            currentSha = fileData.sha;
            if (fileData.content) {
                existingCsv = Buffer.from(
                    fileData.content.replace(/\s/g, ""),
                    "base64"
                ).toString("utf-8");
            }
        } else if (getRes.status !== 404) {
            const errText = await getRes.text();
            return {
                success: false,
                synced: false,
                error: `GitHub GET failed (${getRes.status}): ${errText.slice(0, 200)}`,
            };
        }

        const rowsMap = parseAccountsCsv(existingCsv);

        // If an account was explicitly deleted from Admin, remove the exact
        // broker-qualified row (or every row for the login if broker unknown).
        if (options?.removedAccountNumber) {
            removeCsvAccount(
                rowsMap,
                options.removedAccountNumber,
                options.removedBroker
            );
        }

        // 2. Fetch all EALicense records + IB-verified TradingAccounts from Web DB
        const [licenses, verifiedAccounts] = await Promise.all([
            prisma.eALicense.findMany({
                include: {
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                },
                orderBy: { createdAt: "asc" },
            }),
            prisma.tradingAccount.findMany({
                where: {
                    accountNumber: { not: null },
                    OR: [
                        { ibAttribution: { in: ["VERIFIED", "CONFIRMED"] } },
                        {
                            proEntitlement: {
                                is: {
                                    status: { in: ["ACTIVE", "GRACE"] },
                                },
                            },
                        },
                    ],
                },
                select: {
                    accountNumber: true,
                    broker: true,
                    createdAt: true,
                    user: {
                        select: {
                            name: true,
                            email: true,
                        },
                    },
                    proEntitlement: {
                        select: {
                            startsAt: true,
                            expiresAt: true,
                            status: true,
                        },
                    },
                },
            }),
        ]);

        const todayYmd = formatDateYmd(new Date(), "2026-01-01");

        // Merge EALicense records
        for (const lic of licenses) {
            const acct = lic.accountNumber.trim();
            if (!acct) continue;
            const broker = (lic.broker || "").trim();

            const isApproved =
                lic.status === AccountStatus.APPROVED &&
                (!lic.expiryDate || lic.expiryDate >= new Date());

            const startDate = formatDateYmd(lic.startDate || lic.approvedAt || lic.createdAt, todayYmd);
            const endDate = lic.expiryDate
                ? formatDateYmd(lic.expiryDate, "2099-12-31")
                : "2099-12-31";
            const userLabel = lic.user?.name || lic.user?.email || "TNT User";
            const note = sanitizeCsvField(
                lic.note || `${lic.broker}: ${userLabel}`
            );

            // Upgrade a legacy broker-less row for this login.
            if (broker) rowsMap.delete(buildCsvRowKey(acct));

            rowsMap.set(buildCsvRowKey(acct, broker), {
                account: acct,
                startDate,
                endDate,
                status: isApproved ? "active" : "inactive",
                note,
                broker,
            });
        }

        // Merge IB-Verified / ProEntitlement accounts (unless explicitly rejected/suspended in EALicense)
        const rejectedOrSuspendedKeys = new Set(
            licenses
                .filter(
                    (l) =>
                        l.status === AccountStatus.REJECTED ||
                        l.status === AccountStatus.SUSPENDED ||
                        l.status === AccountStatus.EXPIRED
                )
                .map((l) => buildCsvRowKey(l.accountNumber, l.broker))
        );

        for (const va of verifiedAccounts) {
            const acct = va.accountNumber?.trim();
            if (!acct) continue;

            const broker = (va.broker || "").trim();
            const rowKey = buildCsvRowKey(acct, broker);
            if (rejectedOrSuspendedKeys.has(rowKey)) continue;

            const existingRow = rowsMap.get(rowKey);
            if (existingRow && existingRow.status === "active") continue;

            const startDate = formatDateYmd(
                va.proEntitlement?.startsAt || va.createdAt,
                todayYmd
            );
            const endDate = va.proEntitlement?.expiresAt
                ? formatDateYmd(va.proEntitlement.expiresAt, "2099-12-31")
                : "2099-12-31";
            const userLabel = va.user?.name || va.user?.email || "VIP User";
            const note = sanitizeCsvField(
                `${va.broker || "IB"}: ${userLabel}`
            );

            // Upgrade a legacy broker-less row for this login.
            if (broker) rowsMap.delete(buildCsvRowKey(acct));

            rowsMap.set(rowKey, {
                account: acct,
                startDate,
                endDate,
                status: "active",
                note,
                broker,
            });
        }

        const updatedCsv = serializeAccountsCsv(rowsMap);
        const totalActiveAccounts = Array.from(rowsMap.values()).filter(
            (r) => r.status.toLowerCase() === "active"
        ).length;

        // Avoid redundant commit if content is identical
        if (updatedCsv.trim() === existingCsv.trim()) {
            return {
                success: true,
                synced: true,
                totalActiveAccounts,
            };
        }

        // 3. Commit updated accounts.csv to GitHub
        const putBody: Record<string, unknown> = {
            message: `chore(license): sync ${totalActiveAccounts} active EA accounts from TheNextTrade`,
            content: Buffer.from(updatedCsv, "utf-8").toString("base64"),
            branch,
        };
        if (currentSha) {
            putBody.sha = currentSha;
        }

        const putRes = await fetch(apiUrl, {
            method: "PUT",
            headers: {
                Authorization: `Bearer ${token}`,
                Accept: "application/vnd.github+json",
                "Content-Type": "application/json",
                "X-GitHub-Api-Version": "2022-11-28",
                "User-Agent": "TheNextTrade-LicenseSync",
            },
            body: JSON.stringify(putBody),
        });

        if (!putRes.ok) {
            const errText = await putRes.text();
            return {
                success: false,
                synced: false,
                error: `GitHub PUT failed (${putRes.status}): ${errText.slice(0, 200)}`,
            };
        }

        const putJson = (await putRes.json()) as {
            commit?: { sha?: string };
        };

        return {
            success: true,
            synced: true,
            totalActiveAccounts,
            commitSha: putJson.commit?.sha,
        };
    } catch (error) {
        console.error("syncLicensesToGitHubBackup error:", error);
        return {
            success: false,
            synced: false,
            error: error instanceof Error ? error.message : "Unknown GitHub sync error",
        };
    }
}
