
import { prisma } from "@/lib/prisma";
import { AlertCircle, Trash2, Info } from "lucide-react";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";

export const dynamic = 'force-dynamic';

export default async function SystemLogsPage() {
    const logs = await prisma.errorLog.findMany({
        orderBy: { createdAt: 'desc' },
        take: 100,
        select: {
            id: true,
            severity: true,
            message: true,
            context: true,
            createdAt: true
        }
    });

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="System Health Logs"
                description="Monitor errors and system events. Showing last 100 entries."
            />

            <div className="rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden bg-white dark:bg-[#151925] shadow-sm hover:shadow-md transition-shadow">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 dark:bg-[#0B0E14] text-gray-500 dark:text-gray-400 text-left">
                        <tr>
                            <th className="px-6 py-4 font-medium">Severity</th>
                            <th className="px-6 py-4 font-medium">Message</th>
                            <th className="px-6 py-4 font-medium hidden md:table-cell">Context</th>
                            <th className="px-6 py-4 font-medium text-right">Time</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {logs.map((log) => (
                            <tr key={log.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${log.severity === 'ERROR' ? 'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30' :
                                        log.severity === 'WARN' ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30' :
                                            'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30'
                                        }`}>
                                        {log.severity === 'ERROR' ? <AlertCircle size={12} /> : <Info size={12} />}
                                        {log.severity}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-medium text-gray-900 dark:text-white max-w-md truncate" title={log.message}>
                                    {log.message}
                                </td>
                                <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs hidden md:table-cell max-w-xs truncate">
                                    {log.context || "-"}
                                </td>
                                <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400 whitespace-nowrap">
                                    {new Date(log.createdAt).toLocaleString()}
                                </td>
                            </tr>
                        ))}
                        {logs.length === 0 && (
                            <tr>
                                <td colSpan={4} className="p-8 text-center text-gray-500">
                                    No logs found. System is healthy!
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
