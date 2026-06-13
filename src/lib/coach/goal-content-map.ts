/**
 * Goal-Driven Content Recommendations
 *
 * Maps onboarding trading goals to recommended Academy lessons and
 * customized coach nudge messages. This ensures the user's goal choice
 * actually influences their experience beyond just the WelcomeHero text.
 *
 * Goals: track | mistakes | discipline | pro
 */

/**
 * Goal → Academy lesson slugs mapping.
 * Each goal surfaces different starter lessons in the "Recommended for you" section.
 * Slugs must match published lessons in the database.
 */
export const GOAL_LESSON_MAP: Record<string, {
 lessonSlugs: string[];
 reason: string;
}> = {
 track: {
 lessonSlugs: [
 "getting-started-with-thenexttrade",
 "trading-routine-for-consistency",
 "build-your-trading-plan",
 ],
 reason: "Based on your goal to track trades effectively",
 },
 mistakes: {
 lessonSlugs: [
 "trading-psychology-discipline",
 "risk-management-foundations",
 "trading-routine-for-consistency",
 ],
 reason: "Based on your goal to identify and fix trading mistakes",
 },
 discipline: {
 lessonSlugs: [
 "trading-psychology-discipline",
 "build-your-trading-plan",
 "trading-routine-for-consistency",
 ],
 reason: "Based on your goal to build trading discipline",
 },
 pro: {
 lessonSlugs: [
 "trade-management-basics",
 "risk-management-foundations",
 "market-selection-basics",
 ],
 reason: "Based on your goal to trade at a professional level",
 },
};

/**
 * Goal → Coach nudge customization.
 * When the coach has a NO_ACCOUNT or NO_FIRST_TRADE signal,
 * the nudge title/description adapts to match the user's goal framing.
 */
export const GOAL_NUDGE_OVERRIDES: Record<string, Record<string, {
 title: string;
 summary: string;
}>> = {
 track: {
 NO_ACCOUNT: {
 title: "Connect your account to start tracking",
 summary: "Your dashboard will automatically organize every trade with entries, exits, and P&L — no manual work needed.",
 },
 NO_FIRST_TRADE: {
 title: "Sync your first trade to see your dashboard",
 summary: "Once your first trade syncs, you'll see your performance chart, win rate, and daily stats come alive.",
 },
 NO_LESSON_STARTED: {
 title: "Learn how to read your dashboard",
 summary: "A quick lesson will help you understand what each metric means and how to use it to improve.",
 },
 },
 mistakes: {
 NO_ACCOUNT: {
 title: "Connect your account so we can find mistakes",
 summary: "Our AI will analyze your trades and highlight patterns that are costing you money — automatically.",
 },
 NO_FIRST_TRADE: {
 title: "Log a trade to start finding leaks",
 summary: "We need at least one trade to begin detecting behavioral patterns, SL clusters, and revenge sizing.",
 },
 NO_LESSON_STARTED: {
 title: "Start with Psychology — your biggest edge",
 summary: "Most trading mistakes come from emotions, not strategy. Learn to recognize and prevent them.",
 },
 },
 discipline: {
 NO_ACCOUNT: {
 title: "Connect your account to track discipline",
 summary: "Your dashboard will monitor streaks, plan compliance, and routine consistency — all automatically.",
 },
 NO_FIRST_TRADE: {
 title: "Sync your first trade to build your streak",
 summary: "Every trade counts toward your consistency streak. Start tracking to build the habit.",
 },
 NO_LESSON_STARTED: {
 title: "Learn the 3 pillars of trading discipline",
 summary: "Routine, rules, and review — master these and your results will follow.",
 },
 },
 pro: {
 NO_ACCOUNT: {
 title: "Connect your account to unlock Pro tools",
 summary: "AI Trade Score, advanced analytics, and professional-grade insights are ready — just connect your MT5.",
 },
 NO_FIRST_TRADE: {
 title: "Sync trades to activate your Trade Score",
 summary: "Your AI-powered Trade Score and professional analytics need trade data to calibrate.",
 },
 NO_LESSON_STARTED: {
 title: "Sharpen your edge with advanced lessons",
 summary: "Professional traders never stop learning. Start with trade management and risk frameworks.",
 },
 },
};
