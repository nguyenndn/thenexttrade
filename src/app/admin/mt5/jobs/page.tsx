import { getMt5Jobs } from "@/actions/admin/mt5";
import { formatDistanceToNow, format } from "date-fns";
import { Database, AlertCircle, CheckCircle, Clock } from "lucide-react";
import { CancelJobButton } from "./CancelJobButton";

export const dynamic = "force-dynamic";

export default async function Mt5JobsPage() {
  const jobs = await getMt5Jobs();

  return (
    <div className="overflow-hidden rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm">
        {jobs.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <Database className="mx-auto w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-bold">No Import Jobs Queued</p>
            <p className="text-xs mt-1">Jobs will appear here when users link their accounts and trigger sync.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-dashboard text-xs uppercase text-gray-500 font-black tracking-wider">
                  <th className="px-6 py-4">Job ID</th>
                  <th className="px-6 py-4">Account</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Progress</th>
                  <th className="px-6 py-4">Message</th>
                  <th className="px-6 py-4">Created At</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10 text-sm text-gray-700 dark:text-gray-300">
                {jobs.map((job) => (
                  <tr key={job.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                    <td className="px-6 py-4 font-mono font-semibold text-xs">{job.id}</td>
                    <td className="px-6 py-4">
                      <div className="font-semibold text-gray-800 dark:text-white">
                        {job.account.name || "Unnamed Account"}
                      </div>
                      <div className="text-xs text-gray-400 dark:text-gray-500 font-mono">
                        #{job.account.accountNumber} · {job.account.server}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          job.status === "COMPLETED"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            : job.status === "FAILED"
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                        }`}
                      >
                        {job.status === "COMPLETED" && <CheckCircle size={10} className="mr-1.5 shrink-0" />}
                        {job.status === "FAILED" && <AlertCircle size={10} className="mr-1.5 shrink-0" />}
                        {job.status !== "COMPLETED" && job.status !== "FAILED" && <Clock size={10} className="mr-1.5 shrink-0" />}
                        {job.status}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="w-16 bg-gray-100 dark:bg-white/10 rounded-full h-1.5 overflow-hidden">
                          <div
                            className="bg-primary h-full rounded-full transition-all"
                            style={{ width: `${job.progressPercent}%` }}
                          />
                        </div>
                        <span className="text-xs font-semibold">{job.progressPercent}%</span>
                      </div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        {job.dealsReceived} deals · {job.ordersReceived} orders
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs max-w-xs truncate" title={job.errorMessage || job.message || ""}>
                      {job.status === "FAILED" ? (
                        <span className="text-red-500 font-semibold">{job.errorMessage || job.errorCode}</span>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">{job.message || "N/A"}</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      <div>{formatDistanceToNow(new Date(job.createdAt))} ago</div>
                      <div className="text-[10px] text-gray-400 dark:text-gray-500">
                        {format(new Date(job.createdAt), "yyyy-MM-dd HH:mm")}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <CancelJobButton jobId={job.id} status={job.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
  );
}
