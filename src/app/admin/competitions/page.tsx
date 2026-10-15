import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { fetchAdminCompetitions } from "@/actions/admin/competitions";
import { CompetitionListClient } from "@/components/admin/competitions/CompetitionListClient";

export const metadata: Metadata = {
    title: "Competitions & Sprints | Admin Portal",
    description: "Create and govern live trading sprints, prize distributions, and real-time tournament telemetry.",
};

export default async function AdminCompetitionsPage() {
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login?returnUrl=/admin/competitions");
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (!profile || profile.role !== "ADMIN") {
        redirect("/dashboard");
    }

    const { competitions, stats } = await fetchAdminCompetitions();

    return (
        <div className="w-full space-y-6">
            <CompetitionListClient
                initialCompetitions={competitions}
                stats={stats}
            />
        </div>
    );
}
