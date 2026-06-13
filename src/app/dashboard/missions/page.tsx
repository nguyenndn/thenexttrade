import { getAuthUser } from "@/lib/auth-cache";
import { getUserMissions } from "@/lib/services/edge-missions.service";
import { MissionsClient } from "@/components/dashboard/missions/MissionsClient";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MissionsPage() {
 const user = await getAuthUser();
 if (!user) redirect("/auth/login");

 const missions = await getUserMissions(user.id);

 return (
 <div className="space-y-4 pb-10">
 {/* Page Header */}
 <div className="flex items-center gap-4">
 <div className="w-1 self-stretch min-h-[40px] rounded-full bg-gradient-to-b from-primary via-teal-400 to-emerald-500 shrink-0" />
 <div>
 <h1 className="text-xl font-bold text-gray-700 dark:text-white tracking-tight">
 Edge Missions
 </h1>
 <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5">
 Complete missions to earn Edge and level up your trading journey.
 </p>
 </div>
 </div>

 <MissionsClient
 initialMissions={missions}
 userXp={user.profile?.xp ?? 0}
 />
 </div>
 );
}
