const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const RATES_CONFIG = [
    {
        slug: "EXNESS",
        name: "Exness",
        xauRate: 6.0,
        defaultRate: 0.0,
    },
    {
        slug: "VANTAGE",
        name: "Vantage Markets",
        xauRate: 17.0,
        defaultRate: 0.0,
    },
    {
        slug: "VTMARKETS",
        name: "VT Markets",
        xauRate: 17.0,
        defaultRate: 0.0,
    },
    {
        slug: "ULTIMAMARKETS",
        name: "Ultima Markets",
        xauRate: 17.0,
        defaultRate: 0.0,
    },
];

async function main() {
    console.log("--- Seeding Broker Commission Rates ---");

    for (const item of RATES_CONFIG) {
        let broker = await prisma.eABroker.findUnique({
            where: { slug: item.slug },
        });

        if (!broker) {
            console.warn(`Broker ${item.slug} not found in DB. Searching by name...`);
            broker = await prisma.eABroker.findFirst({
                where: { name: { contains: item.name, mode: "insensitive" } },
            });
        }

        if (!broker) {
            console.error(`Could not locate broker ${item.slug} in DB!`);
            continue;
        }

        // 1. Update commissionPerLot on EABroker
        await prisma.eABroker.update({
            where: { id: broker.id },
            data: {
                commissionPerLot: item.xauRate,
                commissionCurrency: "USD",
            },
        });
        console.log(`Updated EABroker ${broker.name} (commissionPerLot: $${item.xauRate}/lot)`);

        // 2. Upsert XAUUSD rate
        const effectiveDate = new Date("2026-01-01T00:00:00.000Z");
        
        await prisma.brokerCommissionRate.upsert({
            where: {
                brokerId_symbol_effectiveFrom: {
                    brokerId: broker.id,
                    symbol: "XAUUSD",
                    effectiveFrom: effectiveDate,
                },
            },
            create: {
                brokerId: broker.id,
                symbol: "XAUUSD",
                commissionPerLot: item.xauRate,
                currency: "USD",
                effectiveFrom: effectiveDate,
            },
            update: {
                commissionPerLot: item.xauRate,
                currency: "USD",
            },
        });
        console.log(`  -> Seeded rate for ${broker.name}: XAUUSD = $${item.xauRate}/lot`);

        // 3. Upsert wildcard fallback rate
        await prisma.brokerCommissionRate.upsert({
            where: {
                brokerId_symbol_effectiveFrom: {
                    brokerId: broker.id,
                    symbol: "*",
                    effectiveFrom: effectiveDate,
                },
            },
            create: {
                brokerId: broker.id,
                symbol: "*",
                commissionPerLot: item.defaultRate,
                currency: "USD",
                effectiveFrom: effectiveDate,
            },
            update: {
                commissionPerLot: item.defaultRate,
                currency: "USD",
            },
        });
        console.log(`  -> Seeded fallback rate for ${broker.name}: * = $${item.defaultRate}/lot`);
    }

    console.log("--- Commission Rates Seeding Complete ---");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
