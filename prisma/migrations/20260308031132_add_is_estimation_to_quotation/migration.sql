/*
  Warnings:

  - You are about to drop the column `total` on the `Order` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Order" DROP COLUMN "total",
ADD COLUMN     "totalAmount" DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "SalesQuotation" ADD COLUMN     "isEstimation" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "lastSentAt" TIMESTAMP(3);
