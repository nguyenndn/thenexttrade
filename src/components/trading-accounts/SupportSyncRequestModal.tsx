"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";
import { createSupportSyncTicket } from "@/actions/support-sync";
import {
    LifeBuoy,
    AlertTriangle,
    Server,
    ShieldCheck,
    CheckCircle2,
    Lock,
    Clock,
    ChevronDown,
    Check,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export interface AccountOption {
    id: string;
    name: string;
    broker?: string | null;
    accountNumber?: string | null;
    server?: string | null;
    hasCredentials?: boolean;
}

interface SupportSyncRequestModalProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: AccountOption[];
    initialAccountId?: string | null;
    onCreated?: () => void;
}

export function SupportSyncRequestModal({
    isOpen,
    onClose,
    accounts,
    initialAccountId,
    onCreated,
}: SupportSyncRequestModalProps) {
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [broker, setBroker] = useState("");
    const [server, setServer] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [notes, setNotes] = useState("");
    const [isPending, startTransition] = useTransition();

    useEffect(() => {
        if (!isOpen) return;
        if (initialAccountId && accounts.some((a) => a.id === initialAccountId)) {
            setSelectedAccountId(initialAccountId);
        } else if (accounts.length > 0) {
            setSelectedAccountId(accounts[0].id);
        } else {
            setSelectedAccountId("manual");
        }
    }, [isOpen, initialAccountId, accounts]);

    const activeAccount = accounts.find((a) => a.id === selectedAccountId);
    const isManual = selectedAccountId === "manual" || !activeAccount;
    const hasCredentials = isManual ? true : Boolean(activeAccount?.hasCredentials);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const effBroker = isManual ? broker.trim() : activeAccount?.broker?.trim() || "";
        const effAccount = isManual ? accountNumber.trim() : activeAccount?.accountNumber?.trim() || "";
        const effServer = isManual ? server.trim() : activeAccount?.server?.trim() || undefined;

        if (!effBroker || !effAccount) {
            toast.error("Broker and Account Number are required.");
            return;
        }

        startTransition(async () => {
            try {
                const res = await createSupportSyncTicket({
                    broker: effBroker,
                    accountNumber: effAccount,
                    server: effServer || undefined,
                    notes: notes.trim() || undefined,
                    tradingAccountId: isManual ? undefined : activeAccount?.id,
                });

                if (res.success) {
                    toast.success("Support ticket created. Our team will review and sync your account.");
                    setNotes("");
                    onClose();
                    onCreated?.();
                } else {
                    toast.error(res.error || "Failed to create support request.");
                }
            } catch (err: any) {
                toast.error(err?.message || "An unexpected error occurred.");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-lg rounded-2xl p-6">
                <DialogHeader className="space-y-1.5 text-left">
                    <div className="flex items-center gap-2 text-amber-500">
                        <LifeBuoy className="h-5 w-5" />
                        <span className="text-xs font-bold uppercase tracking-wider">
                            Sync Assistance
                        </span>
                    </div>
                    <DialogTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                        Request Manual Sync Support
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                        If automatic cloud sync fails or connection times out, our operations team
                        can connect directly via MT5 to verify and backfill your trading history.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4 mt-2">
                    {/* Account Selector */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Trading Account
                        </label>
                        <DropdownMenu className="w-full">
                            <DropdownMenuTrigger asChild>
                                <button
                                    type="button"
                                    className="w-full flex items-center justify-between rounded-xl border border-gray-200 bg-gray-50/50 px-3.5 py-2.5 text-xs font-medium text-gray-900 transition-all hover:bg-gray-100/70 focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500 dark:border-white/10 dark:bg-[#1E2028] dark:text-white dark:hover:bg-white/10 cursor-pointer"
                                >
                                    <span className="truncate text-left">
                                        {selectedAccountId === "manual" ? (
                                            <span className="font-semibold text-gray-700 dark:text-gray-300">
                                                Custom / Unregistered Account
                                            </span>
                                        ) : activeAccount ? (
                                            <span>
                                                <strong className="text-gray-900 dark:text-white">{activeAccount.name}</strong>{" "}
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    (#{activeAccount.accountNumber || "No Account"} • {activeAccount.broker || "Unknown Broker"})
                                                </span>
                                            </span>
                                        ) : (
                                            <span className="text-gray-400">Select an account...</span>
                                        )}
                                    </span>
                                    <ChevronDown size={14} className="text-gray-400 shrink-0 ml-2" />
                                </button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="start"
                                className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto rounded-xl p-1.5 shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]"
                            >
                                {accounts.map((acc) => {
                                    const isSelected = selectedAccountId === acc.id;
                                    return (
                                        <DropdownMenuItem
                                            key={acc.id}
                                            onClick={() => setSelectedAccountId(acc.id)}
                                            className={cn(
                                                "flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer",
                                                isSelected
                                                    ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 font-semibold"
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <div className="flex flex-col text-left truncate">
                                                <span className="font-bold text-gray-900 dark:text-white truncate">
                                                    {acc.name}
                                                </span>
                                                <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate">
                                                    #{acc.accountNumber || "No Account"} • {acc.broker || "Unknown Broker"}
                                                    {acc.server ? ` (${acc.server})` : ""}
                                                </span>
                                            </div>
                                            {isSelected && (
                                                <Check size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                            )}
                                        </DropdownMenuItem>
                                    );
                                })}
                                <div className="my-1 border-t border-gray-100 dark:border-white/5" />
                                <DropdownMenuItem
                                    onClick={() => setSelectedAccountId("manual")}
                                    className={cn(
                                        "flex items-center justify-between gap-2 px-3 py-2 text-xs rounded-lg transition-colors cursor-pointer",
                                        selectedAccountId === "manual"
                                            ? "bg-amber-500/10 text-amber-900 dark:text-amber-200 font-semibold"
                                            : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5"
                                    )}
                                >
                                    <div className="flex flex-col text-left">
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            Custom / Unregistered Account
                                        </span>
                                        <span className="text-[11px] text-gray-500 dark:text-gray-400">
                                            Manually specify broker, account # and server
                                        </span>
                                    </div>
                                    {selectedAccountId === "manual" && (
                                        <Check size={14} className="text-amber-600 dark:text-amber-400 shrink-0" />
                                    )}
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Account Summary or Manual Inputs */}
                    {!isManual && activeAccount && (
                        <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5 text-xs dark:border-white/10 dark:bg-white/[0.02] space-y-2">
                            <div className="grid grid-cols-2 gap-3 divide-x divide-gray-200/60 dark:divide-white/10">
                                <div>
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                                        Broker & Server
                                    </span>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate mt-0.5">
                                        {activeAccount.broker || "Not specified"}
                                    </p>
                                    <p className="text-[11px] text-gray-500 truncate">
                                        {activeAccount.server || "Default Server"}
                                    </p>
                                </div>
                                <div className="pl-3">
                                    <span className="text-[10px] uppercase font-bold text-gray-400 block">
                                        Account Number
                                    </span>
                                    <p className="font-semibold text-gray-900 dark:text-gray-100 truncate mt-0.5">
                                        #{activeAccount.accountNumber || "N/A"}
                                    </p>
                                    <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                        <ShieldCheck className="h-3 w-3" />
                                        Verified Account
                                    </p>
                                </div>
                            </div>

                            {/* Credential Warning Banner */}
                            {!hasCredentials && (
                                <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-2.5 flex items-start gap-2 text-[11px] text-amber-800 dark:text-amber-300">
                                    <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                                    <span>
                                        This account has no Investor Password on file. Please configure your Investor Password in Cloud Sync settings first so Admin can authenticate.
                                    </span>
                                </div>
                            )}
                        </div>
                    )}

                    {isManual && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                    Broker Name
                                </label>
                                <input
                                    type="text"
                                    value={broker}
                                    onChange={(e) => setBroker(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 dark:border-white/10 dark:bg-[#1E2028] dark:text-white"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                    Account Number
                                </label>
                                <input
                                    type="text"
                                    value={accountNumber}
                                    onChange={(e) => setAccountNumber(e.target.value)}
                                    required
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 dark:border-white/10 dark:bg-[#1E2028] dark:text-white"
                                />
                            </div>
                            <div className="col-span-2 space-y-1">
                                <label className="text-[11px] font-semibold text-gray-600 dark:text-gray-300">
                                    Server Name
                                </label>
                                <input
                                    type="text"
                                    value={server}
                                    onChange={(e) => setServer(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 dark:border-white/10 dark:bg-[#1E2028] dark:text-white"
                                />
                            </div>
                        </div>
                    )}

                    {/* Security Notice: No Password */}
                    <div className="rounded-xl border border-gray-200/70 bg-gray-50/50 p-2.5 flex items-center gap-2 text-[11px] text-gray-600 dark:border-white/5 dark:bg-white/[0.02] dark:text-gray-400">
                        <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                        <span>
                            Investor password is read safely from your encrypted Cloud Sync credentials. Never submit master passwords.
                        </span>
                    </div>

                    {/* Notes field */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                            Sync Scope & Notes
                        </label>
                        <textarea
                            rows={2}
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-xs text-gray-900 focus:border-amber-500 focus:outline-none dark:border-white/10 dark:text-white"
                        />
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0 mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="rounded-xl h-9 px-4 text-xs font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={isPending || (!isManual && !hasCredentials)}
                            className="rounded-xl h-9 px-4 text-xs font-bold gap-1.5 shadow-sm"
                        >
                            {isPending ? "Submitting..." : "Submit Support Request"}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
