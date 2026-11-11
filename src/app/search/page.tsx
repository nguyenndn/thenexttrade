import SearchClient from "./SearchClient";
import { getAuthUser } from "@/lib/auth-cache";
import { isAcademyEnabled } from "@/app/admin/academy/actions";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
    const academyEnabled = await isAcademyEnabled();
    return {
        title: academyEnabled
            ? "Search — Find Trading Articles, Tools & Lessons"
            : "Search — Find Trading Articles, Tools & Research",
        description: academyEnabled
            ? "Search across TheNextTrade's trading articles, Academy lessons, tools, and market analysis. Find exactly what you need to improve your trading."
            : "Search across TheNextTrade's trading articles, risk management tools, and execution research.",
        robots: { index: false, follow: true },
    };
}

export const dynamic = "force-dynamic";

export default async function SearchPage() {
    const [user, academyEnabled] = await Promise.all([
        getAuthUser(),
        isAcademyEnabled(),
    ]);
    return <SearchClient user={user} academyEnabled={academyEnabled} />;
}
