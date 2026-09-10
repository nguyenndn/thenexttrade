const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const sample = await prisma.journalEntry.findFirst({
        where: { symbol: 'XAUUSDc' }
    });
    console.log("XAUUSDc sample lotSize:", sample.lotSize);

    const sample2 = await prisma.journalEntry.findFirst({
        where: { symbol: 'XAUUSD' }
    });
    console.log("XAUUSD sample lotSize:", sample2.lotSize);

    const stats = await prisma.journalEntry.aggregate({
        _min: { lotSize: true },
        _max: { lotSize: true },
        _avg: { lotSize: true },
        _sum: { lotSize: true }
    });
    console.log("Stats:", stats);
}

main().finally(() => prisma.$disconnect());
