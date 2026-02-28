/*
  Warnings:

  - Changed the type of `broker` on the `EALicense` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "EALicense" DROP COLUMN "broker",
ADD COLUMN     "broker" TEXT NOT NULL;

-- DropEnum
DROP TYPE "BrokerName";

-- CreateTable
CREATE TABLE "ea_brokers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT NOT NULL,
    "affiliateUrl" TEXT,
    "color" TEXT NOT NULL DEFAULT '#00C888',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "ea_brokers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ea_brokers_slug_key" ON "ea_brokers"("slug");

-- CreateIndex
CREATE INDEX "ea_brokers_isActive_idx" ON "ea_brokers"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "EALicense_broker_accountNumber_key" ON "EALicense"("broker", "accountNumber");
