import { getAiRoutingPolicies, getAllAiModels } from "@/actions/admin/ai-gateway";
import { AiRoutingPanel } from "@/components/admin/ai/AiRoutingPanel";

export default async function AiRoutesPage() {
    const policies = await getAiRoutingPolicies();
    const models = await getAllAiModels();

    return <AiRoutingPanel policies={policies} models={models} />;
}
