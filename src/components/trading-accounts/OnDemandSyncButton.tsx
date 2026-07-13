"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { subDays } from "date-fns";
import { Button } from "@/components/ui/Button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/Dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface OnDemandSyncButtonProps {
  tradingAccountId: string;
  accountName: string;
  variant?: "default" | "icon" | "premium" | "first-sync";
}

export function OnDemandSyncButton({
  tradingAccountId,
  accountName,
  variant = "default",
}: OnDemandSyncButtonProps) {
  const [open, setOpen] = useState(false);
  const [syncPeriod, setSyncPeriod] = useState(variant === "first-sync" ? "all" : "30");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const router = useRouter();

  const startImport = async () => {
    try {
      setIsSubmitting(true);
      setOpen(false);

      const days = syncPeriod === "all" ? 3650 : parseInt(syncPeriod);
      const toDate = new Date();
      const fromDate = subDays(toDate, days);

      const res = await fetch(`/api/v1/mt5-accounts/${tradingAccountId}/imports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          from: fromDate.toISOString(),
          to: toDate.toISOString(),
          mode: syncPeriod === "all" ? "FULL" : "INCREMENTAL",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to queue import job");
      }

      const jobId = data.job_id;
      const promise = pollImportJob(jobId);

      toast.promise(promise, {
        loading: `Queueing import for ${accountName}...`,
        success: (resData: any) => {
          router.refresh();
          return `Imported ${resData.deals_received} deals for ${accountName}!`;
        },
        error: (err: any) => `Import failed: ${err.message}`,
      });
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const pollImportJob = (jobId: string) => {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const interval = setInterval(async () => {
        try {
          attempts++;
          if (attempts > 300) {
            clearInterval(interval);
            reject(new Error("Import timeout. Please check your MT5 worker."));
            return;
          }

          const res = await fetch(`/api/v1/imports/${jobId}`);
          if (!res.ok) {
            const errData = await res.json();
            clearInterval(interval);
            reject(new Error(errData.error || "Failed to check import status"));
            return;
          }

          const job = await res.json();

          if (job.status === "COMPLETED") {
            clearInterval(interval);
            resolve(job);
          } else if (job.status === "FAILED") {
            clearInterval(interval);
            reject(new Error(job.error_message || "Import failed."));
          } else {
            // Update current toast message
            toast.loading(`Importing ${accountName}: ${job.message} (${job.progress_percent}%)`, {
              id: `import-${jobId}`,
            });
          }
        } catch (error: any) {
          clearInterval(interval);
          reject(error);
        }
      }, 2000);
    });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant === "first-sync" ? "ghost" : "outline"}
          size={variant === "icon" ? "icon" : "sm"}
          className={
            variant === "first-sync"
              ? "flex h-8 items-center gap-1.5 rounded-lg border border-primary/20 bg-primary px-3.5 text-[11px] font-black text-white shadow-sm transition-all hover:bg-primary/90 hover:shadow"
              : variant === "premium"
              ? "flex h-8 min-w-[92px] items-center justify-center gap-1.5 rounded-lg border border-dashboard bg-white px-3.5 text-[11px] font-black text-gray-950 shadow-sm transition-all hover:bg-gray-50 hover:text-gray-950 dark:bg-white/5 dark:text-gray-100 dark:hover:bg-white/10 dark:hover:text-white"
              : variant === "icon" ? "h-8 w-8 text-gray-600" : "gap-2"
          }
        >
          {variant === "first-sync" ? (
            <RefreshCw className={isSubmitting ? "h-[11px] w-[11px] animate-spin" : "h-[11px] w-[11px]"} />
          ) : (
            <RefreshCw className={isSubmitting ? "h-3.5 w-3.5 animate-spin" : "h-3.5 w-3.5 text-primary"} />
          )}
          {variant === "first-sync" && <span>Sync first trades</span>}
          {variant !== "icon" && variant !== "first-sync" && <span>Sync</span>}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>On-Demand Import - {accountName}</DialogTitle>
          <DialogDescription>
            Import historical trades directly from MetaTrader 5 using secure Windows Background Workers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Import Period</label>
            <Select value={syncPeriod} onValueChange={setSyncPeriod}>
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Today</SelectItem>
                <SelectItem value="7">Last Week</SelectItem>
                <SelectItem value="30">Last Month</SelectItem>
                <SelectItem value="90">Last 3 Months</SelectItem>
                <SelectItem value="180">Last 6 Months</SelectItem>
                <SelectItem value="all">Entire History</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Button onClick={startImport} disabled={isSubmitting} className="w-full">
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            Trigger Background Import
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
