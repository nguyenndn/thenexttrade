"use client";

import { format } from "date-fns";
import { History, Activity } from "lucide-react";

export function AiAuditLogPanel({ logs }: { logs: any[] }) {
  return (
    <div className="space-y-4">

      <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm overflow-hidden">
        {logs.length === 0 ? (
          <div className="p-12 text-center text-gray-500 dark:text-gray-400">
            <History className="w-12 h-12 mx-auto mb-4 opacity-20" />
            <p>No audit logs found.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100 dark:divide-white/10">
            {logs.map(log => (
              <div key={log.id} className="p-4 flex gap-4 hover:bg-gray-50 dark:hover:bg-white/[0.02] transition-colors">
                <div className="mt-1 w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                  <Activity className="w-4 h-4 text-blue-600 dark:text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white font-medium">
                    {log.action.replace(/_/g, ' ')}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    <span className="font-semibold">{log.admin?.username || log.admin?.email || "Unknown Admin"}</span> 
                    {" "} modified <span className="font-mono">{log.entityType}</span> {log.entityId && `(${log.entityId.slice(0, 8)}...)`}
                  </p>
                  {log.detailsJson && Object.keys(log.detailsJson).length > 0 && (
                    <div className="mt-2 text-[10px] font-mono text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-black/20 p-2 rounded-xl border border-gray-200 dark:border-white/10 overflow-x-auto">
                      {JSON.stringify(log.detailsJson)}
                    </div>
                  )}
                </div>
                <div className="text-xs text-gray-400 whitespace-nowrap">
                  {format(new Date(log.createdAt), "MMM d, HH:mm")}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
