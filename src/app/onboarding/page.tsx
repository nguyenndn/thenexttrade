import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getGeoFromHeaders } from "@/lib/analytics";
import { normalizeCountryCode } from "@/lib/country-utils";
import { isOnboardingDone } from "@/lib/onboarding/onboarding.server";
import OnboardingClient from "./OnboardingClient";

export default async function OnboardingPage() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Check if onboarding is already completed
    const done = await isOnboardingDone(user.id);
    if (done) {
        redirect("/dashboard");
    }

    // Load DB User & Profile
    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        include: {
            profile: true,
        },
    });

    // Get IP Geo Country
    const reqHeaders = await headers();
    const geo = getGeoFromHeaders(reqHeaders);
    const ipCountry = geo.country?.toUpperCase();
    const normalizedIpCountry = normalizeCountryCode(ipCountry) ?? "US";

    const initialData = {
        email: user.email ?? "",
        fullName: user.user_metadata?.full_name || user.user_metadata?.first_name || dbUser?.name || "",
        username: dbUser?.profile?.username ?? "",
        bio: dbUser?.profile?.bio ?? "",
        avatarUrl: dbUser?.image ?? user.user_metadata?.avatar_url ?? null,
        country: dbUser?.profile?.country ?? normalizedIpCountry,
    };

    return <OnboardingClient initialData={initialData} />;
}
