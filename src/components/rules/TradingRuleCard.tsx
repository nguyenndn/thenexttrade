"use client";

import { Edit, Trash2, Shield, AlertTriangle, Play, HelpCircle } from "lucide-react";
import { useState, useTransition } from "react";
import { updateTradingRule, deleteTradingRule } from "@/actions/rulebook";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

interface TradingRuleCardProps {
  rule: any;
  onUpdate: () => void;
  onEdit: (rule: any) => void;
}

export function TradingRuleCard({ rule, onUpdate, onEdit }: TradingRuleCardProps) {
  const [isPending, startTransition] = useTransition();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleToggleActive = () => {
    startTransition(async () => {
      const res = await updateTradingRule(rule.id, { isActive: !rule.isActive });
      if (res.success) {
        toast.success(`Rule ${rule.isActive ? "deactivated" : "activated"}!`);
        onUpdate();
      } else {
        toast.error("Failed to update rule status.");
      }
    });
  };

  const handleDelete = () => {
    if (!confirm("Are you sure you want to delete this trading rule?")) return;
    setIsDeleting(true);
    startTransition(async () => {
      const res = await deleteTradingRule(rule.id);
      if (res.success) {
        toast.success("Rule deleted successfully!");
        onUpdate();
      } else {
        toast.error("Failed to delete rule.");
        setIsDeleting(false);
      }
    });
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "HIGH":
        return "bg-red-50 text-red-600 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20";
      case "MEDIUM":
        return "bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20";
      default:
        return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-slate-400 dark:border-white/10";
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "RISK":
        return <Shield size={14} className="text-red-500" />;
      case "ENTRY":
        return <Play size={14} className="text-emerald-500" />;
      case "EXIT":
        return <AlertTriangle size={14} className="text-amber-500" />;
      default:
        return <HelpCircle size={14} className="text-indigo-500" />;
    }
  };

  return (
    <div
      className={`relative flex flex-col justify-between p-5 rounded-2xl border transition-all duration-300 ${
        rule.isActive
          ? "bg-white dark:bg-[#151925] border-dashboard/80 dark:border-white/[0.08] hover:shadow-md"
          : "bg-gray-50/50 dark:bg-white/[0.02] border-dashboard/80 dark:border-white/[0.04] opacity-60"
      }`}
    >
      <div>
        {/* Header Tags */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-gray-100 dark:bg-white/5 border border-dashboard dark:border-white/10 text-gray-600 dark:text-gray-400">
              {getCategoryIcon(rule.category)}
              {rule.category}
            </span>
            <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getSeverityColor(rule.severity)}`}>
              {rule.severity} Severity
            </span>
          </div>

          {/* Toggle Switch */}
          <button
            type="button"
            onClick={handleToggleActive}
            disabled={isPending || isDeleting}
            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors shrink-0 ${
              rule.isActive ? "bg-primary" : "bg-gray-200 dark:bg-white/10"
            }`}
          >
            <span
              className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                rule.isActive ? "translate-x-4.5" : "translate-x-0.5"
              }`}
            />
          </button>
        </div>

        {/* Content */}
        <h4 className="text-sm font-bold text-gray-800 dark:text-white leading-snug">
          {rule.title}
        </h4>
        {rule.description && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5 leading-relaxed">
            {rule.description}
          </p>
        )}

        {/* Scopes */}
        <div className="flex flex-wrap items-center gap-2 mt-4 text-[10px] font-semibold text-gray-400 dark:text-gray-500">
          {rule.account && (
            <span className="bg-primary/5 border border-primary/15 text-primary px-2 py-0.5 rounded-md">
              Account: {rule.account.name}
            </span>
          )}
          {rule.strategy && (
            <span className="bg-indigo-500/5 border border-indigo-500/15 text-indigo-500 px-2 py-0.5 rounded-md">
              Strategy: {rule.strategy.name}
            </span>
          )}
          {!rule.account && !rule.strategy && (
            <span className="bg-slate-500/5 border border-slate-500/15 text-slate-500 px-2 py-0.5 rounded-md">
              Global Rule
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center justify-end gap-2 border-t border-dashboard/80 dark:border-white/[0.06] mt-4 pt-3 shrink-0">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onEdit(rule)}
          disabled={isPending || isDeleting}
          className="w-7 h-7 rounded-lg border-gray-300 dark:border-white/10 text-gray-500 dark:text-gray-400 hover:text-primary dark:hover:text-primary"
        >
          <Edit size={12} />
        </Button>
        <Button
          variant="outline"
          size="icon"
          onClick={handleDelete}
          disabled={isPending || isDeleting}
          className="w-7 h-7 rounded-lg border-red-200 dark:border-red-500/15 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10"
        >
          <Trash2 size={12} />
        </Button>
      </div>
    </div>
  );
}
