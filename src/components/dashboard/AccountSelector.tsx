"use client";

import { useEffect, useState, useCallback } from "react";
import { Check, ChevronsUpDown, Plus, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
    CommandSeparator,
} from "@/components/ui/command";
import { Button } from "@/components/ui/Button";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAccountLabel } from "@/lib/utils";

// Helper component for colored rendering
function AccountLabelDisplay({ account }: { account: TradingAccount }) {
    if (!account) return <span>Unknown Account</span>;
    
    const type = account.accountType ? account.accountType.toUpperCase() : "PERSONAL";
    const displayType = (type === "PERSONAL" || type === "REAL") ? "REAL" : type;
    
    const broker = account.broker || account.name || "Unknown Broker";
    const accNumber = account.accountNumber ? `(${account.accountNumber})` : "";
    const platform = account.platform ? `[${account.platform}] ` : "";

    // REAL usually text-[#00C888] (Breek primary)
    // DEMO usually text-red-500
    const typeColor = displayType === "REAL" ? "text-primary font-bold" : "text-red-500 font-bold";

    return (
        <span className="inline-flex items-center gap-1.5 truncate">
            {platform && <span className="text-gray-400 font-normal">{platform}</span>}
            <span className={typeColor}>{displayType}</span>
            <span className="text-gray-600 dark:text-gray-300">- {broker} <span className="text-gray-400">{accNumber}</span></span>
        </span>
    );
}

// Define Account Type
type TradingAccount = {
    id: string;
    name: string;
    broker: string | null;
    balance: number;
    currency: string;
    isDefault: boolean;
    accountNumber: string;
    platform?: string;
    accountType?: string;
};

interface AccountSelectorProps {
    currentAccountId?: string;
    className?: string;
}

export function AccountSelector({ currentAccountId, className }: AccountSelectorProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [open, setOpen] = useState(false);
    const [accounts, setAccounts] = useState<TradingAccount[]>([]);
    const [selectedAccount, setSelectedAccount] = useState<TradingAccount | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch accounts - Run Once
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch("/api/trading-accounts");
                if (res.ok) {
                    const data = await res.json();
                    // API returns { accounts: [...], meta: {...} }
                    const accs = Array.isArray(data) ? data : (data.accounts || []);
                    setAccounts(accs);
                }
            } catch (error) {
                console.error("Failed to load accounts", error);
                toast.error("Could not load trading accounts");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccounts();
    }, []);

    // Effect to Sync Selection
    useEffect(() => {
        if (accounts.length === 0) return;

        let active: TradingAccount | undefined;

        if (currentAccountId && currentAccountId !== "all") {
            active = accounts.find((a) => a.id === currentAccountId);
        }

        // Fallback to Cookie or Oldest Account
        if (!active && accounts.length > 0) {
            // Helper to get cookie
            const getCookie = (name: string) => {
                const value = `; ${document.cookie}`;
                const parts = value.split(`; ${name}=`);
                if (parts.length === 2) return parts.pop()?.split(';').shift();
                return null;
            };

            const savedAccountId = getCookie("last_account_id");
            if (savedAccountId) {
                active = accounts.find((a) => a.id === savedAccountId);
            }

            if (!active) {
                active = accounts[0];
            }
        }

        if (active) {
            setSelectedAccount(active);

            // Navigate if URL param is missing OR if it didn't match any account (stale/deleted)
            if (!currentAccountId || active.id !== currentAccountId) {
                const params = new URLSearchParams(searchParams?.toString());
                params.set("accountId", active.id);
                // Update cookie to correct value
                document.cookie = `last_account_id=${active.id}; path=/; max-age=31536000; SameSite=Lax`;
                // Use replace to avoid history stack pollution for default redirect
                router.replace(`?${params.toString()}`);
            }
        }
    }, [currentAccountId, accounts, router, searchParams]);

    const handleSelect = useCallback((account: TradingAccount) => {
        setSelectedAccount(account);
        setOpen(false);

        // 1. Set Cookie for persistence
        document.cookie = `last_account_id=${account.id}; path=/; max-age=31536000; SameSite=Lax`;

        // 2. Update URL
        const params = new URLSearchParams(searchParams?.toString());
        params.set("accountId", account.id);

        router.push(`?${params.toString()}`);

    }, [router, searchParams]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <Button
                    variant="ghost"
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "flex items-center h-auto gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full",
                        className
                    )}
                >
                    <div className="p-1.5 bg-primary/10 text-primary rounded-lg">
                        <Wallet size={16} />
                    </div>
                    <span className="flex-1 text-left font-medium overflow-hidden">
                        {selectedAccount ? <AccountLabelDisplay account={selectedAccount} /> : (isLoading ? "Loading..." : "Select Account")}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
            </PopoverTrigger>
            <PopoverContent className="w-[300px] sm:w-[360px] p-0" align="end">
                <Command>
                    <CommandInput placeholder="Search account..." />
                    <CommandList>
                        <CommandEmpty>No account found.</CommandEmpty>
                        <CommandGroup heading="My Accounts">
                            {accounts.map((account) => (

                                <CommandItem
                                    key={account.id}
                                    value={`${account.name} ${account.accountNumber} ${account.broker || ""} ${account.id}`.toLowerCase()}
                                    onSelect={() => handleSelect(account)}
                                    // FORCE CLICK: Sometimes cmdk onSelect fails for mouse in Popovers
                                    onClick={() => handleSelect(account)}
                                    className="cursor-pointer data-[disabled]:pointer-events-auto data-[disabled]:opacity-100"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedAccount?.id === account.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col text-left overflow-hidden">
                                        <span className="font-medium text-sm truncate"><AccountLabelDisplay account={account} /></span>
                                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 truncate">{account.name}</span>
                                    </div>
                                </CommandItem>
                            ))}
                        </CommandGroup>
                    </CommandList>
                </Command>
            </PopoverContent>
        </Popover>
    );
}
