const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const account = await prisma.tradingAccount.findFirst({
    where: { accountNumber: '600001145' },
    select: { id: true, userId: true, name: true, accountNumber: true, broker: true }
  });
  console.log('=== TRADING ACCOUNT ===');
  console.log(JSON.stringify(account, null, 2));
  if (!account) return;

  const profile = await prisma.profile.findUnique({
    where: { userId: account.userId },
    select: { mainTradingAccountId: true, userId: true }
  });
  console.log('=== PROFILE (mainTradingAccountId) ===');
  console.log(JSON.stringify(profile, null, 2));

  const entitlements = await prisma.proEntitlement.findMany({
    where: { userId: account.userId },
    select: { id: true, tradingAccountId: true, status: true, source: true, broker: true, accountNumber: true, startsAt: true, expiresAt: true }
  });
  console.log('=== PRO ENTITLEMENTS ===');
  console.log(JSON.stringify(entitlements, null, 2));

  const accounts = await prisma.tradingAccount.findMany({
    where: { userId: account.userId },
    select: { id: true, name: true, accountNumber: true, broker: true }
  });
  console.log('=== ALL TRADING ACCOUNTS ===');
  console.log(JSON.stringify(accounts, null, 2));

  const vipReq = await prisma.vipRequest.findFirst({
    where: { userId: account.userId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, status: true, tradingAccountId: true, broker: true, accountNumber: true }
  });
  console.log('=== VIP REQUEST ===');
  console.log(JSON.stringify(vipReq, null, 2));
}
main().then(() => process.exit(0));
