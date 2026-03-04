import { useState } from "react";
import { Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import psychologyData from "@/data/psychology.json";
import { Button } from "@/components/ui/Button";

interface MindsetCellProps {
    entry: any;
    onUpdate: (id: string, data: any) => Promise<void>;
}

export function MindsetCell({ entry, onUpdate }: MindsetCellProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Flatten all "before" emotions for lookup
    const allEmotions = [
        ...(psychologyData.before.positive || []),
        ...(psychologyData.before.neutral || []),
        ...(psychologyData.before.negative || [])
    ];

    const currentEmotion = allEmotions.find((e: any) => e.label === entry.emotionBefore);

    const handleSelect = async (emotionLabel: string) => {
        await onUpdate(entry.id, { emotionBefore: emotionLabel });
        setIsOpen(false);
    };

    const renderEmotionItem = (e: any) => (
        <Button
            key={e.label}
            variant="outline"
            onClick={(ev) => {
                ev.stopPropagation();
                handleSelect(e.label);
            }}
            className="w-full flex items-center justify-start px-2 py-1.5 text-sm hover:bg-gray-100 dark:hover:bg-white/10 rounded-sm cursor-pointer transition-colors text-left font-normal"
        >
            <span className="mr-2 text-lg">{e.icon}</span>
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
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-50 dark:bg-yellow-500/10 border border-yellow-200 dark:border-yellow-500/20 hover:bg-yellow-100 dark:hover:bg-yellow-500/20 transition-colors"
                            title="Mindset before entry"
                        >
                            <span className="text-sm">{currentEmotion.icon}</span>
                            <span className="text-xs font-bold text-yellow-700 dark:text-yellow-400 whitespace-nowrap">{currentEmotion.label}</span>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            size="icon"
                            aria-label="Set Mindset"
                            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                            <Plus size={12} />
                        </Button>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent align="center" className="w-[200px] p-0" onClick={(e) => e.stopPropagation()}>
                <div className="px-3 py-2 border-b border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/5">
                    <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Mindset (Before Entry)</h4>
                </div>
                <div className="max-h-[300px] overflow-y-auto custom-scrollbar p-1">
                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Positive</div>
                    {psychologyData.before.positive.map(renderEmotionItem)}

                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Neutral</div>
                    {psychologyData.before.neutral.map(renderEmotionItem)}

                    <div className="h-px bg-gray-100 dark:bg-white/5 my-1" />

                    <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">Negative</div>
                    {psychologyData.before.negative.map(renderEmotionItem)}
                </div>
            </PopoverContent>
        </Popover>
    );
}
