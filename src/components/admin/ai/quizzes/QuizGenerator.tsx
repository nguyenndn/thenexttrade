"use client";

import { useState, useEffect } from "react";
import { PremiumCard } from "@/components/ui/PremiumCard";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { Button } from "@/components/ui/Button";
import PreviewPanel from "@/components/admin/ai/shared/PreviewPanel";
import AIGenerationStatus from "@/components/admin/ai/shared/AIGenerationStatus";
import { QuizGenerationResponse } from "@/lib/ai/types";
import { toast } from "sonner";
import { ChevronRight, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";

export default function QuizGenerator() {
    const [formData, setFormData] = useState({
        topic: "",
        numQuestions: 5,
        difficulty: "medium" as "easy" | "medium" | "hard",
        lessonContext: "", // Optional context
    });

    const [generating, setGenerating] = useState(false);
    const [result, setResult] = useState<QuizGenerationResponse | null>(null);

    // Module selection for saving
    const [modules, setModules] = useState<{ id: string; title: string, level: { title: string } }[]>([]);
    const [selectedModule, setSelectedModule] = useState("");

    useEffect(() => {
        const fetchModules = async () => {
            try {
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
        if (!formData.topic) return toast.error("Please enter a topic");

        setGenerating(true);
        setResult(null);

        try {
            const res = await fetch("/api/ai/generate-quiz", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            const data = await res.json();

            if (!res.ok) throw new Error(data.error?.message || "Generation failed");

            setResult(data.data);
            toast.success("Quiz generated!");
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setGenerating(false);
        }
    };

    const handleSave = async () => {
        if (!result) return;
        if (!selectedModule) return toast.error("Please select a Module to attach this quiz to");

        const toastId = toast.loading("Saving quiz...");
        try {
            const { saveQuiz } = await import("@/app/actions/ai");
            const res = await saveQuiz(result, selectedModule, formData.topic);

            if (res.success) {
                toast.success("Quiz saved to database!", { id: toastId });
            } else {
                toast.error(`Save failed: ${res.error}`, { id: toastId });
            }
        } catch (error) {
            toast.error("An unexpected error occurred", { id: toastId });
        }
    };

    return (
        <div className="h-[calc(100vh-140px)] flex flex-col">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 dark:border-white/5 pb-8 mb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Quiz Generator
                        </h1>
                    </div>
                    <div className="flex items-center text-sm text-gray-500 pl-4.5">
                        <Link href="/admin/ai-studio" className="hover:text-primary transition-colors">AI Studio</Link>
                        <ChevronRight size={14} className="mx-2" />
                        <span className="text-gray-900 dark:text-white font-medium">Quiz Generator</span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
                {/* Left: Input Form */}
                <PremiumCard className="p-8 space-y-8 h-full overflow-y-auto custom-scrollbar" variant="glass">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">Quiz Configuration</h3>
                        <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Generate assessment questions for your students.</p>
                    </div>

                    <div className="space-y-6">
                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Save to Module</label>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="w-full justify-between bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium text-sm border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-white/10 shadow-none border border-solid"
                                    >
                                        <span className="truncate flex-1 text-left">
                                            {selectedModule ? modules.find(m => m.id === selectedModule)?.title || "Selected" : "-- Select a Module --"}
                                        </span>
                                        <ChevronDown size={14} className="opacity-50 ml-2 shrink-0" />
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="start" className="w-[var(--radix-dropdown-menu-trigger-width)] max-h-[300px] overflow-y-auto">
                                    <DropdownMenuItem onClick={() => setSelectedModule("")}>-- Select a Module --</DropdownMenuItem>
                                    {modules.map(m => (
                                        <DropdownMenuItem key={m.id} onClick={() => setSelectedModule(m.id)}>
                                            {m.level?.title} - {m.title}
                                        </DropdownMenuItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <PremiumInput
                            label="Topic"
                            placeholder="Support and Resistance Levels"
                            value={formData.topic}
                            onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                        />

                        <div>
                            <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Context (Optional Lesson Content)</label>
                            <textarea
                                className="w-full bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium text-sm border border-gray-200 dark:border-white/10 rounded-lg p-3 focus:border-primary outline-none min-h-[100px] transition-all hover:bg-gray-100 dark:hover:bg-white/10 resize-none"
                                placeholder="Paste lesson content here to generate relevant questions..."
                                value={formData.lessonContext}
                                onChange={(e) => setFormData({ ...formData, lessonContext: e.target.value })}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Difficulty</label>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button
                                            variant="outline"
                                            className="w-full justify-between bg-gray-50 dark:bg-white/5 text-gray-900 dark:text-white font-medium text-sm border-gray-200 dark:border-white/10 rounded-lg px-4 py-2.5 h-auto hover:bg-gray-100 dark:hover:bg-white/10 shadow-none border border-solid capitalize"
                                        >
                                            {formData.difficulty}
                                            <ChevronDown size={14} className="opacity-50 ml-2" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end" className="w-[var(--radix-dropdown-menu-trigger-width)]">
                                        <DropdownMenuItem onClick={() => setFormData({ ...formData, difficulty: "easy" })}>Easy</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFormData({ ...formData, difficulty: "medium" })}>Medium</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => setFormData({ ...formData, difficulty: "hard" })}>Hard</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                            <PremiumInput
                                label="Num Questions"
                                type="number"
                                min={1}
                                max={10}
                                value={formData.numQuestions}
                                onChange={(e) => setFormData({ ...formData, numQuestions: parseInt(e.target.value) || 5 })}
                            />
                        </div>

                        <Button
                            className="w-full py-3 bg-primary hover:bg-[#00a872] text-white font-bold text-sm rounded-xl shadow-lg shadow-primary/30 active:scale-95 transition-all mt-4"
                            onClick={handleGenerate}
                            isLoading={generating}
                        >
                            Generate Quiz
                        </Button>
                    </div>
                </PremiumCard>

                {/* Right: Preview */}
                <PreviewPanel
                    title="2. Preview Questions"
                    onSave={result ? handleSave : undefined}
                    isLoading={generating}
                >
                    {generating ? (
                        <AIGenerationStatus isGenerating={true} estimatedTime="10-15 seconds" />
                    ) : result ? (
                        <div className="space-y-6">
                            {result.questions.map((q, idx) => (
                                <div key={idx} className="bg-white dark:bg-[#0F1117] p-4 rounded-lg border border-gray-200 dark:border-gray-800 shadow-sm">
                                    <div className="flex space-x-3 mb-3">
                                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">
                                            {idx + 1}
                                        </span>
                                        <p className="font-medium text-gray-900 dark:text-white">{q.text}</p>
                                    </div>

                                    <div className="space-y-2 pl-9">
                                        {q.options.map((opt, optIdx) => (
                                            <div
                                                key={optIdx}
                                                className={`p-2 rounded text-sm flex items-center ${opt.isCorrect
                                                    ? "bg-primary/10 border border-primary/30 text-primary"
                                                    : "bg-gray-50 dark:bg-gray-800/50 border border-transparent text-gray-600 dark:text-gray-400"
                                                    }`}
                                            >
                                                <span className={`w-4 h-4 rounded-full border mr-3 flex items-center justify-center ${opt.isCorrect ? "border-primary bg-primary" : "border-gray-300 dark:border-gray-600"
                                                    }`}>
                                                    {opt.isCorrect && <span className="text-white text-[10px]">✓</span>}
                                                </span>
                                                {opt.text}
                                            </div>
                                        ))}
                                    </div>

                                    <div className="mt-3 pl-9 text-xs text-gray-500 italic border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                                        Explanation: {q.explanation}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
                            <p className="text-lg font-medium">Ready to generate quiz questions.</p>
                            <p className="text-sm mt-2">Fill out the form and click Generate.</p>
                        </div>
                    )}
                </PreviewPanel>
            </div>
        </div>
    );
}
