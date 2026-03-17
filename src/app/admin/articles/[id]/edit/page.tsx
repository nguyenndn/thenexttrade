import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";
import { notFound } from "next/navigation";

export default async function ArticleEditPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (!id) return notFound();

    // Fetch article with all fields needed by ArticleForm
    const article = await prisma.article.findUnique({
        where: { id },
        include: {
            tags: {
                select: { tagId: true }
            }
        }
    });

    if (!article) return notFound();

    // Fetch categories for the form
    const categories = await prisma.category.findMany({
        select: { id: true, name: true },
        orderBy: { name: 'asc' }
    });

    // Map article data to ArticleForm's initialData shape
    const initialData = {
        id: article.id,
        title: article.title,
        content: article.content || "",
        excerpt: article.excerpt || "",
        categoryId: article.categoryId || "",
        status: article.status,
        thumbnail: article.thumbnail || "",
        slug: article.slug,
        metaTitle: article.metaTitle || "",
        metaDescription: article.metaDescription || "",
        publishedAt: article.publishedAt?.toISOString() || "",
        tags: article.tags,
        authorId: article.authorId || "",
        isFeatured: article.isFeatured || false,
        focusKeyword: article.focusKeyword || "",
        updatedAt: article.updatedAt?.toISOString() || "",
    };

    return (
        <ArticleForm
            initialData={initialData}
            categories={categories}
            isEditMode={true}
        />
    );
}
