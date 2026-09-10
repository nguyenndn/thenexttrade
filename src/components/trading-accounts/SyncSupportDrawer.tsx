"use client";

import { useState, useEffect, useTransition } from "react";
import {
    Sheet,
    SheetContent,
    SheetTitle,
    SheetDescription,
    SheetClose,
} from "@/components/ui/Sheet";
import { Button } from "@/components/ui/Button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/Tabs";
import { toast } from "sonner";
import {
    createSupportSyncTicket,
    cancelSupportSyncTicket,
} from "@/actions/support-sync";
import {
    LifeBuoy,
    AlertTriangle,
    ShieldCheck,
    Lock,
    ChevronDown,
    Check,
    Plus,
    X,
    Server,
    Calendar,
    RefreshCw,
} from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";

export interface AccountOption {
    id: string;
    name: string;
    broker?: string | null;
    accountNumber?: string | null;
    server?: string | null;
    hasCredentials?: boolean;
}

interface SyncSupportDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    accounts: AccountOption[];
    tickets: any[];
    onRefreshTickets: () => Promise<void> | void;
    initialAccountId?: string | null;
    defaultTab?: "list" | "create";
}

export function SyncSupportDrawer({
    isOpen,
    onClose,
    accounts,
    tickets,
    onRefreshTickets,
    initialAccountId,
    defaultTab = "list",
}: SyncSupportDrawerProps) {
    const [activeTab, setActiveTab] = useState<"list" | "create">(defaultTab);
    const [selectedAccountId, setSelectedAccountId] = useState<string>("");
    const [broker, setBroker] = useState("");
    const [server, setServer] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [notes, setNotes] = useState("");
    const [isPendingSubmit, startSubmitTransition] = useTransition();
    const [cancellingTicketId, setCancellingTicketId] = useState<string | null>(null);

    // Synchronize initialAccountId and tab when drawer opens
    useEffect(() => {
        if (!isOpen) return;

        if (initialAccountId && accounts.some((a) => a.id === initialAccountId)) {
            setSelectedAccountId(initialAccountId);
            setActiveTab("create");
        } else if (tickets.length === 0) {
            setActiveTab("create");
            if (accounts.length > 0) {
                setSelectedAccountId(accounts[0].id);
            } else {
                setSelectedAccountId("manual");
            }
        } else {
            setActiveTab(defaultTab);
            if (accounts.length > 0) {
                setSelectedAccountId(accounts[0].id);
            } else {
                setSelectedAccountId("manual");
            }
        }
    }, [isOpen, initialAccountId, accounts, tickets.length, defaultTab]);

    const activeAccount = accounts.find((a) => a.id === selectedAccountId);
    const isManual = selectedAccountId === "manual" || !activeAccount;
    const hasCredentials = isManual ? true : Boolean(activeAccount?.hasCredentials);

    const pendingTickets = tickets.filter((t) => t.status === "PENDING");

    const handleCancelTicket = async (ticketId: string) => {
        setCancellingTicketId(ticketId);
        try {
            const res = await cancelSupportSyncTicket(ticketId);
            if (res.success) {
                toast.success("Support request permanently deleted.");
                await onRefreshTickets();
            } else {
                toast.error(res.error || "Failed to delete request.");
            }
        } catch (err: any) {
            toast.error(err?.message || "Failed to delete request.");
        } finally {
            setCancellingTicketId(null);
        }
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const effBroker = isManual ? broker.trim() : activeAccount?.broker?.trim() || "";
        const effAccount = isManual ? accountNumber.trim() : activeAccount?.accountNumber?.trim() || "";
        const effServer = isManual ? server.trim() : activeAccount?.server?.trim() || undefined;

        if (!effBroker || !effAccount) {
            toast.error("Broker and Account Number are required.");
            return;
        }

        startSubmitTransition(async () => {
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
                    setBroker("");
                    setAccountNumber("");
                    setServer("");
                    await onRefreshTickets();
                    setActiveTab("list");
                } else {
                    toast.error(res.error || "Failed to create support request.");
                }
            } catch (err: any) {
                toast.error(err?.message || "An unexpected error occurred.");
            }
        });
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent
                side="right"
                className="w-full sm:max-w-xl p-0 flex flex-col bg-white dark:bg-[#15171E] border-l border-dashboard/80 dark:border-white/[0.08] shadow-2xl z-50"
            >
                {/* 1. Header with icon and action */}
                <div className="sticky top-0 z-10 px-6 py-5 border-b border-dashboard/80 dark:border-white/[0.08] bg-white/90 dark:bg-[#15171E]/90 backdrop-blur-md">
                    <div className="flex items-start justify-between gap-4">
                        <div className="space-y-1">
                            <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                                <LifeBuoy className="h-4 w-4 shrink-0" />
                                <span className="text-[11px] font-bold uppercase tracking-wider">
                                    Operations Assistance
                                </span>
                            </div>
                            <SheetTitle className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
                                Sync Support Center
                            </SheetTitle>
                            <SheetDescription className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                                Track manual sync tickets or request direct assistance from the TNT operations team.
                            </SheetDescription>
                        </div>
                        <SheetClose className="rounded-xl p-2 text-gray-400 hover:text-gray-600 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 transition-colors cursor-pointer">
                            <X size={18} />
                            <span className="sr-only">Close</span>
                        </SheetClose>
                    </div>

                    {/* Navigation Tab Bar (Breek UI Guide Section 14) */}
                    <div className="mt-4">
                        <Tabs
                            value={activeTab}
                            onValueChange={(val) => setActiveTab(val as "list" | "create")}
                            tabsId="sync-support-tabs"
                        >
                            <div className="overflow-x-auto scrollbar-hide flex">
                                <TabsList className="bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl p-1 gap-1 w-full shrink-0">
                                    <TabsTrigger
                                        value="list"
                                        className="flex-1 px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                        activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        <LifeBuoy
                                            size={14}
                                            className={cn(
                                                activeTab === "list"
                                                    ? "text-white"
                                                    : "text-gray-400 dark:text-gray-500"
                                            )}
                                        />
                                        <span>Support Tickets</span>
                                        {tickets.length > 0 && (
                                            <span
                                                className={cn(
                                                    "text-[10px] sm:text-[11px] px-2 py-0.5 rounded-full font-mono font-bold tabular-nums transition-colors",
                                                    activeTab === "list"
                                                        ? "bg-white/20 text-white"
                                                        : pendingTickets.length > 0
                                                            ? "bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20"
                                                            : "bg-gray-200/80 text-gray-600 dark:bg-white/10 dark:text-gray-300"
                                                )}
                                            >
                                                {tickets.length}
                                            </span>
                                        )}
                                    </TabsTrigger>
                                    <TabsTrigger
                                        value="create"
                                        className="flex-1 px-4 py-1.5 rounded-lg text-sm font-bold whitespace-nowrap border border-transparent hover:border-gray-200 dark:hover:border-white/10 flex items-center justify-center gap-2 cursor-pointer transition-colors"
                                        activeIndicatorClassName="!bg-gradient-to-r from-primary to-teal-500 shadow-md border-0"
                                        activeTextClassName="!text-white"
                                    >
                                        <Plus
                                            size={14}
                                            className={cn(
                                                activeTab === "create"
                                                    ? "text-white"
                                                    : "text-gray-400 dark:text-gray-500"
                                            )}
                                        />
                                        <span>New Request</span>
                                    </TabsTrigger>
                                </TabsList>
                            </div>
                        </Tabs>
                    </div>
                </div>

                {/* 2. Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
                    {activeTab === "list" ? (
                        tickets.length === 0 ? (
                            <div className="flex flex-col items-center justify-center text-center py-16 px-4 space-y-3">
                                <div className="p-3.5 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    <LifeBuoy className="h-8 w-8" />
                                </div>
                                <div className="space-y-1">
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                                        No active support requests
                                    </h4>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xs leading-relaxed">
                                        If automatic cloud sync or EA import fails, submit a manual sync request for our operations team to backfill trades.
                                    </p>
                                </div>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setActiveTab("create")}
                                    className="rounded-xl font-bold text-xs gap-1.5 border-amber-500/30 text-amber-700 dark:text-amber-300 hover:bg-amber-500/10"
                                >
                                    <Plus size={13} />
                                    Submit Request
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                <div className="flex items-center justify-between text-xs text-gray-500 px-0.5">
                                    <span>{tickets.length} total requests</span>
                                    <span className="font-semibold text-amber-600 dark:text-amber-400">
                                        {pendingTickets.length} pending review
                                    </span>
                                </div>

                                {tickets.map((ticket) => {
                                    const isPending = ticket.status === "PENDING";
                                    const isVerified = ticket.status === "VERIFIED";
                                    const isFailed = ticket.status === "FAILED";
                                    const isCancelling = cancellingTicketId === ticket.id;

                                    return (
                                        <div
                                            key={ticket.id}
                                            className={cn(
                                                "rounded-2xl border p-4 space-y-3 transition-all",
                                                isPending
                                                    ? "border-amber-500/30 bg-amber-500/[0.03] dark:border-amber-500/20"
                                                    : "border-gray-200/80 bg-gray-50/50 dark:border-white/[0.06] dark:bg-white/[0.02]"
                                            )}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-mono font-bold text-xs text-gray-900 dark:text-white truncate">
                                                        #{ticket.accountNumber}
                                                    </span>
                                                    <span className="text-gray-400 text-xs">•</span>
                                                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-300 truncate">
                                                        {ticket.broker}
                                                    </span>
                                                </div>
                                                <span
                                                    className={cn(
                                                        "px-2 py-0.5 rounded-full text-[10px] font-bold inline-flex items-center gap-1.5 shrink-0",
                                                        isPending && "bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30",
                                                        isVerified && "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30",
                                                        isFailed && "bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30",
                                                        ticket.status === "CANCELLED" && "bg-gray-500/15 text-gray-500 border border-gray-500/20"
                                                    )}
                                                >
                                                    {isPending && (
                                                        <span className="h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse" />
                                                    )}
                                                    {ticket.status}
                                                </span>
                                            </div>

                                            {/* 2x2 Specs Grid */}
                                            <div className="rounded-xl border border-gray-200/60 bg-white/80 dark:border-white/5 dark:bg-[#1E2028]/60 p-2.5 text-xs grid grid-cols-2 gap-2 divide-x divide-gray-100 dark:divide-white/5">
                                                <div className="space-y-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Server size={10} /> Active Server
                                                    </span>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                        {ticket.server || "Default"}
                                                    </p>
                                                </div>
                                                <div className="pl-2.5 space-y-0.5">
                                                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider flex items-center gap-1">
                                                        <Calendar size={10} /> Requested
                                                    </span>
                                                    <p className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                                                        {formatDistanceToNow(new Date(ticket.createdAt), {
                                                            addSuffix: true,
                                                            locale: enUS,
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Notes / Message */}
                                            {ticket.notes && (
                                                <div className="p-2.5 rounded-xl bg-gray-100/70 dark:bg-white/[0.03] text-[11px] text-gray-600 dark:text-gray-300 leading-relaxed italic">
                                                    &ldquo;{ticket.notes}&rdquo;
                                                </div>
                                            )}

                                            {/* Action: Cancel / Delete Request */}
                                            <div className="flex items-center justify-end pt-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    disabled={isCancelling}
                                                    onClick={() => handleCancelTicket(ticket.id)}
                                                    className="h-7 px-3 text-[11px] font-bold text-gray-500 hover:text-rose-600 hover:border-rose-300 rounded-xl"
                                                >
                                                    {isCancelling
                                                        ? "Deleting..."
                                                        : isPending
                                                          ? "Cancel & Delete"
                                                          : "Delete"}
                                                </Button>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )
                    ) : (
                        /* Create New Request Form */
                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Account Selector */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Target Trading Account
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
                                                        <strong className="text-gray-900 dark:text-white">
                                                            {activeAccount.name}
                                                        </strong>{" "}
                                                        <span className="text-gray-500 dark:text-gray-400 font-mono">
                                                            (#{activeAccount.accountNumber || "N/A"} • {activeAccount.broker || "Unknown"})
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
                                        className="w-[--radix-dropdown-menu-trigger-width] max-h-60 overflow-y-auto rounded-xl p-1.5 shadow-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] z-[60]"
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
                                                        <span className="text-[11px] text-gray-500 dark:text-gray-400 truncate font-mono">
                                                            #{acc.accountNumber || "N/A"} • {acc.broker || "Unknown Broker"}
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

                            {/* Account Matrix Summary or Manual Inputs */}
                            {!isManual && activeAccount && (
                                <div className="rounded-xl border border-gray-200/80 bg-gray-50/70 p-3.5 text-xs dark:border-white/10 dark:bg-white/[0.02] space-y-2.5">
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
                                            <p className="font-mono font-bold text-gray-900 dark:text-gray-100 truncate mt-0.5">
                                                #{activeAccount.accountNumber || "N/A"}
                                            </p>
                                            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1 mt-0.5">
                                                <ShieldCheck className="h-3 w-3" />
                                                Verified Credentials
                                            </p>
                                        </div>
                                    </div>

                                    {/* Warning if no investor password */}
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
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 dark:border-white/10 dark:bg-[#1E2028] dark:text-white focus:outline-none focus:border-amber-500"
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
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 dark:border-white/10 dark:bg-[#1E2028] dark:text-white focus:outline-none focus:border-amber-500 font-mono"
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
                                            className="w-full rounded-xl border border-gray-200 px-3 py-2 text-xs font-medium text-gray-900 dark:border-white/10 dark:bg-[#1E2028] dark:text-white focus:outline-none focus:border-amber-500"
                                        />
                                    </div>
                                </div>
                            )}

                            {/* Security Notice */}
                            <div className="rounded-xl border border-gray-200/70 bg-gray-50/50 p-2.5 flex items-center gap-2 text-[11px] text-gray-600 dark:border-white/5 dark:bg-white/[0.02] dark:text-gray-400">
                                <Lock className="h-3.5 w-3.5 shrink-0 text-emerald-500" />
                                <span>
                                    Investor password is read safely from your encrypted Cloud Sync credentials. Never submit master passwords.
                                </span>
                            </div>

                            {/* Notes field */}
                            <div className="space-y-1.5">
                                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                                    Sync Scope & Diagnostic Notes
                                </label>
                                <textarea
                                    rows={3}
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="w-full rounded-xl border border-gray-200 bg-transparent px-3 py-2 text-xs text-gray-900 focus:border-amber-500 focus:outline-none dark:border-white/10 dark:text-white"
                                />
                            </div>

                            <div className="pt-2 flex items-center justify-end gap-2">
                                {tickets.length > 0 && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        onClick={() => setActiveTab("list")}
                                        className="rounded-xl h-9 px-4 text-xs font-semibold"
                                    >
                                        Back to Tickets
                                    </Button>
                                )}
                                <Button
                                    type="submit"
                                    disabled={isPendingSubmit || (!isManual && !hasCredentials)}
                                    className="rounded-xl h-9 px-5 text-xs font-bold gap-1.5 shadow-sm bg-amber-500 hover:bg-amber-600 text-white"
                                >
                                    {isPendingSubmit ? (
                                        <>
                                            <RefreshCw size={13} className="animate-spin" />
                                            Submitting...
                                        </>
                                    ) : (
                                        "Submit Support Request"
                                    )}
                                </Button>
                            </div>
                        </form>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    );
}
