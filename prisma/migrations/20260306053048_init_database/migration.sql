/*
  Warnings:

  - You are about to drop the column `requiresPO` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `termOfPaymentDays` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `termOfPaymentEnabled` on the `Customer` table. All the data in the column will be lost.
  - You are about to drop the column `termOfPaymentLabel` on the `Customer` table. All the data in the column will be lost.
  - The `type` column on the `Customer` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `notes` on the `SalesInvoice` table. All the data in the column will be lost.
  - The `status` column on the `SalesInvoice` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `accurateLastSyncAt` on the `SalesQuotation` table. All the data in the column will be lost.
  - You are about to drop the column `hsiPdfGeneratedAt` on the `SalesQuotation` table. All the data in the column will be lost.
  - You are about to drop the column `parentQuotationId` on the `SalesQuotation` table. All the data in the column will be lost.
  - You are about to drop the column `topDueDateAt` on the `SalesQuotation` table. All the data in the column will be lost.
  - The `paymentMethod` column on the `SalesQuotation` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - You are about to drop the column `videoUrl` on the `SalesReturn` table. All the data in the column will be lost.
  - The `status` column on the `SalesReturn` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Made the column `invoiceDate` on table `SalesInvoice` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "SalesInvoice" DROP CONSTRAINT "SalesInvoice_quotationId_fkey";

-- DropForeignKey
ALTER TABLE "SalesQuotation" DROP CONSTRAINT "SalesQuotation_parentQuotationId_fkey";

-- DropForeignKey
ALTER TABLE "SalesReturn" DROP CONSTRAINT "SalesReturn_quotationId_fkey";

-- DropIndex
DROP INDEX "Customer_accurateCustomerCode_key";

-- AlterTable
ALTER TABLE "Customer" DROP COLUMN "requiresPO",
DROP COLUMN "termOfPaymentDays",
DROP COLUMN "termOfPaymentEnabled",
DROP COLUMN "termOfPaymentLabel",
ADD COLUMN     "city" TEXT,
ADD COLUMN     "companyEmail" TEXT,
ADD COLUMN     "companyPhone" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" TEXT NOT NULL DEFAULT 'BISNIS';

-- AlterTable
ALTER TABLE "CustomerAddress" ADD COLUMN     "city" TEXT,
ADD COLUMN     "district" TEXT,
ADD COLUMN     "isBilling" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "province" TEXT;

-- AlterTable
ALTER TABLE "Product" ADD COLUMN     "longDescription" TEXT,
ADD COLUMN     "sliderImages" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "SalesInvoice" DROP COLUMN "notes",
ADD COLUMN     "overdueNotifiedAt" TIMESTAMP(3),
ADD COLUMN     "reminderSentAt" TIMESTAMP(3),
ALTER COLUMN "invoiceDate" SET NOT NULL,
ALTER COLUMN "invoiceDate" SET DEFAULT CURRENT_TIMESTAMP,
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'UNPAID';

-- AlterTable
ALTER TABLE "SalesQuotation" DROP COLUMN "accurateLastSyncAt",
DROP COLUMN "hsiPdfGeneratedAt",
DROP COLUMN "parentQuotationId",
DROP COLUMN "topDueDateAt",
ADD COLUMN     "accurateDoId" INTEGER,
ADD COLUMN     "accurateDoNo" TEXT,
ADD COLUMN     "accurateHsoId" INTEGER,
ADD COLUMN     "accurateHsoNo" TEXT,
ADD COLUMN     "accurateHsqId" INTEGER,
ADD COLUMN     "accurateHsqNo" TEXT,
ADD COLUMN     "adminDoPdfPath" TEXT,
ADD COLUMN     "adminInvoicePdfPath" TEXT,
ADD COLUMN     "adminNotes" TEXT,
ADD COLUMN     "adminQuotePdfPath" TEXT,
ADD COLUMN     "adminSoPdfPath" TEXT,
ADD COLUMN     "clientName" TEXT,
ADD COLUMN     "completedAt" TIMESTAMP(3),
ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN     "freeShipping" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "isHsqApproved" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "offeredAt" TIMESTAMP(3),
ADD COLUMN     "paymentProofPath" TEXT,
ADD COLUMN     "poNotes" TEXT,
ADD COLUMN     "processedAt" TIMESTAMP(3),
ADD COLUMN     "processedBy" TEXT,
ADD COLUMN     "receiptEvidencePath" TEXT,
ADD COLUMN     "returnEvidencePath" TEXT,
ADD COLUMN     "returnReason" TEXT,
ADD COLUMN     "returnRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "shippedAt" TIMESTAMP(3),
ADD COLUMN     "shippingAddress" TEXT,
ADD COLUMN     "shippingCost" DOUBLE PRECISION,
ADD COLUMN     "shippingNotes" TEXT,
ADD COLUMN     "shippingProofPath" TEXT,
ADD COLUMN     "specialDiscount" DOUBLE PRECISION,
ADD COLUMN     "specialDiscountNote" TEXT,
ADD COLUMN     "specialDiscountRequest" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "taxInvoiceUrl" TEXT,
ADD COLUMN     "trackingNumber" TEXT,
ADD COLUMN     "userClientId" TEXT,
ADD COLUMN     "userPoPath" TEXT,
ALTER COLUMN "accurateSyncStatus" DROP NOT NULL,
DROP COLUMN "paymentMethod",
ADD COLUMN     "paymentMethod" TEXT DEFAULT 'CASH';

-- AlterTable
ALTER TABLE "SalesQuotationItem" ADD COLUMN     "adminNote" TEXT,
ADD COLUMN     "availableQty" INTEGER,
ADD COLUMN     "basePrice" DOUBLE PRECISION,
ADD COLUMN     "discountAmount" DOUBLE PRECISION,
ADD COLUMN     "discountPercent" DOUBLE PRECISION,
ADD COLUMN     "discountStr" TEXT,
ADD COLUMN     "isAvailable" BOOLEAN;

-- AlterTable
ALTER TABLE "SalesReturn" DROP COLUMN "videoUrl",
DROP COLUMN "status",
ADD COLUMN     "status" TEXT NOT NULL DEFAULT 'REQUESTED',
ALTER COLUMN "photoUrls" DROP NOT NULL,
ALTER COLUMN "photoUrls" SET DATA TYPE TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "address" TEXT,
ADD COLUMN     "isPrimaryContact" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "position" TEXT;

-- DropEnum
DROP TYPE "CustomerType";

-- DropEnum
DROP TYPE "InvoiceStatus";

-- DropEnum
DROP TYPE "PaymentMethod";

-- DropEnum
DROP TYPE "ReturnStatus";

-- CreateTable
CREATE TABLE "Page" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Page_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UpgradeRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "requestType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "companyName" TEXT,
    "businessType" TEXT,
    "address" TEXT,
    "phone" TEXT,
    "ktp" TEXT,
    "npwp" TEXT,
    "adminNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "ktpName" TEXT,

    CONSTRAINT "UpgradeRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'INFO',
    "link" TEXT,
    "read" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RolePermission" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "permissions" JSONB NOT NULL DEFAULT '[]',
    "role" TEXT NOT NULL,

    CONSTRAINT "RolePermission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesQuotationActivity" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "performedBy" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesQuotationActivity_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserClient" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "company" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserClient_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfileUpdateRequest" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "field" TEXT NOT NULL,
    "newValue" TEXT NOT NULL,
    "otp" TEXT NOT NULL,
    "otpExpiresAt" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ProfileUpdateRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesQuotationItemAlternative" (
    "id" TEXT NOT NULL,
    "quotationItemId" TEXT NOT NULL,
    "productSku" TEXT NOT NULL,
    "productName" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "price" DOUBLE PRECISION NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesQuotationItemAlternative_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Province" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Province_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Regency" (
    "id" TEXT NOT NULL,
    "provinceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Regency_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "District" (
    "id" TEXT NOT NULL,
    "regencyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "District_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Page_slug_key" ON "Page"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "RolePermission_role_key" ON "RolePermission"("role");

-- CreateIndex
CREATE UNIQUE INDEX "ProfileUpdateRequest_userId_key" ON "ProfileUpdateRequest"("userId");

-- AddForeignKey
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UpgradeRequest" ADD CONSTRAINT "UpgradeRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuotationActivity" ADD CONSTRAINT "SalesQuotationActivity_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserClient" ADD CONSTRAINT "UserClient_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfileUpdateRequest" ADD CONSTRAINT "ProfileUpdateRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesQuotationItemAlternative" ADD CONSTRAINT "SalesQuotationItemAlternative_quotationItemId_fkey" FOREIGN KEY ("quotationItemId") REFERENCES "SalesQuotationItem"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Regency" ADD CONSTRAINT "Regency_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "District" ADD CONSTRAINT "District_regencyId_fkey" FOREIGN KEY ("regencyId") REFERENCES "Regency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
