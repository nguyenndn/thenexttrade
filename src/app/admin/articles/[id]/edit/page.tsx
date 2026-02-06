
import { prisma } from "@/lib/prisma";
import { ArticleForm } from "@/components/admin/articles/ArticleForm";
import { notFound } from "next/navigation";

export default async function EditArticlePage(props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    const [article, categories] = await Promise.all([
        prisma.article.findUnique({
            where: { id: params.id }
        }),
        prisma.category.findMany({
            select: { id: true, name: true },
            orderBy: { name: 'asc' }
        })
    ]);

    if (!article) {
        notFound();
    }

    // Cast nulls to empty strings/defined types for form
    const formattedArticle = {
        ...article,
        content: article.content || "",
        excerpt: article.excerpt || "",
        thumbnail: article.thumbnail || "",
        status: article.status || "DRAFT",
        metaTitle: article.metaTitle || "",
        metaDescription: article.metaDescription || "",
        focusKeyword: article.focusKeyword || "",
        publishedAt: article.publishedAt ? article.publishedAt.toISOString() : ""
    };

    return (
        <ArticleForm
            initialData={formattedArticle}
            categories={categories}
            isEditMode={true}
        />
    );
}
