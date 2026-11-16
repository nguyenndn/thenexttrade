import { requireAdminPageAccess } from "@/lib/admin/auth.server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { getBehaviorSegments } from "./actions";
import { BehaviorConsoleClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminTraderBehaviorPage() {
    await requireAdminPageAccess();
    const initialRes = await getBehaviorSegments({
        tab: "needs-attention",
        groupFilter: "ALL",
        page: 1,
        pageSize: 20,
    });

    return (
        <div className="space-y-6 pb-10">
            <AdminPageHeader
                title="Trader Behavior & Support Console"
                description="Live behavioral segmentation radar, retention risk alerts, and value telemetry."
                backHref="/admin"
            />
            <BehaviorConsoleClient initialData={initialRes.data ?? null} />
        </div>
    );
}
