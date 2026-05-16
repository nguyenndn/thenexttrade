"use client";

import { useState, useTransition } from "react";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { trackEvent } from "@/lib/track";
import { generateMyWeeklyReview, generateMyMonthlyReview } from "@/actions/reports";
import { useRouter } from "next/navigation";
import type { GenerateReportResult } from "./report-generate-types";

interface GenerateReportButtonProps {
  type: "WEEKLY" | "MONTHLY";
  accountId?: string;
  className?: string;
  onResult?: (result: GenerateReportResult) => void;
}

export function GenerateReportButton({ type, accountId, className, onResult }: GenerateReportButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleGenerate = () => {
    trackEvent("weekly_review_generate_clicked", {
      surface: "reports",
      action: "generate",
      type: type.toLowerCase(),
    });

    startTransition(async () => {
      const action = type === "WEEKLY" ? generateMyWeeklyReview : generateMyMonthlyReview;
      const result = await action(accountId);

      // Notify parent
      onResult?.(result as GenerateReportResult);

      if ("error" in result && result.error) {
        // Check for no-data code
        if ("code" in result && result.code === "NO_TRADES_THIS_WEEK") {
          trackEvent("weekly_review_generate_blocked_no_data", {
            surface: "reports",
            action: "blocked_no_data",
            type: type.toLowerCase(),
          });
          toast.error(result.error);
        } else {
          toast.error(result.error);
        }
        return;
      }

      if (result.success) {
        const typedResult = result as GenerateReportResult;
        trackEvent("weekly_review_generate_succeeded", {
          surface: "reports",
          action: typedResult.alreadyExists ? "already_exists" : "created",
          type: type.toLowerCase(),
        });

        // Mission reward toast
        if (typedResult.missionReward?.claimable) {
          toast.success("Weekly review generated!", {
            description: `Mission complete! Claim ${typedResult.missionReward.totalEdge} Edge in Missions.`,
          });
        } else if (typedResult.message) {
          toast.info(typedResult.message);
        } else {
          toast.success("Report generated successfully!");
        }
        router.refresh();
      }
    });
  };

  return (
    <Button
      variant="primary"
      onClick={handleGenerate}
      disabled={isPending}
      className={`shadow-lg shadow-primary/30 ${className || ""}`}
    >
      {isPending ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Sparkles size={16} />
      )}
      {type === "WEEKLY" ? "Generate Weekly Review" : "Generate Monthly Review"}
    </Button>
  );
}
