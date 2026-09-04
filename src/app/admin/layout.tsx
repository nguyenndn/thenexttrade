import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { AdminNotificationBell } from "@/components/admin/AdminNotificationBell";
import { AdminButtonSizeProvider } from "@/components/providers/AdminButtonSizeProvider";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login?next=/admin");
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    // Only ADMIN can access admin pages
    if (profile?.role !== "ADMIN") {
        redirect("/dashboard");
    }

    return (
        <AdminButtonSizeProvider>
            <DashboardShell user={user} bell={<AdminNotificationBell />}>
                {children}
            </DashboardShell>
        </AdminButtonSizeProvider>
    );
}
