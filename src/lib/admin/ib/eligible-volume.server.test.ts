import { describe, expect, it } from "vitest";
import { buildEligibleJournalWhere } from "./eligible-volume.server";

describe("buildEligibleJournalWhere", () => {
    it("excludes every non-live account marker from commission volume", () => {
        const where = buildEligibleJournalWhere({
            accountId: "acc-1",
            status: "CLOSED",
            ibConfirmedOnly: true,
        });

        expect(where.syncSource).toEqual({
            in: ["EA_SYNC", "EA_HISTORY", "SUPPORT_SYNC", "CLOUD_WORKER"],
        });
        expect(where.status).toBe("CLOSED");
        expect(where.accountId).toBe("acc-1");

        const accountCondition = where.account as {
            ibAttribution?: string;
            NOT?: Array<Record<string, unknown>>;
        };
        expect(accountCondition.ibAttribution).toBe("CONFIRMED");

        const exclusions = JSON.stringify(accountCondition.NOT);
        for (const marker of ["demo", "contest", "evaluation", "trial"]) {
            expect(exclusions).toContain(`"contains":"${marker}"`);
        }
    });

    it("keeps broker and date filters intact", () => {
        const since = new Date("2026-09-01T00:00:00Z");
        const until = new Date("2026-10-01T00:00:00Z");
        const where = buildEligibleJournalWhere({
            userIds: ["user-1", "user-2"],
            broker: "Exness",
            since,
            until,
        });

        expect(where.userId).toEqual({ in: ["user-1", "user-2"] });
        expect(where.OR).toEqual([
            { exitDate: { gte: since, lte: until } },
            { exitDate: null, entryDate: { gte: since, lte: until } },
        ]);
        expect(where.account).toMatchObject({
            broker: { equals: "Exness", mode: "insensitive" },
        });
    });
});
