
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  // If no user, let the page render (login page handles its own layout)
  // Middleware already blocks non-login admin pages for unauthenticated users
  if (!user) {
    return <>{children}</>;
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true }
  });

  // Non-admin users trying to access admin pages get redirected
  if (profile?.role !== "ADMIN" && profile?.role !== "EDITOR") {
    redirect("/dashboard");
  }

  return (
    <DashboardShell user={user} bell={<AdminNotificationBell />}>
      {children}
    </DashboardShell>
  );
}
