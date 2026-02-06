import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { PublicHeader } from "@/components/layout/PublicHeader";

export default async function AcademyLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    // 1. Get User (Cached)
    const user = await getAuthUser();

    if (!user) {
        // If user session exists in Supabase (handled by middleware) but not in Prisma (getAuthUser returns null),
        // we must sign them out to prevent a redirect loop between Middleware (-> Academy) and Layout (-> Login).
        redirect("/auth/signout");
    }

    // 2. Get Profile (for Username/Bio)
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id }
    });

    return (
        <div className="min-h-screen bg-gray-50 dark:bg-slate-900 text-gray-900 dark:text-white font-outfit">
            <PublicHeader user={user} profile={profile} />
            <main>
                {children}
            </main>
        </div>
    );
}
