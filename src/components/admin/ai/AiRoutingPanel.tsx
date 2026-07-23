"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Route, Power } from "lucide-react";
import { format } from "date-fns";
import { createAiRoutingPolicy } from "@/actions/admin/ai-gateway";
import { AI_TASK_KEYS } from "@/lib/ai-gateway/task-keys";
import { toast } from "sonner";

export function AiRoutingPanel({
    policies,
    models = [],
}: {
    policies: any[];
    models?: any[];
}) {
    const searchParams = useSearchParams();
    const router = useRouter();
    const isAdding = searchParams.get("add") === "true";

    const setIsAdding = (val: boolean) => {
        if (val) {
            router.push("/admin/ai/routes?add=true");
        } else {
            router.push("/admin/ai/routes");
        }
    };

    const [form, setForm] = useState({
        name: "",
        mode: "FIXED",
        scopeType: "GLOBAL",
        scopeValue: "",
        primaryModelId: "",
        fallbackConfigJson: [] as string[],
        timeoutMs: 30000,
        maxAttempts: 3,
    });

    // Handle multiple select for fallbacks
    const handleFallbackChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selected = Array.from(
            e.target.selectedOptions,
            (option) => option.value
        );
        setForm({ ...form, fallbackConfigJson: selected });
    };

    const handleCreate = async () => {
        try {
            await createAiRoutingPolicy(form);
            toast.success("Routing Policy created successfully");
            setIsAdding(false);
            window.location.reload();
        } catch {
            toast.error("Failed to create routing policy");
        }
    };

    return (
        <div className="space-y-4">
            {isAdding && (
                <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm">
                    <h3 className="text-gray-900 dark:text-white font-medium mb-4">
                        New Routing Policy
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Policy Name
                            </label>
                            <input
                                placeholder="e.g. Default Free Tier"
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                value={form.name}
                                onChange={(e) =>
                                    setForm({ ...form, name: e.target.value })
                                }
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Scope Type
                            </label>
                            <select
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                value={form.scopeType}
                                onChange={(e) =>
                                    setForm({ ...form, scopeType: e.target.value })
                                }
                            >
                                <option value="GLOBAL">Global (Default for all tasks)</option>
                                <option value="TASK">Task Specific</option>
                            </select>
                        </div>
                        {form.scopeType === "TASK" && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Task Key
                                </label>
                                <select
                                    className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                    value={form.scopeValue}
                                    onChange={(e) =>
                                        setForm({ ...form, scopeValue: e.target.value })
                                    }
                                >
                                    <option value="">Select Task Key...</option>
                                    {AI_TASK_KEYS.map((task) => (
                                        <option key={task.key} value={task.key}>
                                            {task.key} ({task.label})
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Routing Mode
                            </label>
                            <select
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                value={form.mode}
                                onChange={(e) =>
                                    setForm({ ...form, mode: e.target.value })
                                }
                            >
                                <option value="FIXED">
                                    Fixed (Single Model)
                                </option>
                                <option value="AUTO_FAILOVER">
                                    Auto Failover
                                </option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Primary Model
                            </label>
                            <select
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                value={form.primaryModelId}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        primaryModelId: e.target.value,
                                    })
                                }
                            >
                                <option value="">Select a Model</option>
                                {models.map((m) => (
                                    <option key={m.id} value={m.id}>
                                        {m.provider.displayName} -{" "}
                                        {m.displayName}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Timeout (ms)
                            </label>
                            <input
                                type="number"
                                className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                value={form.timeoutMs}
                                onChange={(e) =>
                                    setForm({
                                        ...form,
                                        timeoutMs: parseInt(e.target.value),
                                    })
                                }
                            />
                        </div>
                        {form.mode === "AUTO_FAILOVER" && (
                            <>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Fallback Models
                                    </label>
                                    <select
                                        multiple
                                        className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary min-h-[100px]"
                                        value={form.fallbackConfigJson}
                                        onChange={handleFallbackChange}
                                    >
                                        {models
                                            .filter(
                                                (m) =>
                                                    m.id !== form.primaryModelId
                                            )
                                            .map((m) => (
                                                <option key={m.id} value={m.id}>
                                                    {m.provider.displayName} -{" "}
                                                    {m.displayName}
                                                </option>
                                            ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                        Max Attempts
                                    </label>
                                    <input
                                        type="number"
                                        className="w-full bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                        value={form.maxAttempts}
                                        onChange={(e) =>
                                            setForm({
                                                ...form,
                                                maxAttempts: parseInt(
                                                    e.target.value
                                                ),
                                            })
                                        }
                                    />
                                </div>
                            </>
                        )}
                    </div>
                    <div className="flex justify-end gap-2">
                        <button
                            onClick={() => setIsAdding(false)}
                            className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleCreate}
                            className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm"
                        >
                            Save Policy
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-4">
                {policies.map((policy) => (
                    <div
                        key={policy.id}
                        className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 shadow-sm"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center text-purple-600 dark:text-purple-500">
                                    <Route className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="text-gray-900 dark:text-white font-semibold text-lg">
                                        {policy.name}
                                    </h3>
                                    <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 mt-1">
                                        <span className="font-mono">
                                            v{policy.version}
                                        </span>
                                        <span>•</span>
                                        <span className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-lg text-xs font-semibold">
                                            {policy.mode}
                                        </span>
                                        <span>•</span>
                                        <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg text-xs font-bold">
                                            {policy.scopeType === "TASK" && policy.scopeValue ? `TASK: ${policy.scopeValue}` : "GLOBAL"}
                                        </span>
                                    </div>
                                </div>
                            </div>
                            <span
                                className={`px-2 py-1 rounded-lg text-xs font-medium flex items-center ${policy.enabled ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-500" : "bg-gray-100 dark:bg-white/10 text-gray-500 dark:text-gray-400"}`}
                            >
                                <Power className="w-3 h-3 mr-1" />{" "}
                                {policy.enabled ? "Enabled" : "Disabled"}
                            </span>
                        </div>

                        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 md:grid-cols-5 gap-4">
                            <div className="col-span-2">
                                <p className="text-xs text-gray-500 mb-1">
                                    Models
                                </p>
                                <div className="text-sm text-gray-900 dark:text-white flex flex-wrap gap-1">
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded border border-primary/20">
                                        {models.find(
                                            (m) =>
                                                m.id === policy.primaryModelId
                                        )?.displayName || "Unknown Model"}
                                    </span>
                                    {policy.mode === "AUTO_FAILOVER" &&
                                        Array.isArray(
                                            policy.fallbackConfigJson
                                        ) &&
                                        policy.fallbackConfigJson.map(
                                            (id: string, idx: number) => {
                                                const fallbackModel =
                                                    models.find(
                                                        (m) => m.id === id
                                                    );
                                                return (
                                                    <span
                                                        key={idx}
                                                        className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded text-gray-600 dark:text-gray-300"
                                                    >
                                                        {fallbackModel
                                                            ? fallbackModel.displayName
                                                            : "Unknown"}
                                                    </span>
                                                );
                                            }
                                        )}
                                </div>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">
                                    Timeout
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {policy.timeoutMs}ms
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">
                                    Max Attempts
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {policy.maxAttempts}
                                </p>
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 mb-1">
                                    Last Updated
                                </p>
                                <p className="text-sm text-gray-900 dark:text-white">
                                    {format(
                                        new Date(policy.updatedAt),
                                        "MMM d, yyyy HH:mm"
                                    )}
                                </p>
                            </div>
                        </div>
                    </div>
                ))}
                {policies.length === 0 && (
                    <div className="text-center py-12 text-sm text-gray-500 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                        No routing policies configured. The system will use
                        default routing.
                    </div>
                )}
            </div>
        </div>
    );
}
