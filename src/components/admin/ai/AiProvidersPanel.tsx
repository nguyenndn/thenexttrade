"use client";

import { useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Plus, Power, Cpu, Settings } from "lucide-react";
import { 
  createAiProvider, 
  toggleAiProvider, 
  updateAiProvider,
  addAiCredential, 
  testAiCredential
} from "@/actions/admin/ai-gateway";
import { toast } from "sonner";
import { format } from "date-fns";

export function AiProvidersPanel({ initialProviders }: { initialProviders: any[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const isAddingProvider = searchParams.get("add") === "true";

  const setIsAddingProvider = (val: boolean) => {
    if (val) {
      router.push("/admin/ai/providers?add=true");
    } else {
      router.push("/admin/ai/providers");
    }
  };

  const [providers, setProviders] = useState(initialProviders);
  const [newProvider, setNewProvider] = useState({ providerCode: "", displayName: "", providerEnum: 1 });
  
  const [editingProviderId, setEditingProviderId] = useState<string | null>(null);
  const [editProviderForm, setEditProviderForm] = useState({ baseUrl: "", defaultModelId: "", timeoutMs: 30000, apiKey: "" });

  const handleAddProvider = async () => {
    try {
      await createAiProvider({
        providerCode: newProvider.providerCode,
        displayName: newProvider.displayName,
        providerEnum: newProvider.providerEnum,
      });
      toast.success("Provider added successfully");
      setIsAddingProvider(false);
      window.location.reload();
    } catch (e) {
      toast.error("Failed to add provider");
    }
  };

  const handleToggle = async (id: string, enabled: boolean) => {
    try {
      await toggleAiProvider(id, !enabled);
      setProviders(providers.map(p => p.id === id ? { ...p, enabled: !enabled } : p));
      toast.success("Provider status updated");
    } catch (e) {
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

      if (editProviderForm.apiKey) {
        const dateStr = format(new Date(), "yyyy-MM-dd HH:mm");
        await addAiCredential(id, `API Key (${dateStr})`, editProviderForm.apiKey);
      }

      toast.success("Provider configuration updated");
      setEditingProviderId(null);
      window.location.reload();
    } catch (e) {
      toast.error("Failed to update provider");
    }
  };

  const handleTestKey = async (credentialId: string) => {
    try {
      await testAiCredential(credentialId);
      toast.success("API Key tested successfully");
      window.location.reload();
    } catch (e) {
      toast.error("API Key test failed");
    }
  };

  return (
    <div className="space-y-4">
      {isAddingProvider && (
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-5 mb-6 space-y-4 shadow-sm">
          <h3 className="text-gray-900 dark:text-white font-medium">New AI Provider</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input 
              placeholder="Display Name (e.g. OpenAI)" 
              className="bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
              value={newProvider.displayName} onChange={e => setNewProvider({...newProvider, displayName: e.target.value})}
            />
            <input 
              placeholder="Provider Code (e.g. openai)" 
              className="bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
              value={newProvider.providerCode} onChange={e => setNewProvider({...newProvider, providerCode: e.target.value})}
            />
            <input 
              type="number"
              placeholder="Enum Value (e.g. 1)" 
              className="bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-4 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
              value={newProvider.providerEnum} onChange={e => setNewProvider({...newProvider, providerEnum: parseInt(e.target.value)})}
            />
          </div>
          <div className="flex justify-end gap-3">
            <button onClick={() => setIsAddingProvider(false)} className="px-4 py-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors">Cancel</button>
            <button onClick={handleAddProvider} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors shadow-sm">Save Provider</button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4">
        {providers.map(provider => {
          const activeCred = provider.credentials.find((c: any) => c.status === 'ACTIVE');
          
          return (
            <div key={provider.id} className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl shadow-sm hover:shadow-md transition-shadow p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    <Cpu className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-gray-900 dark:text-white font-semibold flex items-center gap-2">
                      {provider.displayName} 
                      <span className="text-xs text-gray-500 font-mono">({provider.providerCode})</span>
                    </h3>
                    <div className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-2 mt-1">
                      <span className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${provider.healthStatus === 'HEALTHY' ? 'bg-green-500 animate-pulse' : 'bg-yellow-500'}`} />
                        <span className="font-bold">{provider.healthStatus}</span>
                      </span>
                      <span>•</span>
                      <span>Enum: {provider.providerEnum}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (editingProviderId === provider.id) {
                        setEditingProviderId(null);
                      } else {
                        setEditingProviderId(provider.id);
                        setEditProviderForm({
                          baseUrl: provider.baseUrl || "",
                          defaultModelId: provider.defaultModelId || "",
                          timeoutMs: provider.timeoutMs || 30000,
                          apiKey: "",
                        });
                      }
                    }}
                    className={`px-3 py-1.5 rounded-lg flex items-center text-xs font-semibold transition-all ${editingProviderId === provider.id ? 'bg-primary text-white shadow-sm shadow-primary/20' : 'bg-gray-100 dark:bg-white/5 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-white/10'}`}
                  >
                    <Settings className="w-3.5 h-3.5 mr-1" />
                    Config
                  </button>
                  <button 
                    onClick={() => handleToggle(provider.id, provider.enabled)}
                    className={`px-3 py-1.5 rounded-lg flex items-center text-xs font-semibold transition-all ${provider.enabled ? 'bg-green-50 dark:bg-green-500/10 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-500/20' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}
                  >
                    <Power className="w-3.5 h-3.5 mr-1" />
                    {provider.enabled ? "Enabled" : "Disabled"}
                  </button>
                </div>
              </div>
              
              <div className="border-t border-gray-100 dark:border-white/5" />
              
              <div>
                {/* Configuration details - always visible unless editing */}
                {editingProviderId === provider.id ? (
                  <div className="bg-primary/5 p-4 rounded-xl border border-primary/20 space-y-4">
                    <h4 className="text-xs font-bold text-primary uppercase tracking-wider">Update Configuration</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Base URL</label>
                        <input 
                          placeholder="e.g. https://api.openai.com/v1" 
                          className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                          value={editProviderForm.baseUrl} onChange={e => setEditProviderForm({...editProviderForm, baseUrl: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Default Model ID</label>
                        <input 
                          placeholder="e.g. gpt-4o" 
                          className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                          value={editProviderForm.defaultModelId} onChange={e => setEditProviderForm({...editProviderForm, defaultModelId: e.target.value})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">Timeout (ms)</label>
                        <input 
                          type="number"
                          className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                          value={editProviderForm.timeoutMs} onChange={e => setEditProviderForm({...editProviderForm, timeoutMs: parseInt(e.target.value)})}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-bold text-gray-500 dark:text-gray-400 mb-1">API Key (Secret)</label>
                        <input 
                          type="password"
                          placeholder="Enter new key to update" 
                          className="w-full bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl px-3 py-2 text-gray-900 dark:text-white text-sm focus:outline-none focus:border-primary"
                          value={editProviderForm.apiKey} onChange={e => setEditProviderForm({...editProviderForm, apiKey: e.target.value})}
                        />
                      </div>
                    </div>
                    <div className="flex justify-end gap-2">
                      <button onClick={() => setEditingProviderId(null)} className="px-4 py-2 rounded-xl text-xs text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors font-medium">Cancel</button>
                      <button onClick={() => handleUpdateProvider(provider.id)} className="bg-primary hover:bg-primary/90 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors">Save Config</button>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Base URL</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium truncate" title={provider.baseUrl}>{provider.baseUrl || <span className="text-gray-400 dark:text-gray-500 italic font-normal">Default</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Default Model</p>
                      <p className="text-sm text-gray-900 dark:text-white font-mono font-medium">{provider.defaultModelId || <span className="text-gray-400 dark:text-gray-500 italic font-normal">None</span>}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Timeout</p>
                      <p className="text-sm text-gray-900 dark:text-white font-medium">{provider.timeoutMs}ms</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wider mb-1">Active API Key</p>
                      {activeCred ? (
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm text-gray-900 dark:text-white font-mono font-medium">•••• {activeCred.lastFour}</span>
                          <button 
                            onClick={() => handleTestKey(activeCred.id)}
                            className="text-[10px] text-primary hover:underline font-bold transition-colors"
                          >
                            Test Key
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-red-500 font-bold">Not Configured</span>
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
