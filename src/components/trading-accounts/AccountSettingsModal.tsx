"use client";

import { useState } from "react";
import { X, Check, RefreshCw, Trash2, Shield } from "lucide-react";
import { toast } from "sonner";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { updateTradingAccount } from "@/actions/accounts";
import { updateTradingRules } from "@/actions/trading-rules";

interface AccountSettingsModalProps {
 isOpen: boolean;
 onClose: () => void;
 account: any;
 onUpdate: () => void;
 onDelete: () => void;
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
}: AccountSettingsModalProps) {
 const [name, setName] = useState(account.name);
 const [color, setColor] = useState(account.color || "hsl(var(--primary))");

 const [isSaving, setIsSaving] = useState(false);


 // Trading Rules state
 const [maxDailyLoss, setMaxDailyLoss] = useState<string>(account.maxDailyLoss?.toString() || "");
 const [maxDailyTrades, setMaxDailyTrades] = useState<string>(account.maxDailyTrades?.toString() || "");
 const [maxRiskPercent, setMaxRiskPercent] = useState<string>(account.maxRiskPercent?.toString() || "");
 const [cooldownAfterLosses, setCooldownAfterLosses] = useState<string>(account.cooldownAfterLosses?.toString() || "");

 if (!isOpen) return null;

 async function handleSave() {
 setIsSaving(true);
 try {
 const result = await updateTradingAccount(account.id, {
 name,
 color,
 balance: account.balance,
 currency: account.currency,
 });

 if (result.error) throw new Error(result.error);

 toast.success("Account settings updated successfully");

 // Save Trading Rules separately
 const rulesResult = await updateTradingRules(account.id, {
 maxDailyLoss: maxDailyLoss ? parseFloat(maxDailyLoss) : null,
 maxDailyTrades: maxDailyTrades ? parseInt(maxDailyTrades) : null,
 maxRiskPercent: maxRiskPercent ? parseFloat(maxRiskPercent) : null,
 cooldownAfterLosses: cooldownAfterLosses ? parseInt(cooldownAfterLosses) : null,
 });
 if (rulesResult.error) {
 toast.error("Failed to save trading rules");
 }

 onUpdate();
 onClose();
 } catch (error: any) {
 toast.error(error.message || "Failed to update settings");
 } finally {
 setIsSaving(false);
 }
 }




 return (
 <div className="fixed inset-0 bg-black/60 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6" onClick={onClose}>
 <div
 className="bg-white dark:bg-[#151925] rounded-xl w-full max-w-[520px] overflow-hidden border border-dashboard shadow-2xl animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh] cursor-default"
 onClick={(e) => e.stopPropagation()}
 >
 {/* Header */}
 <div className="flex items-center justify-between px-6 py-4 border-b border-dashboard relative bg-white dark:bg-[#151925] z-10 shrink-0">
 <h2 className="text-xl font-black text-gray-700 dark:text-white flex items-center gap-3">
 <div className="w-2.5 h-8 rounded-full shadow-sm" style={{ backgroundColor: color }} />
 Account Settings
 </h2>
 <Button
 variant="ghost"
 size="icon"
 onClick={onClose}
 aria-label="Close settings"
 className="w-10 h-10 rounded-full text-gray-500 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-white/10"
 >
 <X size={20} />
 </Button>
 </div>

 <div className="p-6 space-y-6 overflow-y-auto custom-scrollbar">
 {/* General Settings */}
 <div className="space-y-4">
 <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
 General Information
 </h3>

 <PremiumInput
 label="Account Name"
 value={name}
 onChange={(e) => setName(e.target.value)}
 />

 <div className="pt-2">
 <label className="block text-[11px] font-black text-gray-500 uppercase tracking-widest mb-2">
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

 {/* Trading Rules (Soft Nudge) */}
 <div className="space-y-4">
 <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-amber-400"></span>
 Trading Protection Rules
 <span className="text-[9px] font-black bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 px-2 py-0.5 rounded-md tracking-wider uppercase ml-1">Optional</span>
 </h3>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed -mt-1">
 Set limits to protect your discipline. Dashboard will show alerts when you approach or exceed these.
 </p>

 <div className="grid grid-cols-2 gap-3">
 <PremiumInput
 label={`Max Daily Loss (${account.currency || 'USD'})`}
 type="number"
 value={maxDailyLoss}
 onChange={(e) => setMaxDailyLoss(e.target.value)}
 placeholder="e.g. 200"
 />
 <PremiumInput
 label="Max Trades / Day"
 type="number"
 value={maxDailyTrades}
 onChange={(e) => setMaxDailyTrades(e.target.value)}
 placeholder="e.g. 5"
 />
 <PremiumInput
 label="Max Risk % / Trade"
 type="number"
 value={maxRiskPercent}
 onChange={(e) => setMaxRiskPercent(e.target.value)}
 placeholder="e.g. 2"
 />
 <PremiumInput
 label="Cooldown After Losses"
 type="number"
 value={cooldownAfterLosses}
 onChange={(e) => setCooldownAfterLosses(e.target.value)}
 placeholder="e.g. 3"
 />
 </div>
 </div>

 {/* Sync Key Info */}
 <div className="space-y-3">
 <h3 className="text-[11px] font-black text-gray-500 uppercase tracking-widest flex items-center gap-2">
 <span className="w-1.5 h-1.5 rounded-full bg-gray-300 dark:bg-gray-600"></span>
 API Configuration
 </h3>

 <div className="p-4 bg-gray-50/80 dark:bg-white/[0.02] rounded-xl border border-dashboard">
 <div className="flex items-start gap-3">
 <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center shrink-0 mt-0.5">
 <Shield size={14} className="text-emerald-500" />
 </div>
 <div>
 <p className="text-sm font-bold text-gray-700 dark:text-white">Unified Sync API Key</p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed mt-0.5">
 One API key works for all your accounts. Manage your Sync API Key in{" "}
 <a href="/dashboard/settings/sync-settings" className="text-primary hover:underline font-semibold">
 Settings
 </a>.
 </p>
 </div>
 </div>
 </div>
 </div>
 </div>

 {/* Footer */}
 <div className="px-6 py-4 border-t border-dashboard flex flex-col sm:flex-row gap-3 bg-white dark:bg-[#151925] shrink-0 justify-between items-center w-full">
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
