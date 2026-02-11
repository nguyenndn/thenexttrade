"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { BookOpen, Users, Hash, Plus, X } from "lucide-react";
import PreviewPanel from "@/components/admin/ai/shared/PreviewPanel";
import AIGenerationStatus from "@/components/admin/ai/shared/AIGenerationStatus";
import { toast } from "sonner";
import { StructureGenerationResponse } from "@/lib/ai/types";
import { saveStructure } from "@/app/actions/ai";
import { useRouter } from "next/navigation";

export default function CreateLevelModal() {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"form" | "preview">("form");
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        topic: "",
        targetAudience: "beginner" as "beginner" | "intermediate" | "advanced",
        numItems: 4,
    });

    const [result, setResult] = useState<StructureGenerationResponse | null>(null);

    const handleGenerate = async () => {
        if (!formData.topic) return toast.error("Please enter a topic");

        setGenerating(true);
        setStep("preview"); // Switch to preview immediately to show loading state
        setResult(null);

        try {
            const res = await fetch("/api/ai/generate-structure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "level",
                    ...formData
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || "Generation failed");

            setResult(data.data);
            toast.success("Level structure generated!");
        } catch (error: any) {
            toast.error(error.message);
            setStep("form"); // Go back to form on error
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);
        const toastId = toast.loading("Saving level to database...");

        try {
            const res = await saveStructure(result, "level", undefined);

            if (res.success) {
                toast.success("Level created successfully!", { id: toastId });
                setOpen(false);
                resetForm();
                router.refresh();
            } else {
                toast.error(`Save failed: ${res.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error("An unexpected error occurred", { id: toastId });
        } finally {
            setSaving(false);
        }
    };

    const resetForm = () => {
        setStep("form");
        setResult(null);
        setFormData({
            topic: "",
            targetAudience: "beginner",
            numItems: 4
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#00a872] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/30 hover:-translate-y-1 active:scale-95 active:translate-y-0">
                    <Plus size={18} strokeWidth={2.5} />
                    New Level
                </Button>
            </DialogTrigger>
            <DialogContent hideCloseButton className="max-w-4xl bg-transparent border-none p-0 shadow-none">
                <div className="relative">
                    {/* Close button outside for cleaner look */}
                    <button
                        onClick={() => setOpen(false)}
                        className="absolute -top-10 right-0 text-white/50 hover:text-white transition-colors"
                    >
                        <X size={24} />
                    </button>

                    {step === "form" && (
                        <PremiumCard className="p-8 animate-in zoom-in-95 duration-200">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">✨ Generate New Level with AI</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Describe your course level, and AI will structure the modules for you.
                                </p>
                            </div>

                            <div className="space-y-6">
                                <PremiumInput
                                    label="Level Topic"
                                    placeholder="Technical Analysis, Risk Management..."
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                    icon={BookOpen}
                                    autoFocus
                                />

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Target Audience</label>
                                    <div className="grid grid-cols-3 gap-3">
                                        {(["beginner", "intermediate", "advanced"] as const).map((type) => (
                                            <div
                                                key={type}
                                                onClick={() => setFormData({ ...formData, targetAudience: type })}
                                                className={`cursor-pointer rounded-xl p-3 border-2 text-center transition-all ${formData.targetAudience === type
                                                    ? "border-primary bg-primary/5 text-primary"
                                                    : "border-gray-100 dark:border-white/5 bg-gray-50 dark:bg-white/5 text-gray-500 hover:border-gray-200"
                                                    }`}
                                            >
                                                <span className="capitalize font-semibold text-sm">{type}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <PremiumInput
                                    label="Number of Modules"
                                    type="number"
                                    min={1}
                                    max={10}
                                    value={formData.numItems}
                                    onChange={(e) => setFormData({ ...formData, numItems: parseInt(e.target.value) || 4 })}
                                    icon={Hash}
                                />

                                <div className="pt-4 flex items-center justify-between">
                                    <div className="text-xs text-gray-400 flex items-center">
                                        <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                                        AI Provider: GitHub Models (Free)
                                    </div>
                                    <div className="flex space-x-3">
                                        <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
                                        <Button
                                            className="bg-primary hover:bg-[#00a872] text-white font-bold"
                                            onClick={handleGenerate}
                                        >
                                            Generate Level
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    )}

                    {step === "preview" && (
                        <PreviewPanel
                            title={generating ? "Generating Level..." : "Review & Save Level"}
                            isLoading={generating}
                            onSave={result ? handleSave : undefined}
                            isSaving={saving}
                            onRegenerate={generating ? undefined : handleGenerate}
                            onEdit={() => setStep("form")}
                        >
                            {generating ? (
                                <AIGenerationStatus isGenerating={true} />
                            ) : result ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    {/* Level Info */}
                                    <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                                        <h3 className="text-xl font-bold text-primary mb-1">{result.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">{result.description}</p>
                                    </div>

                                    {/* Modules List */}
                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Proposed Modules</h4>
                                        {result.items.map((item, idx) => (
                                            <div key={idx} className="bg-white dark:bg-[#0F1117] p-4 rounded-xl border border-gray-200 dark:border-white/5 flex justify-between items-start shadow-sm">
                                                <div>
                                                    <div className="flex items-center space-x-2">
                                                        <span className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-xs font-mono font-bold text-gray-500">
                                                            {idx + 1}
                                                        </span>
                                                        <h4 className="font-bold text-gray-900 dark:text-white">{item.title}</h4>
                                                    </div>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 ml-8">{item.description}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ) : null}
                        </PreviewPanel>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
