import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Analytics | Trading Dashboard",
    description: "Analyze your trading performance",
};

import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const accountIdParam = resolvedParams?.accountId;

    // If accountId is already present, just render
    if (accountIdParam) {
        return (
            <div className="space-y-6">
                <AnalyticsDashboard />
            </div>
        );
    }

    // Otherwise, determine default account
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/signin");
    }

    const cookieStore = await cookies();
    let targetAccountId = cookieStore.get("last_account_id")?.value;

    if (!targetAccountId) {
        // Fallback to first account from DB
        const firstAccount = await prisma.tradingAccount.findFirst({
            where: { userId: user.id },
            select: { id: true },
            orderBy: { createdAt: 'desc' } // Match AccountSelector logic
        });
        targetAccountId = firstAccount?.id;
    }

    // Redirect if we found an account
    if (targetAccountId) {
        redirect(`/dashboard/analytics?accountId=${targetAccountId}`);
    }

    // Fallback if user has NO accounts (render empty state)
    return (
        <div className="space-y-6">
            <AnalyticsDashboard />
        </div>
    );
}
