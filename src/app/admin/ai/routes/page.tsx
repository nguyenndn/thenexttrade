import { getAiRoutingPolicies, getAllAiModels } from "@/actions/admin/ai-gateway";
import { AiRoutingPanel } from "@/components/admin/ai/AiRoutingPanel";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function AiRoutesPage() {
    await requireAdminPageAccess();
    const policies = await getAiRoutingPolicies();
    const models = await getAllAiModels();

    return <AiRoutingPanel policies={policies} models={models} />;
}
