import { Metadata } from "next";
import { getAdminAuditLogs } from "@/actions/admin/ai-gateway";
import { AiAuditLogPanel } from "@/components/admin/ai/AiAuditLogPanel";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const metadata: Metadata = {
    title: "Audit Log | AI Gateway",
    description: "View admin activities in the AI Gateway.",
};

export const dynamic = "force-dynamic";

export default async function AiAuditLogPage() {
    await requireAdminPageAccess();

    const logs = await getAdminAuditLogs();

    return <AiAuditLogPanel logs={logs} />;
}
