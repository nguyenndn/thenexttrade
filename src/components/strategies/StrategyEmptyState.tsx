import { Target, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";

export function StrategyEmptyState({ onAdd }: { onAdd: () => void }) {
    return (
        <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 mt-8">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-6">
                <Target size={32} className="text-gray-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                No strategies yet
            </h3>
            <p className="text-gray-600 px-6 max-w-sm mx-auto mb-6">
                Create strategies to track which setups work best for you.
                Tag your trades and analyze their performance.
            </p>
            <Button variant="primary" onClick={onAdd}>
                <Plus size={18} strokeWidth={2.5} />
                Add Strategy
            </Button>
        </div>
    );
}
