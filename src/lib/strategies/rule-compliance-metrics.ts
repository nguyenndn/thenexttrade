export interface RuleMetaInput {
    id: string;
    title: string;
    category: string;
    strategyId?: string | null;
    strategyName?: string | null;
    strategyColor?: string | null;
}

export interface RuleCheckTelemetryInput {
    tradingRuleId: string;
    status: "FOLLOWED" | "BROKEN" | "SKIPPED" | string;
    entryStatus?: "OPEN" | "CLOSED" | string | null;
    netPnl?: number | null;
}

export interface RuleComplianceStat {
    ruleId: string;
    ruleTitle: string;
    category: string;
    strategyId?: string | null;
    strategyName?: string | null;
    strategyColor?: string | null;
    followed: number;
    broken: number;
    skipped: number;
    gradedCount: number;
    complianceRate: number | null;
    followedPnL: number;
    followedWinRate: number | null;
    followedProfitFactor: number | null;
    followedClosedCount: number;
    brokenPnL: number;
    brokenWinRate: number | null;
    brokenClosedCount: number;
    netPnL: number;
}

export function computeRuleComplianceMetrics(
    rules: RuleMetaInput[],
    checks: RuleCheckTelemetryInput[]
): RuleComplianceStat[] {
    const checksByRule = new Map<string, RuleCheckTelemetryInput[]>();
    for (const check of checks) {
        const list = checksByRule.get(check.tradingRuleId);
        if (list) {
            list.push(check);
        } else {
            checksByRule.set(check.tradingRuleId, [check]);
        }
    }

    return rules.map((rule) => {
        const ruleChecks = checksByRule.get(rule.id) || [];

        let followed = 0;
        let broken = 0;
        let skipped = 0;

        let followedPnL = 0;
        let followedWins = 0;
        let followedClosedCount = 0;
        let followedGrossWin = 0;
        let followedGrossLossAbs = 0;

        let brokenPnL = 0;
        let brokenWins = 0;
        let brokenClosedCount = 0;

        for (const c of ruleChecks) {
            const isClosedWithPnl =
                c.entryStatus === "CLOSED" &&
                typeof c.netPnl === "number" &&
                Number.isFinite(c.netPnl);
            const pnlVal = isClosedWithPnl ? Number(c.netPnl) : 0;

            if (c.status === "FOLLOWED") {
                followed += 1;
                if (isClosedWithPnl) {
                    followedClosedCount += 1;
                    followedPnL += pnlVal;
                    if (pnlVal > 0) {
                        followedWins += 1;
                        followedGrossWin += pnlVal;
                    } else if (pnlVal < 0) {
                        followedGrossLossAbs += Math.abs(pnlVal);
                    }
                }
            } else if (c.status === "BROKEN") {
                broken += 1;
                if (isClosedWithPnl) {
                    brokenClosedCount += 1;
                    brokenPnL += pnlVal;
                    if (pnlVal > 0) {
                        brokenWins += 1;
                    }
                }
            } else if (c.status === "SKIPPED") {
                skipped += 1;
            }
        }

        // Skipped and ungraded trades are intentionally excluded from violation math
        const gradedCount = followed + broken;
        const complianceRate =
            gradedCount > 0 ? Math.round((followed / gradedCount) * 100) : null;

        const followedWinRate =
            followedClosedCount > 0
                ? Math.round((followedWins / followedClosedCount) * 100)
                : null;

        const followedProfitFactor =
            followedGrossLossAbs > 0
                ? Number((followedGrossWin / followedGrossLossAbs).toFixed(2))
                : followedGrossWin > 0
                  ? 99.9
                  : null;

        const brokenWinRate =
            brokenClosedCount > 0
                ? Math.round((brokenWins / brokenClosedCount) * 100)
                : null;

        const roundedFollowedPnL = Number(followedPnL.toFixed(2));
        const roundedBrokenPnL = Number(brokenPnL.toFixed(2));

        return {
            ruleId: rule.id,
            ruleTitle: rule.title,
            category: rule.category,
            strategyId: rule.strategyId ?? null,
            strategyName: rule.strategyName ?? null,
            strategyColor: rule.strategyColor ?? null,
            followed,
            broken,
            skipped,
            gradedCount,
            complianceRate,
            followedPnL: roundedFollowedPnL,
            followedWinRate,
            followedProfitFactor,
            followedClosedCount,
            brokenPnL: roundedBrokenPnL,
            brokenWinRate,
            brokenClosedCount,
            netPnL: Number((roundedFollowedPnL + roundedBrokenPnL).toFixed(2)),
        };
    });
}
