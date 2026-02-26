"use client";

import { useState, useTransition } from "react";
import { Plus, RefreshCw, Search, Wallet } from "lucide-react";
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
    const [searchQuery, setSearchQuery] = useState("");
    
    type ModalState = 
        | { type: "NONE" }
        | { type: "ADD" }
        | { type: "SETTINGS"; account: TradingAccount }
        | { type: "REGEN"; accountId: string }
        | { type: "DELETE"; accountId: string };

    const [activeModal, setActiveModal] = useState<ModalState>({ type: "NONE" });

    // Lọc accounts theo search query
    const filteredAccounts = initialAccounts.filter(account => {
        const query = searchQuery.toLowerCase();
        return (account.name?.toLowerCase().includes(query) || account.accountNumber?.toLowerCase().includes(query));
    });

    return (
        <div>
            <div className="space-y-8">
            {/* Page Header */}
            <PageHeader 
                title="Trading Accounts"
                description="Manage your connected MT4/MT5 trading accounts"
            >
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto mt-4 sm:mt-0">
                    <div className="relative group w-full sm:w-64 order-last sm:order-first mt-2 sm:mt-0">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <Search size={16} className="text-gray-400 group-focus-within:text-primary transition-colors" />
                        </div>
                        <input
                            type="text"
                            placeholder="Search by name or number..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white text-sm rounded-xl focus:ring-2 focus:ring-inset focus:ring-primary/50 focus:border-primary block w-full pl-10 p-2.5 transition-all outline-none"
                        />
                    </div>
                    
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
            </div>

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
            ) : filteredAccounts.length === 0 ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4 text-center">
                    <Search size={48} className="text-gray-300 dark:text-gray-700" />
                    <div>
                        <p className="text-gray-900 dark:text-white font-bold text-lg mb-1">No accounts match your search</p>
                        <p className="text-gray-500 text-sm max-w-sm mx-auto">Try typing a different name or account number to find what you are looking for.</p>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-4 sm:gap-6">
                    {filteredAccounts.map((account) => (
                        <div key={account.id} className="min-w-0 h-full">
                            <AccountCard
                                account={account}
                                onUpdate={() => {
                                    startTransition(() => {
                                        router.refresh();
                                    });
                                }}
                                onRegenerateKey={(id) => setActiveModal({ type: "REGEN", accountId: id })}
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
