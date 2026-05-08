import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import FeedbackPageClient from "./FeedbackPageClient";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    // Server-side guard: if feedback is disabled, redirect to settings
    const configRecord = await prisma.systemSetting.findUnique({
        where: { key: "site_config" },
    });
    const siteConfig = (configRecord?.value as Record<string, unknown>) || {};
    if (siteConfig.feedbackEnabled === false) {
        redirect("/dashboard/settings");
    }

    const feedbacks = await prisma.feedback.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return <FeedbackPageClient feedbacks={feedbacks} />;
}
