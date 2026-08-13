import { getAllAiModels, getAiProviders } from "@/actions/admin/ai-gateway";
import { AiModelsPanel } from "@/components/admin/ai/AiModelsPanel";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function AiModelsPage() {
    await requireAdminPageAccess();
    const models = await getAllAiModels();
    const providers = await getAiProviders();

    return <AiModelsPanel models={models} providers={providers} />;
}
