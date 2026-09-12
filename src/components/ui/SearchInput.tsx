"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useDebouncedCallback } from "use-debounce";

interface SearchInputProps {
    className?: string;
    inputClassName?: string;
}

export const SearchInput = ({
    className = "",
    inputClassName = "",
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
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-500 group-focus-within:text-gold transition-colors" />
            </div>
            <input
                type="text"
                className={`block w-full pl-11 pr-4 py-3.5 rounded-xl bg-white/70 dark:bg-white/5 backdrop-blur-xl border border-gray-200 dark:border-white/10 text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold/30 focus:border-gold transition-all shadow-sm text-sm sm:text-base ${inputClassName}`}
                placeholder="Search for articles, guides..."
                onChange={(e) => handleSearch(e.target.value)}
                defaultValue={searchParams.get("q")?.toString()}
            />
        </div>
    );
};
