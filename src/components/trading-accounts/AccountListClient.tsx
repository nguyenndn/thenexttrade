"use client";

import { useState } from "react";
import { Plus, RefreshCw } from "lucide-react";
import { AccountCard } from "./AccountCard";
import { AddAccountModal } from "./AddAccountModal";
import { AccountSettingsModal } from "./AccountSettingsModal"; // Import Settings Modal
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { useRouter, useSearchParams } from "next/navigation";
import { deleteTradingAccount, regenerateAccountKey } from "@/actions/accounts";
import { PaginationControl } from "@/components/ui/PaginationControl";

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
    const accounts = initialAccounts;
    const [isLoading, setIsLoading] = useState(false); // Only for manual refresh button
    const [showAddModal, setShowAddModal] = useState(false);
    const [showSettingsModal, setShowSettingsModal] = useState<TradingAccount | null>(null);
    const [showRegenModal, setShowRegenModal] = useState<string | null>(null);
    const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null);
    const [newKey, setNewKey] = useState<string | null>(null);
    const [copied, setCopied] = useState(false);

    // Refresh function for manual updates
    // fetchAccounts removed, using router.refresh()

    async function handleRegenerateKey() {
        if (!showRegenModal) return;
        try {
            const result = await regenerateAccountKey(showRegenModal);
            if (result.error) throw new Error(result.error);
            setNewKey(result.apiKey || null);
            toast.success("New API Key generated");
        } catch (e) {
            toast.error("Failed to regenerate key");
        }
    }

    async function handleDelete() {
        if (!showDeleteModal) return;
        try {
            const result = await deleteTradingAccount(showDeleteModal);
            if (result.error) throw new Error(result.error);
            toast.success("Account deleted");
            setShowDeleteModal(null);
            router.refresh(); // Refresh server data
        } catch (e) {
            toast.error("Failed to delete account");
        }
    }

    function copyNewKey() {
        navigator.clipboard.writeText(newKey || "");
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    }

    return (
        <div>
            <div className="space-y-8">
                {/* Page Header */}
                <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-3">
                            <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                            <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                                Trading Accounts
                            </h1>
                        </div>
                        {/* Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-4 sm:mt-0">
                            <button
                                onClick={() => {
                                    setIsLoading(true);
                                    router.refresh();
                                    setTimeout(() => setIsLoading(false), 1000); // Fake spinner for visual feedback, or use transition
                                }}
                                className="flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors sm:mr-2 py-2 sm:py-0"
                            >
                                <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
                                Refresh Status
                            </button>
                            <button
                                onClick={() => setShowAddModal(true)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-xl font-medium hover:bg-[#00B377] transition-colors shadow-lg shadow-primary/20"
                            >
                                <Plus size={18} />
                                Add Account
                            </button>
                        </div>
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                        Manage your connected MT4/MT5 trading accounts
                    </p>
                </div>
            </div>

            {/* Account Grid */}
            {isLoading && accounts.length === 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-64 bg-gray-100 dark:bg-gray-800 rounded-xl animate-pulse"
                        />
                    ))}
                </div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-16 bg-gray-50 dark:bg-[#1E2028] rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-full flex items-center justify-center">
                        <Plus size={32} className="text-primary" />
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                        No Trading Accounts
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 max-w-sm mx-auto">
                        Connect your MetaTrader account to automatically sync your trading history and analyze your performance.
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((account) => (
                        <AccountCard
                            key={account.id}
                            account={account}
                            onUpdate={() => router.refresh()}
                            onRegenerateKey={(id) => setShowRegenModal(id)}
                            onDelete={(id) => setShowDeleteModal(id)}
                            onSettings={(acc) => setShowSettingsModal(acc)}
                        />
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
            {showSettingsModal && (
                <AccountSettingsModal
                    isOpen={!!showSettingsModal}
                    account={showSettingsModal}
                    onClose={() => setShowSettingsModal(null)}
                    onUpdate={() => router.refresh()}
                    onDelete={() => {
                        setShowSettingsModal(null);
                        setShowDeleteModal(showSettingsModal.id);
                    }}
                    onRegenerateKey={() => {
                        setShowSettingsModal(null);
                        setShowRegenModal(showSettingsModal.id);
                    }}
                />
            )}

            {/* Add Modal */}
            <AddAccountModal
                isOpen={showAddModal}
                onClose={() => setShowAddModal(false)}
                onSuccess={(account) => {
                    setShowAddModal(false);
                    router.refresh(); // Refresh list
                }}
            />

            {/* Regenerate Key Modal */}
            <Dialog open={!!showRegenModal} onOpenChange={(open) => !open && !newKey && setShowRegenModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Regenerate API Key</DialogTitle>
                        <DialogDescription>
                            This will invalidate your current API key. You will need to update your EA settings with the new key immediately.
                        </DialogDescription>
                    </DialogHeader>

                    {newKey ? (
                        <div className="space-y-4 py-4">
                            <div className="p-4 bg-gray-50 dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5">
                                <p className="text-xs font-bold text-gray-500 mb-2 uppercase">New API Key</p>
                                <div className="flex gap-2">
                                    <code className="flex-1 font-mono text-sm text-primary break-all">{newKey}</code>
                                    <button onClick={copyNewKey} className="text-sm font-medium text-gray-500 hover:text-gray-700">
                                        {copied ? "Copied" : "Copy"}
                                    </button>
                                </div>
                            </div>
                            <p className="text-sm text-red-500">Please save this key now. It will not be shown again.</p>
                        </div>
                    ) : null}

                    <DialogFooter>
                        {!newKey ? (
                            <>
                                <button
                                    onClick={() => setShowRegenModal(null)}
                                    className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={handleRegenerateKey}
                                    className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                                >
                                    Regenerate
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={() => {
                                    setShowRegenModal(null);
                                    setNewKey(null);
                                }}
                                className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800 font-medium"
                            >
                                Close
                            </button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Modal */}
            <Dialog open={!!showDeleteModal} onOpenChange={() => setShowDeleteModal(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Trading Account?</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete this account? All associated synced trades will be unlinked (or deleted depending on policy). This action cannot be undone.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <button
                            onClick={() => setShowDeleteModal(null)}
                            className="px-4 py-2 text-gray-500 hover:text-gray-700 font-medium"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleDelete}
                            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 font-medium"
                        >
                            Delete
                        </button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
