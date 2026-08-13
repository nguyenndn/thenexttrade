import { getAiGatewayStats } from "@/actions/admin/ai-gateway";
import { AiGatewayOverview } from "@/components/admin/ai/AiGatewayOverview";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function AiGatewayPage() {
    await requireAdminPageAccess();
    const stats = await getAiGatewayStats();

    return <AiGatewayOverview stats={stats} />;
}
