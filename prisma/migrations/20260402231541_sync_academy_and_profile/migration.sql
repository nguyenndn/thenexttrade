-- Sync schema drift: Academy fields, Profile enhancements, Quote/Feedback/Challenge updates

-- Lesson: Add new fields for AI rewrite pipeline
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "metaDescription" VARCHAR(160);
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "rawContent" TEXT;
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "sourceUrls" TEXT[] DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Lesson" ADD COLUMN IF NOT EXISTS "tone" VARCHAR(30);

-- Lesson: Update default status from 'published' to 'draft'
ALTER TABLE "Lesson" ALTER COLUMN "status" SET DEFAULT 'draft';

-- Level: Update default accessLevel
ALTER TABLE "Level" ALTER COLUMN "accessLevel" SET DEFAULT 'PUBLIC';

-- Profile: Add public profile fields
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "is_public_profile" BOOLEAN DEFAULT false;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "profile_headline" TEXT;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "show_badges" BOOLEAN DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "show_pair_stats" BOOLEAN DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "show_session_stats" BOOLEAN DEFAULT true;
ALTER TABLE "Profile" ADD COLUMN IF NOT EXISTS "show_trade_score" BOOLEAN DEFAULT true;

-- Profile: Add index on username  
CREATE INDEX IF NOT EXISTS "Profile_username_idx" ON "Profile"("username");

-- Quote: Rename content→text, add updatedAt, update defaults
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Quote' AND column_name = 'content') THEN
        ALTER TABLE "Quote" RENAME COLUMN "content" TO "text";
    END IF;
END $$;
ALTER TABLE "Quote" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT now();
ALTER TABLE "Quote" ALTER COLUMN "author" SET DEFAULT '';
ALTER TABLE "Quote" ALTER COLUMN "type" SET DEFAULT 'DASHBOARD';

-- Feedback: Update defaults and constraints
ALTER TABLE "Feedback" ALTER COLUMN "status" SET DEFAULT 'OPEN';
-- Drop adminNote if exists
ALTER TABLE "Feedback" DROP COLUMN IF EXISTS "adminNote";
-- Make userId required (drop old FK, alter column, re-add FK)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Feedback' AND column_name = 'userId' AND is_nullable = 'YES') THEN
        ALTER TABLE "Feedback" ALTER COLUMN "userId" SET NOT NULL;
    END IF;
END $$;
ALTER TABLE "Feedback" ALTER COLUMN "type" DROP DEFAULT;

-- Badge: Make category required with default
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'Badge' AND column_name = 'category' AND is_nullable = 'YES') THEN
        UPDATE "Badge" SET "category" = 'milestone' WHERE "category" IS NULL;
        ALTER TABLE "Badge" ALTER COLUMN "category" SET NOT NULL;
        ALTER TABLE "Badge" ALTER COLUMN "category" SET DEFAULT 'milestone';
    END IF;
END $$;

-- Challenge: Add new columns, remove old ones
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "endDate" TIMESTAMPTZ;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "startDate" TIMESTAMPTZ;
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "type" TEXT DEFAULT 'CUSTOM';
ALTER TABLE "Challenge" ADD COLUMN IF NOT EXISTS "winnerId" UUID;
ALTER TABLE "Challenge" DROP COLUMN IF EXISTS "expiresAt";
ALTER TABLE "Challenge" ALTER COLUMN "status" SET DEFAULT 'PENDING';

-- ToolView: Restructure (slug-based primary key)
-- Note: Only run if old structure exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ToolView' AND column_name = 'toolSlug') THEN
        ALTER TABLE "ToolView" ADD COLUMN IF NOT EXISTS "slug" TEXT;
        UPDATE "ToolView" SET "slug" = "toolSlug" WHERE "slug" IS NULL;
        ALTER TABLE "ToolView" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMPTZ DEFAULT now();
        ALTER TABLE "ToolView" DROP COLUMN IF EXISTS "lastViewedAt";
        ALTER TABLE "ToolView" DROP COLUMN IF EXISTS "toolSlug";
        -- Drop old PK and create new one
        ALTER TABLE "ToolView" DROP CONSTRAINT IF EXISTS "ToolView_pkey";
        ALTER TABLE "ToolView" DROP COLUMN IF EXISTS "id";
        ALTER TABLE "ToolView" ALTER COLUMN "slug" SET NOT NULL;
        ALTER TABLE "ToolView" ADD PRIMARY KEY ("slug");
    END IF;
END $$;

-- ArticleSchemaType: Remove unused variants (safe - just enum cleanup)
-- Only remove if no rows reference them
DO $$
BEGIN
    -- These are safe to leave in the enum; removing requires type recreation
    -- Skipping enum variant removal to avoid data issues
    NULL;
END $$;
