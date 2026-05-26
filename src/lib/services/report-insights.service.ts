// ============================================================================
// REPORT INSIGHTS SERVICE
// Generates max 3 "Weekly Focus" insights from trade data
// ============================================================================

interface InsightInput {
  totalTrades: number;
  winRate: number;
  netPnL: number;
  profitFactor: number;
  avgWin: number;
  avgLoss: number;
  planCompliance: number | null;
  avgConfidence: number | null;
  bySymbol: { name: string; trades: number; pnl: number; winRate: number }[];
  bySession: { name: string; trades: number; pnl: number; winRate: number }[];
  topMistakes: { mistakeId: string; name: string; count: number }[];
  prevWinRate: number | null;
  prevPnL: number | null;
  prevTrades: number | null;
}

export interface WeeklyInsight {
  type: "STRENGTH" | "WARNING" | "ACTION";
  icon: "trophy" | "alert-triangle" | "target" | "trending-up" | "trending-down" | "brain";
  title: string;
  body: string;
}

export function buildWeeklyInsights(data: InsightInput): WeeklyInsight[] {
  const insights: WeeklyInsight[] = [];
  const MAX_INSIGHTS = 3;

  if (data.totalTrades === 0) return [];

  // ── Strength: Win rate improvement ──
  if (data.prevWinRate !== null && data.winRate > data.prevWinRate + 5) {
    const diff = Math.round(data.winRate - data.prevWinRate);
    insights.push({
      type: "STRENGTH",
      icon: "trending-up",
      title: "Win Rate Up",
      body: `Your win rate improved by ${diff}% compared to last week. Keep the momentum.`,
    });
  }

  // ── Strength: High plan compliance ──
  if (data.planCompliance !== null && data.planCompliance >= 80 && insights.length < MAX_INSIGHTS) {
    insights.push({
      type: "STRENGTH",
      icon: "trophy",
      title: "Great Discipline",
      body: `${Math.round(data.planCompliance)}% plan compliance this week. Consistent execution is a Pro-level habit.`,
    });
  }

  // ── Strength: Strong profit factor ──
  if (data.profitFactor >= 2.0 && insights.length < MAX_INSIGHTS) {
    insights.push({
      type: "STRENGTH",
      icon: "trophy",
      title: "Strong Edge",
      body: `Profit factor of ${!isFinite(data.profitFactor) ? "∞" : data.profitFactor.toFixed(1)} — your winners outweigh losses by a healthy margin.`,
    });
  }

  // ── Warning: Win rate drop ──
  if (data.prevWinRate !== null && data.winRate < data.prevWinRate - 10 && insights.length < MAX_INSIGHTS) {
    insights.push({
      type: "WARNING",
      icon: "trending-down",
      title: "Win Rate Declined",
      body: `Win rate dropped from ${Math.round(data.prevWinRate)}% to ${Math.round(data.winRate)}%. Review your entries this week.`,
    });
  }

  // ── Warning: Low plan compliance ──
  if (data.planCompliance !== null && data.planCompliance < 50 && insights.length < MAX_INSIGHTS) {
    insights.push({
      type: "WARNING",
      icon: "alert-triangle",
      title: "Low Plan Compliance",
      body: `Only ${Math.round(data.planCompliance)}% of trades followed your plan. Discipline is your edge.`,
    });
  }

  // ── Warning: Avg loss > avg win ──
  if (data.avgLoss > data.avgWin * 1.5 && data.avgWin > 0 && insights.length < MAX_INSIGHTS) {
    const ratio = (data.avgLoss / data.avgWin).toFixed(1);
    insights.push({
      type: "WARNING",
      icon: "alert-triangle",
      title: "Risk/Reward Imbalance",
      body: `Your average loss is ${ratio}x your average win. Consider tighter stops or wider targets.`,
    });
  }

  // ── Action: Worst symbol ──
  const worstSymbol = data.bySymbol.find(s => s.pnl < 0 && s.trades >= 3);
  if (worstSymbol && insights.length < MAX_INSIGHTS) {
    insights.push({
      type: "ACTION",
      icon: "target",
      title: `Review ${worstSymbol.name}`,
      body: `${worstSymbol.name} lost $${Math.abs(worstSymbol.pnl).toFixed(0)} across ${worstSymbol.trades} trades. Consider pausing or adjusting your approach.`,
    });
  }

  // ── Action: Recurring mistake ──
  if (data.topMistakes.length > 0 && data.topMistakes[0].count >= 3 && insights.length < MAX_INSIGHTS) {
    const top = data.topMistakes[0];
    insights.push({
      type: "ACTION",
      icon: "brain",
      title: `Recurring: ${top.name}`,
      body: `"${top.name}" appeared ${top.count} times this week. Create a pre-trade checklist item to address it.`,
    });
  }

  // ── Action: Best session ──
  const bestSession = data.bySession.filter(s => s.pnl > 0).sort((a, b) => b.pnl - a.pnl)[0];
  if (bestSession && insights.length < MAX_INSIGHTS) {
    insights.push({
      type: "ACTION",
      icon: "target",
      title: `Focus on ${bestSession.name}`,
      body: `${bestSession.name} session generated $${bestSession.pnl.toFixed(0)} profit. Consider concentrating your entries there.`,
    });
  }

  return insights.slice(0, MAX_INSIGHTS);
}
