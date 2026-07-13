import { getAiRequests } from "@/actions/admin/ai-gateway";
import { AiRequestsExplorer } from "@/components/admin/ai/AiRequestsExplorer";

export default async function AiRequestsPage() {
  const requests = await getAiRequests(100);

  return <AiRequestsExplorer requests={requests} />;
}
