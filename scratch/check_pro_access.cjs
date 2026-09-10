const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  // Let's import getUserProAccess or inspect logic
  // Since pro-access.ts is TS, we can inspect what pro-access does
  const userId = "787334ae-0483-4afa-b9fa-4a5af8496940";
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { createdAt: true },
  });
  const allTradingAccounts = await prisma.tradingAccount.findMany({
    where: { userId, isDeleted: false },
  });
  const entitlements = await prisma.proEntitlement.findMany({
    where: { userId },
  });
  console.log("allTradingAccounts count:", allTradingAccounts.length);
  console.log("entitlements count:", entitlements.length);
}
main().finally(() => prisma.$disconnect());
