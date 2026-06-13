import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ReleaseHealthDashboard } from "@/components/admin/release-health/ReleaseHealthDashboard";
import { getReleaseHealthData } from "@/lib/admin/release-health.server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function requireAdminPageAccess() {
 const user = await getAuthUser();
 if (!user) redirect("/auth/login");

 const profile = await prisma.profile.findUnique({
 where: { userId: user.id },
 select: { role: true },
 });

 if (!profile || !isAdminRole(profile.role)) redirect("/forbidden");
}

export default async function ReleaseHealthPage() {
 await requireAdminPageAccess();
 const data = await getReleaseHealthData();

 return (
 <div className="space-y-4 pb-10">
 <AdminPageHeader
 title="Release Health"
 description="Quick health check — is the product ready to ship?"
 />
 <ReleaseHealthDashboard data={data} />
 </div>
 );
}
