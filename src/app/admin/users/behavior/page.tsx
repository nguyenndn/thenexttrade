import React from "react";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { BehaviorConsoleClient } from "./client";

export const dynamic = "force-dynamic";

export default async function AdminTraderBehaviorPage() {
    await requireAdminPageAccess();

    return (
        <div className="space-y-6 pb-20">
            <AdminPageHeader
                title="Trader Behavior & Support Console"
                description="Live behavioral segmentation radar, retention risk alerts, and value telemetry."
                backHref="/admin"
            />
            <BehaviorConsoleClient />
        </div>
    );
}
