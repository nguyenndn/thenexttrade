import { Button } from "@/components/ui/Button";
// import { Card } from "@/components/ui/Card"; // Replaced
import { PremiumCard } from "@/components/ui/PremiumCard";
import { ReactNode } from "react";
import { Copy, RefreshCw, Save, Edit2 } from "lucide-react";

interface PreviewPanelProps {
    title: string;
    children: ReactNode;
    onSave?: () => void;
    onRegenerate?: () => void;
    onEdit?: () => void;
    isSaving?: boolean;
    isLoading?: boolean;
}

export default function PreviewPanel({
    title,
    children,
    onSave,
    onRegenerate,
    onEdit,
    isSaving = false,
    isLoading = false,
}: PreviewPanelProps) {
    return (
        <PremiumCard variant="highlight" className="h-[750px] flex flex-col border-gray-200 dark:border-white/5 shadow-2xl shadow-gray-200/50 dark:shadow-none">
            {/* Header */}
            <div className="flex justify-between items-center p-6 border-b border-gray-100 dark:border-white/5 bg-white/50 dark:bg-[#151925]/50 backdrop-blur-md sticky top-0 z-10">
                <div>
                    <h3 className="font-bold text-xl text-gray-900 dark:text-white tracking-tight">{title}</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium uppercase tracking-wider mt-1">AI Generated Output</p>
                </div>
                <div className="flex space-x-2">
                    {onEdit && (
                        <button
                            onClick={onEdit}
                            disabled={isLoading || isSaving}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-50"
                            title="Edit Content"
                        >
                            <Edit2 size={18} />
                        </button>
                    )}
                    {onRegenerate && (
                        <button
                            onClick={onRegenerate}
                            disabled={isLoading || isSaving}
                            className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-all disabled:opacity-50"
                            title="Regenerate"
                        >
                            <RefreshCw size={18} className={isLoading ? "animate-spin" : ""} />
                        </button>
                    )}
                    {onSave && (
                        <Button
                            className="bg-primary hover:bg-[#00a872] text-white font-bold text-sm rounded-lg shadow-lg shadow-primary/30 active:scale-95 transition-all px-4 py-2"
                            onClick={onSave}
                            isLoading={isSaving}
                            disabled={isLoading}
                        >
                            <Save size={16} className="mr-2" />
                            Save to DB
                        </Button>
                    )}
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-6 custom-scrollbar relative">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-4">
                        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                        <p className="animate-pulse font-medium">Generating magic...</p>
                    </div>
                ) : (
                    children
                )}
            </div>
        </PremiumCard>
    );
}
