import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { fetchAdminLoyaltyData } from "@/actions/admin/loyalty";
import { AdminLoyaltyClient } from "@/components/admin/loyalty/AdminLoyaltyClient";

export const metadata: Metadata = {
  title: "Loyalty & Rewards Hub | Admin Portal",
  description: "Manage, review, and dispatch USDT rewards for trader volume milestones.",
};

export default async function AdminLoyaltyPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login?returnUrl=/admin/loyalty");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true },
  });

  if (!profile || profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const res = await fetchAdminLoyaltyData();
  const initialClaims = res.data?.claims || [];
  const initialTiers = res.data?.tiers || [];
  const initialStats = res.data?.stats || {
    pendingCount: 0,
    pendingAmount: 0,
    completedCount: 0,
    completedAmount: 0,
    totalVolumeLots: 0,
    topTradersCount: 0,
  };

  return (
    <div className="w-full space-y-6">
      <AdminLoyaltyClient
        initialClaims={initialClaims}
        initialStats={initialStats}
        initialTiers={initialTiers}
      />
    </div>
  );
}
