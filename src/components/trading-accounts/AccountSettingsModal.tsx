"use client";

import { useState } from "react";
import { X, Save, Copy, Check, Eye, EyeOff, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PremiumInput } from "@/components/ui/PremiumInput";

interface AccountSettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    account: any;
    onUpdate: () => void;
    onDelete: () => void;
    onRegenerateKey: () => void;
}

const COLORS = [
    "hsl(var(--primary))", // Primary Green
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#0EA5E9", // Sky
    "#6366F1", // Indigo
    "#8B5CF6", // Violet
    "#A855F7", // Purple
    "#D946EF", // Fuchsia
    "#EC4899", // Pink
    "#F43F5E", // Rose
    "#EF4444", // Red
    "#F97316", // Orange
    "#F59E0B", // Amber
    "#EAB308", // Yellow
    "#84CC16", // Lime
    "#14B8A6", // Teal
    "#06B6D4", // Cyan
    "#64748B", // Slate
    "#475569", // Dark Slate
    "#1E293B", // Zinc
];

export function AccountSettingsModal({
    isOpen,
    onClose,
    account,
    onUpdate,
    onDelete,
    onRegenerateKey,
}: AccountSettingsModalProps) {
    const [name, setName] = useState(account.name);
    const [color, setColor] = useState(account.color || "hsl(var(--primary))");
    const [autoSync, setAutoSync] = useState(account.autoSync);

    const [isSaving, setIsSaving] = useState(false);
    const [showApiKey, setShowApiKey] = useState(false);
    const [apiKey, setApiKey] = useState<string | null>(null);
    const [isLoadingKey, setIsLoadingKey] = useState(false);

    if (!isOpen) return null;

    async function handleSave() {
        setIsSaving(true);
        try {
            const res = await fetch(`/api/trading-accounts/${account.id}`, {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, color, autoSync }),
            });

            if (!res.ok) throw new Error("Failed to update account");

            toast.success("Account settings updated successfully");
            onUpdate();
            onClose();
        } catch (error) {
            toast.error("Failed to update settings");
        } finally {
            setIsSaving(false);
        }
    }

    async function fetchApiKey() {
        if (showApiKey) {
            setShowApiKey(false);
            return;
        }

        setIsLoadingKey(true);
        try {
            const res = await fetch(`/api/trading-accounts/${account.id}/reveal-key`);
            if (!res.ok) throw new Error("Failed to fetch key");
            const data = await res.json();
            setApiKey(data.apiKey);
            setShowApiKey(true);
        } catch (error) {
            toast.error("Could not retrieve API key");
        } finally {
            setIsLoadingKey(false);
        }
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard");
    }

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#1E2028] rounded-xl w-full max-w-lg overflow-hidden border border-gray-100 dark:border-white/5 shadow-2xl animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-3 h-8 rounded-full" style={{ backgroundColor: color }} />
                        Account Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-8">
                    {/* General Settings */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider">General Information</h3>

                        <PremiumInput
                            label="Account Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">
                                Account Color
                            </label>
                            <div className="flex flex-wrap gap-2">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-9 h-9 rounded-full transition-all flex items-center justify-center ${color === c ? "ring-2 ring-offset-2 ring-offset-white dark:ring-offset-[#1E2028] scale-110" : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: c, boxShadow: color === c ? `0 0 10px ${c}80` : "none" }}
                                    >
                                        {color === c && <Check size={14} className="text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* API Key Section (The Fix) */}
                    <div className="space-y-4">
                        <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                            API Configuration
                            <span className="text-[10px] bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full">Sensitive</span>
                        </h3>

                        <div className="p-4 bg-gray-50 dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-xs font-semibold text-gray-500">API Key</label>
                                <div className="flex gap-2">
                                    <button
                                        onClick={onRegenerateKey}
                                        className="text-xs font-medium text-orange-500 hover:text-orange-600 flex items-center gap-1 px-2 py-1 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded"
                                    >
                                        <RefreshCw size={12} /> Regenerate
                                    </button>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <div className="flex-1 h-10 bg-white dark:bg-black/20 rounded-xl border border-gray-200 dark:border-white/10 flex items-center px-3 font-mono text-sm text-gray-600 dark:text-gray-300 overflow-hidden relative">
                                    {showApiKey && apiKey ? (
                                        <span>{apiKey}</span>
                                    ) : (
                                        <span className="tracking-widest opacity-50">
                                            ••••-••••-••••-••••-••••
                                        </span>
                                    )}
                                </div>

                                <button
                                    onClick={fetchApiKey}
                                    disabled={isLoadingKey}
                                    className="w-10 h-10 flex items-center justify-center text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 transition-colors"
                                >
                                    {isLoadingKey ? <RefreshCw size={18} className="animate-spin" /> : showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>

                                {showApiKey && apiKey && (
                                    <button
                                        onClick={() => copyToClipboard(apiKey)}
                                        className="w-10 h-10 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-colors"
                                    >
                                        <Copy size={18} />
                                    </button>
                                )}
                            </div>
                            <p className="text-xs text-gray-400 mt-2">
                                Use this key in your EA settings. Keep it secret.
                            </p>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-gray-100 dark:border-white/5">
                        <button
                            onClick={onDelete}
                            className="w-full py-3 text-red-500 hover:text-red-600 font-bold hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-all flex items-center justify-center gap-2"
                        >
                            <Trash2 size={18} />
                            Delete this account
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="p-6 border-t border-gray-100 dark:border-white/5 flex gap-3 bg-gray-50/50 dark:bg-white/5">
                    <button
                        onClick={onClose}
                        className="flex-1 py-3 font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="flex-1 py-3 bg-primary hover:bg-[#00B078] text-white font-bold rounded-xl shadow-lg shadow-primary/20 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2"
                    >
                        {isSaving ? "Saving..." : "Save Changes"}
                    </button>
                </div>
            </div>
        </div>
    );
}
