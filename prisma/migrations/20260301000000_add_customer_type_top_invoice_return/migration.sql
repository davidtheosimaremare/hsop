-- CreateEnum
CREATE TYPE "CustomerType" AS ENUM ('GENERAL', 'RETAIL', 'CORPORATE');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('CASH', 'TOP', 'TRANSFER');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('UNPAID', 'PARTIAL', 'PAID', 'OVERDUE', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ReturnStatus" AS ENUM ('REQUESTED', 'APPROVED', 'REJECTED', 'PROCESSING', 'COMPLETED');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "accurateCustomerCode" TEXT,
ADD COLUMN     "requiresPO" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termOfPaymentDays" INTEGER,
ADD COLUMN     "termOfPaymentEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "termOfPaymentLabel" TEXT,
DROP COLUMN "type",
ADD COLUMN     "type" "CustomerType" NOT NULL DEFAULT 'GENERAL';

-- AlterTable
ALTER TABLE "SalesQuotation" ADD COLUMN     "accurateLastSyncAt" TIMESTAMP(3),
ADD COLUMN     "accurateSyncStatus" TEXT NOT NULL DEFAULT 'PENDING',
ADD COLUMN     "hdoPdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "hsiPdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "hsoPdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "hsqPdfGeneratedAt" TIMESTAMP(3),
ADD COLUMN     "parentQuotationId" TEXT,
ADD COLUMN     "paymentMethod" "PaymentMethod" NOT NULL DEFAULT 'CASH',
ADD COLUMN     "revisionNumber" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "topDueDateAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "SalesInvoice" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "accurateHsiId" INTEGER,
    "accurateHsiNo" TEXT,
    "invoiceDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "totalAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "paidAmount" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'UNPAID',
    "notes" TEXT,
    "pdfGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesReturn" (
    "id" TEXT NOT NULL,
    "quotationId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "status" "ReturnStatus" NOT NULL DEFAULT 'REQUESTED',
    "adminNotes" TEXT,
    "photoUrls" TEXT[],
    "videoUrl" TEXT,
    "accurateReturnId" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesReturn_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_quotationId_key" ON "SalesInvoice"("quotationId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_accurateHsiId_key" ON "SalesInvoice"("accurateHsiId");

-- CreateIndex
CREATE UNIQUE INDEX "SalesInvoice_accurateHsiNo_key" ON "SalesInvoice"("accurateHsiNo");

-- CreateIndex
CREATE UNIQUE INDEX "Customer_accurateCustomerCode_key" ON "Customer"("accurateCustomerCode");

-- AddForeignKey
ALTER TABLE "SalesQuotation" ADD CONSTRAINT "SalesQuotation_parentQuotationId_fkey" FOREIGN KEY ("parentQuotationId") REFERENCES "SalesQuotation"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesInvoice" ADD CONSTRAINT "SalesInvoice_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesReturn" ADD CONSTRAINT "SalesReturn_quotationId_fkey" FOREIGN KEY ("quotationId") REFERENCES "SalesQuotation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
