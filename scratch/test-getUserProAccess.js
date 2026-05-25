const { getUserProAccess } = require('../src/lib/pro-access');
const { PrismaClient } = require('@prisma/client');

async function main() {
  const userId = '787334ae-0483-4afa-b9fa-4a5af8496940';
  const result = await getUserProAccess(userId);
  console.log('=== getUserProAccess RESULT ===');
  console.log(JSON.stringify(result, null, 2));
}

main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
