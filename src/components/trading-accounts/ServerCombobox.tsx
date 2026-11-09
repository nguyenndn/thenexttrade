"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { createPortal } from "react-dom";
import { Server, Check, Plus, X, Search, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

export interface MT5ServerItem {
    name: string;
    broker?: string;
    isDemo?: boolean;
}

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

    const [visibleCount, setVisibleCount] = useState(80);
    const [servers, setServers] = useState<MT5ServerItem[]>([]);
    const [isSearchingCache, setIsSearchingCache] = useState(false);
    const [isSearchingLive, setIsSearchingLive] = useState(false);
    const [lastLiveSearchedQuery, setLastLiveSearchedQuery] = useState("");

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

    // Reset visible count when search, filter, or open state changes
    useEffect(() => {
        setVisibleCount(80);
    }, [search, brokerFilter, isOpen]);

    // Step 1: Automatic cache lookup (mode="cache") when user types >= 2 chars (or has brokerFilter)
    // If another user previously searched "Exness", it is already in servers.cache.json and shows immediately!
    useEffect(() => {
        const q = search.trim();
        const effectiveQuery = q || (brokerFilter || "").trim();

        if (!isOpen || effectiveQuery.length < 2) {
            setServers([]);
            setIsSearchingCache(false);
            return;
        }

        const controller = new AbortController();
        const timer = setTimeout(async () => {
            setIsSearchingCache(true);
            try {
                const params = new URLSearchParams({
                    q,
                    mode: "cache",
                });
                if (brokerFilter) params.set("broker", brokerFilter);

                const res = await fetch(
                    `/api/mt5/brokers/search?${params.toString()}`,
                    { signal: controller.signal }
                );
                if (res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data?.servers)) {
                        const mapped: MT5ServerItem[] = data.servers.map(
                            (s: {
                                name?: string;
                                serverName?: string;
                                broker?: string;
                                company?: string;
                                isDemo?: boolean;
                            }) => ({
                                name: String(s.name || s.serverName || "").trim(),
                                broker: s.broker || s.company || undefined,
                                isDemo: Boolean(s.isDemo),
                            })
                        );
                        setServers(mapped.filter((s) => Boolean(s.name)));
                        if (data.queryCached && q) {
                            setLastLiveSearchedQuery(q.toLowerCase());
                        }
                    }
                }
            } catch {
                // Ignore abort errors
            } finally {
                if (!controller.signal.aborted) {
                    setIsSearchingCache(false);
                }
            }
        }, 200);

        return () => {
            clearTimeout(timer);
            controller.abort();
        };
    }, [search, brokerFilter, isOpen]);

    // Step 2: Explicit Live Search (mode="live") triggered when user clicks the Search button
    const handleLiveSearch = useCallback(async () => {
        const q = search.trim();
        const effectiveQuery = q || (brokerFilter || "").trim();
        if (disabled || effectiveQuery.length < 2 || isSearchingLive) return;

        setIsOpen(true);
        setIsSearchingLive(true);
        try {
            const res = await fetch("/api/mt5/brokers/search", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    q,
                    broker: brokerFilter || null,
                    mode: "live",
                }),
            });
            if (res.ok) {
                const data = await res.json();
                if (Array.isArray(data?.servers)) {
                    const mapped: MT5ServerItem[] = data.servers.map(
                        (s: {
                            name?: string;
                            serverName?: string;
                            broker?: string;
                            company?: string;
                            isDemo?: boolean;
                        }) => ({
                            name: String(s.name || s.serverName || "").trim(),
                            broker: s.broker || s.company || undefined,
                            isDemo: Boolean(s.isDemo),
                        })
                    );
                    setServers(mapped.filter((s) => Boolean(s.name)));
                    setLastLiveSearchedQuery(effectiveQuery.toLowerCase());
                }
            }
        } catch {
            // Keep existing cached servers if network fails
        } finally {
            setIsSearchingLive(false);
        }
    }, [search, brokerFilter, disabled, isSearchingLive]);

    const displayedServers = useMemo(() => {
        return servers.slice(0, visibleCount);
    }, [servers, visibleCount]);

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const target = e.currentTarget;
        if (target.scrollTop + target.clientHeight >= target.scrollHeight - 120) {
            if (visibleCount < servers.length) {
                setVisibleCount((prev) => Math.min(prev + 80, servers.length));
            }
        }
    };

    const isExactMatch = useMemo(() => {
        const trimmed = search.trim().toLowerCase();
        return servers.some((s) => s.name.toLowerCase() === trimmed);
    }, [servers, search]);

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
        setServers([]);
        setLastLiveSearchedQuery("");
        if (inputRef.current) inputRef.current.focus();
    };

    const effectiveQuery = search.trim() || (brokerFilter || "").trim();
    const shouldShowDropdown =
        isOpen &&
        mounted &&
        typeof document !== "undefined" &&
        effectiveQuery.length >= 2;
    const hasLiveSearchedCurrentQuery =
        effectiveQuery.length >= 2 &&
        lastLiveSearchedQuery === effectiveQuery.toLowerCase();

    // Calculate fixed portal position floating above all modals
    useEffect(() => {
        if (!shouldShowDropdown || !containerRef.current) return;

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
            const maxH = Math.min(
                320,
                Math.max(160, openUpward ? spaceAbove - 20 : spaceBelow - 20)
            );

            setDropdownStyle({
                position: "fixed",
                left: `${rect.left}px`,
                width: `${rect.width}px`,
                top: openUpward ? "auto" : `${rect.bottom + 6}px`,
                bottom: openUpward
                    ? `${window.innerHeight - rect.top + 6}px`
                    : "auto",
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
    }, [shouldShowDropdown]);

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
                {/* Input trigger box + Search button */}
                <div
                    onClick={() => {
                        if (!disabled) {
                            setIsOpen(true);
                            if (inputRef.current) inputRef.current.focus();
                        }
                    }}
                    className={`group relative flex items-center w-full rounded-lg border bg-white dark:bg-[#1E2028] pl-3.5 pr-2 py-1.5 transition-all cursor-text ${isOpen
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
                                } else if (effectiveQuery.length >= 2) {
                                    handleLiveSearch();
                                } else if (search.trim()) {
                                    handleSelectCustom();
                                }
                            } else if (e.key === "Escape") {
                                setIsOpen(false);
                                setSearch(value || "");
                            }
                        }}
                        className="w-full bg-transparent py-1 text-sm font-medium text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {(value || search) && !disabled && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                onClick={handleClear}
                                aria-label="Clear server"
                                className="h-6 w-6 p-0.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-lg transition-colors"
                            >
                                <X className="h-3.5 w-3.5" />
                            </Button>
                        )}
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            disabled={
                                disabled ||
                                effectiveQuery.length < 2 ||
                                isSearchingLive
                            }
                            onClick={(e) => {
                                e.stopPropagation();
                                handleLiveSearch();
                            }}
                            aria-label="Search MT5 server"
                            className="h-7 px-2.5 text-xs font-semibold rounded-lg gap-1.5 shrink-0"
                        >
                            {isSearchingLive ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                            ) : (
                                <Search className="h-3.5 w-3.5 text-primary" />
                            )}
                            <span>Search</span>
                        </Button>
                    </div>
                </div>

                {/* Portaled Dropdown Menu — only opens when typing >= 2 chars or searching */}
                {shouldShowDropdown &&
                    createPortal(
                        <div
                            ref={contentRef}
                            style={dropdownStyle}
                            className="rounded-lg border border-gray-200 bg-white shadow-2xl dark:border-white/10 dark:bg-[#1E2028] overflow-hidden flex flex-col animate-in fade-in-0 zoom-in-95 duration-150"
                        >
                            {/* Server count & status header */}
                            <div className="px-3 py-2 bg-gray-50/95 dark:bg-white/[0.04] border-b border-gray-100 dark:border-white/5 flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400 select-none shrink-0">
                                <span className="flex items-center gap-1.5">
                                    {isSearchingLive ? (
                                        <>
                                            <Loader2 className="h-3 w-3 animate-spin text-primary" />
                                            <span className="text-primary font-medium">
                                                Searching MT5 servers...
                                            </span>
                                        </>
                                    ) : isSearchingCache ? (
                                        <span>Checking cached servers...</span>
                                    ) : (
                                        <>
                                            Found{" "}
                                            <strong className="text-gray-900 dark:text-white font-semibold">
                                                {servers.length.toLocaleString()}
                                            </strong>{" "}
                                            servers
                                        </>
                                    )}
                                </span>
                                {servers.length > displayedServers.length && (
                                    <span className="text-[10px] text-primary font-medium">
                                        Scroll to see more
                                    </span>
                                )}
                            </div>

                            {/* Custom Server Option */}
                            {search.trim() && !isExactMatch && (
                                <div className="p-2 border-b border-gray-100 dark:border-white/5 bg-primary/5 dark:bg-primary/10 shrink-0">
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={handleSelectCustom}
                                        className="h-auto w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold text-primary hover:bg-primary/10 transition-colors text-left"
                                    >
                                        <span className="flex items-center gap-1.5 truncate">
                                            <Plus className="h-3.5 w-3.5 shrink-0" />
                                            <span>Use custom server:</span>
                                            <strong className="font-mono text-gray-900 dark:text-white truncate">
                                                &quot;{search.trim()}&quot;
                                            </strong>
                                        </span>
                                        <span className="text-[10px] uppercase tracking-wider bg-primary/20 text-primary px-1.5 py-0.5 rounded-lg font-bold shrink-0 ml-2">
                                            Custom
                                        </span>
                                    </Button>
                                </div>
                            )}

                            {/* List of servers */}
                            <div
                                onScroll={handleScroll}
                                className="overflow-y-auto divide-y divide-gray-50 dark:divide-white/[0.03] p-1 flex-1"
                            >
                                {displayedServers.length === 0 ? (
                                    <div className="p-4 text-center text-xs text-gray-500 dark:text-gray-400 space-y-2">
                                        {isSearchingLive ? (
                                            <p className="font-medium text-primary">
                                                Looking up MT5 server directory...
                                            </p>
                                        ) : !hasLiveSearchedCurrentQuery ? (
                                            <>
                                                <p className="font-medium">
                                                    No cached server found for{" "}
                                                    <span className="font-semibold text-gray-800 dark:text-gray-200">
                                                        &quot;{effectiveQuery}&quot;
                                                    </span>
                                                    .
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={handleLiveSearch}
                                                    className="h-7 px-3 text-xs font-semibold rounded-lg gap-1.5 mx-auto"
                                                >
                                                    <Search className="h-3.5 w-3.5 text-primary" />
                                                    <span>
                                                        Search &quot;{effectiveQuery}&quot; on MT5
                                                    </span>
                                                </Button>
                                            </>
                                        ) : (
                                            <>
                                                <p className="font-medium">
                                                    No MT5 server matched.
                                                </p>
                                                <p className="text-[11px] text-gray-400">
                                                    You can select{" "}
                                                    <span className="font-semibold text-primary">
                                                        &quot;{search.trim()}&quot;
                                                    </span>{" "}
                                                    as a custom server above.
                                                </p>
                                            </>
                                        )}
                                    </div>
                                ) : (
                                    <>
                                        {displayedServers.map((server) => {
                                            const isSelected =
                                                (value || "").trim().toLowerCase() ===
                                                server.name.trim().toLowerCase();
                                            return (
                                                <Button
                                                    key={server.name.toLowerCase()}
                                                    type="button"
                                                    variant="ghost"
                                                    onClick={() => handleSelect(server)}
                                                    className={`h-auto w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left ${isSelected
                                                        ? "bg-primary/10 text-primary font-bold"
                                                        : "text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 font-medium"
                                                        }`}
                                                >
                                                    <div className="flex items-center gap-2 min-w-0">
                                                        <span className="font-mono truncate">
                                                            {server.name}
                                                        </span>
                                                        {server.isDemo && (
                                                            <span className="text-[10px] px-1.5 py-0.5 rounded-lg bg-gray-100 text-gray-600 dark:bg-white/10 dark:text-gray-300 shrink-0">
                                                                Demo
                                                            </span>
                                                        )}
                                                    </div>
                                                    {isSelected && (
                                                        <Check className="h-3.5 w-3.5 text-primary shrink-0 ml-2" />
                                                    )}
                                                </Button>
                                            );
                                        })}

                                        {visibleCount < servers.length && (
                                            <div className="py-2 text-center text-[10px] text-gray-400">
                                                Scroll down to load more (
                                                {displayedServers.length} of{" "}
                                                {servers.length.toLocaleString()})
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
