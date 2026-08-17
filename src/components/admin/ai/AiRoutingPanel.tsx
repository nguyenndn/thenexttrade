"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Route, Power, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
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

    // Lookups for dropdown display values
    const selectedTask = AI_TASK_KEYS.find(
        (t) => t.key === form.scopeValue
    );
    const selectedModel = models.find(
        (m) => m.id === form.primaryModelId
    );

    // Toggle a fallback model for AUTO_FAILOVER multi-select
    const toggleFallback = (modelId: string, checked: boolean) => {
        setForm({
            ...form,
            fallbackConfigJson: checked
                ? [...form.fallbackConfigJson, modelId]
                : form.fallbackConfigJson.filter((id) => id !== modelId),
        });
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
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between h-auto bg-gray-50 dark:bg-[#151925] border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-normal text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#151925] hover:border-gray-300 dark:hover:border-white/20"
                                    >
                                        {form.scopeType === "GLOBAL"
                                            ? "Global (Default for all tasks)"
                                            : "Task Specific"}
                                        <ChevronDown
                                            size={16}
                                            className="shrink-0 opacity-60"
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                scopeType: "GLOBAL",
                                            })
                                        }
                                    >
                                        Global (Default for all tasks)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                scopeType: "TASK",
                                            })
                                        }
                                    >
                                        Task Specific
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        {form.scopeType === "TASK" && (
                            <div>
                                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                    Task Key
                                </label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            className="w-full justify-between h-auto bg-gray-50 dark:bg-[#151925] border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-normal text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#151925] hover:border-gray-300 dark:hover:border-white/20"
                                        >
                                            {selectedTask ? (
                                                <span className="truncate">
                                                    {selectedTask.key} (
                                                    {selectedTask.label})
                                                </span>
                                            ) : (
                                                <span className="text-gray-400 dark:text-gray-500">
                                                    Select Task Key...
                                                </span>
                                            )}
                                            <ChevronDown
                                                size={16}
                                                className="shrink-0 opacity-60"
                                            />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent
                                        align="start"
                                        className="max-h-[250px] overflow-y-auto"
                                    >
                                        <DropdownMenuItem
                                            onClick={() =>
                                                setForm({
                                                    ...form,
                                                    scopeValue: "",
                                                })
                                            }
                                        >
                                            Select Task Key...
                                        </DropdownMenuItem>
                                        {AI_TASK_KEYS.map((task) => (
                                            <DropdownMenuItem
                                                key={task.key}
                                                onClick={() =>
                                                    setForm({
                                                        ...form,
                                                        scopeValue: task.key,
                                                    })
                                                }
                                            >
                                                {task.key} ({task.label})
                                            </DropdownMenuItem>
                                        ))}
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )}
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Routing Mode
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between h-auto bg-gray-50 dark:bg-[#151925] border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-normal text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#151925] hover:border-gray-300 dark:hover:border-white/20"
                                    >
                                        {form.mode === "FIXED"
                                            ? "Fixed (Single Model)"
                                            : "Auto Failover"}
                                        <ChevronDown
                                            size={16}
                                            className="shrink-0 opacity-60"
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start">
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setForm({ ...form, mode: "FIXED" })
                                        }
                                    >
                                        Fixed (Single Model)
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                mode: "AUTO_FAILOVER",
                                            })
                                        }
                                    >
                                        Auto Failover
                                    </DropdownMenuItem>
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                                Primary Model
                            </label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="w-full justify-between h-auto bg-gray-50 dark:bg-[#151925] border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-normal text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#151925] hover:border-gray-300 dark:hover:border-white/20"
                                    >
                                        {selectedModel ? (
                                            <span className="truncate">
                                                {selectedModel.provider
                                                    .displayName}{" "}
                                                - {selectedModel.displayName}
                                            </span>
                                        ) : (
                                            <span className="text-gray-400 dark:text-gray-500">
                                                Select a Model
                                            </span>
                                        )}
                                        <ChevronDown
                                            size={16}
                                            className="shrink-0 opacity-60"
                                        />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent
                                    align="start"
                                    className="max-h-[250px] overflow-y-auto"
                                >
                                    <DropdownMenuItem
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                primaryModelId: "",
                                            })
                                        }
                                    >
                                        Select a Model
                                    </DropdownMenuItem>
                                    {models.map((m) => (
                                        <DropdownMenuItem
                                            key={m.id}
                                            onClick={() =>
                                                setForm({
                                                    ...form,
                                                    primaryModelId: m.id,
                                                })
                                            }
                                        >
                                            {m.provider.displayName} -{" "}
                                            {m.displayName}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
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
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                className="w-full justify-between h-auto bg-gray-50 dark:bg-[#151925] border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-normal text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-[#151925] hover:border-gray-300 dark:hover:border-white/20"
                                            >
                                                {form.fallbackConfigJson.length >
                                                0 ? (
                                                    <span className="truncate">
                                                        {
                                                            form
                                                                .fallbackConfigJson
                                                                .length
                                                        }{" "}
                                                        model
                                                        {form
                                                            .fallbackConfigJson
                                                            .length > 1
                                                            ? "s"
                                                            : ""}{" "}
                                                        selected
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 dark:text-gray-500">
                                                        Select fallback models...
                                                    </span>
                                                )}
                                                <ChevronDown
                                                    size={16}
                                                    className="shrink-0 opacity-60"
                                                />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent
                                            align="start"
                                            className="max-h-[250px] overflow-y-auto"
                                        >
                                            {models
                                                .filter(
                                                    (m) =>
                                                        m.id !==
                                                        form.primaryModelId
                                                )
                                                .map((m) => (
                                                    <DropdownMenuCheckboxItem
                                                        key={m.id}
                                                        checked={form.fallbackConfigJson.includes(
                                                            m.id
                                                        )}
                                                        onCheckedChange={(checked) =>
                                                            toggleFallback(
                                                                m.id,
                                                                checked
                                                            )
                                                        }
                                                    >
                                                        {m.provider.displayName}{" "}
                                                        - {m.displayName}
                                                    </DropdownMenuCheckboxItem>
                                                ))}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
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
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setIsAdding(false)}
                            className="h-auto px-4 py-2 text-sm font-semibold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="primary"
                            onClick={handleCreate}
                        >
                            Save Policy
                        </Button>
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
                                    <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-lg border border-primary/20">
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
                                                        className="bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-lg text-gray-600 dark:text-gray-300"
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
