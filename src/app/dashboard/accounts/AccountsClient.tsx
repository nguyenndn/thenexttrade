"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Wallet, Plus, Server, CheckCircle2, RotateCw, Edit2, Trash2, MoreHorizontal, Settings } from "lucide-react";
import { AccountModal } from "@/components/dashboard/accounts/AccountModal";
import { SyncModal } from "@/components/dashboard/accounts/SyncModal";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";

import { useRouter, useSearchParams } from "next/navigation";
import { PaginationControl } from "@/components/ui/PaginationControl";

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

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this account? Associated trades will be unlinked.")) return;

        try {
            const res = await fetch(`/api/trading-accounts/${id}`, {
                method: "DELETE",
            });

            if (!res.ok) throw new Error("Failed to delete");

            toast.success("Account deleted");
            fetchAccounts();
        } catch (error) {
            toast.error("Failed to delete account");
        }
    };

    const openNewAccountModal = () => {
        setSelectedAccount(null);
        setIsModalOpen(true);
    };

    return (

        <>
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Trading Accounts
                        </h1>
                    </div>
                    <button
                        onClick={openNewAccountModal}
                        className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-[#00B078] text-white font-bold rounded-xl transition-all shadow-lg shadow-primary/25 active:scale-95"
                    >
                        <Plus size={18} />
                        Add Account
                    </button>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Manage your connected manual trading accounts.
                </p>
            </div>

            {/* Account Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    // Skeleton
                    [1, 2].map((i) => (
                        <div key={i} className="h-64 rounded-xl bg-gray-100 dark:bg-white/5 animate-pulse" />
                    ))
                ) : accounts.length === 0 ? (
                    <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
                        <div className="w-16 h-16 bg-gray-100 dark:bg-white/5 rounded-full flex items-center justify-center mb-4">
                            <Wallet className="text-gray-400" size={32} />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">No Accounts Found</h3>
                        <p className="text-gray-500 max-w-sm mx-auto">
                            Add a trading account to start tracking your portfolio performance.
                        </p>
                    </div>
                ) : (
                    accounts.map((account) => (
                        <div key={account.id} className="relative group bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-100 dark:border-white/5 p-6 shadow-sm hover:shadow-md transition-all">
                            {/* Broker Badge */}
                            <div className="flex justify-between items-start mb-6">
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 flex items-center justify-center font-bold text-gray-400">
                                        {/* Simple icon based on platform */}
                                        {account.platform?.includes("MetaTrader") ? "MT" : "CT"}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">{account.name}</h3>
                                        <p className="text-xs text-gray-500 flex items-center gap-1">
                                            <Server size={12} />
                                            {account.broker || "Unknown Broker"}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {account.isDefault && (
                                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                                            DEFAULT
                                        </span>
                                    )}
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <button className="p-1 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg text-gray-400 transition-colors">
                                                <MoreHorizontal size={18} />
                                            </button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => handleEdit(account)}>
                                                <Edit2 size={14} className="mr-2" /> Edit
                                            </DropdownMenuItem>
                                            <DropdownMenuItem onClick={() => handleDelete(account.id)} className="text-red-500 focus:text-red-600">
                                                <Trash2 size={14} className="mr-2" /> Delete
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="grid grid-cols-2 gap-4 mb-6">
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Balance</p>
                                    <p className="text-xl font-black text-gray-900 dark:text-white">
                                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: account.currency }).format(account.balance)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 uppercase tracking-wider mb-1">Platform</p>
                                    <p className="text-xl font-bold text-gray-700 dark:text-gray-300 truncate text-sm pt-1">{account.platform}</p>
                                </div>
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 pt-4 border-t border-gray-100 dark:border-white/5">
                                <div className="flex items-center gap-1.5 text-xs font-medium text-green-500 bg-green-50 dark:bg-green-500/10 px-2 py-1 rounded-md">
                                    <CheckCircle2 size={12} />
                                    Active
                                </div>

                                <button
                                    onClick={() => handleSync(account)}
                                    className="ml-auto text-xs flex items-center gap-1 px-3 py-1.5 bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 rounded-lg transition-colors font-medium cursor-pointer"
                                >
                                    <RotateCw size={12} />
                                    Sync
                                </button>
                            </div>
                        </div>
                    ))
                )}

                {/* Add Button as last card if there are accounts */}
                {accounts.length > 0 && (
                    <button
                        onClick={openNewAccountModal}
                        className="flex flex-col items-center justify-center p-6 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-[#2F80ED] dark:hover:border-[#2F80ED] group transition-all text-gray-400 hover:text-[#2F80ED] bg-transparent hover:bg-blue-50/50 dark:hover:bg-blue-500/5 min-h-[220px]"
                    >
                        <div className="w-16 h-16 rounded-full bg-gray-50 dark:bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Plus size={24} />
                        </div>
                        <span className="font-bold text-lg">Add New Account</span>
                    </button>
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
        </>
    );
}
