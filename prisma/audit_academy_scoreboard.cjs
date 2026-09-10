const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

const BANNED_PATTERNS = [
  { name: 'unlock your potential', regex: /unlock\s+(your\s+)?potential/gi },
  { name: 'elevate your', regex: /elevate\s+(your\s+)?(trading|journey|game|skills)/gi },
  { name: 'journey', regex: /\b(your\s+)?journey\b/gi },
  { name: 'seamless / seamlessly', regex: /\bseamless(ly)?\b/gi },
  { name: 'utilize / utilizing', regex: /\butiliz(e|es|ed|ing|ation)\b/gi },
  { name: 'at its core', regex: /\bat\s+its\s+core\b/gi },
  { name: 'furthermore', regex: /\bfurthermore\b/gi },
  { name: 'in conclusion', regex: /\bin\s+conclusion\b/gi },
  { name: 'testament to', regex: /\btestament\s+to\b/gi },
  { name: "in today's fast-paced", regex: /in\s+today'?s\s+(fast-paced|modern)\s+market/gi },
  { name: 'game-changing', regex: /\bgame-?changing\b/gi },
  { name: 'supercharge', regex: /\bsupercharge[ds]?\b/gi },
  { name: 'delve into', regex: /\bdelv(e|es|ed|ing)(\s+into)?\b/gi },
  { name: 'master the art', regex: /\bmaster(ing)?\s+the\s+art\b/gi },
  { name: 'beacon of hope', regex: /\bbeacon\s+of\s+hope\b/gi },
  { name: 'deep dive / dive deep', regex: /\b(deep\s+dive|dive\s+deep)\b/gi },
  { name: 'embark', regex: /\bembark(ed|ing|s)?\b/gi },
  { name: 'plethora', regex: /\bplethora\b/gi },
  { name: 'tapestry', regex: /\btapestry\b/gi },
  { name: 'paramount', regex: /\bparamount\b/gi },
  { name: 'crucial to note', regex: /\bcrucial\s+to\s+(note|remember|understand)\b/gi },
  { name: 'it is important to remember', regex: /it('?s|\s+is)\s+important\s+to\s+(remember|keep\s+in\s+mind|note)\b/gi },
  { name: 'legacy "Breek" brand', regex: /\bBreek\b/gi },
];

const REAL_MATH_PATTERNS = [
  { name: 'dollar_risk', regex: /\$\d+(\.\d+)?/ },
  { name: 'lot_size', regex: /\b0\.\d{1,2}\s*(lots?|micro|mini)?\b|\b\d+\s*lots?\b/i },
  { name: 'pip_distance', regex: /\b\d+\s*pips?\b/i },
  { name: 'rr_ratio', regex: /\b1:\d+(\.\d+)?\b|\bR:R\b/i },
  { name: 'capital_preservation', regex: /\b(stop-?loss|hard\s+stop|drawdown|capital\s+preservation)\b/i },
];

const TELEMETRY_PATTERNS = [
  { name: 'the_next_trade_telemetry', regex: /\b(TheNextTrade|MT5\s+(sync|telemetry|data)|behavioral\s+leak|10-trade\s+sprint)\b/i },
];

const ACTION_STEP_PATTERNS = [
  { name: 'action_step', regex: /(action\s+step|🎯|your\s+action)/i },
];

async function audit() {
  console.log('🔍 [Audit Scoreboard] Loading all 132 lessons...');
  const lessons = await prisma.lesson.findMany({
    include: {
      module: {
        include: {
          level: true,
        },
      },
    },
    orderBy: [
      { module: { level: { order: 'asc' } } },
      { module: { order: 'asc' } },
      { order: 'asc' },
    ],
  });

  const report = {
    totalLessons: lessons.length,
    clicheSummary: {},
    lessonsWithCliches: 0,
    lessonsMissingRealMath: 0,
    lessonsMissingTelemetry: 0,
    lessonsMissingActionStep: 0,
    details: [],
  };

  BANNED_PATTERNS.forEach((p) => {
    report.clicheSummary[p.name] = 0;
  });

  lessons.forEach((l) => {
    const text = (l.content || '') + ' ' + (l.metaDescription || '');
    const clichesFound = [];

    BANNED_PATTERNS.forEach((p) => {
      const matches = text.match(p.regex);
      if (matches && matches.length > 0) {
        clichesFound.push({ name: p.name, count: matches.length });
        report.clicheSummary[p.name] += matches.length;
      }
    });

    const hasRealMath = REAL_MATH_PATTERNS.every((p) => p.regex.test(text));
    const hasTelemetry = TELEMETRY_PATTERNS.some((p) => p.regex.test(text));
    const hasActionStep = ACTION_STEP_PATTERNS.some((p) => p.regex.test(text));

    if (clichesFound.length > 0) report.lessonsWithCliches++;
    if (!hasRealMath) report.lessonsMissingRealMath++;
    if (!hasTelemetry) report.lessonsMissingTelemetry++;
    if (!hasActionStep) report.lessonsMissingActionStep++;

    report.details.push({
      id: l.id,
      slug: l.slug,
      title: l.title,
      levelOrder: l.module?.level?.order,
      levelTitle: l.module?.level?.title,
      moduleOrder: l.module?.order,
      moduleTitle: l.module?.title,
      charCount: l.content?.length || 0,
      cliches: clichesFound,
      hasRealMath,
      hasTelemetry,
      hasActionStep,
    });
  });

  console.log('\n================ AUDIT SCOREBOARD ================');
  console.log(`Total Lessons: ${report.totalLessons}`);
  console.log(`Lessons with AI Clichés: ${report.lessonsWithCliches} / ${report.totalLessons} (${((report.lessonsWithCliches / report.totalLessons) * 100).toFixed(1)}%)`);
  console.log(`Lessons Missing Full Real Math Suite: ${report.lessonsMissingRealMath} / ${report.totalLessons} (${((report.lessonsMissingRealMath / report.totalLessons) * 100).toFixed(1)}%)`);
  console.log(`Lessons Missing TNT Telemetry Hooks: ${report.lessonsMissingTelemetry} / ${report.totalLessons} (${((report.lessonsMissingTelemetry / report.totalLessons) * 100).toFixed(1)}%)`);
  console.log(`Lessons Missing Action Step: ${report.lessonsMissingActionStep} / ${report.totalLessons} (${((report.lessonsMissingActionStep / report.totalLessons) * 100).toFixed(1)}%)`);
  console.log('\n--- Banned AI Clichés Breakdown ---');
  Object.entries(report.clicheSummary)
    .filter(([_, count]) => count > 0)
    .sort((a, b) => b[1] - a[1])
    .forEach(([name, count]) => {
      console.log(`- ${name}: ${count} occurrences`);
    });

  const outPath = path.join(__dirname, 'academy_audit_report.json');
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), 'utf-8');
  console.log(`\n✅ Detailed audit report written to: ${outPath}`);

  await prisma.$disconnect();
}

audit().catch(async (e) => {
  console.error('Audit failed:', e);
  await prisma.$disconnect();
  process.exit(1);
});
