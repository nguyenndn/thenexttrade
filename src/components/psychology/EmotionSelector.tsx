"use client";

import psychologyData from "@/data/psychology.json";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface EmotionSelectorProps {
    value: string | null;
    onChange: (value: string) => void;
    label: string;
    phase?: "before" | "after";
}

export function EmotionSelector({ value, onChange, label, phase = "before" }: EmotionSelectorProps) {
    const emotions = psychologyData[phase] as any;

    return (
        <div className="space-y-3">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {label}
            </label>

            {/* Positive emotions */}
            <div>
                <p className="text-xs text-green-500 mb-2 uppercase tracking-wider font-bold">
                    Positive
                </p>
                <div className="flex flex-wrap gap-2">
                    {emotions.positive.map((emotion: any) => (
                        <Button
                            variant="ghost"
                            key={emotion.label}
                            type="button"
                            onClick={() => onChange(emotion.label)}
                            className={cn(
                                "px-3 py-1.5 h-auto rounded-full text-sm font-medium transition-all flex items-center gap-1.5 border-none",
                                value === emotion.label
                                    ? "bg-green-500 text-white ring-2 ring-green-300 ring-offset-2 dark:ring-offset-gray-900 hover:bg-green-600 hover:text-white"
                                    : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20"
                            )}
                        >
                            <span>{emotion.icon}</span>
                            <span>{emotion.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Neutral emotions */}
            <div>
                <p className="text-xs text-gray-600 mb-2 uppercase tracking-wider font-bold">
                    Neutral
                </p>
                <div className="flex flex-wrap gap-2">
                    {emotions.neutral.map((emotion: any) => (
                        <Button
                            variant="ghost"
                            key={emotion.label}
                            type="button"
                            onClick={() => onChange(emotion.label)}
                            className={cn(
                                "px-3 py-1.5 h-auto rounded-full text-sm font-medium transition-all flex items-center gap-1.5 border-none",
                                value === emotion.label
                                    ? "bg-gray-500 text-white ring-2 ring-gray-300 ring-offset-2 dark:ring-offset-gray-900 hover:bg-gray-600 hover:text-white"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500/20"
                            )}
                        >
                            <span>{emotion.icon}</span>
                            <span>{emotion.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Negative emotions */}
            <div>
                <p className="text-xs text-red-500 mb-2 uppercase tracking-wider font-bold">
                    Negative (Watch out!)
                </p>
                <div className="flex flex-wrap gap-2">
                    {emotions.negative.map((emotion: any) => (
                        <Button
                            variant="ghost"
                            key={emotion.label}
                            type="button"
                            onClick={() => onChange(emotion.label)}
                            className={cn(
                                "px-3 py-1.5 h-auto rounded-full text-sm font-medium transition-all flex items-center gap-1.5 border-none",
                                value === emotion.label
                                    ? "bg-red-500 text-white ring-2 ring-red-300 ring-offset-2 dark:ring-offset-gray-900 hover:bg-red-600 hover:text-white"
                                    : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20"
                            )}
                        >
                            <span>{emotion.icon}</span>
                            <span>{emotion.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
