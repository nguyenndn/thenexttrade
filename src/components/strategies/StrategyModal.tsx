"use client";

import { useState } from "react";
import { toast } from "sonner";
import { X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
// import { Label } from "@/components/ui/label"; // Replaced with html label
// import { Textarea } from "@/components/ui/textarea"; // Replaced with html textarea

interface Strategy {
    id: string;
    name: string;
    description: string | null;
    rules: string | null;
    color: string;
}

interface StrategyModalProps {
    strategy?: Strategy | null;
    onClose: () => void;
    onSave: () => void;
}

const COLORS = [
    "#6366F1", // Indigo
    "#EF4444", // Red
    "#F59E0B", // Amber
    "#10B981", // Emerald
    "#3B82F6", // Blue
    "#8B5CF6", // Violet
    "#EC4899", // Pink
    "#06B6D4", // Cyan
];

export function StrategyModal({ strategy, onClose, onSave }: StrategyModalProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: strategy?.name || "",
        description: strategy?.description || "",
        rules: strategy?.rules || "",
        color: strategy?.color || COLORS[0],
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const isNew = !strategy || strategy.id.startsWith("temp-");

            const url = isNew
                ? "/api/strategies"
                : `/api/strategies/${strategy!.id}`;

            const method = isNew ? "POST" : "PATCH";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || "Failed to save strategy");
            }

            toast.success(strategy ? "Strategy updated" : "Strategy created");
            onSave();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : "Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-[#1E2028] w-full max-w-lg rounded-2xl shadow-xl overflow-hidden border border-gray-100 dark:border-white/5 animate-in fade-in zoom-in-95 duration-200">

                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-100 dark:border-white/5">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {strategy ? "Edit Strategy" : "New Strategy"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label htmlFor="name" className="text-sm font-bold text-gray-700 dark:text-gray-300">Strategy Name</label>
                            <input
                                id="name"
                                type="text"
                                required
                                placeholder="Trend Following"
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="color" className="text-sm font-bold text-gray-700 dark:text-gray-300">Color Tag</label>
                            <div className="flex gap-3 flex-wrap">
                                {COLORS.map((color) => (
                                    <button
                                        key={color}
                                        type="button"
                                        onClick={() => setFormData({ ...formData, color })}
                                        className={`w-8 h-8 rounded-full transition-transform ${formData.color === color
                                            ? "scale-110 ring-2 ring-offset-2 ring-gray-900 dark:ring-white dark:ring-offset-[#1E2028]"
                                            : "hover:scale-105"
                                            }`}
                                        style={{ backgroundColor: color }}
                                    />
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="description" className="text-sm font-bold text-gray-700 dark:text-gray-300">Description</label>
                            <textarea
                                id="description"
                                placeholder="Brief description of when to use this strategy..."
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white min-h-[80px]"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label htmlFor="rules" className="text-sm font-bold text-gray-700 dark:text-gray-300">Rules & Confirmation</label>
                            <textarea
                                id="rules"
                                placeholder="- 4h Trend aligned&#10;- RSI < 30&#10;- Bullish engulfing pattern"
                                className="w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-white/5 px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-gray-400 dark:placeholder:text-gray-500 text-gray-900 dark:text-white min-h-[120px] font-mono"
                                value={formData.rules}
                                onChange={(e) => setFormData({ ...formData, rules: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="flex justify-end gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-[#00b078] text-white">
                            {isLoading ? "Saving..." : "Save Strategy"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
