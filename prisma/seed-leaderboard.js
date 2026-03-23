// Seed leaderboard demo data - ALL TABS
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true },
    take: 20,
  });

  console.log(`Found ${users.length} users`);
  if (users.length === 0) return;

  // --- ACADEMY TAB: Seed lesson completions ---
  const lessons = await prisma.lesson.findMany({ take: 20, select: { id: true } });
  console.log(`\nFound ${lessons.length} lessons`);

  if (lessons.length > 0) {
    // User 0 completes ALL lessons, user 1 most, etc.
    for (let u = 0; u < Math.min(5, users.length); u++) {
      const lessonsForUser = Math.max(1, lessons.length - u * 3);
      let completed = 0;
      for (let l = 0; l < lessonsForUser && l < lessons.length; l++) {
        await prisma.userProgress.upsert({
          where: {
            userId_lessonId: { userId: users[u].id, lessonId: lessons[l].id },
          },
          update: { isCompleted: true, completedAt: new Date(Date.now() - l * 86400000) },
          create: {
            userId: users[u].id,
            lessonId: lessons[l].id,
            isCompleted: true,
            completedAt: new Date(Date.now() - l * 86400000),
          },
        });
        completed++;
      }
      console.log(`📚 ${users[u].name || users[u].email} → ${completed} lessons`);
    }
  }

  // --- TRADING TAB: Seed journal entries (last 7 days, CLOSED, min 5 trades) ---
  // Need a trading account for each user
  const symbols = ["EURUSD", "GBPUSD", "USDJPY", "XAUUSD", "BTCUSD"];
  const tradingProfiles = [
    { wins: 8, losses: 2, label: "80% WR" },
    { wins: 7, losses: 3, label: "70% WR" },
    { wins: 6, losses: 4, label: "60% WR" },
    { wins: 5, losses: 5, label: "50% WR" },
    { wins: 4, losses: 4, label: "50% WR (8 trades)" },
  ];

  for (let u = 0; u < Math.min(5, users.length); u++) {
    const profile = tradingProfiles[u];

    // Get or create a trading account
    let account = await prisma.tradingAccount.findFirst({
      where: { userId: users[u].id },
      select: { id: true },
    });

    if (!account) {
      account = await prisma.tradingAccount.create({
        data: {
          userId: users[u].id,
          name: `Demo Account`,
          broker: "Demo",
          accountNumber: `DEMO${1000 + u}`,
          balance: 10000 + u * 5000,
          currency: "USD",
        },
        select: { id: true },
      });
      console.log(`🏦 Created trading account for ${users[u].name}`);
    }

    // Delete old seed trades (to avoid duplicates)
    await prisma.journalEntry.deleteMany({
      where: {
        userId: users[u].id,
        notes: "LEADERBOARD_SEED",
      },
    });

    // Create WIN trades
    for (let w = 0; w < profile.wins; w++) {
      const daysAgo = Math.floor(Math.random() * 6) + 1;
      const entryDate = new Date(Date.now() - daysAgo * 86400000);
      const exitDate = new Date(entryDate.getTime() + 3600000);
      const pnl = Math.round((50 + Math.random() * 200) * 100) / 100;

      await prisma.journalEntry.create({
        data: {
          userId: users[u].id,
          accountId: account.id,
          symbol: symbols[w % symbols.length],
          type: Math.random() > 0.5 ? "BUY" : "SELL",
          status: "CLOSED",
          result: "WIN",
          entryPrice: 1.1000 + Math.random() * 0.01,
          exitPrice: 1.1050 + Math.random() * 0.01,
          lotSize: 0.1 + Math.random() * 0.4,
          pnl: pnl,
          entryDate,
          exitDate,
          notes: "LEADERBOARD_SEED",
        },
      });
    }

    // Create LOSS trades
    for (let l = 0; l < profile.losses; l++) {
      const daysAgo = Math.floor(Math.random() * 6) + 1;
      const entryDate = new Date(Date.now() - daysAgo * 86400000);
      const exitDate = new Date(entryDate.getTime() + 3600000);
      const pnl = -Math.round((30 + Math.random() * 100) * 100) / 100;

      await prisma.journalEntry.create({
        data: {
          userId: users[u].id,
          accountId: account.id,
          symbol: symbols[l % symbols.length],
          type: Math.random() > 0.5 ? "BUY" : "SELL",
          status: "CLOSED",
          result: "LOSS",
          entryPrice: 1.1000 + Math.random() * 0.01,
          exitPrice: 1.0950 + Math.random() * 0.01,
          lotSize: 0.1 + Math.random() * 0.4,
          pnl: pnl,
          entryDate,
          exitDate,
          notes: "LEADERBOARD_SEED",
        },
      });
    }

    const totalTrades = profile.wins + profile.losses;
    console.log(`📈 ${users[u].name || users[u].email} → ${totalTrades} trades (${profile.label})`);
  }

  console.log("\n🏆 Leaderboard seed complete — all 4 tabs ready!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
