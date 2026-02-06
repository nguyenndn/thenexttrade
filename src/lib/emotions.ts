export const EMOTIONS = {
    positive: [
        { value: "confident", label: "Confident", emoji: "😎" },
        { value: "calm", label: "Calm", emoji: "😌" },
        { value: "focused", label: "Focused", emoji: "🎯" },
        { value: "patient", label: "Patient", emoji: "⏳" },
        { value: "excited", label: "Excited", emoji: "🤩" },
    ],
    negative: [
        { value: "anxious", label: "Anxious", emoji: "😰" },
        { value: "fearful", label: "Fearful", emoji: "😨" },
        { value: "greedy", label: "Greedy", emoji: "🤑" },
        { value: "frustrated", label: "Frustrated", emoji: "😤" },
        { value: "impatient", label: "Impatient", emoji: "⏰" },
        { value: "revenge", label: "Revenge", emoji: "😡" },
        { value: "fomo", label: "FOMO", emoji: "🏃" },
        { value: "overconfident", label: "Overconfident", emoji: "🦸" },
    ],
    neutral: [
        { value: "neutral", label: "Neutral", emoji: "😐" },
        { value: "tired", label: "Tired", emoji: "😴" },
        { value: "uncertain", label: "Uncertain", emoji: "🤷" },
    ],
} as const;

export const ALL_EMOTIONS = [
    ...EMOTIONS.positive,
    ...EMOTIONS.negative,
    ...EMOTIONS.neutral,
];
