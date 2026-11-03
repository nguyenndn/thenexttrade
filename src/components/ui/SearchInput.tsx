"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface SearchInputProps {
    className?: string;
    inputClassName?: string;
    ariaLabel?: string;
}

export const SearchInput = ({
    className = "",
    inputClassName = "",
    ariaLabel = "Search knowledge base articles",
}: SearchInputProps = {}) => {
    const searchParams = useSearchParams();
    const { replace } = useRouter();

    const handleSearch = useDebouncedCallback((term: string) => {
        const params = new URLSearchParams(searchParams.toString());
        if (term) {
            params.set("q", term);
        } else {
            params.delete("q");
        }
        // Reset to page 1 on new search
        params.set("page", "1");

        replace(`/knowledge?${params.toString()}`, { scroll: false });
    }, 300);

    return (
        <div className={`relative w-full group ${className}`}>
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                <Search className="h-4 w-4 text-gray-400 group-focus-within:text-gold transition-colors" />
            </div>
            <input
                type="text"
                aria-label={ariaLabel}
                className={`block w-full pl-10 pr-4 py-3 rounded-lg bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/25 focus:border-gold transition-all shadow-sm text-sm font-medium ${inputClassName}`}
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get("q")?.toString()}
            />
        </div>
    );
};
