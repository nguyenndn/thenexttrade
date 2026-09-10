const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
async function main() {
  const user = await prisma.user.findFirst({
    where: { email: "keezimin@gmail.com" },
    include: {
      tradingAccounts: true,
      vipRequests: true,
      proEntitlements: true,
    },
  });
  console.log("User:", user?.id, user?.email);
  console.log("TradingAccounts:", user?.tradingAccounts.map(a => ({ id: a.id, name: a.name, broker: a.broker, accountNumber: a.accountNumber, accountType: a.accountType })));
  console.log("VIP Requests:", user?.vipRequests.map(r => ({ id: r.id, broker: r.broker, accountNumber: r.accountNumber, status: r.status })));
  console.log("Pro Entitlements:", user?.proEntitlements.map(e => ({ id: e.id, broker: e.broker, accountNumber: e.accountNumber, status: e.status, tradingAccountId: e.tradingAccountId })));
}
main().finally(() => prisma.$disconnect());
