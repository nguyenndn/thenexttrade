import ComingSoonPage from "@/components/ComingSoon";
import { getAuthUser } from "@/lib/auth-cache";
import { PublicHeader } from "@/components/layout/PublicHeader";
import { SiteFooter } from "@/components/layout/SiteFooter";

export default async function Page() {
    const user = await getAuthUser();

    return (
        <main className="min-h-screen bg-slate-50 dark:bg-[#0F1117]">
            <PublicHeader user={user} />
            <div className="pt-20">
                <ComingSoonPage title="Technical Analysis" description="Charts, indicators, and patterns. Analysis tools coming soon." />
            </div>
            <SiteFooter />
        </main>
    );
}
