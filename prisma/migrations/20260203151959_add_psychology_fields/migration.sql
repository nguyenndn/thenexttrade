-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "confidenceLevel" INTEGER,
ADD COLUMN     "emotionAfter" VARCHAR(50),
ADD COLUMN     "emotionBefore" VARCHAR(50),
ADD COLUMN     "followedPlan" BOOLEAN,
ADD COLUMN     "notesPsychology" TEXT;
