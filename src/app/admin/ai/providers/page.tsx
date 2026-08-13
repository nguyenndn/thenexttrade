import { getAiProviders } from "@/actions/admin/ai-gateway";
import { AiProvidersPanel } from "@/components/admin/ai/AiProvidersPanel";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function AiProvidersPage() {
    await requireAdminPageAccess();
    const providers = await getAiProviders();

    return <AiProvidersPanel initialProviders={providers} />;
}
