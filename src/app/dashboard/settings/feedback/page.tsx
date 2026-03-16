import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import FeedbackPageClient from "./FeedbackPageClient";

export const dynamic = "force-dynamic";

export default async function FeedbackPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const feedbacks = await prisma.feedback.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        take: 20,
    });

    return <FeedbackPageClient feedbacks={feedbacks} />;
}
