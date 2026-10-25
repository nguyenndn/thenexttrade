"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { backfillLicenseAccounts } from "@/app/admin/trading-systems/accounts/backfill-actions";

interface BackfillLicensesBannerProps {
    /** Approved licenses missing their account row or License Key. */
    repairNeeded: number;
}

export function BackfillLicensesBanner({
    repairNeeded,
}: BackfillLicensesBannerProps) {
    const router = useRouter();
    const [isRunning, setIsRunning] = useState(false);

    if (repairNeeded <= 0) return null;

    const handleBackfill = async () => {
        setIsRunning(true);
        try {
            const result = await backfillLicenseAccounts();
            if (!result.success) {
                toast.error(result.error || "Backfill failed");
                return;
            }

            toast.success(
                `Backfill complete: ${result.created} created, ${result.updated} updated, ${result.skipped} already healthy.`
            );
            router.refresh();
        } catch {
            toast.error("Backfill failed");
        } finally {
            setIsRunning(false);
        }
    };

    return (
        <div className="flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-500/30 dark:bg-amber-500/10 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400" />
                <div>
                    <p className="text-sm font-semibold text-amber-900 dark:text-amber-200">
                        Data repair required
                    </p>
                    <p className="text-sm text-amber-800/80 dark:text-amber-200/80">
                        {repairNeeded} approved license
                        {repairNeeded === 1 ? "" : "s"} missing an account row
                        or License Key. Run the backfill to repair them.
                    </p>
                </div>
            </div>
            <Button
                type="button"
                onClick={handleBackfill}
                disabled={isRunning}
                className="shrink-0"
            >
                {isRunning ? (
                    <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Backfilling...
                    </>
                ) : (
                    "Backfill licenses"
                )}
            </Button>
        </div>
    );
}
