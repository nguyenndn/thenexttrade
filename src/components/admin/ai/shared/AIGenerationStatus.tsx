import { Loader2 } from "lucide-react";

interface AIGenerationStatusProps {
    isGenerating: boolean;
    provider?: string;
    model?: string;
    estimatedTime?: string;
}

export default function AIGenerationStatus({
    isGenerating,
    provider = "GitHub Models",
    model = "gpt-4o-mini",
    estimatedTime = "5-10 seconds",
}: AIGenerationStatusProps) {
    if (!isGenerating) return null;

    return (
        <div className="flex flex-col items-center justify-center h-full text-gray-400 space-y-6 animate-in fade-in duration-500">
            <div className="relative">
                <div className="w-20 h-20 border-4 border-gray-200 dark:border-white/5 rounded-full" />
                <div className="w-20 h-20 border-4 border-primary border-t-transparent rounded-full animate-spin absolute top-0 left-0 shadow-[0_0_15px_rgba(0,200,136,0.3)]" />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
                    <Loader2 className="w-8 h-8 text-primary animate-pulse" />
                </div>
            </div>

            <div className="text-center space-y-2">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Generating Content...</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto">
                    AI is analyzing your request and structuring the content.
                </p>
                <div className="inline-flex items-center space-x-2 px-3 py-1 bg-gray-100 dark:bg-white/5 rounded-full border border-gray-200 dark:border-white/10 mt-2">
                    <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                    <span className="text-xs font-mono text-gray-600 dark:text-gray-300">
                        {provider} ({model}) • ~{estimatedTime}
                    </span>
                </div>
            </div>
        </div>
    );
}
