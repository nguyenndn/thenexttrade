
import { getKeyStats, getMonthlyAnalytics, getDailyPerformance, getSymbolPerformance } from "../src/lib/analytics-queries";
import { prisma } from "../src/lib/prisma";

async function main() {
    console.log("🚀 Testing Analytics Queries...");

    // 1. Get a random user
    const user = await prisma.user.findFirst();
    if (!user) {
        console.log("❌ No user found to test.");
        return;
    }
    console.log(`👤 Testing for User ID: ${user.id}`);

    // 2. Test Key Stats
    console.log("📊 Testing getKeyStats...");
    const stats = await getKeyStats(user.id);
    console.log("   Result:", stats);

    // 3. Test Monthly
    console.log("📅 Testing getMonthlyAnalytics...");
    const monthly = await getMonthlyAnalytics(user.id);
    console.log(`   Result: ${monthly.length} months found.`);
    if (monthly.length > 0) console.log("   Sample:", monthly[0]);

    // 4. Test Daily
    console.log("📈 Testing getDailyPerformance...");
    const daily = await getDailyPerformance(user.id);
    console.log(`   Result: ${daily.length} days found.`);

    // 5. Test Symbol
    console.log("💱 Testing getSymbolPerformance...");
    const symbols = await getSymbolPerformance(user.id);
    console.log(`   Result: ${symbols.length} symbols found.`);
    if (symbols.length > 0) console.log("   Top Symbol:", symbols[0]);

    console.log("✅ All Queries Executed Successfully!");
}

main()
    .catch(e => {
        console.error("❌ Error:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
