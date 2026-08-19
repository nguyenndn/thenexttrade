"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
    Power,
    Cpu,
    Settings,
    RefreshCw,
    Eye,
    EyeOff,
    ChevronDown,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
    createAiProvider,
    toggleAiProvider,
    updateAiProvider,
    addAiCredential,
    testAiCredential,
    activateAiCredential,
    syncOpenRouterModels,
    getProviderActiveKey,
} from "@/actions/admin/ai-gateway";
import { toast } from "sonner";
import { format } from "date-fns";

const FALLBACK_MODELS = [
    {
        value: "deepseek/deepseek-chat",
        label: "DeepSeek Chat (deepseek/deepseek-chat)",
    },
    {
        value: "deepseek/deepseek-r1",
        label: "DeepSeek R1 (deepseek/deepseek-r1)",
    },
    {
        value: "google/gemini-2.5-flash",
        label: "Google Gemini 2.5 Flash (google/gemini-2.5-flash)",
    },
    {
        value: "anthropic/claude-3.5-sonnet",
        label: "Claude 3.5 Sonnet (anthropic/claude-3.5-sonnet)",
    },
    {
        value: "openai/gpt-4o-mini",
        label: "GPT-4o Mini (openai/gpt-4o-mini)",
    },
    { value: "x-ai/grok-2", label: "Grok 2 (x-ai/grok-2)" },
];

function defaultModelLabel(provider: any, id: string) {
    if (!id) return "-- Select Default Model --";
    const m = provider.models?.find((mm: any) => mm.modelCode === id);
    return m ? `${m.displayName} (${m.modelCode})` : `Current: ${id}`;
}

function sortProviders(list: any[]) {
    return [...list].sort((a, b) => {
        if (a.providerCode === "openrouter") return -1;
        if (b.providerCode === "openrouter") return 1;
        if (a.enabled && !b.enabled) return -1;
        if (!a.enabled && b.enabled) return 1;
        return a.providerEnum - b.providerEnum;
    });
}

export function AiProvidersPanel({
    initialProviders,
}: {
    initialProviders: any[];
}) {
    const router = useRouter();
    const [providers, setProviders] = useState(() => sortProviders(initialProviders));

    const [editingProviderId, setEditingProviderId] = useState<string | null>(
        null
    );
    const [showApiKey, setShowApiKey] = useState(false);
    const [initialApiKey, setInitialApiKey] = useState("");

    const [editProviderForm, setEditProviderForm] = useState({
        baseUrl: "",
        defaultModelId: "",
        timeoutMs: 30000,
        apiKey: "",
    });

    const handleOpenConfig = async (provider: any) => {
        if (editingProviderId === provider.id) {
            setEditingProviderId(null);
            return;
        }

        setEditingProviderId(provider.id);
        setShowApiKey(false);
        setEditProviderForm({
            baseUrl: provider.baseUrl || "",
            defaultModelId: provider.defaultModelId || "",
            timeoutMs: provider.timeoutMs || 30000,
            apiKey: "Loading...",
        });

        try {
            const activeKey = await getProviderActiveKey(provider.id);
            setEditProviderForm((prev) => ({
                ...prev,
                apiKey: activeKey || "",
            }));
            setInitialApiKey(activeKey || "");
        } catch {
            setEditProviderForm((prev) => ({
                ...prev,
                apiKey: "",
            }));
            setInitialApiKey("");
        }
    };

    const handleToggle = async (id: string, currentEnabled: boolean) => {
        try {
            await toggleAiProvider(id, !currentEnabled);
            toast.success("Provider status updated");
            window.location.reload();
        } catch {
            toast.error("Failed to update status");
        }
    };

    const handleUpdateProvider = async (id: string) => {
        try {
            await updateAiProvider(id, {
                baseUrl: editProviderForm.baseUrl,
                defaultModelId: editProviderForm.defaultModelId,
                timeoutMs: editProviderForm.timeoutMs,
            });

            if (
                editProviderForm.apiKey &&
                editProviderForm.apiKey.trim() !== "" &&
                editProviderForm.apiKey !== initialApiKey &&
                editProviderForm.apiKey !== "Loading..."
            ) {
                const dateStr = format(new Date(), "yyyy-MM-dd HH:mm");
                const credResult = await addAiCredential(
                    id,
                    `API Key (${dateStr})`,
                    editProviderForm.apiKey
                );
                if (credResult?.id) {
                    try {
                        await testAiCredential(credResult.id);
                        await activateAiCredential(credResult.id);
                        toast.success("API Key saved & activated successfully!");
                    } catch (testErr: any) {
                        toast.error(
                            "Key saved, but validation failed: " +
                                (testErr.message || "Invalid API Key")
                        );
                    }
                }
            } else {
                toast.success("Provider configuration updated");
            }

            setEditingProviderId(null);
            window.location.reload();
        } catch (err: any) {
            toast.error(
                "Failed to update provider: " +
                    (err.message || "Unknown error")
            );
        }
    };

    const handleTestKey = async (credentialId: string) => {
        try {
            await testAiCredential(credentialId);
            toast.success("API Key tested successfully");
            window.location.reload();
        } catch {
            toast.error("API Key test failed");
        }
    };

    const handleTestAndActivateKey = async (credentialId: string) => {
        try {
            await testAiCredential(credentialId);
            await activateAiCredential(credentialId);
            toast.success("API Key tested & activated successfully!");
            window.location.reload();
        } catch (err: any) {
            toast.error("Failed to test and activate key: " + (err.message || "Invalid Key"));
        }
    };

    const [isSyncingModels, setIsSyncingModels] = useState(false);

    const handleSyncCatalog = async () => {
        setIsSyncingModels(true);
        try {
            const res = await syncOpenRouterModels();
            toast.success(`OpenRouter models synced: ${res.totalSynced} total (${res.createdCount} new)`);
            window.location.reload();
        } catch (error: any) {
            toast.error(error.message || "Failed to sync OpenRouter models");
        } finally {
            setIsSyncingModels(false);
        }
    };

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4">
                {providers.map((provider) => {
                    const activeCred = provider.credentials.find(
                        (c: any) => c.status === "ACTIVE"
                    );

                    return (
                        <div
                            key={provider.id}
                            className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 space-y-4"
                        >
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-4">
                                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                        <Cpu className="w-5 h-5" />
                                    </div>
                                    <div>
                                        <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
                                            {provider.displayName}
                                            <span className="text-xs text-gray-500 font-mono">
                                                ({provider.providerCode})
                                            </span>
                                        </h3>
                                        <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                                            <span className="flex items-center gap-1.5">
                                                <div
                                                    className={`w-1.5 h-1.5 rounded-full ${provider.healthStatus === "HEALTHY" ? "bg-green-500 animate-pulse" : "bg-yellow-500"}`}
                                                />
                                                <span className="font-bold">
                                                    {provider.healthStatus}
                                                </span>
                                            </span>
                                            <span>•</span>
                                            <span>
                                                Enum: {provider.providerEnum}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    {provider.providerCode === "openrouter" && (
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            onClick={handleSyncCatalog}
                                            disabled={isSyncingModels}
                                            className="h-auto px-3 py-1.5 bg-primary/10 text-primary hover:bg-primary/20"
                                        >
                                            <RefreshCw className={`w-3.5 h-3.5 ${isSyncingModels ? "animate-spin" : ""}`} />
                                            {isSyncingModels ? "Syncing..." : "Sync Catalog"}
                                        </Button>
                                    )}
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() => handleOpenConfig(provider)}
                                        className={`h-auto px-3 py-1.5 ${editingProviderId === provider.id ? "bg-primary text-white shadow-sm shadow-primary/20" : "bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10"}`}
                                    >
                                        <Settings className="w-3.5 h-3.5" />
                                        Config
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        onClick={() =>
                                            handleToggle(
                                                provider.id,
                                                provider.enabled
                                            )
                                        }
                                        className={`h-auto px-3 py-1.5 ${provider.enabled ? "bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20" : "bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400"}`}
                                    >
                                        <Power className="w-3.5 h-3.5" />
                                        {provider.enabled
                                            ? "Enabled"
                                            : "Disabled"}
                                    </Button>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 dark:border-white/5" />

                            <div>
                                {/* Configuration details - always visible unless editing */}
                                {editingProviderId === provider.id ? (
                                    <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4">
                                        <h4 className="text-xs font-bold text-primary uppercase tracking-wider">
                                            Update Configuration
                                        </h4>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                                    Base URL
                                                </label>
                                                <input
                                                    placeholder="e.g. https://api.openai.com/v1"
                                                    className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                                    value={
                                                        editProviderForm.baseUrl
                                                    }
                                                    onChange={(e) =>
                                                        setEditProviderForm({
                                                            ...editProviderForm,
                                                            baseUrl:
                                                                e.target.value,
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                                    Default Model ID
                                                </label>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button
                                                            type="button"
                                                            variant="outline"
                                                            className="w-full justify-between h-auto bg-white dark:bg-[#151925] border-gray-200 dark:border-white/10 px-3 py-2 text-sm font-normal font-mono text-gray-900 dark:text-white hover:bg-white dark:hover:bg-[#151925] hover:border-gray-300 dark:hover:border-white/20"
                                                        >
                                                            <span className="truncate">
                                                                {defaultModelLabel(
                                                                    provider,
                                                                    editProviderForm.defaultModelId
                                                                )}
                                                            </span>
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
                                                                setEditProviderForm(
                                                                    {
                                                                        ...editProviderForm,
                                                                        defaultModelId:
                                                                            "",
                                                                    }
                                                                )
                                                            }
                                                        >
                                                            -- Select Default
                                                            Model --
                                                        </DropdownMenuItem>
                                                        {editProviderForm.defaultModelId &&
                                                            provider.models &&
                                                            !provider.models.some(
                                                                (m: any) =>
                                                                    m.modelCode ===
                                                                    editProviderForm.defaultModelId
                                                            ) && (
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        setEditProviderForm(
                                                                            {
                                                                                ...editProviderForm,
                                                                                defaultModelId:
                                                                                    editProviderForm.defaultModelId,
                                                                            }
                                                                        )
                                                                    }
                                                                >
                                                                    Current:{" "}
                                                                    {
                                                                        editProviderForm.defaultModelId
                                                                    }
                                                                </DropdownMenuItem>
                                                            )}
                                                        {provider.models &&
                                                        provider.models.length >
                                                            0 ? (
                                                            provider.models.map(
                                                                (m: any) => (
                                                                    <DropdownMenuItem
                                                                        key={
                                                                            m.id
                                                                        }
                                                                        onClick={() =>
                                                                            setEditProviderForm(
                                                                                {
                                                                                    ...editProviderForm,
                                                                                    defaultModelId:
                                                                                        m.modelCode,
                                                                                }
                                                                            )
                                                                        }
                                                                    >
                                                                        {
                                                                            m.displayName
                                                                        }{" "}
                                                                        (
                                                                        {
                                                                            m.modelCode
                                                                        }
                                                                        )
                                                                    </DropdownMenuItem>
                                                                )
                                                            )
                                                        ) : (
                                                            <>
                                                                {FALLBACK_MODELS.map(
                                                                    (fm) => (
                                                                        <DropdownMenuItem
                                                                            key={
                                                                                fm.value
                                                                            }
                                                                            onClick={() =>
                                                                                setEditProviderForm(
                                                                                    {
                                                                                        ...editProviderForm,
                                                                                        defaultModelId:
                                                                                            fm.value,
                                                                                    }
                                                                                )
                                                                            }
                                                                        >
                                                                            {
                                                                                fm.label
                                                                            }
                                                                        </DropdownMenuItem>
                                                                    )
                                                                )}
                                                            </>
                                                        )}
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                                    Timeout (ms)
                                                </label>
                                                <input
                                                    type="number"
                                                    className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                                                    value={
                                                        editProviderForm.timeoutMs
                                                    }
                                                    onChange={(e) =>
                                                        setEditProviderForm({
                                                            ...editProviderForm,
                                                            timeoutMs: parseInt(
                                                                e.target.value
                                                            ),
                                                        })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">
                                                    API Key (Secret)
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type={showApiKey ? "text" : "password"}
                                                        placeholder="Enter key to save/update"
                                                        className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl pl-3 pr-10 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary font-mono"
                                                        value={
                                                            editProviderForm.apiKey
                                                        }
                                                        onChange={(e) =>
                                                            setEditProviderForm({
                                                                ...editProviderForm,
                                                                apiKey: e.target
                                                                    .value,
                                                            })
                                                        }
                                                    />
                                                    <button
                                                        type="button"
                                                        onClick={() => setShowApiKey(!showApiKey)}
                                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors"
                                                        title={showApiKey ? "Hide API Key" : "Show API Key"}
                                                    >
                                                        {showApiKey ? (
                                                            <EyeOff className="w-4 h-4" />
                                                        ) : (
                                                            <Eye className="w-4 h-4" />
                                                        )}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                onClick={() =>
                                                    setEditingProviderId(null)
                                                }
                                                className="h-auto px-4 py-2 font-semibold"
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="primary"
                                                onClick={() =>
                                                    handleUpdateProvider(
                                                        provider.id
                                                    )
                                                }
                                            >
                                                Save Config
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">
                                                Base URL
                                            </p>
                                            <p
                                                className="text-sm text-gray-900 dark:text-white font-medium truncate"
                                                title={provider.baseUrl}
                                            >
                                                {provider.baseUrl || (
                                                    <span className="text-gray-400 dark:text-gray-500 italic font-normal">
                                                        Default
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">
                                                Default Model
                                            </p>
                                            <p className="text-sm text-gray-900 dark:text-white font-mono font-medium">
                                                {provider.defaultModelId || (
                                                    <span className="text-gray-400 dark:text-gray-500 italic font-normal">
                                                        None
                                                    </span>
                                                )}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">
                                                Timeout
                                            </p>
                                            <p className="text-sm text-gray-900 dark:text-white font-medium">
                                                {provider.timeoutMs}ms
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">
                                                Active API Key
                                            </p>
                                            {activeCred ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-sm text-gray-900 dark:text-white font-mono font-medium">
                                                        ••••{" "}
                                                        {activeCred.lastFour}
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleTestKey(
                                                                activeCred.id
                                                            )
                                                        }
                                                        className="text-[10px] text-primary hover:underline font-bold transition-colors"
                                                    >
                                                        Test Key
                                                    </button>
                                                </div>
                                            ) : provider.credentials && provider.credentials.length > 0 ? (
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <span className="text-xs font-mono text-yellow-600 dark:text-yellow-400">
                                                        •••• {provider.credentials[0].lastFour} ({provider.credentials[0].status})
                                                    </span>
                                                    <button
                                                        onClick={() =>
                                                            handleTestAndActivateKey(
                                                                provider.credentials[0].id
                                                            )
                                                        }
                                                        className="text-[10px] bg-primary/10 text-primary px-2 py-0.5 rounded-lg hover:bg-primary/20 font-bold transition-colors"
                                                    >
                                                        Test & Activate
                                                    </button>
                                                </div>
                                            ) : (
                                                <span className="text-xs text-red-500 font-bold">
                                                    Not Configured
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    );
                })}
                {providers.length === 0 && (
                    <div className="text-center py-12 text-sm text-gray-500 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
                        No AI Providers configured yet.
                    </div>
                )}
            </div>
        </div>
    );
}
