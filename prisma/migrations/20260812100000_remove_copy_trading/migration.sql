-- Cleanup residual copy-trading notification rows before enum migration
DELETE FROM "Notification" WHERE "type" IN ('COPY_TRADING_REGISTERED','COPY_TRADING_APPROVED','COPY_TRADING_REJECTED');

-- AlterEnum
BEGIN;
CREATE TYPE "NotificationType_new" AS ENUM ('LICENSE_APPROVED', 'LICENSE_REJECTED', 'LICENSE_EXPIRED', 'NEW_EA_VERSION', 'ANNOUNCEMENT', 'MAINTENANCE', 'PROMOTION', 'FEATURE_UPDATE', 'WEEKLY_REPORT', 'MONTHLY_REPORT', 'NO_TRADES_NUDGE', 'VIP_APPROVED', 'VIP_REJECTED', 'FEEDBACK_RECEIVED');
ALTER TABLE "Notification" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TABLE "AdminBroadcast" ALTER COLUMN "type" TYPE "NotificationType_new" USING ("type"::text::"NotificationType_new");
ALTER TYPE "NotificationType" RENAME TO "NotificationType_old";
ALTER TYPE "NotificationType_new" RENAME TO "NotificationType";
DROP TYPE "NotificationType_old";
COMMIT;

-- DropForeignKey
ALTER TABLE "copy_trading_registrations" DROP CONSTRAINT "copy_trading_registrations_partner_code_fkey";

-- DropForeignKey
ALTER TABLE "copy_trading_registrations" DROP CONSTRAINT "copy_trading_registrations_userId_fkey";

-- DropTable
DROP TABLE "copy_trading_registrations";

-- DropEnum
DROP TYPE "CopyTradingStatus";
