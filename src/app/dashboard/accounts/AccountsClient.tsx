"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wallet, Plus, Server, CheckCircle2, RotateCw, Edit2, Trash2, MoreHorizontal, CandlestickChart } from "lucide-react";
import { AccountModal } from "@/components/dashboard/accounts/AccountModal";
import { SyncModal } from "@/components/dashboard/accounts/SyncModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { useRouter, useSearchParams } from "next/navigation";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { PaginationControl } from "@/components/ui/PaginationControl";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export default function AccountsClient() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");

    const [accounts, setAccounts] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSyncModalOpen, setIsSyncModalOpen] = useState(false);
    const [selectedAccount, setSelectedAccount] = useState<any | null>(null);
    const [meta, setMeta] = useState({ total: 0, totalPages: 1 });

    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchAccounts = async () => {
        try {
            const res = await fetch(`/api/trading-accounts?page=${page}&limit=${limit}`);
            const data = await res.json();
            if (data.accounts) {
                setAccounts(data.accounts);
                setMeta({
                    total: data.meta?.total || 0,
                    totalPages: data.meta?.totalPages || 1
                });
            }
        } catch (error) {
            console.error("Failed to fetch accounts", error);
            toast.error("Failed to load accounts");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        setIsLoading(true);
        fetchAccounts();
    }, [page, limit]);

    const handleEdit = (account: any) => {
        setSelectedAccount(account);
        setIsModalOpen(true);
    };

    const handleSync = (account: any) => {
        setSelectedAccount(account);
        setIsSyncModalOpen(true);
    };

    const confirmDelete = (id: string) => {
        setAccountToDelete(id);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!accountToDelete) return;
        setIsDeleting(true);

        try {
            const res = await fetch(`/api/trading-accounts/${accountToDelete}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Account deleted");
            fetchAccounts();
        } catch (error) {
            toast.error("Failed to delete account");
        } finally {
            setIsDeleting(false);
            setIsConfirmOpen(false);
            setAccountToDelete(null);
        }
    };

    const openNewAccountModal = () => {
        setSelectedAccount(null);
        setIsModalOpen(true);
    };

    return (

        <>
            {/* Header */}
            <PageHeader 
                title="Trading Accounts"
                description="Manage your connected manual trading accounts."
            >
                <Button
                    onClick={openNewAccountModal}
                    className="flex items-center gap-2 text-white font-bold rounded-xl shadow-lg shadow-primary/25 active:scale-95 border-none"
                    style={{ backgroundColor: 'hsl(var(--primary))' }}
                >
                    <Plus size={18} />
                    Add Account
                </Button>
            </PageHeader>

            {/* Account Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
                {isLoading ? (
                    // Skeleton
                    [1, 2, 3].map((i) => (
                        <div key={i} className="h-[220px] rounded-xl bg-gray-100 dark:bg-[#1E2028] animate-pulse border border-gray-200 dark:border-white/10" />
                    ))
                ) : accounts.length === 0 ? (
                    <div className="col-span-full py-20">
                        <EmptyState 
                            icon={Wallet}
                            title="No Accounts Found"
                            description="Add a trading account to start tracking your portfolio performance."
                            action={
                                <Button
                                    onClick={openNewAccountModal}
                                    className="px-6 py-2.5 bg-gray-900 hover:bg-black dark:bg-white dark:hover:bg-gray-100 text-white dark:text-gray-900 font-bold rounded-xl transition-colors shadow-lg border-none"
                                >
                                    Add Account
                                </Button>
                            }
                        />
                    </div>
                ) : (
                    accounts.map((account) => (
                        <div key={account.id} className="group relative bg-white dark:bg-[#151925] rounded-xl border border-gray-200 dark:border-white/10 p-6 shadow-sm hover:shadow-md transition-shadow overflow-hidden flex flex-col min-h-[220px]">
                            {/* Ambient Glow */}
                            <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/10 rounded-full blur-[60px] pointer-events-none group-hover:bg-primary/20 transition-all duration-700"></div>

                            {/* Broker Badge & Options */}
                            <div className="flex justify-between items-start mb-auto relative z-10">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gray-50/50 dark:bg-black/20 flex items-center justify-center font-black text-gray-500 border border-gray-200 dark:border-white/10 shadow-inner">
                                        {account.platform?.includes("MetaTrader") ? "MT" : "CT"}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{account.name}</h3>
                                        <p className="text-xs text-gray-500 font-medium flex items-center gap-1.5 mt-0.5">
                                            <Server size={10} className="text-gray-400" />
                                            {account.broker || "Unknown Broker"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {account.isDefault && (
                                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20">
                                            Default
                                        </span>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors p-0 m-0">
                                                <MoreHorizontal size={16} />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-40 rounded-xl border-gray-200 dark:border-white/10">
                                            <DropdownMenuItem onClick={() => handleEdit(account)} className="font-medium cursor-pointer rounded-lg mx-1 my-1">
                                                <Edit2 size={14} className="mr-2 text-gray-400" /> Edit Details
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => confirmDelete(account.id)} className="text-red-500 focus:text-red-500 focus:bg-red-50 dark:focus:bg-red-500/10 font-medium cursor-pointer rounded-lg mx-1 my-1">
                                                <Trash2 size={14} className="mr-2" /> Delete Account
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Stats / Balance (Middle) */}
                            <div className="py-6 relative z-10 w-full">
                                <p className="text-[10px] font-black text-gray-400 tracking-widest uppercase mb-2 flex items-center gap-2">
                                    <Wallet size={12} className="text-gray-300 dark:text-gray-600" />
                                    Available Balance
                                </p>
                                <div className="flex items-baseline gap-1">
                                    <p className="text-3xl lg:text-3xl font-black text-gray-900 dark:text-white font-mono tracking-tight drop-shadow-sm truncate w-full">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.balance)}
                                    </p>
                                </div>
                            </div>

                            {/* Actions / Status (Bottom) */}
                            <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-white/10 relative z-10 mt-auto">
                                <div className="flex items-center gap-2">
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-green-500/10 border border-green-500/20 text-green-500">
                                        <CheckCircle2 size={12} fill="currentColor" className="text-white dark:text-green-900" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Active</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400">
                                        <CandlestickChart size={12} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">{account.platform?.split(' ')[0] || "Trader"}</span>
                                    </div>
                                </div>

                                <Button
                                    variant="outline"
                                    onClick={() => handleSync(account)}
                                    className="flex items-center gap-1.5 h-auto px-3 py-1.5 bg-blue-500/10 border-transparent text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-colors font-bold text-xs group/sync"
                                >
                                    <RotateCw size={12} className="group-hover/sync:rotate-180 transition-transform duration-500" />
                                    Sync
                                </Button>
                            </div>
                        </div>
                    ))
                )}

                {/* Add Button as last card if there are accounts */}
                {accounts.length > 0 && (
                    <div
                        role="button"
                        tabIndex={0}
                        onClick={openNewAccountModal}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                openNewAccountModal();
                            }
                        }}
                        className="group flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-primary/50 dark:hover:border-primary/50 transition-all text-gray-400 hover:text-primary bg-transparent hover:bg-primary/5 min-h-[220px] cursor-pointer outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                        <div className="w-14 h-14 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-primary/10 transition-transform duration-300">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-sm tracking-wide">Add New Account</span>
                    </div>
                )}
            </div>

            <div className="mt-8">
                <PaginationControl
                    currentPage={page}
                    totalPages={meta.totalPages}
                    pageSize={limit}
                    totalItems={meta.total}
                    onPageChange={(p) => router.push(`/dashboard/accounts?page=${p}&limit=${limit}`)}
                    onPageSizeChange={(l) => router.push(`/dashboard/accounts?page=1&limit=${l}`)}
                    itemName="accounts"
                />
            </div>

            {isModalOpen && (
                <AccountModal
                    account={selectedAccount}
                    onClose={() => setIsModalOpen(false)}
                    onSave={() => {
                        setIsModalOpen(false);
                        fetchAccounts();
                    }}
                />
            )}

            {isSyncModalOpen && selectedAccount && (
                <SyncModal
                    account={selectedAccount}
                    onClose={() => setIsSyncModalOpen(false)}
                />
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete Account"
                description="Are you sure you want to delete this account? Associated trades will be permanently unlinked."
                confirmText="Delete Account"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => { setIsConfirmOpen(false); setAccountToDelete(null); }}
                variant="danger"
            />
        </>
    );
}
