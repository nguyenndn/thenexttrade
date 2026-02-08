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
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { useRouter, useSearchParams } from "next/navigation";

// Define Account Type
type TradingAccount = {
    id: string;
    name: string;
    broker: string | null;
    balance: number;
    currency: string;
    isDefault: boolean;
    accountNumber: string;
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

    // Fetch accounts
    useEffect(() => {
        const fetchAccounts = async () => {
            try {
                const res = await fetch("/api/trading-accounts");
                if (res.ok) {
                    const data = await res.json();
                    const accs = Array.isArray(data) ? data : [];
                    setAccounts(accs);

                    // Logic to set selected account from Props -> URL -> Default
                    // Priority: currentAccountId (from Server/Cookie/URL) -> Default Account -> First Account

                    let active: TradingAccount | undefined;

                    if (currentAccountId) {
                        active = accs.find((a: TradingAccount) => a.id === currentAccountId);
                    }

                    // Fallback to default if no currentAccountId matched
                    if (!active) {
                        active = accs.find((a: TradingAccount) => a.isDefault);
                    }

                    if (!active && accs.length > 0) {
                        active = accs[0];
                    }

                    if (active) {
                        setSelectedAccount(active);
                        // We do NOT redirect here anymore. The server handles the data fetching based on Cookie/URL.
                        // If we are on a clean URL but have an active account, that's fine.
                    }
                }
            } catch (error) {
                console.error("Failed to load accounts", error);
                toast.error("Could not load trading accounts");
            } finally {
                setIsLoading(false);
            }
        };

        fetchAccounts();
    }, [currentAccountId]);

    const handleSelect = useCallback((account: TradingAccount) => {
        setSelectedAccount(account);
        setOpen(false);

        // 1. Set Cookie for persistence
        document.cookie = `last_account_id=${account.id}; path=/; max-age=31536000; SameSite=Lax`;

        // 2. Update URL & Trigger Server Refresh
        // Using replace to change URL params. Server Page likely listens to searchParams.
        const params = new URLSearchParams(searchParams?.toString());
        params.set("accountId", account.id);
        router.push(`?${params.toString()}`);

    }, [router, searchParams]);

    return (
        <Popover open={open} onOpenChange={setOpen}>
            <PopoverTrigger asChild>
                <button
                    role="combobox"
                    aria-expanded={open}
                    className={cn(
                        "flex items-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors w-full",
                        className
                    )}
                >
                    <div className="p-1.5 bg-blue-500/10 text-blue-500 rounded-lg">
                        <Wallet size={16} />
                    </div>
                    <span className="flex-1 truncate text-left">
                        {selectedAccount ? `${selectedAccount.name} (${selectedAccount.accountNumber})` : "Select Account"}
                    </span>
                    <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </button>
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
                                    onSelect={() => handleSelect(account)}
                                    className="cursor-pointer"
                                >
                                    <Check
                                        className={cn(
                                            "mr-2 h-4 w-4",
                                            selectedAccount?.id === account.id
                                                ? "opacity-100"
                                                : "opacity-0"
                                        )}
                                    />
                                    <div className="flex flex-col">
                                        <span>{account.name} <span className="text-gray-400">({account.accountNumber})</span></span>
                                        <span className="text-xs text-gray-400">{account.broker || "No Broker"}</span>
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
