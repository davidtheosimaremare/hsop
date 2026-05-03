import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import puppeteer from "puppeteer";
import {
  renderHsqTemplate,
  renderHsoTemplate,
  renderHdoTemplate,
  renderHsiTemplate,
} from "@/lib/pdf-templates";
import type {
  PdfCompany,
  PdfItem,
  PdfAddress,
  HsqTemplateData,
  HsoTemplateData,
  HdoTemplateData,
  HsiTemplateData,
  PdfDocumentType,
} from "@/lib/pdf-templates/types";
import { formatDate } from "@/lib/pdf-templates/styles";

// ── Singleton browser instance (avoid cold start on every request) ─────────
let browserInstance: any | null = null;

async function getBrowser() {
  if (!browserInstance || !browserInstance.connected) {
    browserInstance = await puppeteer.launch({
      headless: true,
      executablePath: process.env.PUPPETEER_EXECUTABLE_PATH || undefined,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--no-first-run",
        "--no-zygote",
        "--single-process",
      ],
    });
  }
  return browserInstance;
}

async function generatePdfBuffer(html: string): Promise<Buffer> {
  const browser = await getBrowser();
  const page = await browser.newPage();
  try {
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 15000 });
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", right: "0", bottom: "0", left: "0" },
      preferCSSPageSize: false,
    });
    return Buffer.from(pdf);
  } finally {
    await page.close();
  }
}

// ── Company info resolver ──────────────────────────────────────────────────
async function getCompanyInfo(): Promise<PdfCompany> {
  try {
    const settings = await db.siteSetting.findMany({
      where: { key: { in: ["company_name", "company_address", "company_phone", "company_email", "company_npwp", "company_logo"] } },
    });
    const get = (key: string) => {
      const s = settings.find((x) => x.key === key);
      if (!s) return "";
      return typeof s.value === "string" ? s.value : (s.value as any)?.text || String(s.value);
    };
    return {
      name: get("company_name") || "PT. Hokiindo Raya",
      address: get("company_address") || "Jakarta, Indonesia",
      phone: get("company_phone") || "-",
      email: get("company_email") || "-",
      npwp: get("company_npwp") || undefined,
      logoUrl: get("company_logo") || undefined,
    };
  } catch {
    return {
      name: "PT. Hokiindo Raya",
      address: "Jakarta, Indonesia",
      phone: "-",
      email: "-",
    };
  }
}

// ── Quotation items mapper ─────────────────────────────────────────────────
function mapItems(items: any[]): PdfItem[] {
  return items.map((item, idx) => ({
    no: idx + 1,
    sku: item.productSku || item.sku || "-",
    name: item.productName || item.name || "-",
    brand: item.brand || null,
    qty: item.quantity ?? item.qty ?? 0,
    unit: "pcs",
    unitPrice: item.price ?? 0,
    discount: undefined,
    subtotal: (item.price ?? 0) * (item.quantity ?? item.qty ?? 0),
    notes: item.adminNote || null,
  }));
}

// ── Address resolver ───────────────────────────────────────────────────────
function resolveAddress(quotation: any): PdfAddress | undefined {
  if (quotation.shippingAddress) {
    return { street: quotation.shippingAddress };
  }
  const customer = quotation.customer;
  if (!customer) return undefined;
  return {
    street: customer.address,
    city: customer.city,
    province: customer.province,
    postalCode: customer.postalCode,
    phone: customer.phone,
  };
}

// ── Main handler ──────────────────────────────────────────────────────────
export async function GET(req: NextRequest, context: any) {
  const params = await context.params;
  const { type, id } = params as { type: string; id: string };
  const docType = type.toLowerCase() as PdfDocumentType;

  if (!["hsq", "hso", "hdo", "hsi"].includes(docType)) {
    return NextResponse.json({ error: "Invalid document type. Use: hsq, hso, hdo, hsi" }, { status: 400 });
  }

  try {
    // Fetch quotation with all relations
    const quotation = await db.salesQuotation.findUnique({
      where: { id },
      include: {
        items: true,
        invoice: true,
        user: true,
      },
    });

    if (!quotation) {
      return NextResponse.json({ error: "Document not found" }, { status: 404 });
    }

    const company = await getCompanyInfo();
    const items = mapItems(quotation.items);
    const subtotal = items.reduce((s, i) => s + i.subtotal, 0);
    const grandTotal = subtotal + (quotation.shippingCost ?? 0) - (quotation.specialDiscount ?? 0);
    const customerAddr = resolveAddress(quotation);
    const paymentMethod = (quotation.paymentMethod as "CASH" | "TOP" | "TRANSFER") ?? "CASH";

    let html = "";

    // ── HSQ ──────────────────────────────────────────────────────────────
    if (docType === "hsq") {
      const revisionLabel =
        quotation.revisionNumber > 0 ? `R${quotation.revisionNumber}` : undefined;

      const data: HsqTemplateData = {
        company,
        documentNo: quotation.accurateHsqNo || quotation.quotationNo,
        revisionLabel,
        date: formatDate(quotation.createdAt),
        validUntil: quotation.offeredAt ? formatDate(quotation.offeredAt) : undefined,
        customerName: quotation.clientName || "Pelanggan",
        customerAddress: customerAddr,
        customerPhone: quotation.phone || undefined,
        customerEmail: quotation.email || undefined,
        paymentMethod,
        topDays: undefined,
        items,
        subtotal,
        discountTotal: quotation.specialDiscount ?? 0,
        shipping: quotation.shippingCost ?? 0,
        grandTotal,
        notes: quotation.notes || undefined,
        preparedBy: quotation.processedBy || undefined,
      };
      html = renderHsqTemplate(data);

      // Update timestamp
      await db.salesQuotation.update({
        where: { id },
        data: { hsqPdfGeneratedAt: new Date() },
      });
    }

    // ── HSO ──────────────────────────────────────────────────────────────
    else if (docType === "hso") {
      if (!quotation.accurateHsoNo) {
        return NextResponse.json({ error: "HSO belum dibuat. Proses order terlebih dahulu." }, { status: 422 });
      }
      const data: HsoTemplateData = {
        company,
        documentNo: quotation.accurateHsoNo,
        hsqRef: quotation.accurateHsqNo || quotation.quotationNo,
        orderDate: formatDate(quotation.confirmedAt || quotation.updatedAt),
        date: formatDate(quotation.confirmedAt || quotation.updatedAt),
        validUntil: undefined,
        poNumber: quotation.poNotes || undefined,
        customerName: quotation.clientName || "Pelanggan",
        customerAddress: customerAddr,
        customerPhone: quotation.phone || undefined,
        customerEmail: quotation.email || undefined,
        paymentMethod,
        items,
        subtotal,
        discountTotal: quotation.specialDiscount ?? 0,
        shipping: quotation.shippingCost ?? 0,
        grandTotal,
        notes: quotation.notes || undefined,
        preparedBy: quotation.processedBy || undefined,
      };
      html = renderHsoTemplate(data);

      await db.salesQuotation.update({
        where: { id },
        data: { hsoPdfGeneratedAt: new Date() },
      });
    }

    // ── HDO ──────────────────────────────────────────────────────────────
    else if (docType === "hdo") {
      if (!quotation.accurateDoNo) {
        return NextResponse.json({ error: "HDO belum tersedia. Tunggu konfirmasi pengiriman dari Accurate." }, { status: 422 });
      }
      const shippingAddr: PdfAddress = customerAddr
        ? { ...customerAddr, recipient: quotation.clientName || undefined }
        : { street: quotation.shippingAddress || "-" };

      const data: HdoTemplateData = {
        company,
        documentNo: quotation.accurateDoNo,
        hsoRef: quotation.accurateHsoNo || "-",
        date: formatDate(quotation.shippedAt || quotation.updatedAt),
        customerName: quotation.clientName || "Pelanggan",
        shippingAddress: shippingAddr,
        items,
        trackingNumber: quotation.trackingNumber || undefined,
        courier: undefined,
        shippingNotes: quotation.shippingNotes || undefined,
        preparedBy: quotation.processedBy || undefined,
      };
      html = renderHdoTemplate(data);

      await db.salesQuotation.update({
        where: { id },
        data: { hdoPdfGeneratedAt: new Date() },
      });
    }

    // ── HSI ──────────────────────────────────────────────────────────────
    else if (docType === "hsi") {
      const invoice = quotation.invoice;
      if (!invoice) {
        return NextResponse.json({ error: "Invoice belum tersedia untuk transaksi ini." }, { status: 422 });
      }
      const data: HsiTemplateData = {
        company,
        documentNo: invoice.accurateHsiNo || invoice.id,
        hsoRef: quotation.accurateHsoNo || quotation.quotationNo,
        invoiceDate: formatDate(invoice.invoiceDate || invoice.createdAt),
        dueDate: invoice.dueDate ? formatDate(invoice.dueDate) : undefined,
        customerName: quotation.clientName || "Pelanggan",
        customerAddress: customerAddr,
        paymentMethod,
        items,
        subtotal,
        discountTotal: quotation.specialDiscount ?? 0,
        shipping: quotation.shippingCost ?? 0,
        grandTotal: invoice.totalAmount || grandTotal,
        paidAmount: invoice.paidAmount || 0,
        remainingAmount: (invoice.totalAmount || grandTotal) - (invoice.paidAmount || 0),
        notes: quotation.notes || undefined,
        preparedBy: quotation.processedBy || undefined,
      };
      html = renderHsiTemplate(data);

      await db.salesInvoice.update({
        where: { id: invoice.id },
        data: { pdfGeneratedAt: new Date() },
      });
    }

    // Generate PDF
    const pdfBuffer = await generatePdfBuffer(html);

    const docNo =
      docType === "hsq" ? (quotation.accurateHsqNo || quotation.quotationNo)
        : docType === "hso" ? (quotation.accurateHsoNo || "HSO")
          : docType === "hdo" ? (quotation.accurateDoNo || "HDO")
            : (quotation.invoice?.accurateHsiNo || "HSI");

    const filename = `${docType.toUpperCase()}-${docNo.replace(/\//g, "-")}.pdf`;

    // Support ?download=1 to force download instead of inline view
    const isDownload = req.nextUrl.searchParams.get("download") === "1";

    return new NextResponse(pdfBuffer as any, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `${isDownload ? "attachment" : "inline"}; filename="${filename}"`,
        "Content-Length": pdfBuffer.length.toString(),
        "Cache-Control": "no-store",
      },
    });
  } catch (error: any) {
    console.error("[PDF Generator Error]", error);
    return NextResponse.json(
      { error: "Gagal generate PDF", detail: error.message },
      { status: 500 }
    );
  }
}
