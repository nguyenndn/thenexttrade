import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ArticleOpsDashboard } from "@/components/admin/articles/ArticleOpsDashboard";
import { getArticleOpsData } from "@/lib/articles/article-readiness.server";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function ArticleOpsPage() {
    await requireAdminPageAccess();
    const { rows, summary } = await getArticleOpsData("all");

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Article Ops"
                description="Find articles that need images, SEO fields, or publishing cleanup before they go live."
            >
                <Link href="/admin/articles">
                    <Button variant="outline">
                        <ArrowLeft size={16} />
                        Back to Articles
                    </Button>
                </Link>
            </AdminPageHeader>

            <ArticleOpsDashboard initialRows={rows} initialSummary={summary} />
        </div>
    );
}
