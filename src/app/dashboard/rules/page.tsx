import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getTradingRulesList, getTraderGoalsList } from "@/actions/rulebook";
import { getStrategies } from "@/actions/strategies";
import { prisma } from "@/lib/prisma";
import { RulebookClient } from "@/components/rules/RulebookClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Trading Rulebook & Behavior Goals | TheNextTrade",
  description: "Manage your personal trading rules, discipline guidelines, and behavioral goals.",
};

export default async function RulesPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login");
  }

  // Fetch data in parallel
  const [rules, goals, { strategies }, accounts] = await Promise.all([
    getTradingRulesList(),
    getTraderGoalsList(),
    getStrategies(),
    prisma.tradingAccount.findMany({
      where: { userId: user.id },
      select: { id: true, name: true, accountNumber: true },
    }),
  ]);

  return (
    <div className="space-y-6">
      <RulebookClient
        initialRules={rules}
        initialGoals={goals}
        strategies={strategies}
        accounts={accounts}
      />
    </div>
  );
}
