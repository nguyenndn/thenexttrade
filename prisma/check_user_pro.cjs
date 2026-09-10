const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const userId = '787334ae-0483-4afa-b9fa-4a5af8496940';
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, createdAt: true },
  });
  const accounts = await prisma.tradingAccount.findMany({ where: { userId } });
  const entitlements = await prisma.proEntitlement.findMany({ where: { userId } });
  const vipRequests = await prisma.vipRequest.findMany({ where: { userId } });

  console.log('User:', JSON.stringify(user, null, 2));
  console.log('Accounts:', JSON.stringify(accounts, null, 2));
  console.log('Entitlements:', JSON.stringify(entitlements, null, 2));
  console.log('VIP Requests:', JSON.stringify(vipRequests, null, 2));
}

main().finally(() => prisma.$disconnect());
