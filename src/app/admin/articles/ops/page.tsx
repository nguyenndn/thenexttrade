import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { ArticleOpsDashboard } from "@/components/admin/articles/ArticleOpsDashboard";
import { getArticleOpsData } from "@/lib/articles/article-readiness.server";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { isAdminRole } from "@/lib/permissions";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

async function requireAdminPageAccess() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (!profile || !isAdminRole(profile.role)) redirect("/forbidden");
}

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
