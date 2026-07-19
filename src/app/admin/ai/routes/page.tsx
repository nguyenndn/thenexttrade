import { getAiRoutingPolicies, getAiModels } from "@/actions/admin/ai-gateway";
import { AiRoutingPanel } from "@/components/admin/ai/AiRoutingPanel";

export default async function AiRoutesPage() {
    const policies = await getAiRoutingPolicies();
    const models = await getAiModels();

    return <AiRoutingPanel policies={policies} models={models} />;
}
