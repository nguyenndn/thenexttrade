import { describe, it, expect, vi } from "vitest";
import {
    buildPnlScaleSql,
    buildRatesCteSql,
    buildRatesJoinSql,
} from "./analytics-queries";
import { CURRENCY_METADATA } from "./utils/cent-account";

// analytics-queries pulls in the Next cache helper and the Prisma client at
// module scope; neither is exercised here because only the SQL builders are
// under test.
vi.mock("next/cache", () => ({
    unstable_cache: (fn: unknown) => fn,
    revalidateTag: vi.fn(),
    revalidatePath: vi.fn(),
}));

vi.mock("@/lib/prisma", () => ({ prisma: {} }));

type SqlFragment = { strings: string[]; values: unknown[] };

function sqlText(fragment: unknown): string {
    return (fragment as SqlFragment).strings.join("?");
}

function sqlValues(fragment: unknown): unknown[] {
    return (fragment as SqlFragment).values;
}

const ratesCte = buildRatesCteSql("user-rates-owner");
const ratesText = sqlText(ratesCte);

/**
 * Rates from `WHEN UPPER(COALESCE(ta."currency", '')) IN ('A','B') THEN 0.01`
 * branches. Every alias in one branch shares that branch's rate.
 */
function inListRates(text: string): Map<string, number> {
    const rates = new Map<string, number>();
    const branch = /IN \(([^)]+)\) THEN ([0-9.]+)/g;
    for (const match of text.matchAll(branch)) {
        const rate = Number(match[2]);
        for (const alias of match[1].split(",")) {
            rates.set(alias.trim().replace(/'/g, ""), rate);
        }
    }
    return rates;
}

/**
 * Rates from the standard equality branches
 * (`WHEN UPPER(...) = 'EUR' THEN 1.08`). Later assignments win, so the
 * Cent-server sub-CASE earlier in the SQL does not shadow the standard rate.
 */
function equalityRates(text: string): Map<string, number> {
    const rates = new Map<string, number>();
    const branch =
        /COALESCE\(ta\."currency", ''\)\) = '([A-Z]+)' THEN ([0-9.]+)/g;
    for (const match of text.matchAll(branch)) {
        rates.set(match[1], Number(match[2]));
    }
    return rates;
}

function centFlaggedCodes(text: string): Set<string> {
    const match = /IN \(([^)]+)\) THEN TRUE/.exec(text);
    if (!match) return new Set();
    return new Set(
        match[1]
            .split(",")
            .map((alias) => alias.trim().replace(/'/g, ""))
            .filter(Boolean)
    );
}

describe("buildRatesCteSql — per-account rate CTE", () => {
    it("resolves one row per account owned by the requesting user", () => {
        expect(ratesText).toContain('ta."id" AS "account_id"');
        expect(ratesText).toContain('FROM "trading_accounts" ta');
        expect(ratesText).toContain('WHERE ta."userId" = ?::uuid');
        expect(sqlValues(ratesCte)).toEqual(["user-rates-owner"]);
        // The whole point of the CTE: no journal table inside it
        expect(ratesText).not.toContain("journal_entries");
    });

    it("exposes both the FX rate and the Cent flag the queries need", () => {
        expect(ratesText).toContain('AS "rate"');
        expect(ratesText).toContain('AS "is_cent"');
    });
});

describe("buildRatesCteSql — FX/Cent rate parity with CURRENCY_METADATA", () => {
    const inList = inListRates(ratesText);
    const equality = equalityRates(ratesText);

    it.each(Object.entries(CURRENCY_METADATA))(
        "applies the metadata USD rate for %s",
        (code, info) => {
            const sqlRate = inList.get(code) ?? equality.get(code) ?? 1.0;
            expect(sqlRate).toBe(info.usdRate);
        }
    );

    it("lists every Cent currency from CURRENCY_METADATA in the IN branches", () => {
        const centCodes = Object.values(CURRENCY_METADATA)
            .filter((info) => info.isCent)
            .map((info) => info.code);
        for (const code of centCodes) {
            expect(inList.has(code)).toBe(true);
        }
    });

    it("flags every Cent currency (and no standard one) as is_cent", () => {
        const flagged = centFlaggedCodes(ratesText);
        const centCodes = Object.values(CURRENCY_METADATA)
            .filter((info) => info.isCent)
            .map((info) => info.code);
        const standardCodes = Object.values(CURRENCY_METADATA)
            .filter((info) => !info.isCent)
            .map((info) => info.code);

        expect(flagged.size).toBeGreaterThan(0);
        for (const code of centCodes) {
            expect(flagged.has(code)).toBe(true);
        }
        for (const code of standardCodes) {
            expect(flagged.has(code)).toBe(false);
        }
    });

    it("reports unknown currencies at parity with metadata's 1.0 default", () => {
        expect(ratesText).toContain("ELSE 1.0");
    });

    it("maps Cent-account EUR/GBP/USD to their metadata cent rates", () => {
        const start = ratesText.indexOf("ILIKE '%cent%'");
        expect(start).toBeGreaterThan(-1);
        const end = ratesText.indexOf("END", start);
        const centBlock = ratesText.slice(start, end + 3);

        const eur = /= 'EUR' THEN ([0-9.]+)/.exec(centBlock);
        const gbp = /= 'GBP' THEN ([0-9.]+)/.exec(centBlock);
        expect(Number(eur?.[1])).toBe(CURRENCY_METADATA.EUC.usdRate);
        expect(Number(gbp?.[1])).toBe(CURRENCY_METADATA.GBC.usdRate);
        expect(centBlock).toContain(`ELSE ${CURRENCY_METADATA.USC.usdRate}`);
    });
});

describe("buildPnlScaleSql / buildRatesJoinSql — account scoping", () => {
    it("pins a single account to its native currency (no CTE join, flat 1.0)", () => {
        const scale = sqlText(buildPnlScaleSql("acc-single"));
        expect(scale).toBe("1.0");
        expect(scale).not.toContain("CASE");
        expect(sqlText(buildRatesJoinSql("acc-single"))).toBe("");
    });

    it("reads the CTE rate across all accounts", () => {
        const scale = sqlText(buildPnlScaleSql());
        expect(scale).toBe('COALESCE(r."rate", 1.0)');
        expect(scale).not.toContain("CASE");
    });

    it("joins the CTE on the journal account id across all accounts", () => {
        const join = sqlText(buildRatesJoinSql());
        expect(join).toBe('LEFT JOIN rates r ON r."account_id" = je."accountId"');
    });
});
