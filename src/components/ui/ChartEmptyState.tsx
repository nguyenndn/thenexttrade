import { BarChart3 } from "lucide-react";

interface ChartEmptyStateProps {
    title?: string;
    description?: string;
    height?: string;
}

export function ChartEmptyState({ 
    title = "No data available", 
    description = "There is not enough data to display this chart yet.",
    height = "h-[250px]"
}: ChartEmptyStateProps) {
    return (
        <div className={`flex flex-col items-center justify-center p-6 text-center ${height}`}>
            <div className="w-12 h-12 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-3">
                <BarChart3 className="w-6 h-6 text-gray-400" />
            </div>
            <h4 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-1">
                {title}
            </h4>
            <p className="text-xs text-gray-600 dark:text-gray-300 max-w-[200px]">
                {description}
            </p>
        </div>
    );
}
