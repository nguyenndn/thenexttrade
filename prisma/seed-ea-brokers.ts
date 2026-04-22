/**
 * Seed EA Brokers — Exness, Vantage, VT Markets, Ultima Markets
 * Run: npx tsx prisma/seed-ea-brokers.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const EA_BROKERS = [
    {
        name: "Exness",
        slug: "EXNESS",
        logo: "/images/brokers/exness.png",
        affiliateUrl: "https://one.exnesstrack.org/a/1ewjh1ww32",
        ibCode: "1ewjh1ww32",
        color: "#F59E0B",
        isActive: true,
        order: 1,
    },
    {
        name: "Vantage Markets",
        slug: "VANTAGE",
        logo: "/images/brokers/vantage.png",
        affiliateUrl: "https://www.vantagemarkets.com/forex-trading/forex-trading-account/?affid=111451",
        ibCode: "111451",
        color: "#0EA5E9",
        isActive: true,
        order: 2,
    },
    {
        name: "VT Markets",
        slug: "VTMARKETS",
        logo: "/images/brokers/vtmarkets.png",
        affiliateUrl: "https://www.vtmarkets.com/get-trading/forex-trading-account/?affid=830422",
        ibCode: "830422",
        color: "#6366F1",
        isActive: true,
        order: 3,
    },
    {
        name: "Ultima Markets",
        slug: "ULTIMAMARKETS",
        logo: "/images/brokers/ultima.png",
        affiliateUrl: "https://www.ultimamarkets.trade/forex-trading/forex-trading-account/?affid=NzIzNDkwMw==",
        ibCode: "NzIzNDkwMw==",
        color: "#7C3AED",
        isActive: true,
        order: 4,
    },
];

async function main() {
    console.log("🚀 Seeding EA Brokers...\n");

    for (const broker of EA_BROKERS) {
        const result = await prisma.eABroker.upsert({
            where: { slug: broker.slug },
            update: {
                name: broker.name,
                logo: broker.logo,
                affiliateUrl: broker.affiliateUrl,
                ibCode: broker.ibCode,
                color: broker.color,
                isActive: broker.isActive,
                order: broker.order,
            },
            create: broker,
        });

        console.log(`  ✅ ${result.name} (${result.slug}) — ${result.id}`);
    }

    console.log(`\n🎉 Done! ${EA_BROKERS.length} brokers seeded.`);
}

main()
    .catch((e) => {
        console.error("❌ Seed failed:", e);
        process.exit(1);
    })
    .finally(() => prisma.$disconnect());
