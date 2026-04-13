import { getVipRequests, getVipRequestStats } from "@/actions/vip-request";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminVipRequestsClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminCommunityPage() {
  const user = await getAuthUser();
  if (!user) redirect("/auth/login");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") redirect("/dashboard");

  const [{ requests, total }, stats] = await Promise.all([
    getVipRequests({ limit: 50 }),
    getVipRequestStats(),
  ]);

  return (
    <div className="space-y-4 pb-10">
      <AdminPageHeader
        title="VIP Requests"
        description="Manage VIP access requests from community members."
      />

      {/* Stats */}
      <AdminVipRequestsClient
        initialRequests={JSON.parse(JSON.stringify(requests))}
        total={total}
        stats={stats ?? { total: 0, pending: 0, approved: 0, rejected: 0 }}
      />
    </div>
  );
}
