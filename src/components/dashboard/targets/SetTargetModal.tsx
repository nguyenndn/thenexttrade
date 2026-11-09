"use client";

import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { SetTargetModalProps, TargetType, AccountTargetOption, WEEKLY_PRESETS, MONTHLY_PRESETS } from "./TargetProgressTypes";
import { TargetPeriodField } from "./TargetPeriodField";
import { updateAccountProfitTargets } from "@/actions/profit-targets";
import { useSampleMode } from "@/components/providers/SampleModeProvider";
import { toast } from "sonner";

const EMPTY_ACCOUNTS: AccountTargetOption[] = [];

export function SetTargetModal({
    open, onClose, accountId, accountName, currency = "USD", availableAccounts = EMPTY_ACCOUNTS,
    initialWeeklyTarget, initialWeeklyTargetType = "USD",
    initialMonthlyTarget, initialMonthlyTargetType = "USD", onTargetSaved,
}: SetTargetModalProps) {
    const { isSampleMode } = useSampleMode();
    const isAll = !accountId || accountId === "all";
    const [selectedAccId, setSelectedAccId] = useState<string>(accountId && !isAll ? accountId : (availableAccounts[0]?.id || ""));
    const [wEnabled, setWEnabled] = useState<boolean>(Boolean(initialWeeklyTarget != null && initialWeeklyTarget > 0));
    const [wType, setWType] = useState<TargetType>(initialWeeklyTargetType);
    const [wVal, setWVal] = useState<string>(initialWeeklyTarget ? String(initialWeeklyTarget) : "");
    const [mEnabled, setMEnabled] = useState<boolean>(Boolean(initialMonthlyTarget != null && initialMonthlyTarget > 0));
    const [mType, setMType] = useState<TargetType>(initialMonthlyTargetType);
    const [mVal, setMVal] = useState<string>(initialMonthlyTarget ? String(initialMonthlyTarget) : "");
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        if (!open) return;
        const acc = availableAccounts.find((a) => a.id === selectedAccId);
        const wt = acc ? acc.weeklyTargetType : initialWeeklyTargetType;
        const wv = acc ? acc.weeklyTarget : initialWeeklyTarget;
        const mt = acc ? acc.monthlyTargetType : initialMonthlyTargetType;
        const mv = acc ? acc.monthlyTarget : initialMonthlyTarget;
        setWType(wt || "USD");
        setWVal(wv ? String(wv) : "");
        setWEnabled(Boolean(wv != null && wv > 0));
        setMType(mt || "USD");
        setMVal(mv ? String(mv) : "");
        setMEnabled(Boolean(mv != null && mv > 0));
    }, [open, selectedAccId]);

    const handleSave = async () => {
        const weeklyTarget = !wEnabled ? null : (wVal.trim() === "" ? null : Number(wVal));
        const monthlyTarget = !mEnabled ? null : (mVal.trim() === "" ? null : Number(mVal));

        if (weeklyTarget !== null && (!Number.isFinite(weeklyTarget) || weeklyTarget < 0)) return toast.error("Weekly target must be a valid non-negative number.");
        if (monthlyTarget !== null && (!Number.isFinite(monthlyTarget) || monthlyTarget < 0)) return toast.error("Monthly target must be a valid non-negative number.");
        if (wType === "PERCENT" && weeklyTarget !== null && weeklyTarget > 1000) return toast.error("Weekly target percentage cannot exceed 1,000%.");
        if (mType === "PERCENT" && monthlyTarget !== null && monthlyTarget > 1000) return toast.error("Monthly target percentage cannot exceed 1,000%.");
        if (wEnabled && (weeklyTarget === null || weeklyTarget === 0)) return toast.error("Please enter a valid weekly target or uncheck to disable.");
        if (mEnabled && (monthlyTarget === null || monthlyTarget === 0)) return toast.error("Please enter a valid monthly target or uncheck to disable.");

        setIsSaving(true);
        if (isSampleMode) {
            toast.success("Sample profit targets updated in Playground mode.");
            onTargetSaved?.({ weeklyTarget, weeklyTargetType: wType, monthlyTarget, monthlyTargetType: mType });
            setIsSaving(false);
            onClose();
            return;
        }

        const targetAccount = !isAll ? accountId : selectedAccId;
        if (!targetAccount) {
            toast.error("Please select a specific trading account to configure profit targets.");
            setIsSaving(false);
            return;
        }

        const res = await updateAccountProfitTargets(targetAccount, { weeklyTarget, weeklyTargetType: wType, monthlyTarget, monthlyTargetType: mType });
        setIsSaving(false);
        if (res?.success) {
            toast.success("Profit targets updated successfully.");
            onTargetSaved?.({ weeklyTarget, weeklyTargetType: wType, monthlyTarget, monthlyTargetType: mType });
            onClose();
        } else {
            toast.error(res?.error || "Failed to update profit targets.");
        }
    };

    const activeAcc = availableAccounts.find((a) => a.id === selectedAccId);
    const activeName = activeAcc?.name || accountName || "active account";
    const activeCurrency = activeAcc?.currency || currency || "USD";

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#1A1D27] p-6">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white">Set Profit Targets</DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 dark:text-gray-400">Configure weekly and monthly milestones for {activeName}.</DialogDescription>
                </DialogHeader>

                {!isSampleMode && isAll && availableAccounts.length > 1 && (
                    <div className="pt-2">
                        <label className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-1.5 block">Target Account</label>
                        <div className="flex flex-wrap gap-1.5">
                            {availableAccounts.map((acc) => (
                                <Button key={acc.id} type="button" size="sm" variant={selectedAccId === acc.id ? "primary" : "outline"} onClick={() => setSelectedAccId(acc.id)} className="h-7 text-xs rounded-lg">{acc.name}</Button>
                            ))}
                        </div>
                    </div>
                )}

                <div className="space-y-4 py-2">
                    <TargetPeriodField id="weekly-target-val" label="Weekly Target" targetType={wType} onTypeChange={setWType} value={wVal} onValueChange={setWVal} enabled={wEnabled} onToggleEnabled={setWEnabled} currency={activeCurrency} helperText={wType === "USD" ? `Absolute ${activeCurrency} target for Monday to Sunday UTC` : "Percentage of starting capital base for the week"} presets={wType === "USD" ? WEEKLY_PRESETS.usd : WEEKLY_PRESETS.pct} />
                    <TargetPeriodField id="monthly-target-val" label="Monthly Target" targetType={mType} onTypeChange={setMType} value={mVal} onValueChange={setMVal} enabled={mEnabled} onToggleEnabled={setMEnabled} currency={activeCurrency} helperText={mType === "USD" ? `Absolute ${activeCurrency} target for calendar month` : "Percentage of starting capital base for the month"} presets={mType === "USD" ? MONTHLY_PRESETS.usd : MONTHLY_PRESETS.pct} />
                </div>

                <DialogFooter className="gap-2 sm:gap-0 pt-2">
                    <Button variant="outline" onClick={onClose} disabled={isSaving}>Cancel</Button>
                    <Button variant="primary" onClick={handleSave} isLoading={isSaving} disabled={!isSampleMode && isAll && !selectedAccId}>Save Targets</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
