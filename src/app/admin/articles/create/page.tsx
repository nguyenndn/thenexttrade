
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";

export default async function CreateArticlePage() {
    // Fetch categories for the form
    const categories = await prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    return (
        <ArticleForm categories={categories} />
    );
}
