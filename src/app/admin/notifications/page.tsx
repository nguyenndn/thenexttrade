
import { Metadata } from "next";
import Link from "next/link";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Megaphone, Plus, Clock, CheckCircle } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
    title: "Broadcasts | Admin",
    description: "Manage system-wide announcements",
};

export default async function AdminNotificationsPage() {
    const broadcasts = await prisma.adminBroadcast.findMany({
        include: {
            creator: { select: { name: true, email: true } }
        },
        orderBy: { createdAt: "desc" },
    });

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Broadcasts"
                description="Send announcements to all users."
            >
                <Link href="/admin/notifications/create">
                    <Button variant="primary" className="shadow-primary/30">
                        <Plus size={18} className="mr-2" />
                        New Broadcast
                    </Button>
                </Link>
            </AdminPageHeader>

            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm hover:shadow-md transition-shadow">
                {broadcasts.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <Megaphone size={48} className="mx-auto mb-4 opacity-30" />
                        <p>No broadcasts found.</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Title</th>
                                    <th className="px-6 py-4">Status</th>
                                    <th className="px-6 py-4">Scheduled for</th>
                                    <th className="px-6 py-4">Created By</th>
                                    <th className="px-6 py-4">Created At</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                                {broadcasts.map((b) => (
                                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="font-bold text-gray-900 dark:text-white">{b.title}</div>
                                            <div className="text-xs text-gray-500 truncate max-w-[300px]">{b.message}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {b.sentAt ? (
                                                <span className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs font-bold">
                                                    <CheckCircle size={14} /> Sent
                                                </span>
                                            ) : (
                                                <span className="flex items-center gap-1 text-yellow-600 dark:text-yellow-400 text-xs font-bold">
                                                    <Clock size={14} /> Scheduled
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-400">
                                            {b.scheduledAt ? format(new Date(b.scheduledAt), "HH:mm dd/MM/yyyy", { locale: enUS }) : "Immediate"}
                                        </td>
                                        <td className="px-6 py-4 text-xs">
                                            {b.creator?.name || b.creator?.email || "Unknown"}
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500">
                                            {format(new Date(b.createdAt), "dd/MM/yyyy")}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
