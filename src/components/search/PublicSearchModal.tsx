"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function PublicSearchModal() {
    const [open, setOpen] = useState(false);
    const [query, setQuery] = useState("");
    const inputRef = useRef<HTMLInputElement>(null);
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
                setQuery("");
            }
        };
        document.addEventListener("keydown", handleKeyDown);
        return () => document.removeEventListener("keydown", handleKeyDown);
    }, []);

    // Auto focus input
    useEffect(() => {
        if (open) {
            setTimeout(() => inputRef.current?.focus(), 100);
            document.body.style.overflow = "hidden";
        } else {
            document.body.style.overflow = "";
        }
        return () => { document.body.style.overflow = ""; };
    }, [open]);

    const handleSearch = () => {
        if (!query.trim()) return;
        setOpen(false);
        router.push(`/search?q=${encodeURIComponent(query.trim())}`);
        setQuery("");
    };

    return (
        <AnimatePresence>
            {open && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => { setOpen(false); setQuery(""); }}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[9999]"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ type: "spring", damping: 25, stiffness: 400 }}
                        className="fixed inset-0 flex items-center justify-center px-4 z-[9999] pointer-events-none"
                    >
                        <div className="flex items-center bg-white dark:bg-[#1E2028] rounded-full border border-gray-200 dark:border-gray-700 shadow-2xl px-5 py-2 gap-3 w-full max-w-xl pointer-events-auto">
                            <Search size={20} className="text-gray-500 flex-shrink-0" />
                            <input
                                ref={inputRef}
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                                placeholder="Search for anything..."
                                className="flex-1 bg-transparent text-base text-gray-700 dark:text-white placeholder:text-gray-500 outline-none py-2"
                            />
                            <button
                                onClick={handleSearch}
                                className="px-5 py-2 rounded-full bg-primary text-white font-semibold text-sm hover:opacity-90 transition-opacity flex-shrink-0"
                            >
                                Search
                            </button>
                        </div>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

export function PublicSearchTrigger({ className }: { className?: string }) {
    const handleClick = () => {
        document.dispatchEvent(
            new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
        );
    };

    return (
        <button
            onClick={handleClick}
            className={`flex items-center gap-2 px-3 py-2 rounded-full bg-gray-50 dark:bg-white/5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-white/10 transition-colors text-sm cursor-pointer border border-transparent ${className || ""}`}
        >
            <Search size={16} />
            <span className="hidden sm:inline">Search...</span>
            <kbd className="hidden sm:inline-flex h-5 items-center gap-0.5 rounded border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-1.5 font-mono text-[10px] font-medium text-gray-600 dark:text-gray-300">
                <span className="text-[10px] text-primary">Ctrl + K </span>
            </kbd>
        </button>
    );
}
