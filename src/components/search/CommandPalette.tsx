"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search, FileText, X, ArrowRight } from "lucide-react";
import {
    Command,
    CommandInput,
    CommandList,
    CommandEmpty,
    CommandGroup,
    CommandItem,
    CommandSeparator,
} from "@/components/ui/command";
import { dashboardMenuItems } from "@/config/navigation";
import { cn } from "@/lib/utils";

// Flatten navigation items for search
function flattenNavItems() {
    const items: { name: string; href: string; category: string; icon?: any }[] = [];
    for (const group of dashboardMenuItems) {
        if (group.href && group.href !== "#") {
            items.push({ name: group.name, href: group.href, category: "Pages", icon: group.icon });
        }
        if (group.items) {
            for (const sub of group.items) {
                items.push({ name: sub.name, href: sub.href, category: group.name, icon: group.icon });
            }
        }
    }
    return items;
}

const allPages = flattenNavItems();

export function CommandPalette({ searchRoute = "/dashboard/search" }: { searchRoute?: string }) {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const router = useRouter();

    // Ctrl+K shortcut
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if ((e.ctrlKey || e.metaKey) && e.key === "k") {
                e.preventDefault();
                setOpen((prev) => !prev);
            }
            if (e.key === "Escape") {
                setOpen(false);
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    const handleSelect = useCallback(
        (href: string) => {
            setOpen(false);
            setSearchQuery("");
            router.push(href);
        },
        [router]
    );

    const handleSearch = useCallback(() => {
        if (searchQuery.trim()) {
            setOpen(false);
            router.push(`${searchRoute}?q=${encodeURIComponent(searchQuery.trim())}`);
            setSearchQuery("");
        }
    }, [searchQuery, searchRoute, router]);

    if (!open) return null;

    return (
        <div className="fixed inset-0 z-[9999]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={() => setOpen(false)}
            />

            {/* Modal */}
            <div className="absolute left-1/2 top-[20%] -translate-x-1/2 w-full max-w-[640px] px-4">
                <Command className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-[#1E2028] shadow-2xl overflow-hidden" shouldFilter={true}>
                    {/* Search Input */}
                    <div className="flex items-center border-b border-gray-100 dark:border-gray-800 px-4">
                        <CommandInput
                            placeholder="Search for anything..."
                            autoFocus
                            value={searchQuery}
                            onValueChange={setSearchQuery}
                            onKeyDown={(e: React.KeyboardEvent) => {
                                if (e.key === "Enter" && searchQuery.trim()) {
                                    // If no item is actively selected, do a full search
                                    const selected = document.querySelector('[cmdk-item][data-selected="true"]');
                                    if (!selected) {
                                        e.preventDefault();
                                        handleSearch();
                                    }
                                }
                            }}
                            className="flex h-12 w-full bg-transparent py-3 text-[15px] outline-none placeholder:text-gray-400 dark:placeholder:text-gray-500 border-none"
                        />
                        <button
                            onClick={() => setOpen(false)}
                            className="ml-2 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <CommandList className="max-h-[360px] overflow-y-auto p-2">
                        <CommandEmpty className="py-2">
                            {searchQuery.trim() ? (
                                <button
                                    onClick={handleSearch}
                                    className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left hover:bg-gray-50 dark:hover:bg-white/5 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                                        <Search size={16} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Search for &ldquo;{searchQuery}&rdquo;</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Search across all trades, sessions, and more</p>
                                    </div>
                                    <ArrowRight size={14} className="text-gray-400" />
                                </button>
                            ) : (
                                <p className="py-6 text-center text-sm text-gray-500">No results found.</p>
                            )}
                        </CommandEmpty>

                        {/* Full Search Option (always visible when typing) */}
                        {searchQuery.trim() && (
                            <CommandGroup heading="Search">
                                <CommandItem
                                    value={`__search__${searchQuery}`}
                                    onSelect={handleSearch}
                                    className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 aria-selected:bg-gray-50 dark:aria-selected:bg-white/5"
                                >
                                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 shrink-0">
                                        <Search size={16} className="text-primary" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold text-gray-900 dark:text-white">Search for &ldquo;{searchQuery}&rdquo;</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400">Search across all trades, sessions, and more</p>
                                    </div>
                                    <ArrowRight size={14} className="text-gray-400" />
                                </CommandItem>
                            </CommandGroup>
                        )}

                        {/* Pages */}
                        <CommandGroup heading="Pages">
                            {allPages.map((item) => {
                                const Icon = item.icon || FileText;
                                return (
                                    <CommandItem
                                        key={item.href}
                                        value={`${item.name} ${item.category}`}
                                        onSelect={() => handleSelect(item.href)}
                                        className="flex items-center gap-3 px-3 py-2.5 rounded-lg cursor-pointer text-gray-700 dark:text-gray-300 aria-selected:bg-gray-50 dark:aria-selected:bg-white/5"
                                    >
                                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gray-100 dark:bg-white/5 shrink-0">
                                            <Icon size={16} className="text-gray-500 dark:text-gray-400" />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.name}</p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{item.category}</p>
                                        </div>
                                        <span className="text-[10px] font-medium text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded">
                                            Pages
                                        </span>
                                    </CommandItem>
                                );
                            })}
                        </CommandGroup>
                    </CommandList>

                    {/* Footer */}
                    <div className="flex items-center justify-between px-4 py-2.5 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-white/[0.02] text-xs text-gray-400">
                        <div className="flex items-center gap-4">
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-mono text-[10px]">↑↓</kbd>
                                to navigate
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-mono text-[10px]">↵</kbd>
                                to select
                            </span>
                            <span className="flex items-center gap-1">
                                <kbd className="px-1.5 py-0.5 rounded bg-gray-200 dark:bg-white/10 text-gray-500 dark:text-gray-400 font-mono text-[10px]">Esc</kbd>
                                to close
                            </span>
                        </div>
                    </div>
                </Command>
            </div>
        </div>
    );
}

// Trigger button for the header
export function CommandPaletteTrigger({ className }: { className?: string }) {
    const handleClick = () => {
        // Dispatch Ctrl+K to open the palette
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
        );
    };

    return (
        <button
            onClick={handleClick}
            className={cn(
                "flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 dark:bg-white/5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm cursor-pointer",
                className
            )}
        >
            <Search size={16} />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-1.5 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400">
                <span className="text-[10px]">Ctrl</span>K
            </kbd>
        </button>
    );
}
