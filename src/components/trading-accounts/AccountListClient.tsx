"use client";

import { useState, useTransition, useEffect } from "react";
import { Plus, RefreshCw, Wallet, Download, Monitor } from "lucide-react";
import { AccountCard } from "./AccountCard";
import { AddAccountModal } from "./AddAccountModal";
import { AccountSettingsModal } from "./AccountSettingsModal";
import { RegenerateKeyModal } from "./RegenerateKeyModal";
import { DeleteAccountModal } from "./DeleteAccountModal";
import { useRouter, useSearchParams } from "next/navigation";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { setMainAccount } from "@/actions/main-account";
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
    const [mainAccountId, setMainAccountId] = useState<string | null>(initialMainId ?? null);
    
    type ModalState =
        | { type: "NONE" }
        | { type: "ADD"; initialMode?: "chooser" | "free" | "pro" | "upgrade-pro"; sourceAccount?: TradingAccount }
        | { type: "SETTINGS"; account: TradingAccount }
        | { type: "REGEN"; accountId: string }
        | { type: "DELETE"; accountId: string };

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
    }, [searchParams, activeModal.type]);

    return (
        <div className="space-y-4">
                {/* Page Header */}
                <PageHeader
                    title="Account Hub"
                    description="Connect Free MT5 accounts or open a Partner Pro account to unlock EA access, VIP tools & auto-sync."
                >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <a
                            id="onborda-ea-download"
                            href="/downloads/TheNextTrade_TradeSync.ex5"
                            download
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 hover:bg-amber-100 dark:hover:bg-amber-500/20 transition-colors flex-1 sm:flex-none"
                        >
                            <Download size={16} />
                            EA Sync
                        </a>
                        <a
                            href="/downloads/TheNextTradeConnect.exe"
                            download
                            className="flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border border-indigo-200 dark:border-indigo-500/30 bg-indigo-50 dark:bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 hover:bg-indigo-100 dark:hover:bg-indigo-500/20 transition-colors flex-1 sm:flex-none"
                        >
                            <Monitor size={16} />
                            TNT Connect
                        </a>
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
                        description="Connect a Free MT5 account to track performance, or open a Partner Pro account to unlock EA access, VIP tools, and automated sync."
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
                                    Unlock Partner Pro
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
                    onRegenerateKey={() => {
                        setActiveModal({ type: "REGEN", accountId: activeModal.account.id });
                    }}
                />
            )}

            {/* Add Modal */}
            <AddAccountModal
                isOpen={activeModal.type === "ADD"}
                onClose={() => setActiveModal({ type: "NONE" })}
                onSuccess={(account) => {
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

        </div>
    );
}
