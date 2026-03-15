
import { Metadata } from "next";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { Activity } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const metadata: Metadata = {
    title: "Audit Logs | Admin",
    description: "View system audit logs",
};

export default async function AuditLogsPage() {
    const logs = await prisma.auditLog.findMany({
        include: {
            admin: { select: { name: true, email: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 100,
    });

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="System Logs"
                description="Track important admin actions and system events."
            />

            <div className="bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden shadow-sm">
                <div className="overflow-x-auto custom-scrollbar">
                    <table className="w-full text-left text-sm border-collapse">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">Action</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">Target</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">Details</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">Admin</th>
                                <th className="px-6 py-4 border-b border-gray-100 dark:border-white/5">Time</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {logs.map((log) => (
                                <tr key={log.id} className="group hover:bg-gray-50 dark:hover:bg-white/[0.01] transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                                        {log.action.replace(/_/g, " ")}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        <span className="font-mono bg-gray-100 dark:bg-white/10 px-1 py-0.5 rounded mr-1">{log.targetType}</span>
                                        {log.targetId}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-600 dark:text-gray-300">
                                        <pre className="whitespace-pre-wrap max-w-xs">{JSON.stringify(log.details, null, 1)}</pre>
                                    </td>
                                    <td className="px-6 py-4 text-xs">
                                        {log.admin?.name || log.admin?.email}
                                    </td>
                                    <td className="px-6 py-4 text-xs text-gray-500">
                                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm:ss", { locale: enUS })}
                                    </td>
                                </tr>
                            ))}
                            {logs.length === 0 && (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-gray-500">
                                        <Activity size={32} className="mx-auto mb-2 opacity-30" />
                                        No audit logs found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
