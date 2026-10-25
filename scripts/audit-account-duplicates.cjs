/**
 * Read-only audit for broker-scoped account identity duplicates.
 *
 * A login is unique only within a broker. Before adding
 * `@@unique([userId, broker, accountNumber])` to TradingAccount, we must prove
 * there are no existing duplicate rows once broker names are normalized the
 * same way the application does it (`normalizeBrokerKey` in
 * `src/lib/trading-account-identity.ts`).
 *
 * Usage: node scripts/audit-account-duplicates.cjs
 * Exit code: 0 = clean, 1 = duplicates found, 2 = audit failed.
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

function normalizeAccountNumber(value) {
    return String(value ?? "").trim();
}

function normalizeBrokerKey(value) {
    if (!value) return "";
    const cleaned = String(value)
        .toUpperCase()
        .replace(/[\s\-_]/g, "");
    if (cleaned.startsWith("VANTAGE")) return "VANTAGE";
    if (cleaned.startsWith("EXNESS")) return "EXNESS";
    if (
        cleaned.startsWith("VTMARKET") ||
        cleaned === "VT" ||
        cleaned.startsWith("VTGLOBAL")
    ) {
        return "VTMARKETS";
    }
    if (cleaned.startsWith("ULTIMA")) return "ULTIMAMARKETS";
    return cleaned;
}

function groupBy(rows, keyFn) {
    const groups = new Map();
    for (const row of rows) {
        const key = keyFn(row);
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(row);
    }
    return groups;
}

function printGroup(label, key, rows) {
    console.log(`\n  ${label}: ${key} (${rows.length} rows)`);
    for (const row of rows) {
        console.log(
            `    - id=${row.id} user=${row.userId} broker=${JSON.stringify(
                row.broker
            )} account=${JSON.stringify(row.accountNumber)} status=${row.status}`
        );
    }
}

async function main() {
    let failures = 0;

    const tradingAccounts = await prisma.tradingAccount.findMany({
        select: {
            id: true,
            userId: true,
            broker: true,
            accountNumber: true,
            status: true,
            createdAt: true,
        },
    });

    const accountGroups = groupBy(
        tradingAccounts,
        (row) =>
            `${row.userId}::${normalizeBrokerKey(row.broker)}::${normalizeAccountNumber(
                row.accountNumber
            )}`
    );
    const duplicateAccounts = [...accountGroups.entries()].filter(
        ([key, rows]) =>
            rows.length > 1 && !key.endsWith("::") // skip fully empty identities
    );

    console.log(
        `TradingAccount rows: ${tradingAccounts.length}, normalized duplicate groups: ${duplicateAccounts.length}`
    );
    if (duplicateAccounts.length > 0) {
        failures++;
        console.log(
            "\nDuplicate TradingAccount identities (same user + broker + login):"
        );
        for (const [key, rows] of duplicateAccounts) {
            printGroup("identity", key, rows);
        }
        console.log(
            "\n  ACTION: merge/clean these rows before adding @@unique([userId, broker, accountNumber])."
        );
    }

    const licenses = await prisma.eALicense.findMany({
        select: {
            id: true,
            userId: true,
            broker: true,
            accountNumber: true,
            status: true,
            createdAt: true,
        },
    });

    const licenseGroups = groupBy(
        licenses,
        (row) =>
            `${normalizeBrokerKey(row.broker)}::${normalizeAccountNumber(
                row.accountNumber
            )}`
    );
    const duplicateLicenses = [...licenseGroups.entries()].filter(
        ([key, rows]) => rows.length > 1 && !key.endsWith("::")
    );

    console.log(
        `\nEALicense rows: ${licenses.length}, normalized duplicate groups: ${duplicateLicenses.length}`
    );
    if (duplicateLicenses.length > 0) {
        failures++;
        console.log(
            "\nDuplicate EALicense identities (same broker + login across display-name variants):"
        );
        for (const [key, rows] of duplicateLicenses) {
            printGroup("license", key, rows);
        }
        console.log(
            "\n  ACTION: EALicense already has @@unique([broker, accountNumber]); these rows differ only by broker spelling and must be reconciled."
        );
    }

    // Licenses with no matching TradingAccount row for the same user + broker.
    const accountKeys = new Set(
        tradingAccounts.map(
            (row) =>
                `${row.userId}::${normalizeBrokerKey(row.broker)}::${normalizeAccountNumber(
                    row.accountNumber
                )}`
        )
    );
    const unmatchedLicenses = licenses.filter((license) => {
        const key = `${license.userId}::${normalizeBrokerKey(
            license.broker
        )}::${normalizeAccountNumber(license.accountNumber)}`;
        return !accountKeys.has(key);
    });

    console.log(
        `\nLicenses without a matching TradingAccount identity: ${unmatchedLicenses.length}`
    );
    if (unmatchedLicenses.length > 0) {
        // Informational only: legacy licenses may legitimately have no account
        // until the explicit backfill runs.
        for (const license of unmatchedLicenses.slice(0, 25)) {
            console.log(
                `    - license=${license.id} user=${license.userId} broker=${JSON.stringify(
                    license.broker
                )} account=${JSON.stringify(license.accountNumber)} status=${license.status}`
            );
        }
        if (unmatchedLicenses.length > 25) {
            console.log(`    ... and ${unmatchedLicenses.length - 25} more`);
        }
    }

    if (failures > 0) {
        console.log(
            "\nRESULT: NOT CLEAN. Do not add the unique constraint yet."
        );
        process.exitCode = 1;
    } else {
        console.log(
            "\nRESULT: CLEAN. No normalized duplicate identities found."
        );
    }
}

main()
    .catch((error) => {
        console.error("Audit failed:", error);
        process.exitCode = 2;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
