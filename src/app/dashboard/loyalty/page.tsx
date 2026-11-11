import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
  getUserLoyaltyProgress,
  isLoyaltyEnabled,
} from "@/lib/loyalty/loyalty.server";
import { LoyaltyDashboardClient } from "@/components/loyalty/LoyaltyDashboardClient";

export const metadata: Metadata = {
  title: "Loyalty Program & Volume Rewards | TheNextTrade",
  description:
    "Track your cumulative traded lots, climb through 10 institutional milestone tiers, and claim direct USDT rebates and trading perks.",
};

export default async function LoyaltyPage() {
  const [user, loyaltyEnabled] = await Promise.all([
    getAuthUser(),
    isLoyaltyEnabled(),
  ]);

  if (!user) {
    redirect("/auth/login?next=/dashboard/loyalty");
  }

  if (!loyaltyEnabled) {
    const isAdmin =
      user.profile?.role === "ADMIN" ||
      (
        await prisma.profile.findUnique({
          where: { userId: user.id },
          select: { role: true },
        })
      )?.role === "ADMIN";

    if (!isAdmin) {
      redirect("/dashboard");
    }
  }

  const progress = await getUserLoyaltyProgress(user.id);

  return (
    <div className="w-full space-y-6">
      <LoyaltyDashboardClient initialProgress={progress} />
    </div>
  );
}
