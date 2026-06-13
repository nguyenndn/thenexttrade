-- AlterTable
ALTER TABLE "Profile" ADD COLUMN "show_money" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "show_broker" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "show_account_number" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "show_real_name" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN "show_percent_metrics" BOOLEAN NOT NULL DEFAULT true;
