import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default async function AcademyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const user = await getAuthUser();

    // Allow guest access — no redirect for unauthenticated users
    const profile = user
        ? await prisma.profile.findUnique({ where: { userId: user.id } })
        : null;

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-outfit">
            <PublicHeader user={user} profile={profile} />
            <main>
                {children}
            </main>
        </div>
    );
}
