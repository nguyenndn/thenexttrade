
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const args = process.argv.slice(2);
    const command = args[0];

    if (command === "list") {
        console.log("Fetching users...");
        const users = await prisma.user.findMany({
            include: {
                profile: true,
            },
            orderBy: { createdAt: 'desc' }
        });

        if (users.length === 0) {
            console.log("No users found.");
        } else {
            console.table(
                users.map((u) => ({
                    Email: u.email,
                    Name: u.name,
                    Role: u.profile?.role || "USER (No Profile)",
                    ID: u.id,
                }))
            );
        }
    } else if (command === "promote") {
        const email = args[1];
        if (!email) {
            console.error("Please provide an email: npx tsx scripts/manage-admin.ts promote <email>");
            process.exit(1);
        }

        console.log(`Promoting ${email} to ADMIN...`);

        // 1. Find user
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            console.error(`User with email ${email} not found.`);
            console.error("Make sure the user has signed up/exists in the public 'User' table.");
            process.exit(1);
        }

        // 2. Upsert Profile with ADMIN role
        await prisma.profile.upsert({
            where: { userId: user.id },
            update: { role: "ADMIN" },
            create: {
                userId: user.id,
                role: "ADMIN",
                username: email.split("@")[0], // Default username
            },
        });

        console.log(`✅ Success! ${email} is now an ADMIN.`);
    } else {
        console.log("Usage:");
        console.log("  npx tsx scripts/manage-admin.ts list");
        console.log("  npx tsx scripts/manage-admin.ts promote <email>");
    }
}

main()
    .then(async () => {
        await prisma.$disconnect();
    })
    .catch(async (e) => {
        console.error(e);
        await prisma.$disconnect();
        process.exit(1);
    });
