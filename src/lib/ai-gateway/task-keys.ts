export const AI_TASK_KEYS = [
    {
        key: "TRADE_ANALYSIS",
        label: "Analyze My Trades",
    },
    {
        key: "WEEKLY_COACH",
        label: "Weekly Coach",
    },
    {
        key: "COACH_INSIGHTS",
        label: "Coach Insights",
    },
    {
        key: "COGNITIVE_BIAS",
        label: "Cognitive Bias",
    },
    {
        key: "QUIZ_EXPLANATION",
        label: "Quiz Explanation",
    },
    {
        key: "SUGGEST_TAGS",
        label: "Suggest Article Tags",
    },
    {
        key: "ARTICLE_REWRITE",
        label: "Rewrite Article",
    },
    {
        key: "QUICK_SUMMARY",
        label: "Quick Summary",
    },
    {
        key: "ACADEMY_COACH",
        label: "Academy Coach",
    },
] as const;

export type AiTaskKey = (typeof AI_TASK_KEYS)[number]["key"];

const AI_TASK_KEY_SET = new Set<string>(AI_TASK_KEYS.map((task) => task.key));

export function isAiTaskKey(value: string): value is AiTaskKey {
    return AI_TASK_KEY_SET.has(value);
}
