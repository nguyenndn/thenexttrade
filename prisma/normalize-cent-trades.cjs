const { PrismaClient } = require('c:/laragon/www/gsn-crm/node_modules/@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("Starting Cent trade volume normalization...");

    const before = await prisma.journalEntry.aggregate({
        _sum: { lotSize: true },
        _count: { id: true },
    });
    console.log(`Before normalization: ${before._count.id} trades, total lots = ${before._sum.lotSize}`);

    // Update all trades for the Cent account user
    const updatedCount = await prisma.$executeRaw`
        UPDATE "JournalEntry"
        SET "lotSize" = ROUND(CAST("lotSize" / 100.0 AS numeric), 6)
        WHERE "userId" = '787334ae-0483-4afa-b9fa-4a5af8496940'::uuid;
    `;
    console.log(`Updated ${updatedCount} rows in JournalEntry.`);

    const after = await prisma.journalEntry.aggregate({
        _sum: { lotSize: true },
        _count: { id: true },
        _min: { lotSize: true },
        _max: { lotSize: true },
    });
    console.log(`After normalization: ${after._count.id} trades, total lots = ${after._sum.lotSize}`);
    console.log(`Min lot: ${after._min.lotSize}, Max lot: ${after._max.lotSize}`);
    console.log(`Rounded total standard lots: ${(Math.round((after._sum.lotSize || 0) * 100) / 100).toFixed(2)} Lots`);
}

main()
    .catch((err) => {
        console.error("Migration failed:", err);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
