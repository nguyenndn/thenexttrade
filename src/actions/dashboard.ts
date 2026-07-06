"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";

export async function getUserDashboards() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const dashboards = await prisma.userDashboard.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: 'asc' }
  });

  // Create default if none exists
  if (dashboards.length === 0) {
    const defaultDashboard = await prisma.userDashboard.create({
      data: {
        userId: user.id,
        name: "Main Dashboard",
        isDefault: true,
        layout: {
          grid: [
            { i: "overview", x: 0, y: 0, w: 240, h: 66, type: "BALANCE_GROWTH" },
            { i: "win_rate", x: 0, y: 66, w: 80, h: 60, type: "DAILY_WIN_RATE" },
            { i: "profit_dist", x: 80, y: 66, w: 80, h: 60, type: "PROFIT_DIST" },
            { i: "lot_dist", x: 160, y: 66, w: 80, h: 60, type: "LOT_DIST" },
            { i: "monthly_analytics", x: 0, y: 126, w: 120, h: 66, type: "MONTHLY_ANALYTICS" },
            { i: "win_loss_comparison", x: 120, y: 126, w: 120, h: 66, type: "WIN_LOSS_COMPARISON" }
          ],
          hero: ["TOTAL_BALANCE", "PERIOD_PNL", "WIN_RATE", "TRADE_SCORE"]
        }
      }
    });
    return [defaultDashboard];
  }

  return dashboards;
}

export async function saveDashboardLayout(dashboardId: string, layout: any, name?: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Verify ownership
  const dashboard = await prisma.userDashboard.findUnique({
    where: { id: dashboardId }
  });

  if (!dashboard || dashboard.userId !== user.id) {
    throw new Error("Dashboard not found or unauthorized");
  }

  const dataToUpdate: any = { layout };
  if (name !== undefined) {
    dataToUpdate.name = name;
  }

  const updated = await prisma.userDashboard.update({
    where: { id: dashboardId },
    data: dataToUpdate
  });

  revalidatePath('/dashboard');
  return updated;
}

export async function createDashboard(name: string, layout: any = []) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const newDashboard = await prisma.userDashboard.create({
    data: {
      userId: user.id,
      name,
      isDefault: false,
      layout
    }
  });

  revalidatePath('/dashboard');
  return newDashboard;
}

export async function deleteDashboard(dashboardId: string) {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  // Prevent deleting the last/default board
  const count = await prisma.userDashboard.count({
    where: { userId: user.id }
  });

  if (count <= 1) {
    throw new Error("Cannot delete the only dashboard");
  }

  await prisma.userDashboard.delete({
    where: { id: dashboardId, userId: user.id }
  });

  revalidatePath('/dashboard');
  return true;
}
