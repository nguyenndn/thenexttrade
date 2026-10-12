import { getAuthUser } from "@/lib/auth-cache";
import { getUserMissions } from "@/lib/services/edge-missions.service";
import { MissionsClient } from "@/components/dashboard/missions/MissionsClient";
import { PageHeader } from "@/components/ui/PageHeader";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const missions = await getUserMissions(user.id);
    const userXp = (user as any).xp ?? 0;

    return (
        <div className="space-y-6 pb-12">
            <PageHeader
                title="Edge Missions"
                description="Structured execution milestones to eliminate behavioral leaks, sharpen risk execution, and build positive expectancy."
            />

            <MissionsClient
                initialMissions={missions}
                userXp={userXp}
            />
        </div>
    );
}
