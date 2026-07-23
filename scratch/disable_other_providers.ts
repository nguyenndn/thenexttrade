import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("Disabling non-OpenRouter providers and enabling OpenRouter...");

    // Disable all providers except openrouter
    const disabledCount = await prisma.aiProvider.updateMany({
        where: {
            providerCode: { not: "openrouter" },
        },
        data: {
            enabled: false,
        },
    });
    console.log(`Disabled ${disabledCount.count} providers.`);

    // Enable openrouter
    await prisma.aiProvider.updateMany({
        where: {
            providerCode: "openrouter",
        },
        data: {
            enabled: true,
        },
    });
    console.log("OpenRouter provider enabled.");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
