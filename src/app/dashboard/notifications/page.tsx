
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Lock, Bell, CheckCircle } from "lucide-react";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";

export const metadata: Metadata = {
    title: "Notifications | TheNextTrade",
    description: "Your latest notifications",
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

    return (
        <div className="w-full">
            <div className="mb-4">
                <p className="text-base text-primary font-semibold border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg px-4 py-2 w-fit">Your latest notifications and account updates.</p>
            </div>

            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                {notifications.length === 0 ? (
                    <div className="p-16 text-center text-gray-600 dark:text-gray-300">
                        <Bell size={48} className="mx-auto mb-4 opacity-50" />
                        <h3 className="text-lg font-bold">No notifications</h3>
                        <p className="text-sm">You will receive notifications about account updates or products.</p>
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100 dark:divide-white/5">
                        {notifications.map((n) => (
                            <div
                                key={n.id}
                                className={`p-6 hover:bg-gray-50 dark:hover:bg-white/5 transition flex gap-4 ${!n.isRead ? 'bg-blue-50/30 dark:bg-blue-900/5' : ''}`}
                            >
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${!n.isRead ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-gray-100 text-gray-600 dark:bg-white/10'}`}>
                                    <Bell size={20} />
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className={`text-base font-bold ${!n.isRead ? 'text-gray-700 dark:text-white' : 'text-gray-600 dark:text-gray-300'}`}>
                                            {n.title}
                                        </h3>
                                        <span className="text-xs text-gray-500 whitespace-nowrap ml-2">
                                            {format(new Date(n.createdAt), "HH:mm dd/MM/yyyy", { locale: enUS })}
                                        </span>
                                    </div>
                                    <p className="text-gray-600 dark:text-gray-500 mt-1 leading-relaxed">
                                        {n.message}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
