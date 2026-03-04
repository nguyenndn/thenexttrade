"use client";

import { useState } from "react";
import { X, Save, Copy, Check, Eye, EyeOff, RefreshCw, Trash2, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
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
                className="bg-white dark:bg-[#151925] rounded-[24px] w-full max-w-[520px] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] cursor-default"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-white/10 relative bg-white dark:bg-[#151925] z-10 shrink-0">
                    <h2 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-3">
                        <div className="w-2.5 h-8 rounded-full shadow-sm" style={{ backgroundColor: color }} />
                        Account Settings
                    </h2>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        aria-label="Close settings"
                        className="w-10 h-10 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
                    >
                        <X size={20} />
                    </Button>
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
                                    <Button
                                        variant="ghost"
                                        type="button"
                                        key={c}
                                        onClick={() => setColor(c)}
                                        aria-label={`Select color ${c}`}
                                        className={`w-9 h-9 p-0 hover:bg-transparent hover:text-white rounded-full transition-all flex items-center justify-center relative shadow-sm ring-offset-2 ring-offset-white dark:ring-offset-[#151925] ${
                                            color === c ? "scale-110 z-10 ring-2 ring-current" : "hover:scale-105"
                                        }`}
                                        style={{ 
                                            backgroundColor: c,
                                            color: c // Đặt color = c để class ring-current ăn theo màu này
                                        }}
                                    >
                                        {color === c && <Check size={16} strokeWidth={3} className="text-white drop-shadow-md" />}
                                    </Button>
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

                        <div className="p-4 bg-gray-50/80 dark:bg-white/[0.02] rounded-[20px] border border-gray-200 dark:border-white/10 shadow-inner">
                            <div className="flex items-center justify-between mb-2">
                                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">API Key</label>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={onRegenerateKey}
                                    className="text-[11px] font-bold text-orange-500 hover:text-orange-600 border-orange-200 hover:bg-orange-50 dark:border-orange-500/20 dark:hover:bg-orange-500/10 uppercase tracking-wider h-8 px-3"
                                >
                                    <RefreshCw size={12} strokeWidth={2.5} className="mr-1.5" /> Regenerate
                                </Button>
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

                                <Button
                                    variant="outline"
                                    size="icon"
                                    onClick={fetchApiKey}
                                    disabled={isLoadingKey}
                                    aria-label="Toggle API Key visibility"
                                    className="w-12 h-12 rounded-xl text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white shrink-0"
                                >
                                    {isLoadingKey ? <RefreshCw size={18} className="animate-spin" /> : showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                                </Button>

                                {showApiKey && apiKey && (
                                    <Button
                                        variant="outline"
                                        size="icon"
                                        onClick={() => copyToClipboard(apiKey)}
                                        aria-label="Copy API Key"
                                        className="w-12 h-12 rounded-xl text-primary border-primary/20 hover:bg-primary/10 shrink-0"
                                    >
                                        <Copy size={18} />
                                    </Button>
                                )}
                            </div>
                            <p className="text-[11px] font-medium text-gray-500 dark:text-gray-400 leading-relaxed">
                                Use this key in your EA settings. Keep it secret and do not share it with anyone.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 dark:border-white/10 flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#151925] shrink-0 justify-between items-center w-full">
                    <Button
                        variant="destructive"
                        onClick={onDelete}
                        className="w-full sm:w-auto px-4 group"
                        title="Delete this account"
                    >
                        <Trash2 size={16} className="group-hover:scale-110 transition-transform sm:mr-0 mr-2" />
                        <span className="sm:hidden">Delete Account</span>
                    </Button>
                    
                    <div className="flex flex-col-reverse sm:flex-row gap-3 w-full sm:w-auto">
                        <Button
                            variant="outline"
                            onClick={onClose}
                            className="w-full sm:w-auto px-6 font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={handleSave}
                            disabled={isSaving}
                            className="w-full sm:w-auto px-6 font-bold shadow-lg shadow-primary/25"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw size={18} className="animate-spin mr-2" />
                                    Saving...
                                </>
                            ) : (
                                "Save Changes"
                            )}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
