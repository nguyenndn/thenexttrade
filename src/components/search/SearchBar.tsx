
"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchBarProps {
    className?: string;
    variant?: "default" | "minimal";
    targetRoute?: string;
}

export function SearchBar({ className, variant = "default", targetRoute = "/dashboard/search" }: SearchBarProps) {
    const router = useRouter();
    const [query, setQuery] = useState("");

    const handleSearch = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            router.push(`${targetRoute}?q=${encodeURIComponent(query.trim())}`);
        }
    }, [query, router, targetRoute]);

    return (
        <form onSubmit={handleSearch} className={cn("relative w-full max-w-sm", className)}>
            <div className="relative group">
                <Search
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors"
                    size={20}
                />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search..."
                    className={cn(
                        "w-full pl-10 pr-4 py-2.5 rounded-xl border outline-none transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500",
                        variant === "default"
                            ? "bg-gray-50 dark:bg-[#151925] border-gray-200 dark:border-white/10 focus:bg-white dark:focus:bg-[#151925] focus:border-primary focus:ring-2 focus:ring-primary/20"
                            : "bg-transparent border-none focus:ring-0 px-0 pl-8 text-sm"
                    )}
                />
            </div>
        </form>
    );
}
