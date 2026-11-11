import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { isAcademyEnabled } from "@/app/admin/academy/actions";

export const dynamic = "force-dynamic";

export default async function AcademyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [user, academyEnabled] = await Promise.all([
        getAuthUser(),
        isAcademyEnabled(),
    ]);

    if (!academyEnabled) {
        const isAdmin =
            user?.profile?.role === "ADMIN" ||
            (user
                ? (
                      await prisma.profile.findUnique({
                          where: { userId: user.id },
                          select: { role: true },
                      })
                  )?.role === "ADMIN"
                : false);

        if (!isAdmin) {
            redirect(user ? "/dashboard" : "/");
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-transparent text-gray-700 dark:text-white font-sans">
            <PublicHeader user={user} />
            <main>{children}</main>
        </div>
    );
}
