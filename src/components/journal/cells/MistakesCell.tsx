import { useState } from "react";
import { Plus } from "lucide-react";
import { MISTAKES, getMistakeSeverityColor } from "@/lib/mistakes";
import { MistakeSelector } from "@/components/mistakes/MistakeSelector";
import { Button } from "@/components/ui/Button";

interface MistakesCellProps {
    entry: any; // Using any for JournalEntry
    onUpdate: (id: string, data: any) => Promise<void>;
}

export function MistakesCell({ entry, onUpdate }: MistakesCellProps) {
    const mistakes = entry.mistakes || [];

    const handleUpdate = async (newMistakes: string[]) => {
        await onUpdate(entry.id, { mistakes: newMistakes });
    };

    // Prepare Trigger Content (Badges)
    const triggerContent = (
        <div
            className="flex gap-1 flex-wrap justify-center cursor-pointer min-h-[24px] min-w-[24px] items-center"
        >
            {mistakes.length > 0 ? (
                mistakes.map((mCode: string, idx: number) => {
                    let mistake: any = undefined;
                    for (const category of Object.values(MISTAKES)) {
                        const found = category.find((m: any) => m.code === mCode);
                        if (found) {
                            mistake = found;
                            break;
                        }
                    }

                    if (mistake) {
                        return (
                            <span key={idx} className={`px-2 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1 whitespace-nowrap ${getMistakeSeverityColor(mistake.severity)}`}>
                                <span>{mistake.emoji}</span>
                                <span>{mistake.name}</span>
                            </span>
                        );
                    } else {
                        return (
                            <span key={idx} className="px-2 py-1 rounded-full bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-[10px] font-bold border border-gray-200 dark:border-white/10 whitespace-nowrap">
                                📝 {mCode}
                            </span>
                        );
                    }
                })
            ) : (
                <Button
                    variant="outline"
                    size="icon"
                    aria-label="Select Mistakes"
                    className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
                >
                    <Plus size={12} />
                </Button>
            )}
        </div>
    );

    return (
        <MistakeSelector
            value={mistakes}
            onChange={handleUpdate}
            trigger={triggerContent}
        />
    );
}
