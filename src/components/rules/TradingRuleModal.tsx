"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { createTradingRule, updateTradingRule } from "@/actions/rulebook";
import { toast } from "sonner";
import { useEffect, useTransition } from "react";
import { Loader2 } from "lucide-react";

const ruleFormSchema = z.object({
    title: z.string().min(3, "Title must be at least 3 characters").max(140),
    description: z.string().optional().or(z.literal("")),
    category: z.enum([
        "RISK",
        "ENTRY",
        "EXIT",
        "PSYCHOLOGY",
        "SESSION",
        "MANAGEMENT",
    ]),
    severity: z.enum(["LOW", "MEDIUM", "HIGH"]),
    accountId: z.string().optional().or(z.literal("")),
    strategyId: z.string().optional().or(z.literal("")),
    isActive: z.boolean(),
});

type RuleFormValues = z.infer<typeof ruleFormSchema>;

interface TradingRuleModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    ruleToEdit?: any;
    accounts: Array<{ id: string; name: string; accountNumber: string | null }>;
    strategies: Array<{ id: string; name: string }>;
}

export function TradingRuleModal({
    isOpen,
    onClose,
    onSuccess,
    ruleToEdit,
    accounts,
    strategies,
}: TradingRuleModalProps) {
    const [isPending, startTransition] = useTransition();

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RuleFormValues>({
        resolver: zodResolver(ruleFormSchema),
        defaultValues: {
            title: "",
            description: "",
            category: "RISK",
            severity: "MEDIUM",
            accountId: "",
            strategyId: "",
            isActive: true,
        },
    });

    // Load values when editing
    useEffect(() => {
        if (ruleToEdit) {
            reset({
                title: ruleToEdit.title,
                description: ruleToEdit.description || "",
                category: ruleToEdit.category,
                severity: ruleToEdit.severity,
                accountId: ruleToEdit.accountId || "",
                strategyId: ruleToEdit.strategyId || "",
                isActive: ruleToEdit.isActive !== false,
            });
        } else {
            reset({
                title: "",
                description: "",
                category: "RISK",
                severity: "MEDIUM",
                accountId: "",
                strategyId: "",
                isActive: true,
            });
        }
    }, [ruleToEdit, reset, isOpen]);

    const onSubmit = (values: RuleFormValues) => {
        startTransition(async () => {
            const formattedValues = {
                ...values,
                description: values.description || null,
                accountId: values.accountId || null,
                strategyId: values.strategyId || null,
            };

            let res;
            if (ruleToEdit) {
                res = await updateTradingRule(ruleToEdit.id, formattedValues);
            } else {
                res = await createTradingRule(formattedValues);
            }

            if (res.success) {
                toast.success(
                    ruleToEdit
                        ? "Rule updated successfully!"
                        : "Rule created successfully!"
                );
                onSuccess();
                onClose();
            } else {
                toast.error(res.error || "Failed to save rule.");
            }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="max-w-md bg-white dark:bg-[#11141d] border-dashboard dark:border-white/[0.08] p-6 rounded-2xl">
                <DialogHeader className="border-b border-dashboard/80 dark:border-white/[0.08] pb-4">
                    <DialogTitle className="text-lg font-bold text-gray-800 dark:text-white">
                        {ruleToEdit
                            ? "Edit Trading Rule"
                            : "Create Trading Rule"}
                    </DialogTitle>
                    <DialogDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Rules will appear in your trade logging checklists.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 mt-4"
                >
                    {/* Rule Title */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                            Rule Title
                        </label>
                        <PremiumInput
                            placeholder="e.g. Stop after 2 consecutive losses"
                            {...register("title")}
                            error={errors.title?.message}
                        />
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                            Description / Notes
                        </label>
                        <textarea
                            placeholder="Provide context on why this rule exists..."
                            {...register("description")}
                            className="w-full min-h-[80px] p-3 rounded-xl border border-gray-300 dark:border-white/10 bg-transparent text-sm text-gray-800 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary"
                        />
                    </div>

                    {/* Category & Severity Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                                Category
                            </label>
                            <select
                                {...register("category")}
                                className="w-full h-10 p-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#151925] text-sm text-gray-800 dark:text-white focus:outline-none"
                            >
                                <option value="RISK">Risk Management</option>
                                <option value="ENTRY">Entry Criteria</option>
                                <option value="EXIT">Exit Criteria</option>
                                <option value="PSYCHOLOGY">Psychology</option>
                                <option value="SESSION">Session Rules</option>
                                <option value="MANAGEMENT">
                                    Trade Management
                                </option>
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                                Severity
                            </label>
                            <select
                                {...register("severity")}
                                className="w-full h-10 p-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#151925] text-sm text-gray-800 dark:text-white focus:outline-none"
                            >
                                <option value="LOW">Low</option>
                                <option value="MEDIUM">Medium</option>
                                <option value="HIGH">High</option>
                            </select>
                        </div>
                    </div>

                    {/* Account & Strategy Scope Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                                Limit to Account
                            </label>
                            <select
                                {...register("accountId")}
                                className="w-full h-10 p-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#151925] text-sm text-gray-800 dark:text-white focus:outline-none"
                            >
                                <option value="">Global (All Accounts)</option>
                                {accounts.map((acc) => (
                                    <option key={acc.id} value={acc.id}>
                                        {acc.name}{" "}
                                        {acc.accountNumber
                                            ? `(#${acc.accountNumber})`
                                            : ""}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500 block mb-1">
                                Limit to Strategy
                            </label>
                            <select
                                {...register("strategyId")}
                                className="w-full h-10 p-2 border border-gray-300 dark:border-white/10 rounded-xl bg-white dark:bg-[#151925] text-sm text-gray-800 dark:text-white focus:outline-none"
                            >
                                <option value="">
                                    Global (All Strategies)
                                </option>
                                {strategies.map((strat) => (
                                    <option key={strat.id} value={strat.id}>
                                        {strat.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex items-center justify-end gap-3 border-t border-dashboard/80 dark:border-white/[0.08] pt-4 mt-6">
                        <Button
                            type="button"
                            variant="outline"
                            size="smd"
                            onClick={onClose}
                            disabled={isPending}
                            className="border-gray-300 dark:border-white/10 font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="smd"
                            disabled={isPending}
                            className="font-bold"
                        >
                            {isPending && (
                                <Loader2
                                    size={14}
                                    className="animate-spin mr-1.5"
                                />
                            )}
                            {ruleToEdit ? "Save Changes" : "Create Rule"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
