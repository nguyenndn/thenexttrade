"use client";

import { useState, useEffect } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
// import { Input } from "@/components/ui/Input";
import PreviewPanel from "./PreviewPanel";
import { LessonGenerationResponse } from "@/lib/ai/types";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

export default function LessonGenerator() {
    const [formData, setFormData] = useState({
        title: "",
        topic: "",
        level: "beginner" as "beginner" | "intermediate" | "advanced",
        length: "medium" as "short" | "medium" | "long",
        includeExamples: true,
    });

    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<LessonGenerationResponse | null>(null);

    const [modules, setModules] = useState<{ id: string; title: string; level: { title: string } }[]>([]);
    const [selectedModule, setSelectedModule] = useState("");

    // Fetch modules on mount
    useEffect(() => {
        const fetchModules = async () => {
            // Dynamic import to avoid server action issues in client component if checking types strictly
            // But usually we importing from @/app/actions/ai is fine if it has "use server"
            // For safety in this context I'll assume direct import works or use fetch if it was an API.
            // But here I'll try dynamic to be safe or just standard.
            // Actually, I can't put `import` inside `useEffect`. I'll put the logic here.
            try {
                // Using dynamic import for the action to ensure it's loaded
                const { getModulesForSelect } = await import("@/app/actions/ai");
                const res = await getModulesForSelect();
                if (res.success && res.data) {
                    setModules(res.data);
                }
            } catch (e) {
                console.error("Failed to fetch modules", e);
            }
        };
        fetchModules();
    }, []);

    const handleGenerate = async () => {
        if (!formData.title || !formData.topic) return toast.error("Please enter title and topic");

        setGenerating(true);
        setResult(null);

        try {
            const res = await fetch("/api/ai/generate-lesson", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || "Generation failed");

            setResult(data.data);
            toast.success("Lesson generated!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        if (!selectedModule) return toast.error("Please select a Module to save this lesson to");

        const toastId = toast.loading("Saving lesson...");
        try {
            const { saveLesson } = await import("@/app/actions/ai");
            const res = await saveLesson(result, selectedModule);

            if (res.success) {
                toast.success("Lesson saved to database!", { id: toastId });
            } else {
                toast.error(`Save failed: ${res.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error("An unexpected error occurred", { id: toastId });
        }
    };

    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[700px]">
            {/* Left: Input Form */}
            <PremiumCard className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar" variant="glass">
                <div>
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Lesson Configuration</h3>
                    <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Design your lesson content and structure.</p>
                </div>

                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Save to Module</label>
                        <div className="relative">
                            <input type="text" className="sr-only" /> {/* Focus trap mock */}
                            <select
                                className="w-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium text-sm border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none appearance-none transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                                value={selectedModule}
                                onChange={(e) => setSelectedModule(e.target.value)}
                            >
                                <option value="">-- Select a Module --</option>
                                {modules.map(m => (
                                    <option key={m.id} value={m.id}>
                                        {m.level?.title} - {m.title}
                                    </option>
                                ))}
                            </select>
                            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none border-l border-gray-300 dark:border-gray-700 pl-3">
                                <span className="text-gray-400 text-[10px]">▼</span>
                            </div>
                        </div>
                    </div>

                    <PremiumInput
                        label="Lesson Title"
                        placeholder="Introduction to Pips and Lots"
                        value={formData.title}
                        onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />

                    <div>
                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Topic / Context</label>
                        <textarea
                            className="w-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium text-sm border border-gray-200 dark:border-white/10 rounded-lg p-3 focus:border-primary outline-none min-h-[100px] transition-all hover:bg-gray-100 dark:hover:bg-white/10 resize-none"
                            placeholder="Describe what this lesson should cover... (e.g. Explain how to calculate pip value for EURUSD)"
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Level</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium text-sm border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none appearance-none transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                                    value={formData.level}
                                    onChange={(e) => setFormData({ ...formData, level: e.target.value as any })}
                                >
                                    <option value="beginner">Beginner</option>
                                    <option value="intermediate">Intermediate</option>
                                    <option value="advanced">Advanced</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Length</label>
                            <div className="relative">
                                <select
                                    className="w-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium text-sm border border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 focus:border-primary outline-none appearance-none transition-all cursor-pointer hover:bg-gray-100 dark:hover:bg-white/10"
                                    value={formData.length}
                                    onChange={(e) => setFormData({ ...formData, length: e.target.value as any })}
                                >
                                    <option value="short">Short (~5 mins)</option>
                                    <option value="medium">Medium (~10 mins)</option>
                                    <option value="long">Long (~20 mins)</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 rounded-xl bg-gray-50 dark:bg-[#151925]">
                        <input
                            type="checkbox"
                            checked={formData.includeExamples}
                            onChange={(e) => setFormData({ ...formData, includeExamples: e.target.checked })}
                            className="w-5 h-5 accent-primary rounded cursor-pointer"
                        />
                        <label className="text-sm font-bold text-gray-700 dark:text-gray-300 cursor-pointer select-none" onClick={() => setFormData({ ...formData, includeExamples: !formData.includeExamples })}>
                            Include real-world examples
                        </label>
                    </div>

                    <Button
                        className="w-full py-3 bg-primary hover:bg-[#00a872] text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all mt-4"
                        onClick={handleGenerate}
                        isLoading={generating}
                    >
                        Generate Lesson
                    </Button>
                </div>
            </PremiumCard>

            {/* Right: Preview */}
            <PreviewPanel
                title="2. Preview Content"
                onSave={result ? handleSave : undefined}
                isLoading={generating}
            >
                {result ? (
                    <div className="space-y-4 text-gray-300">
                        <div className="border-b border-gray-700 pb-2 mb-4">
                            <h2 className="text-2xl font-bold text-primary">{result.title}</h2>
                            <div className="flex items-center space-x-4 mt-2 text-sm text-gray-500">
                                <span>⏱️ {result.duration} min read</span>
                                {/* <span>📝 {result.content.split(' ').length} words</span> */}
                            </div>
                        </div>

                        <div className="prose prose-invert prose-green max-w-none">
                            <ReactMarkdown>{result.content}</ReactMarkdown>
                        </div>
                    </div>
                ) : (
                    <div className="text-center text-gray-500 mt-32">
                        <p>Ready to generate lesson content.</p>
                        <p className="text-xs">Fill out the form and click Generate.</p>
                    </div>
                )}
            </PreviewPanel>
        </div>
    );
}
