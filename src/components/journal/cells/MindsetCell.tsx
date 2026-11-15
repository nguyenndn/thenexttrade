import { useState } from "react";
import { Plus, Smile, Meh, AlertTriangle } from "lucide-react";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import psychologyData from "@/data/psychology.json";
import { Button } from "@/components/ui/Button";

type EmotionTone = "positive" | "neutral" | "negative";

interface EmotionItem {
    label: string;
    tone: EmotionTone;
}

interface MindsetEntry {
    id: string;
    emotionBefore?: string | null;
}

interface MindsetCellProps {
    entry: MindsetEntry;
    onUpdate: (id: string, data: { emotionBefore: string }) => Promise<void>;
}

function renderToneIcon(tone: EmotionTone, size = 13) {
    if (tone === "positive") {
        return <Smile size={size} className="text-emerald-500 shrink-0" />;
    }
    if (tone === "negative") {
        return <AlertTriangle size={size} className="text-amber-500 shrink-0" />;
    }
    return <Meh size={size} className="text-slate-400 shrink-0" />;
}

export function MindsetCell({ entry, onUpdate }: MindsetCellProps) {
    const [isOpen, setIsOpen] = useState(false);

    const positiveEmotions: EmotionItem[] = (
        psychologyData.before.positive || []
    ).map((item) => ({ label: item.label, tone: "positive" as const }));
    const neutralEmotions: EmotionItem[] = (
        psychologyData.before.neutral || []
    ).map((item) => ({ label: item.label, tone: "neutral" as const }));
    const negativeEmotions: EmotionItem[] = (
        psychologyData.before.negative || []
    ).map((item) => ({ label: item.label, tone: "negative" as const }));

    const allEmotions: EmotionItem[] = [
        ...positiveEmotions,
        ...neutralEmotions,
        ...negativeEmotions,
    ];

    const currentEmotion = allEmotions.find(
        (e) => e.label === entry.emotionBefore
    );

    const handleSelect = async (emotionLabel: string) => {
        await onUpdate(entry.id, { emotionBefore: emotionLabel });
        setIsOpen(false);
    };

    const renderEmotionItem = (e: EmotionItem) => (
        <Button
            key={e.label}
            variant="outline"
            onClick={(ev) => {
                ev.stopPropagation();
                handleSelect(e.label);
            }}
            className="w-full flex items-center justify-start gap-2 px-2 py-1.5 text-sm border-transparent hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg cursor-pointer transition-colors text-left font-normal"
        >
            {renderToneIcon(e.tone, 14)}
            <span className="text-gray-700 dark:text-gray-200">{e.label}</span>
        </Button>
    );

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    className="flex justify-center items-center cursor-pointer min-h-[24px]"
                    onClick={(e) => e.stopPropagation()}
                >
                    {currentEmotion ? (
                        <div
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
                            title="Mindset before entry"
                        >
                            {renderToneIcon(currentEmotion.tone, 12)}
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 whitespace-nowrap">
                                {currentEmotion.label}
                            </span>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Set Mindset"
                            className="w-6 h-6 rounded-lg bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                            <Plus size={12} />
                        </Button>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent
                align="center"
                className="w-[200px] p-0 rounded-xl"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="px-3 py-2 border-b border-dashboard bg-gray-50/50 dark:bg-white/5">
                    <h4 className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                        Mindset (Before Entry)
                    </h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Positive
                    </div>
                    {positiveEmotions.map(renderEmotionItem)}

                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Neutral
                    </div>
                    {neutralEmotions.map(renderEmotionItem)}

                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-600 dark:text-gray-300">
                        Negative
                    </div>
                    {negativeEmotions.map(renderEmotionItem)}
                </div>
            </PopoverContent>
        </Popover>
    );
}
