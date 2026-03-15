-- AlterTable
ALTER TABLE "ea_brokers" ADD COLUMN     "ibCode" TEXT;

-- AlterTable
ALTER TABLE "trading_accounts" ADD COLUMN     "timezone" VARCHAR(50) NOT NULL DEFAULT 'Etc/UTC';

-- CreateTable
CREATE TABLE "content_shortcuts" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "content" TEXT NOT NULL,
    "authorId" UUID NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "content_shortcuts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "content_shortcuts_authorId_idx" ON "content_shortcuts"("authorId");

-- AddForeignKey
ALTER TABLE "content_shortcuts" ADD CONSTRAINT "content_shortcuts_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
