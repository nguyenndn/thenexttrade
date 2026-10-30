"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import {
    Lock,
    Server,
    ShieldCheck,
    Sparkles,
    X,
    Eye,
    EyeOff,
    Wallet,
    AlertTriangle,
    Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { POPULAR_MT5_SERVERS } from "@/lib/constants/mt5-servers";
import type { CloudAccountSummary } from "@/lib/mt5-bridge/types";

interface ConnectMt5ModalProps {
    isOpen: boolean;
    targetAccount?: CloudAccountSummary | null;
    onClose: () => void;
    onConnected: (accountId: string) => void;
}

interface ConnectionLogEntry {
    id: string;
    time: string;
    level: "ERROR" | "INFO";
    message: string;
}

export function ConnectMt5Modal({
    isOpen,
    targetAccount,
    onClose,
    onConnected,
}: ConnectMt5ModalProps) {
    const [login, setLogin] = useState("");
    const [password, setPassword] = useState("");
    const [server, setServer] = useState("STARTRADERFinancial-Demo");
    const [useCustomAccount, setUseCustomAccount] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [logs, setLogs] = useState<ConnectionLogEntry[]>([]);

    const wasOpenRef = useRef(false);
    const lastAccountIdRef = useRef<string | null>(null);

    const targetId = targetAccount?.id ?? null;
    const targetAccountNumber = targetAccount?.accountNumber ?? "";
    const targetServer = targetAccount?.server ?? "";

    useEffect(() => {
        if (!isOpen) {
            wasOpenRef.current = false;
            return;
        }

        const isFirstOpen = !wasOpenRef.current;
        const isDifferentAccount = lastAccountIdRef.current !== targetId;

        if (isFirstOpen || isDifferentAccount) {
            wasOpenRef.current = true;
            lastAccountIdRef.current = targetId;

            if (targetAccountNumber) {
                setLogin(targetAccountNumber);
                setServer(targetServer || "STARTRADERFinancial-Demo");
                setUseCustomAccount(false);
            } else {
                setUseCustomAccount(true);
            }
        }
    }, [isOpen, targetId, targetAccountNumber, targetServer]);

    const appendLog = (level: "ERROR" | "INFO", message: string) => {
        const now = new Date();
        const time = now.toTimeString().slice(0, 8);
        setLogs((prev) => [
            {
                id: `${now.getTime()}-${Math.random().toString(36).slice(2, 6)}`,
                time,
                level,
                message,
            },
            ...prev.slice(0, 19),
        ]);
    };

    const filteredServers = useMemo(() => {
        const q = server.trim().toLowerCase();
        if (!q) return POPULAR_MT5_SERVERS.slice(0, 12);
        return POPULAR_MT5_SERVERS.filter(
            (s) =>
                s.name.toLowerCase().includes(q) ||
                (s.broker && s.broker.toLowerCase().includes(q))
        ).slice(0, 12);
    }, [server]);

    if (!isOpen) return null;

    const isLockedToMain = Boolean(targetAccount?.accountNumber && !useCustomAccount);

    const handleConnect = async (
        overrideLogin?: string,
        overridePassword?: string,
        overrideServer?: string
    ) => {
        const finalLogin =
            overrideLogin ??
            (isLockedToMain && targetAccount?.accountNumber
                ? targetAccount.accountNumber
                : login.trim());
        const finalPassword = overridePassword ?? password;
        const finalServer =
            overrideServer ??
            (isLockedToMain && targetAccount?.server
                ? targetAccount.server
                : server.trim());

        setError(null);
        setIsLoading(true);
        appendLog(
            "INFO",
            `Connecting #${finalLogin || "?"} → ${finalServer || "?"}...`
        );

        try {
            const res = await fetch("/api/remote/connect", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    accountId:
                        !overrideLogin && isLockedToMain
                            ? targetAccount?.id
                            : undefined,
                    login: finalLogin,
                    password: finalPassword,
                    server: finalServer,
                }),
            });
            const data = await res.json();
            if (!res.ok || !data.success) {
                const errMsg =
                    data.error ||
                    `HTTP ${res.status}: Unable to connect to MT5 server.`;
                setError(errMsg);
                appendLog("ERROR", errMsg);
                return;
            }
            appendLog("INFO", `Connected #${finalLogin} successfully.`);
            if (data.account?.id) {
                onConnected(data.account.id);
            }
            onClose();
        } catch (err: unknown) {
            const errMsg =
                err instanceof Error ? err.message : "Network connection error";
            setError(errMsg);
            appendLog("ERROR", errMsg);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-6 shadow-2xl space-y-5">
                <div className="flex items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-extrabold text-gray-900 dark:text-white">
                            Connect Direct MT5 Cloud
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                            Direct TCP socket connection to your broker server. No PC or VPS required.
                        </p>
                    </div>
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close modal"
                        className="h-8 w-8"
                    >
                        <X size={16} />
                    </Button>
                </div>

                {(error || logs.length > 0) && (
                    <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 space-y-2">
                        {error && (
                            <div className="flex items-start gap-2 text-xs font-semibold text-red-400">
                                <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                                <span className="break-words">{error}</span>
                            </div>
                        )}
                        {logs.length > 0 && (
                            <div className="rounded-lg bg-black/40 border border-white/10 p-2 space-y-1 max-h-28 overflow-y-auto font-mono text-[11px]">
                                <div className="flex items-center justify-between text-[10px] text-gray-400 pb-1 border-b border-white/10">
                                    <span>BRIDGE CONNECTION LOG</span>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        aria-label="Clear connection logs"
                                        onClick={() => {
                                            setLogs([]);
                                            setError(null);
                                        }}
                                        className="h-5 px-1.5 text-[10px] text-gray-400 hover:text-white"
                                    >
                                        <Trash2 size={10} />
                                        <span>Clear</span>
                                    </Button>
                                </div>
                                {logs.map((entry) => (
                                    <div
                                        key={entry.id}
                                        className={
                                            entry.level === "ERROR"
                                                ? "text-red-300 break-words"
                                                : "text-gray-300 break-words"
                                        }
                                    >
                                        <span className="text-gray-500 mr-1.5">
                                            [{entry.time}]
                                        </span>
                                        {entry.message}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                <div className="space-y-4">
                    {isLockedToMain && targetAccount ? (
                        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2.5 min-w-0">
                                <div className="h-9 w-9 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                                    <Wallet size={18} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <span className="text-xs font-extrabold text-gray-900 dark:text-white truncate">
                                            {targetAccount.name || "Main Account"}
                                        </span>
                                        <span className="rounded-full bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-black text-emerald-400">
                                            MAIN
                                        </span>
                                    </div>
                                    <div className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300 truncate">
                                        #{targetAccount.accountNumber} • {server}
                                    </div>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => setUseCustomAccount(true)}
                                className="h-7 px-2 text-[11px] shrink-0"
                            >
                                Change
                            </Button>
                        </div>
                    ) : (
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                MT5 Account Login Number
                            </label>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={login}
                                onChange={(e) => setLogin(e.target.value)}
                                className="w-full h-10 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 px-3 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                            />
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                Numeric MetaTrader 5 account login ID provided by your broker.
                            </p>
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                            MT5 Master Password
                        </label>
                        <div className="relative">
                            <input
                                type={showPassword ? "text" : "password"}
                                autoFocus
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                onKeyDown={(e) => {
                                    if (e.key === "Enter" && password.trim()) {
                                        void handleConnect();
                                    }
                                }}
                                className="w-full h-10 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 pl-3 pr-10 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                            />
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                aria-label="Toggle password visibility"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-1 top-1 h-8 w-8 text-gray-400"
                            >
                                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                            </Button>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                            <Lock size={11} className="text-emerald-400 shrink-0" />
                            <span>Encrypted with AES-256-GCM. Saved once so future connections are 1-click.</span>
                        </p>
                    </div>

                    {(!isLockedToMain || !targetAccount?.server) && (
                        <div className="relative">
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300 mb-1.5">
                                Broker Server Name
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={server}
                                    onFocus={() => setShowSuggestions(true)}
                                    onBlur={() => setTimeout(() => setShowSuggestions(false), 180)}
                                    onChange={(e) => {
                                        setServer(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    className="w-full h-10 rounded-lg bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 pl-9 pr-3 text-sm font-semibold text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-gold/50"
                                />
                                <Server
                                    size={15}
                                    className="absolute left-3 top-3 text-gray-400 pointer-events-none"
                                />
                            </div>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1">
                                Select from 1,300+ broker servers (Startrader, HFM, Exness, IC Markets) or type exact server name.
                            </p>

                            {showSuggestions && filteredServers.length > 0 && (
                                <div className="absolute z-30 mt-1 max-h-44 w-full overflow-y-auto rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] shadow-xl divide-y divide-gray-100 dark:divide-white/5">
                                    {filteredServers.map((item) => (
                                        <Button
                                            key={item.name}
                                            type="button"
                                            variant="ghost"
                                            onClick={() => {
                                                setServer(item.name);
                                                setShowSuggestions(false);
                                            }}
                                            className="w-full justify-between px-3 py-2 text-left text-xs font-semibold rounded-none h-auto"
                                        >
                                            <span className="text-gray-900 dark:text-white">
                                                {item.name}
                                            </span>
                                            {item.broker && (
                                                <span className="text-[10px] text-gray-400">
                                                    {item.broker}
                                                </span>
                                            )}
                                        </Button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                <div className="pt-2 space-y-2.5">
                    <Button
                        type="button"
                        variant="primary"
                        isLoading={isLoading}
                        onClick={() => handleConnect()}
                        className="w-full min-h-11"
                    >
                        <ShieldCheck size={16} />
                        <span>
                            {isLockedToMain
                                ? `Connect #${targetAccount?.accountNumber} Now`
                                : "Connect MT5 Account"}
                        </span>
                    </Button>

                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isLoading}
                            onClick={() =>
                                handleConnect(
                                    "99999999",
                                    "SimPass2026!",
                                    "TheNextTrade-Sim"
                                )
                            }
                            className="flex-1 text-xs h-9 border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
                        >
                            <Sparkles size={14} />
                            <span>Try Live Cloud Demo (XAUUSD)</span>
                        </Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                            className="text-xs h-9"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
