import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function CreateArticlePage() {
    await requireAdminPageAccess();
    // Fetch categories for the form
    const categories = await prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: "asc" },
    });

    return <ArticleForm categories={categories} />;
}
