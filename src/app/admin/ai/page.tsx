import { getAiGatewayStats } from "@/actions/admin/ai-gateway";
import { AiGatewayOverview } from "@/components/admin/ai/AiGatewayOverview";

export default async function AiGatewayPage() {
    const stats = await getAiGatewayStats();

    return <AiGatewayOverview stats={stats} />;
}
