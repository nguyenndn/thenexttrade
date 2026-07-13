import { Metadata } from "next";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";
import { getAdminAuditLogs } from "@/actions/admin/ai-gateway";
import { AiAuditLogPanel } from "@/components/admin/ai/AiAuditLogPanel";

export const metadata: Metadata = {
  title: "Audit Log | AI Gateway",
  description: "View admin activities in the AI Gateway.",
};

export default async function AiAuditLogPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/dashboard");
  }

  const logs = await getAdminAuditLogs();

  return <AiAuditLogPanel logs={logs} />;
}
