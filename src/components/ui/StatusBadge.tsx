
import { AccountStatus } from "@prisma/client";
import { cn } from "@/lib/utils";

interface StatusBadgeProps {
    status: AccountStatus;
    className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
    const styles: Record<AccountStatus, string> = {
        APPROVED: "bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400",
        PENDING: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
        REJECTED: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
        EXPIRED: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
        SUSPENDED: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400",
    };

    const labels: Record<AccountStatus, string> = {
        APPROVED: "Approved",
        PENDING: "Pending",
        REJECTED: "Rejected",
        EXPIRED: "Expired",
        SUSPENDED: "Suspended",
    };

    return (
        <span
            className={cn(
                "px-2 py-1 rounded text-xs font-bold inline-flex items-center justify-center min-w-[70px]",
                styles[status],
                className
            )}
        >
            {labels[status]}
        </span>
    );
}
