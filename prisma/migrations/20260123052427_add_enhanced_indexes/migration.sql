-- DropIndex
DROP INDEX "Article_isFeatured_status_idx";

-- CreateIndex
CREATE INDEX "Article_isFeatured_status_createdAt_idx" ON "Article"("isFeatured", "status", "createdAt");

-- CreateIndex
CREATE INDEX "Article_status_views_idx" ON "Article"("status", "views");
