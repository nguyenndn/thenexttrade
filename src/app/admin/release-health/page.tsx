import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ReleaseHealthDashboard } from "@/components/admin/release-health/ReleaseHealthDashboard";
import { getReleaseHealthData } from "@/lib/admin/release-health.server";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function ReleaseHealthPage() {
    await requireAdminPageAccess();
    const data = await getReleaseHealthData();

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Platform Health"
                description="Quick health check — is the platform operating normally?"
            />
            <ReleaseHealthDashboard data={data} />
        </div>
    );
}
