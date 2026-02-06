
import { prisma } from "../src/lib/prisma";
import { updateModule, deleteModule } from "../src/app/admin/ai-studio/modules/actions";

async function main() {
    console.log("🚀 Starting Module CRUD Verification (Robust)...");

    // 1. Setup: Create a temp level
    console.log("1. Creating temporary level...");
    const level = await prisma.level.create({
        data: {
            title: "Temp Verification Level",
            description: "To be deleted",
            order: 9999
        }
    });
    console.log(`   > Created Level: ${level.id}`);

    let moduleId = "";

    try {
        // 2. Setup: Create a temp module
        console.log("2. Creating temporary module...");
        const module = await prisma.module.create({
            data: {
                title: "Original Module Title",
                description: "Original Description",
                levelId: level.id,
                order: 1
            }
        });
        moduleId = module.id;
        console.log(`   > Created Module: ${moduleId}`);

        // 3. Test Update
        console.log("3. Testing updateModule action...");
        console.log("   (Note: 'static generation store missing' error is expected and ignored)");

        try {
            await updateModule(module.id, {
                title: "Updated Module Content",
                description: "Updated Description"
            });
        } catch (e) {
            // Ignore revalidate error
        }

        const updatedModule = await prisma.module.findUnique({ where: { id: module.id } });
        console.log(`   > DB Title: "${updatedModule?.title}"`);

        if (updatedModule?.title !== "Updated Module Content") {
            throw new Error(`Update verification failed: Expected 'Updated Module Content', got '${updatedModule?.title}'`);
        }
        console.log("   > ✅ Update Verified (DB Updated)!");

        // 4. Test Delete
        console.log("4. Testing deleteModule action...");
        try {
            await deleteModule(module.id);
        } catch (e) {
            // Ignore revalidate error
        }

        const deletedModule = await prisma.module.findUnique({ where: { id: module.id } });
        if (deletedModule) {
            throw new Error("Delete verification failed: Module still exists");
        }
        console.log("   > ✅ Delete Verified!");

    } catch (error) {
        console.error("❌ Verification Failed:", error);
    } finally {
        // Cleanup
        console.log("5. Cleaning up...");
        await prisma.level.delete({ where: { id: level.id } }).catch(() => { });
        console.log("   > Cleanup complete.");
    }
}

main();
