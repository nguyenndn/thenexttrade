import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { getDailyBriefingData } from "@/lib/briefing-queries";
import { BriefingClient } from "./BriefingClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Daily Briefing | Dashboard",
    description: "Your personalized daily trading report",
};

export default async function BriefingPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/signin");

    // Account
    let accountId: string | undefined;
    const cookieStore = await cookies();
    const lastAccountId = cookieStore.get("last_account_id")?.value;

    if (lastAccountId) {
        const exists = await prisma.tradingAccount.findFirst({
            where: { id: lastAccountId, userId: user.id },
            select: { id: true },
        });
        if (exists) accountId = lastAccountId;
    }

    if (!accountId) {
        const firstAccount = await prisma.tradingAccount.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: { id: true },
        });
        accountId = firstAccount?.id;
    }

    return (
        <Suspense fallback={<BriefingLoadingSkeleton />}>
            <BriefingDataLoader userId={user.id} accountId={accountId} />
        </Suspense>
    );
}

async function BriefingDataLoader({ userId, accountId }: { userId: string; accountId?: string }) {
    const data = await getDailyBriefingData(userId, accountId);
    return <BriefingClient data={data} />;
}

function BriefingLoadingSkeleton() {
    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-in fade-in py-4">
            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 border border-gray-200 dark:border-white/10">
                <div className="h-8 w-64 bg-gray-200 dark:bg-white/5 rounded-lg mb-4 animate-pulse" />
                <div className="h-4 w-40 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
            </div>
            {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-200 dark:border-white/10 h-32 animate-pulse" />
            ))}
        </div>
    );
}
