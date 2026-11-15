"use client";

import psychologyData from "@/data/psychology.json";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import {
    ShieldCheck,
    Smile,
    Crosshair,
    Clock,
    Zap,
    Minus,
    Moon,
    HelpCircle,
    AlertCircle,
    ShieldAlert,
    Flame,
    Frown,
    Timer,
    Swords,
    TrendingUp,
    Sparkles,
    CheckCircle2,
    Activity,
    type LucideIcon,
} from "lucide-react";

interface EmotionItem {
    label: string;
    icon?: string;
}

interface EmotionPhaseGroup {
    positive: EmotionItem[];
    neutral: EmotionItem[];
    negative: EmotionItem[];
}

interface EmotionSelectorProps {
    value: string | null;
    onChange: (value: string) => void;
    label: string;
    phase?: "before" | "after";
}

const EMOTION_ICON_MAP: Record<string, LucideIcon> = {
    Confident: ShieldCheck,
    Calm: Smile,
    Focused: Crosshair,
    Patient: Clock,
    Excited: Zap,
    Satisfied: CheckCircle2,
    Disciplined: ShieldCheck,
    Relieved: Smile,
    Neutral: Minus,
    Tired: Moon,
    Uncertain: HelpCircle,
    Indifferent: Minus,
    Anxious: AlertCircle,
    Fearful: ShieldAlert,
    Greedy: Flame,
    Frustrated: Frown,
    Impatient: Timer,
    Revenge: Swords,
    FOMO: TrendingUp,
    Overconfident: Sparkles,
    Regretful: Frown,
    Angry: Flame,
};

export function EmotionSelector({
    value,
    onChange,
    label,
    phase = "before",
}: EmotionSelectorProps) {
    const emotions = psychologyData[phase] as EmotionPhaseGroup;

    const renderEmotionIcon = (emotionLabel: string) => {
        const Icon = EMOTION_ICON_MAP[emotionLabel] || Activity;
        return <Icon size={12} aria-hidden="true" />;
    };

    return (
        <div className="space-y-2.5">
            <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                {label}
            </label>

            {/* Positive emotions */}
            <div>
                <p className="text-[11px] text-green-500 mb-1.5 uppercase tracking-wider font-bold">
                    Positive
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {emotions.positive.map((emotion) => (
                        <Button
                            variant="ghost"
                            key={emotion.label}
                            type="button"
                            onClick={() => onChange(emotion.label)}
                            className={cn(
                                "px-2.5 py-1 h-auto rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border-none",
                                value === emotion.label
                                    ? "bg-green-500 text-white ring-2 ring-green-300 ring-offset-2 dark:ring-offset-gray-900 hover:bg-green-600 hover:text-white"
                                    : "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-500/20"
                            )}
                        >
                            {renderEmotionIcon(emotion.label)}
                            <span>{emotion.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Neutral emotions */}
            <div>
                <p className="text-[11px] text-gray-600 mb-1.5 uppercase tracking-wider font-bold">
                    Neutral
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {emotions.neutral.map((emotion) => (
                        <Button
                            variant="ghost"
                            key={emotion.label}
                            type="button"
                            onClick={() => onChange(emotion.label)}
                            className={cn(
                                "px-2.5 py-1 h-auto rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border-none",
                                value === emotion.label
                                    ? "bg-gray-500 text-white ring-2 ring-gray-300 ring-offset-2 dark:ring-offset-gray-900 hover:bg-gray-600 hover:text-white"
                                    : "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-500/20"
                            )}
                        >
                            {renderEmotionIcon(emotion.label)}
                            <span>{emotion.label}</span>
                        </Button>
                    ))}
                </div>
            </div>

            {/* Negative emotions */}
            <div>
                <p className="text-[11px] text-red-500 mb-1.5 uppercase tracking-wider font-bold">
                    Negative (Watch out!)
                </p>
                <div className="flex flex-wrap gap-1.5">
                    {emotions.negative.map((emotion) => (
                        <Button
                            variant="ghost"
                            key={emotion.label}
                            type="button"
                            onClick={() => onChange(emotion.label)}
                            className={cn(
                                "px-2.5 py-1 h-auto rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 border-none",
                                value === emotion.label
                                    ? "bg-red-500 text-white ring-2 ring-red-300 ring-offset-2 dark:ring-offset-gray-900 hover:bg-red-600 hover:text-white"
                                    : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400 hover:bg-red-200 dark:hover:bg-red-500/20"
                            )}
                        >
                            {renderEmotionIcon(emotion.label)}
                            <span>{emotion.label}</span>
                        </Button>
                    ))}
                </div>
            </div>
        </div>
    );
}
