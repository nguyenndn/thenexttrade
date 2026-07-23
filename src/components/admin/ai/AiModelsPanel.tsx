"use client";

import { useState } from "react";
import { Cpu, Power, RefreshCw, Plus, Search } from "lucide-react";
import { toggleAiModel, createCustomAiModel, syncOpenRouterModels } from "@/actions/admin/ai-gateway";
import { toast } from "sonner";

export function AiModelsPanel({
    models,
    providers,
}: {
    models: any[];
    providers: any[];
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [isSyncing, setIsSyncing] = useState(false);
    const [isAddingCustom, setIsAddingCustom] = useState(false);
    const [customForm, setCustomForm] = useState({
        providerId: providers.find((p) => p.providerCode === "openrouter")?.id || providers[0]?.id || "",
        modelCode: "",
        displayName: "",
        contextLimit: 64000,
    });

    const handleToggle = async (id: string, currentEnabled: boolean) => {
        try {
            await toggleAiModel(id, !currentEnabled);
            toast.success("Model status updated");
            window.location.reload();
        } catch {
            toast.error("Failed to update model status");
        }
    };

    const handleSync = async () => {
        setIsSyncing(true);
        try {
            const res = await syncOpenRouterModels();
            toast.success(`Synced ${res.totalSynced} models (${res.createdCount} new, ${res.updatedCount} updated)`);
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Failed to sync OpenRouter models");
        } finally {
            setIsSyncing(false);
        }
    };

    const handleAddCustom = async () => {
        if (!customForm.modelCode || !customForm.displayName) {
            toast.error("Please enter both Model ID and Display Name");
            return;
        }
        try {
            await createCustomAiModel(customForm);
            toast.success("Custom model added successfully");
            setIsAddingCustom(false);
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Failed to add model");
        }
    };

    const filteredModels = models.filter(
        (m) =>
            m.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.modelCode.toLowerCase().includes(searchTerm.toLowerCase()) ||
            m.provider?.displayName?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-4">
            {/* Header & Controls */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="relative flex-1 max-w-md">
                    <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        placeholder="Search models by name, code or provider..."
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className="flex items-center gap-2">
                    <button
                        onClick={handleSync}
                        disabled={isSyncing}
                        className="px-3.5 py-2 bg-primary/10 hover:bg-primary/20 text-primary font-semibold text-xs rounded-xl flex items-center transition-colors disabled:opacity-50"
                    >
                        <RefreshCw className={`w-3.5 h-3.5 mr-1.5 ${isSyncing ? "animate-spin" : ""}`} />
                        {isSyncing ? "Syncing..." : "Sync OpenRouter Catalog"}
                    </button>
                    <button
                        onClick={() => setIsAddingCustom(!isAddingCustom)}
                        className="px-3.5 py-2 bg-primary hover:bg-primary/90 text-white font-semibold text-xs rounded-xl flex items-center transition-colors shadow-sm"
                    >
                        <Plus className="w-3.5 h-3.5 mr-1.5" />
                        Add Custom Model
                    </button>
                </div>
            </div>

            {/* Add Custom Model Modal/Panel */}
            {isAddingCustom && (
                <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 dark:text-white">
                        Add Custom AI Model
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1">
                                Provider
                            </label>
                            <select
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                value={customForm.providerId}
                                onChange={(e) => setCustomForm({ ...customForm, providerId: e.target.value })}
                            >
                                {providers.map((p) => (
                                    <option key={p.id} value={p.id}>
                                        {p.displayName} ({p.providerCode})
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1">
                                Model Code (ID)
                            </label>
                            <input
                                placeholder="e.g. deepseek/deepseek-r1"
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                value={customForm.modelCode}
                                onChange={(e) => setCustomForm({ ...customForm, modelCode: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1">
                                Display Name
                            </label>
                            <input
                                placeholder="e.g. DeepSeek R1"
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                value={customForm.displayName}
                                onChange={(e) => setCustomForm({ ...customForm, displayName: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 font-medium mb-1">
                                Context Limit (tokens)
                            </label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-sm text-gray-900 dark:text-white focus:outline-none focus:border-primary"
                                value={customForm.contextLimit}
                                onChange={(e) => setCustomForm({ ...customForm, contextLimit: parseInt(e.target.value) || 64000 })}
                            />
                        </div>
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAddingCustom(false)}
                            className="px-4 py-2 text-xs font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleAddCustom}
                            className="px-4 py-2 bg-primary hover:bg-primary/90 text-white font-bold text-xs rounded-xl shadow-sm"
                        >
                            Save Model
                        </button>
                    </div>
                </div>
            )}

            {/* Model List Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredModels.map((model) => (
                    <div
                        key={model.id}
                        className={`bg-white dark:bg-[#1E2028] border ${model.enabled ? "border-gray-200 dark:border-white/10" : "border-gray-100 dark:border-white/5 opacity-60"} rounded-xl p-4 shadow-sm hover:shadow-md transition-all space-y-3`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    <Cpu className="w-4 h-4" />
                                </div>
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 dark:text-white truncate max-w-[180px]" title={model.displayName}>
                                        {model.displayName}
                                    </h4>
                                    <p className="text-xs text-gray-400 font-mono truncate max-w-[180px]" title={model.modelCode}>
                                        {model.modelCode}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={() => handleToggle(model.id, model.enabled)}
                                className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center transition-all ${model.enabled ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20" : "bg-gray-100 dark:bg-white/5 text-gray-400"}`}
                            >
                                <Power className="w-3 h-3 mr-1" />
                                {model.enabled ? "Enabled" : "Disabled"}
                            </button>
                        </div>

                        <div className="border-t border-gray-100 dark:border-white/5 pt-3 grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-gray-400 block">Provider</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300">
                                    {model.provider?.displayName || "Unknown"}
                                </span>
                            </div>
                            <div>
                                <span className="text-gray-400 block">Context Window</span>
                                <span className="font-semibold text-gray-700 dark:text-gray-300 font-mono">
                                    {model.contextLimit ? `${Math.round(model.contextLimit / 1000)}k` : "64k"}
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {filteredModels.length === 0 && (
                <div className="text-center py-12 text-sm text-gray-500 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                    No models found matching your search.
                </div>
            )}
        </div>
    );
}
