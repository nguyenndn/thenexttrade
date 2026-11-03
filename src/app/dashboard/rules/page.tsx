import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getTradingRulesList } from "@/actions/rulebook";
import { getStrategies } from "@/actions/strategies";
import { prisma } from "@/lib/prisma";
import { RulebookClient } from "@/components/rules/RulebookClient";
import { isRulebookGoalsEnabled } from "@/lib/feature-flags";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Trading Rulebook & Compliance | TheNextTrade",
    description:
        "Manage your personal trading rules and discipline compliance.",
};

export default async function RulesPage() {
    if (!isRulebookGoalsEnabled()) {
        redirect("/dashboard");
    }

    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login");
    }

    // Fetch data in parallel
    const [rules, { strategies }, accounts] = await Promise.all([
        getTradingRulesList(),
        getStrategies(),
        prisma.tradingAccount.findMany({
            where: { userId: user.id },
            select: { id: true, name: true, accountNumber: true },
        }),
    ]);

    return (
        <div className="space-y-4">
            <RulebookClient
                initialRules={rules}
                strategies={strategies}
                accounts={accounts}
            />
        </div>
    );
}
