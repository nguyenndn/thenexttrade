"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, RefreshCw, Wallet, Download, Monitor, Crown, CheckCircle2, Lock, Clock3, Cable, ArrowRight } from "lucide-react";
import { AccountCard } from "./AccountCard";
import { AddAccountModal } from "./AddAccountModal";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { RegenerateKeyModal } from "./RegenerateKeyModal";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { TradeSyncWizard } from "./TradeSyncWizard";
import { useRouter, useSearchParams } from "next/navigation";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/Dialog";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { setMainAccount } from "@/actions/main-account";
import { useProAccess } from "@/components/pro/ProProvider";
import { toast } from "sonner";

interface TradingAccount {
    id: string;
    name: string;
    platform: string;
    broker: string | null;
    accountNumber: string | null;
    status: string;
    lastHeartbeat: string | null;
    lastSync: string | null;
    totalTrades: number;
    isConnected: boolean;
    color?: string | null;
    autoSync?: boolean;
    server?: string | null;
    balance?: number | null;
    equity?: number | null;
    accountType?: string | null;
    syncSource?: string | null;
    appLastHeartbeat?: string | null;
    eaVersion?: string | null;
    useForLeaderboard?: boolean;
    eligibility?: any;
    eaAccess?: string;
    proStatus?: string;
    proSource?: string | null;
    proExpiresAt?: string | null;
    vipStatus?: string | null;
    createdAt?: string;
    isDefault?: boolean;
    currency?: string;
    maxDailyLoss?: number | null;
    maxDailyTrades?: number | null;
    maxRiskPercent?: number | null;
    cooldownAfterLosses?: number | null;
}

interface Meta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

interface AccountListClientProps {
    initialAccounts: TradingAccount[];
    meta?: Meta;
    userEmail?: string;
    userName?: string;
    userTelegramId?: string;
    userCountry?: string;
    mainAccountId?: string | null;
}

export function AccountListClient({ initialAccounts, meta, userEmail, userName, userTelegramId, userCountry, mainAccountId: initialMainId }: AccountListClientProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [isPending, startTransition] = useTransition();
    const proAccess = useProAccess();
    const [mainAccountId, setMainAccountId] = useState<string | null>(initialMainId ?? null);
    
    type ModalState =
        | { type: "NONE" }
        | { type: "ADD"; initialMode?: "chooser" | "free" | "pro" | "upgrade-pro"; sourceAccount?: TradingAccount }
        | { type: "SETTINGS"; account: TradingAccount }
        | { type: "REGEN"; accountId: string }
        | { type: "DELETE"; accountId: string }
        | { type: "FREE_VS_PRO" }
        | { type: "SYNC_SETUP" };

    const [activeModal, setActiveModal] = useState<ModalState>({ type: "NONE" });

    // Handle incoming query params (e.g. ?action=add&intent=unlock-pro or just ?intent=unlock-pro)
    useEffect(() => {
        const action = searchParams.get("action");
        const intent = searchParams.get("intent");
        const isProIntent = intent === "unlock-pro";
        const isAddAction = action === "add";

        if ((isAddAction || isProIntent) && activeModal.type === "NONE") {
            const sourceAccountId = searchParams.get("sourceAccountId");
            let initialMode: "chooser" | "pro" | "upgrade-pro" = isProIntent ? "pro" : "chooser";
            let sourceAccount: TradingAccount | undefined;
            
            if (sourceAccountId) {
                sourceAccount = initialAccounts.find(a => a.id === sourceAccountId);
                if (sourceAccount) {
                    initialMode = "upgrade-pro";
                }
            } else if (isProIntent && initialAccounts.length > 0) {
                // Always respect user's main account selection if available
                sourceAccount = initialAccounts.find(a => a.id === mainAccountId) || initialAccounts[0];
                if (sourceAccount) {
                    initialMode = "upgrade-pro";
                }
            }

            setActiveModal({ type: "ADD", initialMode, sourceAccount });
            
            // Clear the query params after handling them
            const newParams = new URLSearchParams(searchParams.toString());
            newParams.delete("action");
            newParams.delete("intent");
            newParams.delete("sourceAccountId");
            const newUrl = newParams.toString() ? `?${newParams.toString()}` : window.location.pathname;
            window.history.replaceState({}, '', newUrl);
        }
    }, [searchParams, activeModal.type, mainAccountId, initialAccounts]);

    return (
        <div className="space-y-4">
                {/* Page Header */}
                <PageHeader
                    title="Account Hub"
                    description="Connect Free MT5 accounts to track and sync trades, or open an eligible Partner Pro account to unlock EA access, VIP tools, and premium trading intelligence."
                >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <Button
                            id="onborda-trade-sync-setup"
                            variant="outline"
                            onClick={() => setActiveModal({ type: "SYNC_SETUP" })}
                            className="flex items-center justify-center gap-2 border-cyan-200 dark:border-cyan-500/30 bg-cyan-50 dark:bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-500/20 flex-1 sm:flex-none"
                        >
                            <Cable size={16} />
                            Set up Trade Sync
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => {
                                startTransition(() => {
                                    router.refresh();
                                });
                            }}
                            disabled={isPending}
                            className="flex items-center justify-center gap-2 sm:mr-2 flex-1 sm:flex-none"
                        >
                            <RefreshCw size={16} className={isPending ? "animate-spin text-primary" : ""} />
                            Refresh
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setActiveModal({ type: "FREE_VS_PRO" })}
                            className="flex items-center justify-center gap-2 border-emerald-200 dark:border-emerald-500/30 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 flex-1 sm:flex-none"
                        >
                            <Crown size={16} />
                            Free vs Pro
                        </Button>
                        <Button
                            id="onborda-add-account"
                            variant="primary"
                            onClick={() => setActiveModal({ type: "ADD" })}
                            className="flex items-center justify-center gap-2 shadow-lg shadow-primary/25"
                        >
                            <Plus size={18} />
                            Add Account
                        </Button>
                    </div>
                </PageHeader>

            {/* Account Grid */}
            {isPending && initialAccounts.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : initialAccounts.length === 0 ? (
                <div className="py-20">
                    <EmptyState
                        icon={Wallet}
                        title="No Accounts Yet"
                        description="Connect Free MT5 accounts to track and sync trades, or open an eligible Partner Pro account to unlock EA access, VIP tools, and premium trading intelligence."
                        action={
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                <Button
                                    variant="outline"
                                    onClick={() => setActiveModal({ type: "ADD", initialMode: "free" })}
                                    className="min-w-[140px]"
                                >
                                    Free Account
                                </Button>
                                <Button
                                    variant="primary"
                                    onClick={() => setActiveModal({ type: "ADD", initialMode: "pro" })}
                                    className="shadow-lg min-w-[160px] bg-gradient-to-r from-amber-500 to-amber-600 border-none hover:from-amber-600 hover:to-amber-700"
                                >
                                    Apply for Partner Pro
                                </Button>
                            </div>
                        }
                    />
                </div>
            ) : (
                <div id="onborda-account-grid" className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                    {initialAccounts.map((account) => (
                        <div key={account.id} className="min-w-0 h-full">
                            <AccountCard
                                account={account}
                                isMain={account.id === mainAccountId}
                                onSetMain={async (id) => {
                                    setMainAccountId(id); // optimistic
                                    const result = await setMainAccount(id);
                                    if (result.error) {
                                        setMainAccountId(mainAccountId); // rollback
                                        toast.error(result.error);
                                    } else {
                                        toast.success("Main account updated");
                                        // Update cookie so next nav link uses new main account
                                        document.cookie = `last_account_id=${id};path=/;max-age=31536000;samesite=lax`;
                                        // Immediately refresh sidebar Pro badge
                                        proAccess.refetch();
                                    }
                                }}
                                onUpdate={() => {
                                    startTransition(() => {
                                        router.refresh();
                                    });
                                }}
                                onDelete={(id) => setActiveModal({ type: "DELETE", accountId: id })}
                                onSettings={(acc) => setActiveModal({ type: "SETTINGS", account: acc })}
                                onUnlockPro={(acc) =>
                                    setActiveModal({ type: "ADD", initialMode: "upgrade-pro", sourceAccount: acc })
                                }
                            />
                        </div>
                    ))}
                </div>
            )}

            {/* Pagination */}
            {meta && (
                <div className="mt-8">
                    <PaginationControl
                        currentPage={meta.page}
                        totalPages={meta.totalPages}
                        pageSize={meta.limit}
                        totalItems={meta.total}
                        onPageChange={(p) => router.push(`/dashboard/accounts?page=${p}&limit=${meta.limit}`)}
                        onPageSizeChange={(l) => router.push(`/dashboard/accounts?page=1&limit=${l}`)}
                        itemName="accounts"
                    />
                </div>
            )}

            {/* Settings Modal */}
            {activeModal.type === "SETTINGS" && (
                <AccountSettingsModal
                    isOpen={true}
                    account={activeModal.account}
                    onClose={() => setActiveModal({ type: "NONE" })}
                    onUpdate={() => router.refresh()}
                    onDelete={() => {
                        setActiveModal({ type: "DELETE", accountId: activeModal.account.id });
                    }}
                />
            )}

            {/* Add Modal */}
            <AddAccountModal
                isOpen={activeModal.type === "ADD"}
                onClose={() => setActiveModal({ type: "NONE" })}
                onSuccess={(_account) => {
                    setActiveModal({ type: "NONE" });
                    router.refresh();
                }}
                initialMode={activeModal.type === "ADD" ? activeModal.initialMode : undefined}
                sourceAccount={activeModal.type === "ADD" ? activeModal.sourceAccount : undefined}
                userEmail={userEmail}
                userName={userName}
                userTelegramId={userTelegramId}
                userCountry={userCountry}
            />

            {/* Regenerate Key Modal */}
            <RegenerateKeyModal
                isOpen={activeModal.type === "REGEN"}
                onClose={() => setActiveModal({ type: "NONE" })}
                accountId={activeModal.type === "REGEN" ? activeModal.accountId : null}
            />

            {/* Delete Confirmation Modal */}
            <DeleteAccountModal
                isOpen={activeModal.type === "DELETE"}
                onClose={() => setActiveModal({ type: "NONE" })}
                accountId={activeModal.type === "DELETE" ? activeModal.accountId : null}
                onSuccess={() => router.refresh()}
            />

            {/* Trade Sync Setup Wizard */}
            <TradeSyncWizard
                isOpen={activeModal.type === "SYNC_SETUP"}
                onClose={() => setActiveModal({ type: "NONE" })}
                accounts={initialAccounts}
            />

            {/* Free vs Pro Modal */}
            <Dialog open={activeModal.type === "FREE_VS_PRO"} onOpenChange={(open) => !open && setActiveModal({ type: "NONE" })}>
                <DialogContent className="max-w-4xl p-0 overflow-hidden bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800">
                    <div className="p-6 pb-4 border-b border-gray-100 dark:border-gray-800">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2 text-xl">
                                <Crown className="w-6 h-6 text-amber-500" />
                                Free vs Pro Access
                            </DialogTitle>
                            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                                Free accounts can track and sync trades. Partner Pro unlocks premium downloads, VIP access, and advanced trading intelligence for eligible accounts.
                            </DialogDescription>
                        </DialogHeader>
                    </div>
                    
                    <div className="max-h-[70vh] overflow-auto">
                        <table className="w-full min-w-[640px] text-sm text-left">
                            <thead className="bg-gray-50 dark:bg-gray-800/50 sticky top-0">
                                <tr>
                                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Feature</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Free</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">Pro</th>
                                    <th className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">URL</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {[
                                    { name: "Account tracking", free: "Included", pro: "Included", url: "/dashboard/accounts", label: "/dashboard/accounts" },
                                    { name: "Trade sync", free: "Included", pro: "Included", url: "/dashboard/accounts", label: "/dashboard/accounts" },
                                    { name: "EA Sync download", free: "Included", pro: "Included", url: "/downloads/TheNextTrade_TradeSync.ex5", label: "Download EA Sync" },
                                    { name: "TNT Connect download", free: "Included", pro: "Included", url: "/downloads/TheNextTradeConnect.exe", label: "Download TNT Connect" },
                                    { name: "EA downloads", free: "Locked", pro: "Included", url: "/dashboard/trading-systems", label: "/dashboard/trading-systems" },
                                    { name: "Indicator downloads", free: "Locked", pro: "Included", url: "/dashboard/trading-systems", label: "/dashboard/trading-systems" },
                                    { name: "AI Coach / Risk Assessment", free: "Locked", pro: "Included", url: "/dashboard/intelligence", label: "/dashboard/intelligence" },
                                    { name: "Edge Leak Detector", free: "Locked", pro: "Included", url: "/dashboard/intelligence", label: "/dashboard/intelligence" },
                                    { name: "Rule Violation Tracker", free: "Locked", pro: "Included", url: "/dashboard/intelligence", label: "/dashboard/intelligence" },
                                    { name: "VIP community & priority support", free: "Locked", pro: "Included", url: "/dashboard/trading-systems?tab=VIP", label: "/dashboard/trading-systems?tab=VIP" },
                                    { name: "Partner Pro eligibility review", free: "Eligibility review", pro: "Verified", url: "/dashboard/accounts?action=add&intent=unlock-pro", label: "/dashboard/accounts?action=add&intent=unlock-pro" },
                                ].map((row, i) => (
                                    <tr key={i} className="hover:bg-gray-50/50 dark:hover:bg-gray-800/30">
                                        <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-200">{row.name}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {row.free === "Included" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                {row.free === "Locked" && <Lock className="w-4 h-4 text-gray-400" />}
                                                {row.free === "Eligibility review" && <Clock3 className="w-4 h-4 text-amber-500" />}
                                                <span className={row.free === "Included" ? "text-emerald-700 dark:text-emerald-400" : row.free === "Locked" ? "text-gray-500" : "text-amber-700 dark:text-amber-400"}>
                                                    {row.free}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                {row.pro === "Included" && <CheckCircle2 className="w-4 h-4 text-emerald-500" />}
                                                {row.pro === "Verified" && <Crown className="w-4 h-4 text-emerald-500" />}
                                                <span className="text-emerald-700 dark:text-emerald-400">
                                                    {row.pro}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {row.url.startsWith("/downloads") ? (
                                                <a href={row.url} download className="text-primary hover:underline">{row.label}</a>
                                            ) : (
                                                <Link href={row.url} onClick={() => setActiveModal({ type: "NONE" })} className="text-primary hover:underline">{row.label}</Link>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    
                    <div className="p-4 bg-gray-50 dark:bg-gray-800/50 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800">
                        <p>Partner Pro access depends on supported broker and account eligibility. If an account is not eligible, the request may be rejected after review.</p>
                        <div className="mt-2 flex items-center gap-2 flex-wrap text-sm font-medium text-gray-700 dark:text-gray-300">
                            <span>Supported Brokers:</span>
                            <div className="flex items-center flex-wrap gap-2">
                                <a href="https://www.vantagemarkets.com/forex-trading/forex-trading-account/?affid=111451" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors">Vantage</a>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <a href="https://one.exnesstrack.org/a/1ewjh1ww32" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors">Exness</a>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <a href="https://www.vtmarkets.com/get-trading/forex-trading-account/?affid=830422" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors">VTMarkets</a>
                                <span className="text-gray-300 dark:text-gray-600">•</span>
                                <a href="https://www.ultimamarkets.trade/forex-trading/forex-trading-account/?affid=NzIzNDkwMw==" target="_blank" rel="noopener noreferrer" className="text-amber-500 hover:text-amber-600 dark:text-amber-400 dark:hover:text-amber-300 font-bold transition-colors">Ultima Markets</a>
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}
