
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

import { useDebouncedCallback } from "use-debounce";

interface SearchBarProps {
    className?: string;
    variant?: "default" | "minimal";
    targetRoute?: string;
}

export function SearchBar({ className, variant = "default", targetRoute = "/dashboard/search" }: SearchBarProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const handleSearch = useDebouncedCallback((term: string) => {
        if (term.trim()) {
            router.push(`${targetRoute}?q=${encodeURIComponent(term.trim())}`);
        }
    }, 500);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setQuery(val);
        handleSearch(val);
    };

    return (
        <div className={cn("relative w-full max-w-sm", className)}>
            <div className="relative group">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"
                    size={20}
                />
                <input
                    type="text"
                    value={query}
                    onChange={handleChange}
                    placeholder="Search..."
                    className={cn(
                        "w-full pl-10 pr-16 py-2 rounded-full border-none outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-medium",
                        variant === "default"
                            ? "bg-gray-50 dark:bg-white/5 focus:bg-white dark:focus:bg-white/10 focus:ring-2 focus:ring-primary/10"
                            : "bg-transparent px-0 pl-8"
                    )}
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none hidden sm:block">
                    <kbd className="inline-flex h-6 items-center gap-1 rounded-md border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-2 font-mono text-[10px] font-medium text-gray-500 dark:text-gray-400 shadow-sm">
                        <span className="text-xs text-primary">Ctrl + K </span>
                    </kbd>
                </div>
            </div>
        </div>
    );
}
