import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";

export async function checkAdminApiAccess() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { isAuthorized: false as const, status: 401, user: null };
    }

    const { data: aal, error: aalError } =
        await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
    if (
        aalError ||
        (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2")
    ) {
        return { isAuthorized: false as const, status: 403, user: null };
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") {
        return { isAuthorized: false as const, status: 403, user };
    }

    return { isAuthorized: true as const, status: 200, user };
}
