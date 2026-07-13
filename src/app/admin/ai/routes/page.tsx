import { getAiRoutingPolicies } from "@/actions/admin/ai-gateway";
import { AiRoutingPanel } from "@/components/admin/ai/AiRoutingPanel";

export default async function AiRoutesPage() {
  const policies = await getAiRoutingPolicies();

  return <AiRoutingPanel policies={policies} />;
}
