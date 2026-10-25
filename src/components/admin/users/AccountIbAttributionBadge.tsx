"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, ChevronDown, HelpCircle, Loader2, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import { updateTradingAccountIbAttribution } from "@/app/admin/users/[id]/actions";

type IbAttributionStatus = "CONFIRMED" | "NOT_OURS" | "UNKNOWN";

interface AccountIbAttributionBadgeProps {
    accountId: string;
    initialAttribution?: IbAttributionStatus | string | null;
    userId?: string;
    accountNumber?: string | null;
    compact?: boolean;
}

export function AccountIbAttributionBadge({
    accountId,
    initialAttribution,
    userId,
    accountNumber,
    compact = false,
}: AccountIbAttributionBadgeProps) {
    const router = useRouter();
    const [attribution, setAttribution] = useState<IbAttributionStatus>(
        (initialAttribution as IbAttributionStatus) || "UNKNOWN"
    );
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        setAttribution((initialAttribution as IbAttributionStatus) || "UNKNOWN");
    }, [initialAttribution]);

    const handleSelect = (newStatus: IbAttributionStatus) => {
        if (newStatus === attribution) return;
        const previous = attribution;
        setAttribution(newStatus);

        startTransition(async () => {
            const res = await updateTradingAccountIbAttribution(accountId, newStatus, userId);
            if (res.success) {
                toast.success(
                    newStatus === "CONFIRMED"
                        ? `Approved IB & unlocked EA License for #${accountNumber || accountId}`
                        : `IB attribution set to ${newStatus}`
                );
                router.refresh();
            } else {
                setAttribution(previous);
                toast.error(res.error || "Failed to update attribution");
            }
        });
    };

    const config = {
        CONFIRMED: {
            label: "IB: Confirmed",
            dotColor: "bg-emerald-500 shadow-emerald-500/50",
            textColor: "text-emerald-700 dark:text-emerald-300",
            bgColor: "bg-emerald-500/10 border-emerald-500/30",
            icon: CheckCircle2,
        },
        NOT_OURS: {
            label: "IB: External",
            dotColor: "bg-amber-500 shadow-amber-500/50",
            textColor: "text-amber-700 dark:text-amber-300",
            bgColor: "bg-amber-500/10 border-amber-500/30",
            icon: ShieldAlert,
        },
        UNKNOWN: {
            label: "IB: Unknown",
            dotColor: "bg-gray-400 dark:bg-gray-500",
            textColor: "text-gray-600 dark:text-gray-400",
            bgColor: "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10",
            icon: HelpCircle,
        },
    }[attribution] || {
        label: "IB: Unknown",
        dotColor: "bg-gray-400",
        textColor: "text-gray-600 dark:text-gray-400",
        bgColor: "bg-gray-100 dark:bg-white/5 border-gray-200 dark:border-white/10",
        icon: HelpCircle,
    };

    return (
        <div className="inline-flex items-center gap-1.5 flex-wrap">
            {attribution === "UNKNOWN" && !compact && (
                <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    disabled={isPending}
                    onClick={() => handleSelect("CONFIRMED")}
                    aria-label={`Approve IB attribution for account ${accountNumber || accountId}`}
                    className="h-7 px-2.5 rounded-lg text-[11px] font-bold"
                >
                    {isPending ? (
                        <Loader2 size={12} className="animate-spin" />
                    ) : (
                        <CheckCircle2 size={12} />
                    )}
                    <span>Approve IB</span>
                </Button>
            )}
            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <Button
                        type="button"
                        variant="ghost"
                        disabled={isPending}
                        className={`h-auto inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold tracking-tight transition-all hover:scale-105 active:scale-95 cursor-pointer ${config.bgColor} ${config.textColor}`}
                        title="Click to toggle IB attribution"
                        aria-label={`Toggle IB attribution for account ${accountNumber || accountId}`}
                    >
                        <span className="relative flex h-2 w-2">
                            {attribution === "CONFIRMED" && (
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            )}
                            <span className={`relative inline-flex rounded-full h-2 w-2 ${config.dotColor}`} />
                        </span>
                        <span>{config.label}</span>
                        <ChevronDown size={11} className="opacity-60" />
                    </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="text-[11px] uppercase tracking-wider text-gray-400">
                        Set IB Attribution {accountNumber ? `(#${accountNumber})` : ""}
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                        onClick={() => handleSelect("CONFIRMED")}
                        className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 cursor-pointer"
                    >
                        <span className="h-2 w-2 rounded-full bg-emerald-500" />
                        <span>Confirmed Partner IB</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleSelect("NOT_OURS")}
                        className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 cursor-pointer"
                    >
                        <span className="h-2 w-2 rounded-full bg-amber-500" />
                        <span>External / Not Ours</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem
                        onClick={() => handleSelect("UNKNOWN")}
                        className="flex items-center gap-2 text-xs font-medium text-gray-500 dark:text-gray-400 cursor-pointer"
                    >
                        <span className="h-2 w-2 rounded-full bg-gray-400" />
                        <span>Unknown (Default)</span>
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    );
}
