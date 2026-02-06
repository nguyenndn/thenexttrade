"use client";

import { useState } from "react";
// import { Card } from "@/components/ui/Card";
// import { Input } from "@/components/ui/Input";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import { BookOpen, Users, Hash } from "lucide-react";
import PreviewPanel from "./PreviewPanel";
import { StructureGenerationResponse } from "@/lib/ai/types";
import { toast } from "sonner"; // Assuming sonner is installed from package.json

export default function StructureGenerator() {
    const [formData, setFormData] = useState({
        type: "level" as "level" | "module",
        topic: "",
        targetAudience: "beginner" as "beginner" | "intermediate" | "advanced",
        numItems: 4,
    });

    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<StructureGenerationResponse | null>(null);

    const handleGenerate = async () => {
        if (!formData.topic) return toast.error("Please enter a topic");

        setGenerating(true);
        setResult(null);

        try {
            const res = await fetch("/api/ai/generate-structure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || "Generation failed");

            setResult(data.data);
            toast.success("Structure generated!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;

        // For MVP validation: If type is module, warn user (selector not implemented yet)
        if (formData.type === "module") {
            toast.error("Saving Modules requires selecting a parent Level. Feature coming soon.");
            return;
        }

        const toastId = toast.loading("Saving structure...");
        try {
            const { saveStructure } = await import("@/app/actions/ai");
            const res = await saveStructure(result, formData.type, undefined);

            if (res.success) {
                toast.success("Structure saved to database!", { id: toastId });
            } else {
                toast.error(`Save failed: ${res.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error("An unexpected error occurred", { id: toastId });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[600px]">
            {/* Left: Input Form */}
            <PremiumCard className="p-8 space-y-8" variant="glass">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Configuration</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Define the parameters for your course structure.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Generate Type</label>
                        <div className="flex gap-4">
                            <label className={`flex-1 cursor-pointer group`}>
                                <input
                                    type="radio"
                                    className="peer sr-only"
                                    checked={formData.type === "level"}
                                    onChange={() => setFormData({ ...formData, type: "level" })}
                                />
                                <div className="p-4 rounded-2xl border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-[#151925] peer-checked:border-[#00C888] peer-checked:bg-[#00C888]/5 transition-all text-center">
                                    <span className="font-bold text-gray-700 dark:text-white peer-checked:text-[#00C888]">Level</span>
                                    <span className="block text-xs text-gray-400 mt-1">Generates Modules</span>
                                </div>
                            </label>

                            <label className={`flex-1 cursor-pointer group`}>
                                <input
                                    type="radio"
                                    className="peer sr-only"
                                    checked={formData.type === "module"}
                                    onChange={() => setFormData({ ...formData, type: "module" })}
                                />
                                <div className="p-4 rounded-2xl border-2 border-gray-100 dark:border-white/5 bg-white dark:bg-[#151925] peer-checked:border-[#00C888] peer-checked:bg-[#00C888]/5 transition-all text-center">
                                    <span className="font-bold text-gray-700 dark:text-white peer-checked:text-[#00C888]">Module</span>
                                    <span className="block text-xs text-gray-400 mt-1">Generates Lessons</span>
                                </div>
                            </label>
                        </div>
                    </div>

                    <PremiumInput
                        label="Topic"
                        placeholder="Technical Analysis, Risk Management..."
                        value={formData.topic}
                        onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        icon={BookOpen}
                    />

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Audience</label>
                        <div className="relative">
                            <Users size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                            <select
                                className="w-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium text-sm border border-gray-200 dark:border-white/10 rounded-lg pl-9 pr-4 py-2.5 focus:border-[#00C888] outline-none appearance-none transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                                value={formData.targetAudience}
                                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value as any })}
                            >
                                <option value="beginner">Beginner</option>
                                <option value="intermediate">Intermediate</option>
                                <option value="advanced">Advanced</option>
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-300 dark:border-gray-700 pl-3">
                                <span className="text-gray-400 text-[10px]">▼</span>
                            </div>
                        </div>
                    </div>

                    <PremiumInput
                        label={`Number of ${formData.type === "level" ? "Modules" : "Lessons"}`}
                        type="number"
                        min={1}
                        max={12}
                        value={formData.numItems}
                        onChange={(e) => setFormData({ ...formData, numItems: parseInt(e.target.value) || 4 })}
                        icon={Hash}
                    />

                    <Button
                        className="w-full py-3 bg-[#00C888] hover:bg-[#00a872] text-white font-bold text-sm rounded-2xl shadow-lg shadow-[#00C888]/30 hover:-translate-y-1 active:scale-95 transition-all"
                        onClick={handleGenerate}
                        isLoading={generating}
                    >
                        Generate Structure
                    </Button>
                </div>
            </PremiumCard>

            {/* Right: Preview */}
            <PreviewPanel
                title="2. Preview & Save"
                onSave={result ? handleSave : undefined}
                isLoading={generating}
            >
                {result ? (
                    <div className="space-y-4">
                        <div className="border-b border-gray-200 dark:border-gray-700 pb-2">
                            <h2 className="text-xl font-bold text-[#00C888]">{result.title}</h2>
                            <p className="text-gray-600 dark:text-gray-400 text-sm">{result.description}</p>
                        </div>
                        <div className="space-y-3">
                            {result.items.map((item, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#0F1117] p-3 rounded-lg border border-gray-200 dark:border-gray-800 flex justify-between items-start shadow-sm shadow-gray-100 dark:shadow-none">
                                    <div>
                                        <div className="flex items-center space-x-2">
                                            <span className="text-gray-400 dark:text-gray-500 font-mono text-sm">#{item.order}</span>
                                            <h4 className="font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                                        </div>
                                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{item.description}</p>
                                    </div>
                                    {item.duration && (
                                        <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-600 dark:text-gray-300 whitespace-nowrap font-medium border border-gray-100 dark:border-white/5">
                                            {item.duration} min
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-20">
                        <p>Ready to generate content.</p>
                        <p className="text-xs">Select options and click Generate.</p>
                    </div>
                )}
            </PreviewPanel>
        </div>
    );
}
