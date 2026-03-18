"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronDown, Check, Layers, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ModuleOption {
    id: string;
    title: string;
    levelTitle: string;
}

interface ModuleSelectorProps {
    modules: ModuleOption[];
    value: string;
    onChange: (moduleId: string) => void;
    className?: string;
}

export function ModuleSelector({ modules, value, onChange, className }: ModuleSelectorProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const ref = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Group modules by level
    const grouped = modules.reduce<Record<string, ModuleOption[]>>((acc, mod) => {
        const key = mod.levelTitle || "Ungrouped";
        if (!acc[key]) acc[key] = [];
        acc[key].push(mod);
        return acc;
    }, {});

    const filtered = Object.entries(grouped).reduce<Record<string, ModuleOption[]>>((acc, [level, mods]) => {
        const matching = mods.filter(m =>
            m.title.toLowerCase().includes(search.toLowerCase()) ||
            level.toLowerCase().includes(search.toLowerCase())
        );
        if (matching.length > 0) acc[level] = matching;
        return acc;
    }, {});

    const selected = modules.find(m => m.id === value);

    // Close on outside click
    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setIsOpen(false);
                setSearch("");
            }
        };
        document.addEventListener("mousedown", handler);
        return () => document.removeEventListener("mousedown", handler);
    }, []);

    // Focus search on open
    useEffect(() => {
        if (isOpen && inputRef.current) {
            inputRef.current.focus();
        }
    }, [isOpen]);

    return (
        <div ref={ref} className={cn("relative", className)}>
            {/* Trigger */}
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={cn(
                    "w-full flex items-center justify-between gap-2 p-2.5 rounded-xl text-sm transition-all text-left",
                    "bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10",
                    "hover:border-gray-300 dark:hover:border-white/20",
                    isOpen && "ring-2 ring-primary/20 border-primary",
                    !selected && "text-gray-400"
                )}
            >
                <div className="flex items-center gap-2 truncate">
                    <Layers size={14} className="text-gray-400 flex-shrink-0" />
                    {selected ? (
                        <span className="text-gray-900 dark:text-white truncate">
                            <span className="text-gray-400 text-xs">{selected.levelTitle} →</span>{" "}
                            {selected.title}
                        </span>
                    ) : (
                        <span>Select Module</span>
                    )}
                </div>
                <ChevronDown size={14} className={cn("text-gray-400 transition-transform flex-shrink-0", isOpen && "rotate-180")} />
            </button>

            {/* Dropdown */}
            {isOpen && (
                <div className="absolute z-50 mt-1 w-full bg-white dark:bg-[#1a1e2e] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden animate-in fade-in-0 zoom-in-95 duration-100">
                    {/* Search */}
                    <div className="p-2 border-b border-gray-100 dark:border-white/5">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                placeholder="Search modules..."
                                value={search}
                                onChange={e => setSearch(e.target.value)}
                                className="w-full pl-8 pr-3 py-2 text-sm bg-gray-50 dark:bg-white/5 rounded-lg border-none focus:outline-none text-gray-900 dark:text-white placeholder:text-gray-400"
                            />
                        </div>
                    </div>

                    {/* Options */}
                    <div className="max-h-64 overflow-y-auto py-1">
                        {Object.keys(filtered).length === 0 ? (
                            <p className="text-sm text-gray-400 text-center py-4">No modules found</p>
                        ) : (
                            Object.entries(filtered).map(([levelTitle, mods]) => (
                                <div key={levelTitle}>
                                    {/* Level group header */}
                                    <div className="px-3 py-1.5 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-gray-50 dark:bg-white/[0.02] sticky top-0">
                                        {levelTitle}
                                    </div>
                                    {mods.map(mod => (
                                        <button
                                            key={mod.id}
                                            type="button"
                                            onClick={() => {
                                                onChange(mod.id);
                                                setIsOpen(false);
                                                setSearch("");
                                            }}
                                            className={cn(
                                                "w-full flex items-center justify-between px-3 py-2 text-sm transition-colors text-left",
                                                mod.id === value
                                                    ? "bg-primary/5 text-primary font-medium"
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                                            )}
                                        >
                                            <span className="truncate">{mod.title}</span>
                                            {mod.id === value && <Check size={14} className="text-primary flex-shrink-0" />}
                                        </button>
                                    ))}
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
