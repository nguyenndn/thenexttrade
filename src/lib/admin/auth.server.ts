import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

/**
 * Verify admin access for server-rendered admin pages.
 * - Not logged in → redirect /auth/login
 * - Not ADMIN or EDITOR → redirect /forbidden
 *
 * Usage: call `await requireAdminPageAccess()` at the top of every
 * server-rendered admin page function as defense-in-depth
 * (layout already checks, this is a safety net).
 */
export async function requireAdminPageAccess() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (!profile || !isAdminRole(profile.role)) redirect("/forbidden");
}
