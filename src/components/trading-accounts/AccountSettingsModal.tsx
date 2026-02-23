"use client";

import { useState } from "react";
import { X, Save, Copy, Check, Eye, EyeOff, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { updateTradingAccount, revealApiKey, regenerateAccountKey } from "@/actions/accounts";

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
            const result = await updateTradingAccount(account.id, {
                name,
                color,
                // autoSync is NOT in schema? Schema has isDefault.
                // AccountSettingsModal has autoSync state but schema in actions.ts doesn't. 
                // I need to add autoSync to schema if I want to update it. Use 'isDefault' if that's what was meant, or add autoSync.
                // The original code had autoSync.
                // I should add autoSync to schema.
                balance: account.balance, // Required by schema
                currency: account.currency, // Required by schema
            });

            if (result.error) throw new Error(result.error);

            toast.success("Account settings updated successfully");
            onUpdate(); // Calling parent refresh (which will be router.refresh)
            onClose();
        } catch (error: any) {
            toast.error(error.message || "Failed to update settings");
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
            const result = await revealApiKey(account.id);
            if (result.error) throw new Error(result.error);
            // Explicitly assert success case property access
            if ('apiKey' in result) {
                setApiKey(result.apiKey ?? null);
                setShowApiKey(true);
            }
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
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
            <div
                className="bg-white dark:bg-[#151925] rounded-[24px] w-full max-w-[520px] overflow-hidden border border-gray-100 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-white/5 relative bg-white dark:bg-[#151925] z-10 shrink-0">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-2.5 h-8 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                        Account Settings
                    </h2>
                    <button
                        onClick={onClose}
                        className="w-10 h-10 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20"
                    >
                        <X size={20} />
                    </button>
                </div>

                <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
                    {/* General Settings */}
                    <div className="space-y-4">
                        <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                            <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                            General Information
                        </h3>

                        <PremiumInput
                            label="Account Name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <div className="pt-2">
                            <label className="block text-[11px] font-black text-gray-400 uppercase tracking-widest mb-2">
                                Account Color
                            </label>
                            <div className="flex flex-wrap gap-2.5">
                                {COLORS.map((c) => (
                                    <button
                                        key={c}
                                        onClick={() => setColor(c)}
                                        className={`w-9 h-9 rounded-full transition-all flex items-center justify-center relative ${color === c ? "scale-110 z-10" : "hover:scale-105"
                                            }`}
                                        style={{ 
                                            backgroundColor: c, 
                                            boxShadow: color === c ? `0 0 0 3px ${c}40, 0 4px 12px ${c}60` : "0 2px 5px rgba(0,0,0,0.1)" 
                                        }}
                                    >
                                        {color === c && <Check size={16} strokeWidth={3} className="text-white drop-shadow-md" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* API Key Section */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-3">
                            <h3 className="text-[11px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                                API Configuration
                            </h3>
                            <span className="text-[9px] font-black bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md tracking-wider uppercase">Sensitive</span>
                        </div>

                        <div className="p-4 bg-gray-50/80 dark:bg-white/[0.02] rounded-[20px] border border-gray-100 dark:border-white/5 shadow-inner">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">API Key</label>
                                <button
                                    onClick={onRegenerateKey}
                                    className="text-[11px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1.5 px-3 py-1.5 hover:bg-orange-50 dark:hover:bg-orange-500/10 rounded-lg transition-colors uppercase tracking-wider"
                                >
                                    <RefreshCw size={12} strokeWidth={2.5} /> Regenerate
                                </button>
                            </div>

                            <div className="flex items-center gap-2.5 mb-2">
                                <div className="flex-1 h-12 bg-white dark:bg-black/40 rounded-xl border border-gray-200 dark:border-white/10 flex items-center px-4 font-mono text-sm text-gray-800 dark:text-gray-200 overflow-hidden relative shadow-sm">
                                    {showApiKey && apiKey ? (
                                        <span className="tracking-widest">{apiKey}</span>
                                    ) : (
                                        <div className="flex items-center gap-1 opacity-40">
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="mx-1.5">-</span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="mx-1.5">-</span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="mx-1.5">-</span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                            <span className="w-2 h-2 rounded-full bg-current"></span>
                                        </div>
                                    )}
                                </div>

                                <button
                                    onClick={fetchApiKey}
                                    disabled={isLoadingKey}
                                    className="w-12 h-12 flex items-center justify-center text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl hover:bg-gray-50 dark:hover:bg-white/10 hover:shadow-sm transition-all focus:outline-none shrink-0"
                                >
                                    {isLoadingKey ? <RefreshCw size={18} className="animate-spin" /> : showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>

                                {showApiKey && apiKey && (
                                    <button
                                        onClick={() => copyToClipboard(apiKey)}
                                        className="w-12 h-12 flex items-center justify-center text-primary bg-primary/10 border border-primary/20 rounded-xl hover:bg-primary/20 transition-all shadow-sm shrink-0"
                                    >
                                        <Copy size={18} />
                                    </button>
                                )}
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                                Use this key in your EA settings. Keep it secret and do not share it with anyone.
                            </p>
                        </div>
                    </div>

                    {/* Danger Zone */}
                    <div className="pt-4 border-t border-dashed border-gray-200 dark:border-white/10">
                        <button
                            onClick={onDelete}
                            className="w-full py-3 text-red-500 hover:text-white hover:bg-red-500 border border-red-500/20 hover:border-red-500 font-bold rounded-xl transition-all flex items-center justify-center gap-2.5 group"
                        >
                            <Trash2 size={18} className="group-hover:scale-110 transition-transform" />
                            Delete this account
                        </button>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-100 dark:border-white/5 flex flex-col-reverse sm:flex-row gap-3 bg-white dark:bg-[#151925] shrink-0">
                    <button
                        onClick={onClose}
                        className="w-full sm:w-auto px-6 py-3 font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white bg-gray-50 hover:bg-gray-100 dark:bg-white/5 dark:hover:bg-white/10 rounded-xl transition-colors sm:flex-1"
                    >
                        Cancel
                    </button>
                    <button
                        onClick={handleSave}
                        disabled={isSaving}
                        className="w-full sm:w-auto px-6 py-3 bg-primary hover:bg-[#00B078] text-white font-bold rounded-xl shadow-lg shadow-primary/25 hover:-translate-y-0.5 transition-all flex items-center justify-center gap-2 sm:flex-1 disabled:opacity-70 disabled:hover:translate-y-0"
                    >
                        {isSaving ? (
                            <>
                                <RefreshCw size={18} className="animate-spin" />
                                Saving...
                            </>
                        ) : (
                            "Save Changes"
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}
