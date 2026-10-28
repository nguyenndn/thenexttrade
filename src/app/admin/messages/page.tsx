import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { fetchAdminMessagesData } from "@/actions/admin/messages";
import { AdminMessagesClient } from "@/components/admin/messages/AdminMessagesClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
  title: "Messages | Admin Portal",
  description: "Review, triage, and reply to trader correspondence dispatched from the public contact desk.",
};

export default async function AdminMessagesPage() {
  const user = await getAuthUser();
  if (!user) {
    redirect("/auth/login?returnUrl=/admin/messages");
  }

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true },
  });

  if (!profile || profile.role !== "ADMIN") {
    redirect("/dashboard");
  }

  const res = await fetchAdminMessagesData();
  const initialMessages = res.data?.messages || [];
  const initialStats = res.data?.stats || {
    total: 0,
    newCount: 0,
    readCount: 0,
    repliedCount: 0,
    archivedCount: 0,
  };
  const initialTotal = res.data?.total || 0;

  return (
    <div className="w-full space-y-6">
      <AdminPageHeader
        title="Messages"
        description="Review, triage, and reply to trader correspondence dispatched from the public contact desk."
        backHref="/admin"
      />

      <AdminMessagesClient
        initialMessages={initialMessages}
        initialStats={initialStats}
        initialTotal={initialTotal}
      />
    </div>
  );
}
