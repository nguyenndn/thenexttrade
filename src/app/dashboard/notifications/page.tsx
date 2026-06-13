import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/PageHeader";
import { NotificationsList } from "./NotificationsList";

export const metadata: Metadata = {
 title: "Notifications | TheNextTrade",
 description: "Your latest notifications and account updates",
};

export default async function NotificationsPage() {
 const user = await getAuthUser();

 if (!user) {
 redirect("/auth/login");
 }

 const notifications = await prisma.notification.findMany({
 where: { userId: user.id },
 orderBy: { createdAt: "desc" },
 take: 50,
 });

 // Mark all unread as read when visiting this page
 await prisma.notification.updateMany({
 where: { userId: user.id, isRead: false },
 data: { isRead: true, readAt: new Date() },
 });

 return (
 <div className="space-y-4">
 <PageHeader
 title="Notifications"
 description="Your latest notifications and account updates."
 />
 <NotificationsList initialNotifications={JSON.parse(JSON.stringify(notifications))} />
 </div>
 );
}
