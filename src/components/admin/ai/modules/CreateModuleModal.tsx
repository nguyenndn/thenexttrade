"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { BookOpen, Hash, Plus, X } from "lucide-react";
import PreviewPanel from "@/components/admin/ai/shared/PreviewPanel";
import AIGenerationStatus from "@/components/admin/ai/shared/AIGenerationStatus";
import { toast } from "sonner";
import { StructureGenerationResponse } from "@/lib/ai/types";
import { saveStructure } from "@/app/actions/ai";
import { useRouter } from "next/navigation";

interface CreateModuleModalProps {
    levelId: string;
    levelTitle: string;
}

export default function CreateModuleModal({ levelId, levelTitle }: CreateModuleModalProps) {
    const [open, setOpen] = useState(false);
    const [step, setStep] = useState<"form" | "preview">("form");
    const [generating, setGenerating] = useState(false);
    const [saving, setSaving] = useState(false);
    const router = useRouter();

    const [formData, setFormData] = useState({
        topic: "",
        numItems: 8,
    });

    const [result, setResult] = useState<StructureGenerationResponse | null>(null);

    const handleGenerate = async () => {
        if (!formData.topic) return toast.error("Please enter a topic");

        setGenerating(true);
        setStep("preview");
        setResult(null);

        try {
            const res = await fetch("/api/ai/generate-structure", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    type: "module",
                    levelTitle: levelTitle, // Pass context if API supports it
                    ...formData,
                    targetAudience: "intermediate", // Inherit or default
                }),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || "Generation failed");

            setResult(data.data);
            toast.success("Module structure generated!");
        } catch (error: any) {
            toast.error(error.message);
            setStep("form");
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        setSaving(true);
        const toastId = toast.loading("Saving module to database...");

        try {
            const res = await saveStructure(result, "module", levelId);

            if (res.success) {
                toast.success("Module created successfully!", { id: toastId });
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
            numItems: 8
        });
    }

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="w-full sm:w-auto rounded-xl shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0">
                    <Plus size={18} strokeWidth={2.5} />
                    Add Module
                </Button>
            </DialogTrigger>
            <DialogContent hideCloseButton className="max-w-4xl bg-transparent border-none p-0 shadow-none">
                <div className="relative">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setOpen(false)}
                        className="absolute -top-10 right-0 text-white/50 hover:text-white hover:bg-transparent transition-colors rounded-lg"
                    >
                        <X size={24} />
                    </Button>

                    {step === "form" && (
                        <PremiumCard className="p-8 animate-in zoom-in-95 duration-200">
                            <div className="mb-8">
                                <h2 className="text-2xl font-bold text-gray-900 dark:text-white">✨ Generate New Module</h2>
                                <p className="text-gray-500 dark:text-gray-400 mt-1">
                                    Adding to Level: <span className="font-bold text-primary">{levelTitle}</span>
                                </p>
                            </div>

                            <div className="space-y-6">
                                <PremiumInput
                                    label="Module Topic"
                                    placeholder="Fibonacci Retracements"
                                    value={formData.topic}
                                    onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                                    icon={BookOpen}
                                    autoFocus
                                />

                                <PremiumInput
                                    label="Number of Lessons"
                                    type="number"
                                    min={1}
                                    max={15}
                                    value={formData.numItems}
                                    onChange={(e) => setFormData({ ...formData, numItems: parseInt(e.target.value) || 8 })}
                                    icon={Hash}
                                />

                                <div className="pt-4 flex items-center justify-between">
                                    <div className="text-xs text-gray-400 flex items-center">
                                        <span className="w-2 h-2 bg-primary rounded-full mr-2"></span>
                                        AI Provider: GitHub Models
                                    </div>
                                    <div className="flex space-x-3">
                                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                                        <Button
                                            className="bg-primary hover:bg-[#00a872] text-white font-bold"
                                            onClick={handleGenerate}
                                        >
                                            Generate Module
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </PremiumCard>
                    )}

                    {step === "preview" && (
                        <PreviewPanel
                            title={generating ? "Generating Module..." : "Review & Save Module"}
                            isLoading={generating}
                            onSave={result ? handleSave : undefined}
                            isSaving={saving}
                            onRegenerate={generating ? undefined : handleGenerate}
                            onEdit={() => setStep("form")}
                        >
                            {generating ? (
                                <AIGenerationStatus isGenerating={true} estimatedTime="5 seconds" />
                            ) : result ? (
                                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                    <div className="bg-primary/10 p-4 rounded-xl border border-primary/20">
                                        <h3 className="text-xl font-bold text-primary mb-1">{result.title}</h3>
                                        <p className="text-gray-600 dark:text-gray-300 text-sm">{result.description}</p>
                                    </div>

                                    <div className="space-y-3">
                                        <h4 className="text-sm font-bold text-gray-500 uppercase tracking-wider">Proposed Lessons</h4>
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
                                                <span className="text-xs bg-gray-100 dark:bg-white/5 px-2 py-1 rounded text-gray-400">
                                                    {item.duration} min
                                                </span>
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
