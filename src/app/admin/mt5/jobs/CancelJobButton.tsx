"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Ban, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useRouter } from "next/navigation";

export function CancelJobButton({ jobId, status }: { jobId: string; status: string }) {
  const [isCancelling, setIsCancelling] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      const res = await fetch(`/api/v1/imports/${jobId}/cancel`, {
        method: "POST",
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to cancel job");
      }

      toast.success(`Job ${jobId} cancelled successfully.`);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setIsCancelling(false);
    }
  };

  const cancellableStatuses = [
    "QUEUED",
    "CLAIMED",
    "AUTHENTICATING",
    "FETCHING_ORDERS",
    "FETCHING_DEALS",
    "UPLOADING",
  ];

  if (!cancellableStatuses.includes(status)) {
    return null;
  }

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleCancel}
      disabled={isCancelling}
      className="h-7 px-2 text-xs text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-500/20 dark:hover:bg-red-500/10"
      title="Cancel Job"
    >
      {isCancelling ? <Loader2 className="w-3 h-3 animate-spin" /> : <Ban className="w-3 h-3" />}
    </Button>
  );
}
