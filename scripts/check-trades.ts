
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  try {
    const count = await prisma.journalEntry.count();
    console.log(`Total Journal Entries: ${count}`);

    if (count > 0) {
      const trades = await prisma.journalEntry.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: { account: true }
      });
      
      console.log("Most recent 5 trades:");
      trades.forEach(t => {
        console.log(`- [${t.status}] ${t.symbol} ${t.type} @ ${t.entryDate.toISOString()} (Account: ${t.account?.name} / ${t.accountId}) - UserID: ${t.userId}`);
      });
    }

    const accounts = await prisma.tradingAccount.findMany();
    console.log("\nTrading Accounts:");
    accounts.forEach(a => {
        console.log(`- ${a.name} (ID: ${a.id}) - Owner: ${a.userId}`);
    });

  } catch (error) {
    console.error("Error:", error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
