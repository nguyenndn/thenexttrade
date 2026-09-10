"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { Server, Check, ChevronDown, Plus, X } from "lucide-react";
import {
    MT5ServerItem,
    getServersForBroker,
} from "@/lib/constants/mt5-servers";

interface ServerComboboxProps {
    value: string;
    onChange: (server: string, broker?: string) => void;
    brokerFilter?: string | null;
    label?: string;
    placeholder?: string;
    required?: boolean;
    helperText?: string;
    error?: string | null;
    disabled?: boolean;
}

export function ServerCombobox({
    value,
    onChange,
    brokerFilter,
    label = "Select Server",
    placeholder = "",
    required = false,
    helperText = "Exact broker server name required for MT5 connection",
    error,
    disabled = false,
}: ServerComboboxProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [search, setSearch] = useState("");
    const [mounted, setMounted] = useState(false);
    const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({});

    const containerRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setMounted(true);
    }, []);

    // Sync input text when value changes externally
    useEffect(() => {
        if (!isOpen) {
            setSearch(value || "");
        }
    }, [value, isOpen]);

    // Friendly display title for broker
    const brokerTitle = useMemo(() => {
        if (!brokerFilter) return "";
        const b = brokerFilter.trim().toUpperCase();
        if (b === "EXNESS") return "Exness";
        if (b === "VANTAGE") return "Vantage";
        if (b === "VTMARKETS") return "VT Markets";
        if (b === "ULTIMAMARKETS") return "Ultima Markets";
        return brokerFilter;
    }, [brokerFilter]);

    // Base servers filtered by selected broker (e.g. 148 for Exness, 47 for Vantage, or all 1,372 if no filter)
    const baseServers = useMemo(() => {
        return getServersForBroker(brokerFilter);
    }, [brokerFilter]);

    const [visibleCount, setVisibleCount] = useState(80);

    // Reset visible count when search, filter, or open state changes
    useEffect(() => {
        setVisibleCount(80);
    }, [search, brokerFilter, isOpen]);

    // Filter server list across broker servers or all catalog servers
    const allFilteredServers = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) return baseServers;
        return baseServers.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                (s.broker && s.broker.toLowerCase().includes(q))
        );
    }, [baseServers, search]);

    // Progressively displayed slice for maximum DOM performance and infinite scroll
    const displayedServers = useMemo(() => {
        return allFilteredServers.slice(0, visibleCount);
    }, [allFilteredServers, visibleCount]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
            if (visibleCount < allFilteredServers.length) {
                setVisibleCount((prev) => Math.min(prev + 80, allFilteredServers.length));
            }
        }
    };

    const isExactMatch = useMemo(() => {
        const trimmed = search.trim().toLowerCase();
        return baseServers.some(
            (s) => s.name.toLowerCase() === trimmed
        );
    }, [baseServers, search]);

    const handleSelect = (serverItem: MT5ServerItem) => {
        onChange(serverItem.name, serverItem.broker);
        setSearch(serverItem.name);
        setIsOpen(false);
    };

    const handleSelectCustom = () => {
        const customName = search.trim();
        if (customName) {
            onChange(customName);
            setSearch(customName);
            setIsOpen(false);
        }
    };

    const handleClear = (e: React.MouseEvent) => {
        e.stopPropagation();
        onChange("");
        setSearch("");
        if (inputRef.current) inputRef.current.focus();
    };

    // Calculate fixed portal position floating above all modals
    useEffect(() => {
        if (!isOpen || !containerRef.current) return;

        const updatePosition = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            // Auto-close if scrolled completely offscreen
            if (rect.bottom < -50 || rect.top > window.innerHeight + 50) {
                setIsOpen(false);
                return;
            }

            const spaceBelow = window.innerHeight - rect.bottom;
            const spaceAbove = rect.top;
            const openUpward = spaceBelow < 280 && spaceAbove > spaceBelow;
            const maxH = Math.min(320, Math.max(160, openUpward ? spaceAbove - 20 : spaceBelow - 20));

            setDropdownStyle({
                position: "fixed",
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                top: openUpward ? "auto" : `${rect.bottom + 6}px`,
                bottom: openUpward ? `${window.innerHeight - rect.top + 6}px` : "auto",
                maxHeight: `${maxH}px`,
                zIndex: 99999,
            });
        };

        updatePosition();
        const rafId = requestAnimationFrame(updatePosition);

        window.addEventListener("scroll", updatePosition, true);
        window.addEventListener("resize", updatePosition);

        return () => {
            cancelAnimationFrame(rafId);
            window.removeEventListener("scroll", updatePosition, true);
            window.removeEventListener("resize", updatePosition);
        };
    }, [isOpen]);

    // Close on click outside (checks both input trigger and portaled content)
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            const target = event.target as Node;
            const isInsideTrigger =
                containerRef.current && containerRef.current.contains(target);
            const isInsideContent =
                contentRef.current && contentRef.current.contains(target);

            if (!isInsideTrigger && !isInsideContent) {
                setIsOpen(false);
                setSearch(value || "");
            }
        }

        if (isOpen) {
            document.addEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isOpen, value]);

    return (
        <div className="w-full space-y-1.5" ref={containerRef}>
            {label && (
                <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                        {label} {required && <span className="text-red-500">*</span>}
                    </label>
                    {value && (
                        <span className="text-[11px] font-semibold text-primary">
                            Selected
                        </span>
                    )}
                </div>
            )}

            <div className="relative">
                {/* Input trigger box */}
                <div
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen(true);
                            if (inputRef.current) inputRef.current.focus();
                        }
                    }}
                    className={`group relative flex items-center w-full rounded-xl border bg-white dark:bg-[#1E2028] px-3.5 py-2.5 transition-all cursor-text ${
                        isOpen
                            ? "border-primary ring-2 ring-primary/20 shadow-sm"
                            : error
                            ? "border-red-500 ring-1 ring-red-500/20"
                            : "border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20"
                    } ${disabled ? "opacity-60 cursor-not-allowed bg-gray-50 dark:bg-white/5" : ""}`}
                >
                    <Server className="h-4 w-4 mr-2.5 text-gray-400 group-hover:text-primary transition-colors shrink-0" />

                    <input
                        ref={inputRef}
                        type="text"
                        disabled={disabled}
                        value={search}
                        placeholder={placeholder}
                        onFocus={() => setIsOpen(true)}
                        onChange={(e) => {
                            setSearch(e.target.value);
                            setIsOpen(true);
                        }}
                        onKeyDown={(e) => {
                            if (e.key === "Enter") {
                                e.preventDefault();
                                if (displayedServers.length > 0) {
                                    handleSelect(displayedServers[0]);
                                } else if (search.trim()) {
                                    handleSelectCustom();
                                }
                            } else if (e.key === "Escape") {
                                setIsOpen(false);
                                setSearch(value || "");
                            }
                        }}
                        className="w-full bg-transparent text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {value && (
                            <button
                                type="button"
                                onClick={handleClear}
                                aria-label="Clear server"
                                className="p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                        <ChevronDown
                            className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                                isOpen ? "rotate-180 text-primary" : ""
                            }`}
                        />
                    </div>
                </div>

                {/* Portaled Dropdown Menu — floats on top of all modals (never clipped) */}
                {isOpen && mounted && typeof document !== "undefined" && createPortal(
                    <div
                        ref={contentRef}
                        style={dropdownStyle}
                        className="rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1E2028] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150"
                    >
                        {/* Server count & guidance header */}
                        <div className="px-3 py-2 bg-gray-50/95 dark:bg-white/[0.04] border-b border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 select-none shrink-0">
                            <span>
                                {search.trim() ? (
                                    <>Found <strong className="text-gray-900 dark:text-white font-semibold">{allFilteredServers.length.toLocaleString()}</strong> servers</>
                                ) : (
                                    <>
                                        {brokerFilter ? (
                                            <>Catalog: <strong className="text-gray-900 dark:text-white font-semibold">{baseServers.length.toLocaleString()}</strong> {brokerTitle} MT5 servers (A–Z)</>
                                        ) : (
                                            <>Catalog: <strong className="text-gray-900 dark:text-white font-semibold">{baseServers.length.toLocaleString()}</strong> MT5 servers (A–Z)</>
                                        )}
                                    </>
                                )}
                            </span>
                            {allFilteredServers.length > displayedServers.length && (
                                <span className="text-[10px] text-primary font-medium">
                                    Scroll to see more
                                </span>
                            )}
                        </div>

                        {/* Search Indicator or Custom Option */}
                        {search.trim() && !isExactMatch && (
                            <div className="p-2 border-b border-gray-100 dark:border-white/5 bg-primary/5 dark:bg-primary/10 shrink-0">
                                <button
                                    type="button"
                                    onClick={handleSelectCustom}
                                    className="w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors text-left"
                                >
                                    <span className="flex items-center gap-1.5 truncate">
                                        <Plus className="h-3.5 w-3.5 shrink-0" />
                                        <span>Use custom server:</span>
                                        <strong className="font-mono text-gray-900 dark:text-white truncate">
                                            "{search.trim()}"
                                        </strong>
                                    </span>
                                    <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded font-bold shrink-0 ml-2">
                                        Custom
                                    </span>
                                </button>
                            </div>
                        )}

                        {/* List of servers */}
                        <div 
                            onScroll={handleScroll}
                            className="overflow-y-auto divide-y divide-gray-50 dark:divide-white/[0.03] p-1 flex-1"
                        >
                            {displayedServers.length === 0 ? (
                                <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400">
                                    <p className="font-medium">No pre-configured server matched.</p>
                                    <p className="mt-1 text-[11px] text-gray-400">
                                        Press Enter to use <span className="font-semibold text-primary">"{search.trim()}"</span> as a custom server.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {displayedServers.map((server) => {
                                        const isSelected = value === server.name;
                                        return (
                                            <button
                                                key={server.name}
                                                type="button"
                                                onClick={() => handleSelect(server)}
                                                className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${
                                                    isSelected
                                                        ? "bg-primary/10 text-primary font-bold"
                                                        : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 font-medium"
                                                }`}
                                            >
                                                <div className="flex items-center gap-2 min-w-0">
                                                    <span className="font-mono truncate">{server.name}</span>
                                                    {server.isDemo && (
                                                        <span className="text-[10px] px-1 py-0.2 rounded bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 shrink-0">
                                                             Demo
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2 shrink-0 ml-2">
                                                    {server.broker && (
                                                        <span className="text-[11px] text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                                                            {server.broker}
                                                        </span>
                                                    )}
                                                    {isSelected && (
                                                        <Check className="h-3.5 w-3.5 text-primary shrink-0" />
                                                    )}
                                                </div>
                                            </button>
                                        );
                                    })}

                                    {visibleCount < allFilteredServers.length && (
                                        <div className="py-2 text-center text-[10px] text-gray-400">
                                            Scroll down to load more ({displayedServers.length} of {allFilteredServers.length.toLocaleString()})
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>,
                    document.body
                )}
            </div>

            {error ? (
                <p className="text-[11px] font-medium text-red-500 mt-1">{error}</p>
            ) : helperText ? (
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                    {helperText}
                </p>
            ) : null}
        </div>
    );
}
