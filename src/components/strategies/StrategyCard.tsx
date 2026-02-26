import { Edit2, Trash2, Target, TrendingUp, Percent, Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Strategy, StrategyPerformance } from "./StrategyManager";

export function StrategyCard({
    strategy,
    performance,
    isGhost,
    onEdit,
    onDelete,
}: {
    strategy: Strategy;
    performance?: StrategyPerformance;
    isGhost?: boolean;
    onEdit: () => void;
    onDelete: () => void;
}) {
    return (
        <div className={`bg-white dark:bg-[#1E2028] p-6 rounded-xl border shadow-sm group hover:border-[#00C888]/50 hover:shadow-md transition-shadow ${isGhost ? 'border-dashed border-gray-300 dark:border-white/20' : 'border-gray-100 dark:border-white/5'
            }`}>
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: strategy.color }}
                    />
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white flex items-center gap-2">
                        {strategy.name}
                        {isGhost && (
                            <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-0.5 rounded-full text-gray-500 font-medium">Unsaved</span>
                        )}
                    </h3>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onEdit}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
                        aria-label="Edit strategy"
                    >
                        <Edit2 size={16} />
                    </Button>
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={onDelete}
                        className="hover:bg-red-50 dark:hover:bg-red-500/10 text-gray-400 hover:text-red-500"
                        aria-label="Delete strategy"
                    >
                        <Trash2 size={16} />
                    </Button>
                </div>
            </div>

            {/* Description */}
            <div className="min-h-[40px] mb-4">
                {strategy.description ? (
                    <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
                        {strategy.description}
                    </p>
                ) : (
                    <p className="text-sm text-gray-400 italic">No description</p>
                )}
            </div>

            {/* Rules */}
            {strategy.rules && (
                <div className="mb-4">
                    <p className="text-xs font-bold text-gray-400 uppercase mb-1">Rules</p>
                    <div className="text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-gray-100 dark:border-white/5 whitespace-pre-line max-h-[100px] overflow-y-auto custom-scrollbar">
                        {strategy.rules}
                    </div>
                </div>
            )}

            {/* Stats */}
            {performance ? (
                <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-50 dark:border-white/5">
                    <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Target size={16} className="mx-auto mb-1 text-purple-500" />
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                            {(performance.winRate ?? 0).toFixed(0)}%
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">Win Rate</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <TrendingUp size={16} className={`mx-auto mb-1 ${performance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`} />
                        <p className={`text-base font-bold ${performance.totalPnL >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${Math.abs(performance.totalPnL ?? 0).toFixed(0)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">P&L</p>
                    </div>
                    <div className="text-center p-2 bg-gray-50 dark:bg-white/5 rounded-xl">
                        <Percent size={16} className="mx-auto mb-1 text-blue-500" />
                        <p className="text-base font-bold text-gray-900 dark:text-white">
                            {performance.profitFactor === Infinity ? "MAX" : (performance.profitFactor ?? 0).toFixed(1)}
                        </p>
                        <p className="text-[10px] uppercase font-bold text-gray-400">PF</p>
                    </div>
                </div>
            ) : (
                <div className="py-6 text-center bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                    <p className="text-sm text-gray-400">
                        No trades recorded
                    </p>
                </div>
            )}

            {/* Save Ghost Button */}
            {isGhost && (
                <div className="mt-4 border-t border-gray-50 dark:border-white/5 pt-4">
                    <Button 
                        variant="outline" 
                        onClick={onEdit} 
                        className="w-full bg-primary/10 text-primary hover:bg-primary/20 hover:text-primary font-bold border border-primary/20 transition-colors"
                    >
                        <Save size={16} />
                        <span>Save to Library</span>
                    </Button>
                </div>
            )}
        </div>
    );
}
