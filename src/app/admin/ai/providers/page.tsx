import { getAiProviders } from "@/actions/admin/ai-gateway";
import { AiProvidersPanel } from "@/components/admin/ai/AiProvidersPanel";

export default async function AiProvidersPage() {
  const providers = await getAiProviders();

  return <AiProvidersPanel initialProviders={providers} />;
}
