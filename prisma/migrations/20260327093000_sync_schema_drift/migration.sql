-- CreateEnum
DO $$ BEGIN
    CREATE TYPE "ArticleSchemaType" AS ENUM ('ARTICLE', 'HOWTO', 'FAQ', 'LISTICLE');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- CreateTable: ArticleVote
CREATE TABLE IF NOT EXISTS "ArticleVote" (
    "id" TEXT NOT NULL,
    "userId" UUID NOT NULL,
    "articleId" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ArticleVote_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Challenge
CREATE TABLE IF NOT EXISTS "Challenge" (
    "id" TEXT NOT NULL,
    "challengerId" UUID NOT NULL,
    "challengeeId" UUID NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "expiresAt" TIMESTAMPTZ,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "Challenge_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Feedback
CREATE TABLE IF NOT EXISTS "Feedback" (
    "id" TEXT NOT NULL,
    "userId" UUID,
    "type" TEXT NOT NULL DEFAULT 'general',
    "message" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "adminNote" TEXT,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    CONSTRAINT "Feedback_pkey" PRIMARY KEY ("id")
);

-- CreateTable: Quote
CREATE TABLE IF NOT EXISTS "Quote" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable: ToolView
CREATE TABLE IF NOT EXISTS "ToolView" (
    "id" TEXT NOT NULL,
    "toolSlug" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "lastViewedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ToolView_pkey" PRIMARY KEY ("id")
);

-- CreateTable: UserFollow
CREATE TABLE IF NOT EXISTS "UserFollow" (
    "id" TEXT NOT NULL,
    "followerId" UUID NOT NULL,
    "followingId" UUID NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "UserFollow_pkey" PRIMARY KEY ("id")
);

-- AlterTable: Article - Add new columns
DO $$ BEGIN
    ALTER TABLE "Article" ADD COLUMN "estimatedTime" INTEGER;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Article" ADD COLUMN "schemaType" "ArticleSchemaType" NOT NULL DEFAULT 'ARTICLE';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- AlterTable: Badge - Add category column
DO $$ BEGIN
    ALTER TABLE "Badge" ADD COLUMN "category" TEXT;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- AlterTable: Lesson - Add status column
DO $$ BEGIN
    ALTER TABLE "Lesson" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'published';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- AlterTable: Level - Add accessLevel column
DO $$ BEGIN
    ALTER TABLE "Level" ADD COLUMN "accessLevel" TEXT NOT NULL DEFAULT 'free';
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- AlterTable: User - Add showOnLeaderboard column
DO $$ BEGIN
    ALTER TABLE "User" ADD COLUMN "showOnLeaderboard" BOOLEAN NOT NULL DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- AlterTable: trading_accounts - Add use_for_leaderboard column
DO $$ BEGIN
    ALTER TABLE "trading_accounts" ADD COLUMN "use_for_leaderboard" BOOLEAN NOT NULL DEFAULT false;
EXCEPTION
    WHEN duplicate_column THEN null;
END $$;

-- CreateIndex: ArticleVote
CREATE UNIQUE INDEX IF NOT EXISTS "ArticleVote_userId_articleId_key" ON "ArticleVote"("userId", "articleId");
CREATE INDEX IF NOT EXISTS "ArticleVote_articleId_idx" ON "ArticleVote"("articleId");

-- CreateIndex: Challenge
CREATE INDEX IF NOT EXISTS "Challenge_challengerId_idx" ON "Challenge"("challengerId");
CREATE INDEX IF NOT EXISTS "Challenge_challengeeId_idx" ON "Challenge"("challengeeId");
CREATE INDEX IF NOT EXISTS "Challenge_status_idx" ON "Challenge"("status");

-- CreateIndex: Feedback
CREATE INDEX IF NOT EXISTS "Feedback_userId_idx" ON "Feedback"("userId");
CREATE INDEX IF NOT EXISTS "Feedback_type_idx" ON "Feedback"("type");
CREATE INDEX IF NOT EXISTS "Feedback_status_idx" ON "Feedback"("status");

-- CreateIndex: Quote
CREATE INDEX IF NOT EXISTS "Quote_type_idx" ON "Quote"("type");
CREATE INDEX IF NOT EXISTS "Quote_isActive_idx" ON "Quote"("isActive");

-- CreateIndex: ToolView
CREATE INDEX IF NOT EXISTS "ToolView_viewCount_idx" ON "ToolView"("viewCount");

-- CreateIndex: UserFollow
CREATE UNIQUE INDEX IF NOT EXISTS "UserFollow_followerId_followingId_key" ON "UserFollow"("followerId", "followingId");
CREATE INDEX IF NOT EXISTS "UserFollow_followerId_idx" ON "UserFollow"("followerId");
CREATE INDEX IF NOT EXISTS "UserFollow_followingId_idx" ON "UserFollow"("followingId");

-- CreateIndex: User (streak)
CREATE INDEX IF NOT EXISTS "User_streak_idx" ON "User"("streak");

-- CreateIndex: UserBadge
CREATE INDEX IF NOT EXISTS "UserBadge_userId_idx" ON "UserBadge"("userId");

-- AddForeignKey: ArticleVote
DO $$ BEGIN
    ALTER TABLE "ArticleVote" ADD CONSTRAINT "ArticleVote_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "ArticleVote" ADD CONSTRAINT "ArticleVote_articleId_fkey" FOREIGN KEY ("articleId") REFERENCES "Article"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: Challenge
DO $$ BEGIN
    ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_challengerId_fkey" FOREIGN KEY ("challengerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "Challenge" ADD CONSTRAINT "Challenge_challengeeId_fkey" FOREIGN KEY ("challengeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: Feedback
DO $$ BEGIN
    ALTER TABLE "Feedback" ADD CONSTRAINT "Feedback_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- AddForeignKey: UserFollow
DO $$ BEGIN
    ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followerId_fkey" FOREIGN KEY ("followerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    ALTER TABLE "UserFollow" ADD CONSTRAINT "UserFollow_followingId_fkey" FOREIGN KEY ("followingId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;
