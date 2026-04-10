// Seed script: Create ninja_team partner
// Run with: npx tsx prisma/seed-partner.ts

const { PrismaClient } = require("@prisma/client");
const { createHash } = require("crypto");

const prisma = new PrismaClient();

async function main() {
    const API_KEY = "pvsr_live_cff7edb1f84261e9fe7aacabdb416333852bf9881d8cdc57";
    const apiKeyHash = createHash("sha256").update(API_KEY).digest("hex");

    const partner = await prisma.partner.upsert({
        where: { partnerCode: "ninja_team" },
        update: {
            apiKeyHash,
            partnerName: "Ninja Team Vietnam",
            status: "ACTIVE",
        },
        create: {
            partnerCode: "ninja_team",
            partnerName: "Ninja Team Vietnam",
            apiKeyHash,
            status: "ACTIVE",
        },
    });

    console.log("✅ Partner seeded:", {
        id: partner.id,
        code: partner.partnerCode,
        name: partner.partnerName,
        status: partner.status,
        hashPrefix: apiKeyHash.slice(0, 16) + "...",
    });
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
