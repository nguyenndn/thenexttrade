import { getAiRequests } from "@/actions/admin/ai-gateway";
import { AiRequestsExplorer } from "@/components/admin/ai/AiRequestsExplorer";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function AiRequestsPage() {
    await requireAdminPageAccess();
    const requests = await getAiRequests(100);

    return <AiRequestsExplorer requests={requests} />;
}
