import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { isAcademyEnabled } from "@/app/admin/academy/actions";

export const dynamic = "force-dynamic";

export default async function DashboardAcademyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, academyEnabled] = await Promise.all([
        getAuthUser(),
        isAcademyEnabled(),
    ]);

    if (!academyEnabled) {
        if (!user) {
            redirect("/auth/login");
        }

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

    return <>{children}</>;
}

