"use client";

import { useState, useTransition } from "react";
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
}

export function AccountListClient({ initialAccounts, meta }: AccountListClientProps) {
    const router = useRouter();
    // const [accounts, setAccounts] = useState<TradingAccount[]>(initialAccounts); // We can just use initialAccounts if we use router.refresh()
    // However, for immediate UI feedback we might want state. But router.refresh() with server actions is the "Vercel way".
    // Let's us initialAccounts directly.
    const [isPending, startTransition] = useTransition();
    type ModalState =
        | { type: "NONE" }
        | { type: "ADD" }
        | { type: "SETTINGS"; account: TradingAccount }
        | { type: "REGEN"; accountId: string }
        | { type: "DELETE"; accountId: string };

    const [activeModal, setActiveModal] = useState<ModalState>({ type: "NONE" });

    return (
        <div className="space-y-4">
                {/* Page Header */}
                <PageHeader
                    title="Trading Accounts"
                    description="Manage your connected MT5 trading accounts"
                >
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                        <a
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
                        title="No Trading Accounts"
                        description="Connect your MetaTrader account to automatically sync your trading history and analyze your performance."
                        action={
                            <Button
                                variant="primary"
                                onClick={() => setActiveModal({ type: "ADD" })}
                                className="shadow-lg min-w-[140px]"
                            >
                                Add Account
                            </Button>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                    {initialAccounts.map((account) => (
                        <div key={account.id} className="min-w-0 h-full">
                            <AccountCard
                                account={account}
                                onUpdate={() => {
                                    startTransition(() => {
                                        router.refresh();
                                    });
                                }}
                                onDelete={(id) => setActiveModal({ type: "DELETE", accountId: id })}
                                onSettings={(acc) => setActiveModal({ type: "SETTINGS", account: acc })}
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
