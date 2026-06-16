"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { Save, Loader2, Brain, Check, X, ClipboardList } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { EmotionSelector } from "@/components/psychology/EmotionSelector";
import { getTradingRulesList } from "@/actions/rulebook";
import { createTradePlan } from "@/actions/trade-plans";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

async function fetchTradingAccounts() {
  const res = await fetch("/api/trading-accounts");
  if (!res.ok) throw new Error("Failed to fetch accounts");
  const data = await res.json();
  return Array.isArray(data) ? data : (data.accounts || []);
}

interface TradePlanModalProps {
  onSuccess: () => void;
  onCancel: () => void;
  initialData?: any;
}

export function TradePlanModal({ onSuccess, onCancel, initialData }: TradePlanModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [rules, setRules] = useState<any[]>([]);
  const [selectedRules, setSelectedRules] = useState<Record<string, boolean>>({});

  const [formData, setFormData] = useState({
    symbol: initialData?.symbol || "",
    type: initialData?.type || "BUY",
    plannedEntry: initialData?.plannedEntry || "",
    plannedStopLoss: initialData?.plannedStopLoss || "",
    plannedTakeProfit: initialData?.plannedTakeProfit || "",
    plannedLotSize: initialData?.plannedLotSize || "",
    riskAmount: initialData?.riskAmount || "",
    setupName: initialData?.setupName || "",
    thesis: initialData?.thesis || "",
    invalidation: initialData?.invalidation || "",
    emotionBefore: initialData?.emotionBefore || null,
    confidenceLevel: initialData?.confidenceLevel || 3,
    accountId: initialData?.accountId || "",
  });

  useEffect(() => {
    async function loadData() {
      try {
        const [accs, activeRules] = await Promise.all([
          fetchTradingAccounts(),
          getTradingRulesList(),
        ]);
        setAccounts(accs);
        setRules(activeRules.filter((r) => r.isActive));

        // Set default account if none
        if (accs.length > 0 && !formData.accountId) {
          const defaultAcc = accs.find((a: any) => a.isDefault) || accs[0];
          setFormData((prev) => ({ ...prev, accountId: defaultAcc.id }));
        }

        // Initialize checklist if editing
        if (initialData?.ruleChecklist) {
          setSelectedRules(initialData.ruleChecklist);
        }
      } catch (err) {
        console.error("Failed to load plan modal data", err);
      }
    }
    loadData();
  }, [initialData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleRuleToggle = (ruleId: string) => {
    setSelectedRules((prev) => ({
      ...prev,
      [ruleId]: !prev[ruleId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.symbol) {
      toast.error("Symbol is required");
      return;
    }

    const entry = parseFloat(formData.plannedEntry as string);
    const sl = formData.plannedStopLoss ? parseFloat(formData.plannedStopLoss as string) : null;
    const tp = formData.plannedTakeProfit ? parseFloat(formData.plannedTakeProfit as string) : null;

    if (!isNaN(entry)) {
      if (formData.type === "BUY") {
        if (sl !== null && sl >= entry) {
          toast.error("Stop Loss must be below Entry Price for BUY setup.");
          return;
        }
        if (tp !== null && tp <= entry) {
          toast.error("Take Profit must be above Entry Price for BUY setup.");
          return;
        }
      } else {
        if (sl !== null && sl <= entry) {
          toast.error("Stop Loss must be above Entry Price for SELL setup.");
          return;
        }
        if (tp !== null && tp >= entry) {
          toast.error("Take Profit must be below Entry Price for SELL setup.");
          return;
        }
      }
    }

    setIsSubmitting(true);
    try {
      const payload: any = {
        ...formData,
        plannedEntry: formData.plannedEntry ? parseFloat(formData.plannedEntry as string) : null,
        plannedStopLoss: formData.plannedStopLoss ? parseFloat(formData.plannedStopLoss as string) : null,
        plannedTakeProfit: formData.plannedTakeProfit ? parseFloat(formData.plannedTakeProfit as string) : null,
        plannedLotSize: formData.plannedLotSize ? parseFloat(formData.plannedLotSize as string) : null,
        riskAmount: formData.riskAmount ? parseFloat(formData.riskAmount as string) : null,
        ruleChecklist: selectedRules,
        confidenceLevel: formData.confidenceLevel,
      };

      const result = await createTradePlan(payload);
      if (result.error) throw new Error(result.error);

      toast.success("Trade plan saved successfully!");
      onSuccess();
    } catch (err: any) {
      toast.error(err.message || "Failed to save trade plan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5 max-h-[80vh] overflow-y-auto custom-scrollbar p-1">
      {/* Target Symbol & Parameters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500">
            Account Selection
          </label>
          <Select
            value={formData.accountId}
            onValueChange={(val) => setFormData((prev) => ({ ...prev, accountId: val }))}
          >
            <SelectTrigger className="w-full h-11 px-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-dashboard focus:ring-0 focus:outline-none text-sm font-medium">
              <SelectValue placeholder="Select Account" />
            </SelectTrigger>
            <SelectContent>
              {accounts.map((acc: any) => (
                <SelectItem key={acc.id} value={acc.id}>
                  {acc.name} ({acc.accountType})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500">
            Setup Name
          </label>
          <PremiumInput
            name="setupName"
            value={formData.setupName}
            onChange={handleChange}
            placeholder="e.g., Support Bounce, Break & Retest"
            className="h-11"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500">
            Pair / Symbol
          </label>
          <PremiumInput
            name="symbol"
            value={formData.symbol}
            onChange={handleChange}
            placeholder="e.g., EURUSD, XAUUSD"
            className="uppercase font-bold h-11"
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500">
            Direction
          </label>
          <div className="flex bg-gray-50 dark:bg-black/20 p-1 rounded-xl border border-dashboard h-11">
            {["BUY", "SELL"].map((type) => (
              <Button
                key={type}
                type="button"
                onClick={() => setFormData((p) => ({ ...p, type: type as any }))}
                className={`flex-1 h-full text-xs font-black rounded-lg transition-all ${
                  formData.type === type
                    ? type === "BUY"
                      ? "bg-blue-500 text-white shadow-lg shadow-blue-500/20"
                      : "bg-red-500 text-white shadow-lg shadow-red-500/20"
                    : "bg-transparent text-gray-500 hover:bg-white dark:hover:bg-white/5"
                }`}
              >
                {type}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Target levels */}
      <div className="bg-gray-50/50 dark:bg-white/[0.01] p-4 rounded-xl border border-dashboard space-y-4">
        <h4 className="text-xs font-black uppercase text-primary tracking-wide">
          Target Parameters
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400">Entry Price</span>
            <input
              type="number"
              step="any"
              name="plannedEntry"
              value={formData.plannedEntry}
              onChange={handleChange}
              placeholder="0.0000"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-black/20 border border-dashboard text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-red-500">Stop Loss</span>
            <input
              type="number"
              step="any"
              name="plannedStopLoss"
              value={formData.plannedStopLoss}
              onChange={handleChange}
              placeholder="0.0000"
              className="w-full p-2.5 rounded-lg bg-red-50/30 dark:bg-red-500/5 border border-red-100 dark:border-red-500/20 text-sm font-mono text-red-500 focus:border-red-500 focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-emerald-500">Take Profit</span>
            <input
              type="number"
              step="any"
              name="plannedTakeProfit"
              value={formData.plannedTakeProfit}
              onChange={handleChange}
              placeholder="0.0000"
              className="w-full p-2.5 rounded-lg bg-green-50/30 dark:bg-green-500/5 border border-green-100 dark:border-green-500/20 text-sm font-mono text-emerald-500 focus:border-primary focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400">Planned Lot</span>
            <input
              type="number"
              step="any"
              name="plannedLotSize"
              value={formData.plannedLotSize}
              onChange={handleChange}
              placeholder="0.10"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-black/20 border border-dashboard text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400">Target Risk ($)</span>
            <input
              type="number"
              step="any"
              name="riskAmount"
              value={formData.riskAmount}
              onChange={handleChange}
              placeholder="e.g. 50"
              className="w-full p-2.5 rounded-lg bg-white dark:bg-black/20 border border-dashboard text-sm font-mono focus:border-primary focus:outline-none"
            />
          </div>
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase text-gray-400">Confidence Level</span>
            <div className="flex gap-1">
              {[1, 2, 3, 4, 5].map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setFormData((prev) => ({ ...prev, confidenceLevel: lvl }))}
                  className={`flex-1 py-2 rounded-lg font-bold text-xs transition-all border ${
                    formData.confidenceLevel === lvl
                      ? "bg-purple-500 text-white border-purple-500 shadow-md shadow-purple-500/10"
                      : "bg-white dark:bg-black/20 text-gray-500 border-dashboard"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Thesis & Invalidation */}
      <div className="space-y-4">
        <div className="space-y-1">
          <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500">
            Trading Thesis (Logic & Confirmation)
          </label>
          <textarea
            name="thesis"
            value={formData.thesis}
            onChange={handleChange}
            placeholder="Describe the trade logic, support/resistance lines, indicator confluence, or news context..."
            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none text-sm resize-none"
            rows={3}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-black uppercase text-gray-400 dark:text-gray-500">
            Invalidation Point (When is this plan wrong?)
          </label>
          <textarea
            name="invalidation"
            value={formData.invalidation}
            onChange={handleChange}
            placeholder="What market action invalidates this setup? (e.g. Candle closes below support)"
            className="w-full p-3 rounded-xl bg-gray-50 dark:bg-black/20 border border-dashboard focus:border-primary focus:outline-none text-sm resize-none"
            rows={2}
          />
        </div>
      </div>

      {/* Psychology prior */}
      <div className="space-y-2 pt-2 border-t border-dashboard">
        <EmotionSelector
          value={formData.emotionBefore}
          onChange={(val) => setFormData((prev) => ({ ...prev, emotionBefore: val }))}
          label="Pre-trade mindset"
          phase="before"
        />
      </div>

      {/* Rule Checklist */}
      {rules.length > 0 && (
        <div className="space-y-2 pt-4 border-t border-dashboard">
          <h4 className="text-xs font-black uppercase text-gray-400 dark:text-gray-500 flex items-center gap-1.5">
            <ClipboardList size={14} className="text-primary" />
            Checklist Rulebook Compliance
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {rules.map((rule) => {
              const isChecked = !!selectedRules[rule.id];
              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => handleRuleToggle(rule.id)}
                  className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                    isChecked
                      ? "bg-primary/5 border-primary text-gray-800 dark:text-white"
                      : "bg-white dark:bg-black/10 border-dashboard text-gray-500 hover:border-gray-400"
                  }`}
                >
                  <div className={`w-4 h-4 rounded-md border flex items-center justify-center flex-shrink-0 transition-colors ${
                    isChecked
                      ? "bg-primary border-primary text-white"
                      : "border-gray-300 dark:border-white/10"
                  }`}>
                    {isChecked && <Check size={12} strokeWidth={3} />}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold truncate">{rule.title}</p>
                    <span className="text-[9px] font-black uppercase text-primary/80">
                      {rule.category}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Form Buttons */}
      <div className="flex justify-end gap-3 pt-4 border-t border-dashboard">
        <Button
          type="button"
          onClick={onCancel}
          variant="outline"
          className="rounded-xl font-bold text-gray-500"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="rounded-xl">
          {isSubmitting ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <Save size={16} />
          )}
          <span>Save Trade Plan</span>
        </Button>
      </div>
    </form>
  );
}
