import { useState } from "react";
import { Plus, MoreVertical } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/Button";


interface StrategyCellProps {
    entry: any; // Type should be JournalEntry but using any for flexibility during refactor
    strategies: any[];
    onUpdate: (id: string, data: any) => Promise<void>;
}

export function StrategyCell({ entry, strategies = [], onUpdate }: StrategyCellProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleSelect = async (strategyName: string) => {
        await onUpdate(entry.id, { strategy: strategyName });
        setIsOpen(false);
    };

    const handleClear = async () => {
        await onUpdate(entry.id, { strategy: null });
        setIsOpen(false);
    };

    // Helper to get style for a strategy
    const getStrategyStyle = (strategyName: string) => {
        const strategy = strategies.find(s => s.name === strategyName);
        const color = strategy?.color || "#6B7280"; // Default gray if not found

        return {
            backgroundColor: `${color}15`, // 15 = ~8% opacity
            color: color,
            borderColor: `${color}30` // 30 = ~19% opacity
        };
    };

    const currentStyle = entry.strategy ? getStrategyStyle(entry.strategy) : {};

    return (
        <Popover open={isOpen} onOpenChange={setIsOpen}>
            <PopoverTrigger asChild>
                <div
                    className="flex gap-1 flex-wrap justify-center cursor-pointer min-h-[24px] min-w-[24px] items-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    {entry.strategy ? (
                        <span
                            className="px-2 py-1 rounded-full text-[10px] font-bold uppercase border whitespace-nowrap transition-colors"
                            style={currentStyle}
                        >
                            {entry.strategy}
                        </span>
                    ) : (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/5 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors hover:bg-gray-200 dark:hover:bg-white/10"
                        >
                            <Plus size={12} />
                        </Button>
                    )}
                </div>
            </PopoverTrigger>
            <PopoverContent className="w-80 p-0 overflow-hidden" align="center" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200 dark:border-white/10">
                    <h4 className="font-semibold text-sm text-gray-900 dark:text-white">Strategy Tags</h4>
                    <Button variant="ghost" size="icon" className="w-6 h-6 p-0 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                        <MoreVertical size={16} />
                    </Button>
                </div>

                <div className="p-4 space-y-4">
                    {/* Current Strategy */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <label className="text-xs font-medium text-gray-500">Current Strategy</label>
                            {entry.strategy && (
                                <Button variant="ghost" size="sm" onClick={handleClear} className="h-4 px-1 text-[10px] text-red-500 hover:text-red-600 hover:underline bg-transparent">Remove</Button>
                            )}
                        </div>
                        <div className="flex flex-wrap gap-2">
                            {entry.strategy ? (
                                <span
                                    className="px-3 py-1.5 rounded-full text-xs font-bold border"
                                    style={currentStyle}
                                >
                                    {entry.strategy}
                                </span>
                            ) : (
                                <span className="text-xs text-gray-400 italic">No strategy selected</span>
                            )}
                        </div>

                        {/* Create Tag Button (Visual only for now matching image) */}

                    </div>

                    <div className="h-px bg-gray-100 dark:bg-white/5" />

                    {/* Select Strategy */}
                    <div className="space-y-2">
                        <label className="text-xs font-medium text-gray-500">Select a Strategy</label>
                        <div className="flex flex-wrap gap-2 max-h-[200px] overflow-y-auto">
                            {strategies.length > 0 ? (
                                strategies.map((strategy) => {
                                    const style = getStrategyStyle(strategy.name);
                                    const isSelected = entry.strategy === strategy.name;

                                    return (
                                        <Button
                                            key={strategy.name}
                                            variant="outline"
                                            onClick={() => handleSelect(strategy.name)}
                                            className={`h-auto px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${isSelected
                                                    ? "ring-2 ring-offset-1 ring-blue-500/20"
                                                    : "opacity-70 hover:opacity-100 hover:bg-gray-100 dark:hover:bg-white/5"
                                                }`}
                                            style={style}
                                        >
                                            {strategy.name}
                                        </Button>
                                    );
                                })
                            ) : (
                                <div className="text-xs text-gray-500 w-full text-center py-2">No strategies found.</div>
                            )}
                        </div>
                    </div>
                </div>
            </PopoverContent>
        </Popover>
    );
}
