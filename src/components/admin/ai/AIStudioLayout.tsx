"use client";

import { useState } from "react";
import StructureGenerator from "./StructureGenerator";
import LessonGenerator from "./LessonGenerator";
import QuizGenerator from "./QuizGenerator";
import { LayoutDashboard, BookOpen, FileQuestion, Layers } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Tab = "structure" | "lesson" | "quiz";

export default function AIStudioLayout() {
    const [activeTab, setActiveTab] = useState<Tab>("structure");

    return (
        <div className="space-y-8 relative">
            {/* Decorative Background Blob */}
            <div className="absolute -top-20 -right-20 w-96 h-96 bg-primary/10 rounded-full blur-[100px] pointer-events-none" />

            {/* Custom Premium Tabs */}
            <div className="flex p-1.5 bg-gray-100 dark:bg-[#0F1117]/60 rounded-xl border border-transparent dark:border-white/5 w-fit relative z-10">
                <TabButton
                    active={activeTab === "structure"}
                    onClick={() => setActiveTab("structure")}
                    label="Structure"
                    icon={Layers}
                />
                <TabButton
                    active={activeTab === "lesson"}
                    onClick={() => setActiveTab("lesson")}
                    label="Lesson Content"
                    icon={BookOpen}
                />
                <TabButton
                    active={activeTab === "quiz"}
                    onClick={() => setActiveTab("quiz")}
                    label="Quiz Generator"
                    icon={FileQuestion}
                />
            </div>

            <div className="min-h-[600px] animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeTab === "structure" && <StructureGenerator />}
                {activeTab === "lesson" && <LessonGenerator />}
                {activeTab === "quiz" && <QuizGenerator />}
            </div>
        </div>
    );
}

function TabButton({ active, onClick, label, icon: Icon }: { active: boolean; onClick: () => void; label: string, icon: any }) {
    return (
        <Button
            variant="ghost"
            onClick={onClick}
            className={`flex items-center gap-2 px-6 py-2.5 h-auto text-sm font-bold rounded-lg transition-all duration-300 ${active
                ? "bg-white dark:bg-[#1E2028] text-primary shadow-sm shadow-gray-200/50 dark:shadow-none translate-y-0 hover:bg-white dark:hover:bg-[#1E2028] hover:text-primary"
                : "text-gray-500 hover:text-gray-900 dark:hover:text-gray-300 hover:bg-black/5 dark:hover:bg-white/5"
                }`}
        >
            <Icon size={18} className={active ? "text-primary" : "text-gray-400"} />
            {label}
        </Button>
    );
}
