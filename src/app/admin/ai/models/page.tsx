import { getAllAiModels, getAiProviders } from "@/actions/admin/ai-gateway";
import { AiModelsPanel } from "@/components/admin/ai/AiModelsPanel";

export default async function AiModelsPage() {
    const models = await getAllAiModels();
    const providers = await getAiProviders();

    return <AiModelsPanel models={models} providers={providers} />;
}
