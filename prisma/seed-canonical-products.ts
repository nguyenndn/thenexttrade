// Seed script: ensure the 3 canonical EA products exist so product-usage access
// grants (FK -> EAProduct.id) can be written by approveVipRequest / admin actions.
// Run with: npx tsx prisma/seed-canonical-products.ts
// Idempotent: upserts by unique slug, keeps id === slug to match CANONICAL_PRODUCTS.

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

const CANONICAL_PRODUCTS = [
    {
        id: "goldscalperninja",
        slug: "goldscalperninja",
        name: "GoldScalperNinja",
        description: "Flagship Gold XAUUSD EA",
        type: "AUTO_TRADE",
    },
    {
        id: "trade-manager",
        slug: "trade-manager",
        name: "Trade Manager",
        description: "Execution & Risk Management Utility",
        type: "MANUAL_ASSIST",
    },
    {
        id: "gsn-phoenix-grid",
        slug: "gsn-phoenix-grid",
        name: "GSN Phoenix Grid",
        description: "Automated Grid & Trend EA",
        type: "AUTO_TRADE",
    },
];

async function main() {
    for (const p of CANONICAL_PRODUCTS) {
        const product = await prisma.eAProduct.upsert({
            where: { slug: p.slug },
            update: {
                name: p.name,
                description: p.description,
                type: p.type,
                isActive: true,
            },
            create: {
                id: p.id,
                slug: p.slug,
                name: p.name,
                description: p.description,
                type: p.type,
                platform: "BOTH",
                isActive: true,
            },
        });
        console.log(`✅ EAProduct seeded: ${product.slug} (${product.id})`);
    }
}

main()
    .catch((err) => {
        console.error(err);
        process.exitCode = 1;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
