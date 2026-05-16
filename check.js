const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
async function main() {
    const brokers = await prisma.eABroker.findMany();
    console.log(JSON.stringify(brokers, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
