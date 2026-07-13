"use client";

import { useState, useTransition } from "react";
import { Cpu, Ban, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { revokeMt5Worker } from "@/actions/admin/mt5";
import { formatDistanceToNow } from "date-fns";

interface WorkersClientProps {
  initialWorkers: any[];
}

export function WorkersClient({ initialWorkers }: WorkersClientProps) {
  const [workers, setWorkers] = useState(initialWorkers);
  const [isPending, startTransition] = useTransition();
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);

  const handleRevoke = (id: string) => {
    setSelectedWorkerId(id);
    setIsConfirmOpen(true);
  };

  const confirmRevoke = () => {
    if (!selectedWorkerId) return;

    startTransition(async () => {
      try {
        await revokeMt5Worker(selectedWorkerId);
        toast.success("Worker status set to REVOKED");
        setWorkers((prev) =>
          prev.map((w) => (w.id === selectedWorkerId ? { ...w, status: "REVOKED" } : w))
        );
      } catch (err: any) {
        toast.error("Failed to revoke worker");
      } finally {
        setIsConfirmOpen(false);
      }
    });
  };

  const refreshWorkers = () => {
    window.location.reload();
  };

  return (
    <>

      <div className="overflow-hidden rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm">
        {workers.length === 0 ? (
          <div className="text-center py-12 text-gray-400 dark:text-gray-500">
            <Cpu className="mx-auto w-12 h-12 mb-3 opacity-30" />
            <p className="text-sm font-bold">No Workers Registered</p>
            <p className="text-xs mt-1">Enroll a new Windows background worker to start importing history.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 dark:bg-white/5 border-b border-dashboard text-xs uppercase text-gray-500 font-black tracking-wider">
                  <th className="px-6 py-4">Worker ID</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Version</th>
                  <th className="px-6 py-4">Current Job</th>
                  <th className="px-6 py-4">Last Activity</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/10 text-sm text-gray-700 dark:text-gray-300">
                {workers.map((worker) => (
                  <tr key={worker.id} className="hover:bg-gray-50/50 dark:hover:bg-white/[0.01]">
                    <td className="px-6 py-4 font-mono font-semibold text-xs">{worker.id}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          worker.status === "ONLINE"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
                            : worker.status === "BUSY"
                            ? "bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-500/10 dark:text-yellow-400 dark:border-yellow-500/20"
                            : worker.status === "REVOKED"
                            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
                            : "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
                        }`}
                      >
                        {worker.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400">{worker.version || "N/A"}</td>
                    <td className="px-6 py-4">
                      {worker.currentJobId ? (
                        <span className="font-mono text-xs font-semibold text-yellow-600 dark:text-yellow-400">
                          {worker.currentJobId}
                        </span>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-600">IDLE</span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-xs text-gray-500 dark:text-gray-400">
                      {worker.lastHeartbeat
                        ? `${formatDistanceToNow(new Date(worker.lastHeartbeat))} ago`
                        : "Never"}
                    </td>
                    <td className="px-6 py-4 text-right">
                      {worker.status !== "REVOKED" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleRevoke(worker.id)}
                          className="h-8 text-red-500 hover:bg-red-50 hover:text-red-600 border-red-100 hover:border-red-200 dark:border-red-500/10 dark:hover:bg-red-500/15"
                        >
                          <Ban size={14} className="mr-1.5" />
                          Revoke
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <ConfirmDialog
        isOpen={isConfirmOpen}
        title="Revoke Worker Authorization"
        description="Are you sure you want to revoke this background worker? It will instantly lose access to API routes and job leases."
        confirmText={isPending ? "Revoking..." : "Revoke"}
        cancelText="Cancel"
        onConfirm={confirmRevoke}
        onCancel={() => setIsConfirmOpen(false)}
        variant="danger"
      />
    </>
  );
}
