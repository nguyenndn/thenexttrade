import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { EmailCampaignsClient } from "@/components/admin/email-campaigns/EmailCampaignsClient";
import {
    getCampaignAudienceCounts,
    getCampaignHistory,
} from "./actions";
import type { AudienceCountsMap } from "@/lib/emails/marketing-campaign-shared";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Email Campaigns | Admin",
    description: "Targeted email marketing campaigns and delivery telemetry",
};

const EMPTY_COUNTS: AudienceCountsMap = {
    ALL_USERS: { total: 0, optedIn: 0, skipped: 0 },
    FREE_TRIAL: { total: 0, optedIn: 0, skipped: 0 },
    VIP_PRO: { total: 0, optedIn: 0, skipped: 0 },
    HAS_MT5: { total: 0, optedIn: 0, skipped: 0 },
    NO_MT5: { total: 0, optedIn: 0, skipped: 0 },
};

export default async function AdminEmailCampaignsPage() {
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login?next=/admin/email-campaigns");
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const [countsResult, history] = await Promise.all([
        getCampaignAudienceCounts(),
        getCampaignHistory(30),
    ]);

    const defaultTestEmail = process.env.EMAIL_TEST_TO || user.email || "";

    return (
        <div className="w-full max-w-full py-6 pr-6">
            <EmailCampaignsClient
                initialCounts={countsResult.counts || EMPTY_COUNTS}
                initialHistory={history}
                defaultTestEmail={defaultTestEmail}
            />
        </div>
    );
}
