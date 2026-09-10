"use client";

import { useState } from "react";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import {
    LifeBuoy,
    Check,
    X,
    Eye,
    EyeOff,
    Copy,
    KeyRound,
    ExternalLink,
    AlertTriangle,
    ShieldCheck,
    Send,
    Clock,
    Terminal,
} from "lucide-react";
import {
    resolveSupportTicketAdmin,
    markTicketFailedAdmin,
    UnifiedSyncItem,
} from "@/actions/admin-sync-requests";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, format } from "date-fns";
import Link from "next/link";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/Avatar";

interface AdminTicketDetailDrawerProps {
    item: UnifiedSyncItem | null;
    isOpen: boolean;
    onClose: () => void;
    onUpdated: () => void;
}

export function AdminTicketDetailDrawer({
    item,
    isOpen,
    onClose,
    onUpdated,
}: AdminTicketDetailDrawerProps) {
    const [isPassviewMasked, setIsPassviewMasked] = useState(false);
    const [isResolving, setIsResolving] = useState(false);
    const [isFailDialogOpen, setIsFailDialogOpen] = useState(false);
    const [failReason, setFailReason] = useState("");
    const [isFailing, setIsFailing] = useState(false);

    if (!item) return null;

    const ticketNumber = item.supportTicket?.ticketNumber || item.id.slice(-8).toUpperCase();
    const isPending = item.status === "PENDING";
    const isVerified = item.status === "VERIFIED";
    const isFailed = item.status === "FAILED";

    const passview = item.supportTicket?.investorPassword || "";

    const handleCopy = (text: string, label: string) => {
        if (!text) return;
        navigator.clipboard.writeText(text);
        toast.success(`Copied ${label} to clipboard.`);
    };

    const handleCopyAll = () => {
        const text = `Account: ${item.account.accountNumber}\nBroker: ${item.account.broker}\nServer: ${item.account.server || "N/A"}\nInvestor Password: ${passview || "N/A"}`;
        navigator.clipboard.writeText(text);
        toast.success("Copied all MT5 credentials to clipboard.");
    };

    const handleResolve = async () => {
        setIsResolving(true);
        try {
            const res = await resolveSupportTicketAdmin(item.id);
            if (res.success) {
                toast.success(`Ticket #${ticketNumber} marked as synced.`);
                onUpdated();
                onClose();
            } else {
                toast.error(res.error || "Failed to resolve support ticket.");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to resolve support ticket.");
        } finally {
            setIsResolving(false);
        }
    };

    const handleFailSubmit = async () => {
        setIsFailing(true);
        try {
            const res = await markTicketFailedAdmin(item.id, failReason);
            if (res.success) {
                toast.success(`Ticket #${ticketNumber} marked as failed.`);
                setIsFailDialogOpen(false);
                setFailReason("");
                onUpdated();
                onClose();
            } else {
                toast.error(res.error || "Failed to mark ticket failed.");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to mark ticket failed.");
        } finally {
            setIsFailing(false);
        }
    };

    return (
        <>
            <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
                <SheetContent
                    side="right"
                    className="w-full sm:max-w-xl p-0 flex flex-col bg-white dark:bg-[#15171E] border-l border-gray-200 dark:border-white/10 shadow-2xl"
                >
                    {/* Header */}
                    <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-start justify-between gap-4">
                        <div className="space-y-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <LifeBuoy size={18} />
                                </div>
                                <SheetTitle className="text-base font-bold text-gray-900 dark:text-white">
                                    Support Ticket #{ticketNumber}
                                </SheetTitle>
                                <span
                                    className={cn(
                                        "text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full",
                                        isPending &&
                                            "bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-500/30",
                                        isVerified &&
                                            "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30",
                                        isFailed &&
                                            "bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-500/30"
                                    )}
                                >
                                    {item.status}
                                </span>
                            </div>
                            <SheetDescription className="text-xs text-gray-500 dark:text-gray-400">
                                Manual MT5 sync assistance request from trader
                            </SheetDescription>
                        </div>
                        <SheetClose asChild>
                            <Button
                                variant="outline"
                                size="icon"
                                className="h-8 w-8 min-w-8 aspect-square rounded-xl"
                                aria-label="Close drawer"
                            >
                                <X size={16} />
                            </Button>
                        </SheetClose>
                    </div>

                    {/* Scrollable Body */}
                    <div className="flex-1 overflow-y-auto p-6 space-y-5">
                        {/* Trader Profile Row */}
                        <div className="p-4 rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                <Link
                                    href={`/admin/users/${item.user.id}`}
                                    className="shrink-0 group"
                                    title="View Trader Profile"
                                >
                                    <Avatar className="h-10 w-10 rounded-xl border border-gray-100 dark:border-white/10 group-hover:ring-2 group-hover:ring-primary/40 transition-all">
                                        <AvatarImage
                                            src={item.user.image || undefined}
                                            alt={item.user.name || "Trader"}
                                        />
                                        <AvatarFallback className="rounded-xl bg-primary/10 text-primary font-bold text-sm">
                                            {(item.user.name || item.user.email || "U").charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                </Link>
                                <div className="min-w-0">
                                    <Link
                                        href={`/admin/users/${item.user.id}`}
                                        className="text-sm font-bold text-gray-900 dark:text-white truncate block hover:text-primary hover:underline transition-colors"
                                    >
                                        {item.user.name || "Trader"}
                                    </Link>
                                    <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                        {item.user.email}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {item.user.telegramId && (
                                    <a
                                        href={`https://t.me/${item.user.telegramId.replace("@", "")}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-600 dark:text-sky-400 hover:bg-sky-500/20 transition-colors"
                                    >
                                        <Send size={12} />
                                        <span>@{item.user.telegramId.replace("@", "")}</span>
                                    </a>
                                )}
                                <Link
                                    href={`/admin/users/${item.user.id}`}
                                    className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                    title="View User Profile"
                                >
                                    <ExternalLink size={15} />
                                </Link>
                            </div>
                        </div>

                        {/* 2x2 Matrix Card Specs (UI Guide Invariant) */}
                        <div>
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider block mb-2">
                                Account Specifications
                            </span>
                            <div className="grid grid-cols-2 divide-x divide-y divide-gray-100 dark:divide-white/5 border border-gray-100 dark:border-white/5 rounded-xl bg-gray-50/50 dark:bg-white/[0.02] overflow-hidden">
                                <div className="p-3">
                                    <span className="text-[11px] font-bold text-gray-400 block">
                                        Account Number
                                    </span>
                                    <span className="text-xs font-bold font-mono text-gray-900 dark:text-white truncate block mt-0.5">
                                        #{item.account.accountNumber}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <span className="text-[11px] font-bold text-gray-400 block">
                                        Broker
                                    </span>
                                    <span className="text-xs font-bold text-gray-900 dark:text-white truncate block mt-0.5">
                                        {item.account.broker}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <span className="text-[11px] font-bold text-gray-400 block">
                                        Server
                                    </span>
                                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300 truncate block mt-0.5">
                                        {item.account.server || "Default"}
                                    </span>
                                </div>
                                <div className="p-3">
                                    <span className="text-[11px] font-bold text-gray-400 block">
                                        Balance
                                    </span>
                                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 truncate block mt-0.5">
                                        {item.account.balance !== null && item.account.balance !== undefined
                                            ? `${item.account.currency || "USD"} ${item.account.balance.toLocaleString()}`
                                            : "N/A"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Trader Notes / Problem Description */}
                        {item.supportTicket?.notes && (
                            <div className="p-4 rounded-xl border border-amber-500/20 bg-amber-500/5 space-y-1">
                                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                    <AlertTriangle size={14} />
                                    <span>Trader Notes / Error Details:</span>
                                </div>
                                <p className="text-xs text-gray-700 dark:text-gray-300 italic font-mono whitespace-pre-wrap pl-5 border-l-2 border-amber-500/30">
                                    "{item.supportTicket.notes}"
                                </p>
                            </div>
                        )}

                        {/* Investor Credentials Inspector Box */}
                        <div className="rounded-xl border border-emerald-500/25 bg-emerald-50/50 dark:bg-emerald-950/15 p-4 space-y-3">
                            <div className="flex items-center justify-between gap-2">
                                <div className="flex items-center gap-2">
                                    <KeyRound size={16} className="text-emerald-600 dark:text-emerald-400" />
                                    <span className="text-xs font-bold text-emerald-900 dark:text-emerald-200">
                                        Investor Credentials (MT5 Passview)
                                    </span>
                                </div>
                                {passview && (
                                    <div className="flex items-center gap-1">
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => handleCopy(passview, "Passview")}
                                            className="h-7 px-2 text-[11px] font-bold rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                        >
                                            <Copy size={12} className="mr-1" />
                                            Copy Passview
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={handleCopyAll}
                                            className="h-7 px-2 text-[11px] font-bold rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                        >
                                            <Terminal size={12} className="mr-1" />
                                            Copy All
                                        </Button>
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => setIsPassviewMasked(!isPassviewMasked)}
                                            className="h-7 px-2 text-[11px] font-bold rounded-lg border-emerald-500/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-500/20"
                                            aria-label={isPassviewMasked ? "Show password" : "Hide password"}
                                        >
                                            {isPassviewMasked ? (
                                                <Eye size={12} className="mr-1" />
                                            ) : (
                                                <EyeOff size={12} className="mr-1" />
                                            )}
                                            {isPassviewMasked ? "Show" : "Hide"}
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {passview ? (
                                <div className="grid grid-cols-2 gap-2 text-xs bg-white dark:bg-[#1E2028] p-3 rounded-lg border border-emerald-500/20 font-mono">
                                    <div>
                                        <span className="text-[10px] text-gray-400 block font-sans">
                                            Login (MT5 #)
                                        </span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 select-all">
                                            {item.account.accountNumber}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-[10px] text-gray-400 block font-sans">
                                            Server
                                        </span>
                                        <span className="font-bold text-gray-800 dark:text-gray-200 select-all">
                                            {item.account.server || "Default"}
                                        </span>
                                    </div>
                                    <div className="col-span-2 pt-2 border-t border-gray-100 dark:border-white/5">
                                        <span className="text-[10px] text-gray-400 block font-sans">
                                            Investor Password
                                        </span>
                                        <span className="font-bold text-emerald-600 dark:text-emerald-400 text-sm select-all">
                                            {isPassviewMasked ? "••••••••••••" : passview}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="text-xs text-amber-700 dark:text-amber-400 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center gap-2">
                                    <AlertTriangle size={14} className="shrink-0" />
                                    <span>
                                        No investor password stored in vault. Please check trader notes or contact trader directly.
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Telemetry Timestamps */}
                        <div className="text-xs text-gray-400 space-y-1 pt-2 border-t border-gray-100 dark:border-white/5">
                            <div className="flex items-center gap-1.5">
                                <Clock size={13} />
                                <span>Requested:</span>
                                <span className="font-medium text-gray-600 dark:text-gray-300">
                                    {formatDistanceToNow(new Date(item.createdAt), {
                                        addSuffix: true,
                                    })}
                                </span>
                                <span className="text-gray-400">
                                    ({format(new Date(item.createdAt), "MMM d, yyyy HH:mm")})
                                </span>
                            </div>
                            {item.supportTicket?.verifiedAt && (
                                <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400">
                                    <ShieldCheck size={13} />
                                    <span>Resolved:</span>
                                    <span className="font-medium">
                                        {format(
                                            new Date(item.supportTicket.verifiedAt),
                                            "MMM d, yyyy HH:mm"
                                        )}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer Action Buttons */}
                    <div className="p-4 sm:p-6 border-t border-gray-100 dark:border-white/5 bg-gray-50/50 dark:bg-white/[0.02] flex items-center justify-between gap-3">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl text-xs font-bold"
                        >
                            Close
                        </Button>

                        {isPending ? (
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setFailReason("");
                                        setIsFailDialogOpen(true);
                                    }}
                                    className="rounded-xl text-xs font-bold text-rose-600 dark:text-rose-400 border-rose-500/30 hover:bg-rose-50 dark:hover:bg-rose-500/10"
                                >
                                    <X size={14} className="mr-1" />
                                    Mark Failed
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={handleResolve}
                                    isLoading={isResolving}
                                    className="rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs"
                                >
                                    <Check size={14} className="mr-1" />
                                    Mark Synced
                                </Button>
                            </div>
                        ) : (
                            <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                                <span>Status:</span>
                                <span className="font-bold text-gray-800 dark:text-white uppercase">
                                    {item.status}
                                </span>
                            </div>
                        )}
                    </div>
                </SheetContent>
            </Sheet>

            {/* Mark Failed Confirmation Dialog */}
            <Dialog open={isFailDialogOpen} onOpenChange={setIsFailDialogOpen}>
                <DialogContent className="sm:max-w-md rounded-2xl">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
                            <AlertTriangle size={18} />
                            <span>Mark Ticket as Failed</span>
                        </DialogTitle>
                        <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">
                            Specify the reason why manual sync for account #{item.account.accountNumber} could not be completed.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-2 py-2">
                        <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                            Failure Reason:
                        </label>
                        <textarea
                            value={failReason}
                            onChange={(e) => setFailReason(e.target.value)}
                            rows={3}
                            className="w-full text-xs p-3 rounded-xl border border-gray-200 dark:border-white/10 bg-gray-50 dark:bg-white/5 text-gray-800 dark:text-white focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            onClick={() => setIsFailDialogOpen(false)}
                            className="rounded-xl text-xs font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleFailSubmit}
                            isLoading={isFailing}
                            className="rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700"
                        >
                            Confirm Failed
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </>
    );
}
