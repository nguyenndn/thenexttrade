"use client";

import { useState, useTransition } from "react";
import { Plus, Edit2, Trash2, DollarSign } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/Dialog";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { toast } from "sonner";
import { upsertBrokerCommissionRate, deleteBrokerCommissionRate } from "./actions";

export interface CommissionRateItem {
    id: string;
    brokerId: string;
    broker?: {
        id: string;
        name: string;
        slug: string;
        color?: string | null;
        logo?: string | null;
    };
    symbol: string;
    commissionPerLot: number;
    currency: string;
    effectiveFrom: Date | string;
    createdAt: Date | string;
    updatedAt: Date | string;
}

interface BrokerOption {
    id: string;
    name: string;
    slug: string;
}

interface CommissionRatesTabProps {
    initialRates: CommissionRateItem[];
    availableBrokers?: BrokerOption[];
}

export function CommissionRatesTab({
    initialRates,
    availableBrokers = [],
}: CommissionRatesTabProps) {
    const [rates, setRates] = useState<CommissionRateItem[]>(initialRates);
    const [isPending, startTransition] = useTransition();

    // Modal state
    const [modalOpen, setModalOpen] = useState(false);
    const [editingRate, setEditingRate] = useState<CommissionRateItem | null>(null);
    const [brokerId, setBrokerId] = useState("");
    const [symbol, setSymbol] = useState("XAUUSD");
    const [commissionPerLot, setCommissionPerLot] = useState("17.0");
    const [currency, setCurrency] = useState("USD");

    // Delete state
    const [deleteId, setDeleteId] = useState<string | null>(null);

    const openCreateModal = () => {
        setEditingRate(null);
        setBrokerId(availableBrokers[0]?.id || "");
        setSymbol("XAUUSD");
        setCommissionPerLot("17.0");
        setCurrency("USD");
        setModalOpen(true);
    };

    const openEditModal = (rate: CommissionRateItem) => {
        setEditingRate(rate);
        setBrokerId(rate.brokerId);
        setSymbol(rate.symbol);
        setCommissionPerLot(String(rate.commissionPerLot));
        setCurrency(rate.currency || "USD");
        setModalOpen(true);
    };

    const handleSave = () => {
        if (!brokerId.trim()) {
            toast.error("Broker is required");
            return;
        }
        if (!symbol.trim()) {
            toast.error("Symbol is required");
            return;
        }
        const parsedRate = parseFloat(commissionPerLot);
        if (isNaN(parsedRate) || parsedRate < 0) {
            toast.error("Commission per lot must be a valid non-negative number");
            return;
        }

        startTransition(async () => {
            const res = await upsertBrokerCommissionRate({
                id: editingRate?.id,
                brokerId: brokerId.trim(),
                symbol: symbol.trim(),
                commissionPerLot: parsedRate,
                currency: currency.trim() || "USD",
            });

            if (res.success && res.data) {
                toast.success(editingRate ? "Commission rate updated" : "Commission rate created");
                const saved = res.data as unknown as CommissionRateItem;
                setRates((prev) => {
                    if (editingRate) {
                        return prev.map((r) => (r.id === saved.id ? saved : r));
                    }
                    return [...prev, saved].sort((a, b) => {
                        const nameA = a.broker?.name || "";
                        const nameB = b.broker?.name || "";
                        return nameA.localeCompare(nameB) || a.symbol.localeCompare(b.symbol);
                    });
                });
                setModalOpen(false);
            } else {
                toast.error(res.error || "Failed to save rate");
            }
        });
    };

    const handleDelete = () => {
        if (!deleteId) return;
        startTransition(async () => {
            const res = await deleteBrokerCommissionRate(deleteId);
            if (res.success) {
                toast.success("Commission rate deleted");
                setRates((prev) => prev.filter((r) => r.id !== deleteId));
                setDeleteId(null);
            } else {
                toast.error(res.error || "Failed to delete rate");
            }
        });
    };

    return (
        <div className="space-y-4">
            {/* Header / Actions Bar */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028]">
                <div>
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <DollarSign size={16} className="text-primary" />
                        Commission Rate Table
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        Broker-specific payout per lot (Gold $17/lot partner rate, non-gold fallback $0/lot).
                    </p>
                </div>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={openCreateModal}
                    className="shadow-md shadow-primary/20 shrink-0"
                >
                    <Plus size={15} strokeWidth={2.5} />
                    Add Commission Rate
                </Button>
            </div>

            {/* Rates Table */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden overflow-x-auto shadow-sm">
                <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-white/5 text-left">
                        <tr>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                Broker
                            </th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                Symbol
                            </th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                Rate / Lot
                            </th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase">
                                Currency
                            </th>
                            <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">
                                Actions
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-white/10">
                        {rates.map((rate) => {
                            const isWildcard = rate.symbol === "*";
                            const brokerName = rate.broker?.name || "Unknown Broker";
                            const brokerSlug = rate.broker?.slug || "";

                            return (
                                <tr
                                    key={rate.id}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <td className="p-4">
                                        <div className="flex items-center gap-2">
                                            <span className="px-2.5 py-1 rounded-lg text-xs font-mono font-bold bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white">
                                                {brokerName}
                                            </span>
                                            {brokerSlug && (
                                                <span className="text-[11px] font-mono text-gray-400">
                                                    ({brokerSlug})
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="p-4">
                                        <span className={`px-2 py-0.5 rounded-md text-xs font-mono font-bold ${
                                            isWildcard
                                                ? "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/20"
                                                : "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20"
                                        }`}>
                                            {rate.symbol}
                                        </span>
                                    </td>
                                    <td className="p-4">
                                        <span className="font-mono text-sm font-black text-gray-900 dark:text-white">
                                            ${rate.commissionPerLot.toFixed(2)}
                                        </span>
                                        <span className="text-xs text-gray-400 ml-1">/ lot</span>
                                    </td>
                                    <td className="p-4">
                                        <span className="text-xs font-mono font-bold text-gray-600 dark:text-gray-300">
                                            {rate.currency}
                                        </span>
                                    </td>
                                    <td className="p-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => openEditModal(rate)}
                                                className="h-8 w-8 p-0"
                                                aria-label="Edit commission rate"
                                            >
                                                <Edit2 size={13} />
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => setDeleteId(rate.id)}
                                                className="h-8 w-8 p-0 hover:border-red-500 hover:text-red-500"
                                                aria-label="Delete commission rate"
                                            >
                                                <Trash2 size={13} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                        {rates.length === 0 && (
                            <tr>
                                <td colSpan={5} className="p-8 text-center text-sm text-gray-500">
                                    No commission rates configured. Add a rule to start estimating revenue.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Modal: Add / Edit Rate */}
            <Dialog open={modalOpen} onOpenChange={setModalOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle>
                            {editingRate ? "Edit Commission Rate" : "Add Commission Rate"}
                        </DialogTitle>
                        <DialogDescription>
                            Configure payout rates per symbol for partner brokers or set wildcard fallback.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 pt-2">
                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                Select Partner Broker
                            </label>
                            <select
                                value={brokerId}
                                onChange={(e) => setBrokerId(e.target.value)}
                                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] text-sm text-gray-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-primary/40"
                            >
                                {availableBrokers.map((b) => (
                                    <option key={b.id} value={b.id}>
                                        {b.name} ({b.slug})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div>
                            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                Symbol
                            </label>
                            <PremiumInput
                                value={symbol}
                                onChange={(e) => setSymbol(e.target.value.toUpperCase())}
                            />
                            <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-400">
                                Exact symbol (e.g. XAUUSD) or * for all other symbols.
                            </p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                    Rate ($ / Lot)
                                </label>
                                <PremiumInput
                                    type="number"
                                    step="0.1"
                                    min="0"
                                    value={commissionPerLot}
                                    onChange={(e) => setCommissionPerLot(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-1.5">
                                    Currency
                                </label>
                                <PremiumInput
                                    value={currency}
                                    onChange={(e) => setCurrency(e.target.value.toUpperCase())}
                                />
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 pt-2">
                            <Button
                                variant="outline"
                                onClick={() => setModalOpen(false)}
                                disabled={isPending}
                            >
                                Cancel
                            </Button>
                            <Button
                                variant="primary"
                                onClick={handleSave}
                                isLoading={isPending}
                            >
                                {editingRate ? "Save Changes" : "Create Rate"}
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirm Delete */}
            <ConfirmDialog
                isOpen={!!deleteId}
                onCancel={() => setDeleteId(null)}
                title="Delete Commission Rate"
                description="Are you sure you want to delete this commission rate rule? Estimated revenue calculations will fall back to wildcards or $0."
                confirmText="Delete Rule"
                variant="danger"
                onConfirm={handleDelete}
            />
        </div>
    );
}
