import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export interface QuotationExportData {
    quotationNo: string;
    createdAt: string;
    status: string;
    totalAmount: number;
    clientName?: string; // Project name
    title?: string;      // Custom title (e.g. PENAWARAN HARGA)
    typeLabel?: string;  // Custom label for the ID (e.g. Nomor Penawaran)
    items: {
        productSku: string;
        productName: string;
        brand: string;
        quantity: number;
        price: number;
        stockStatus?: string;
    }[];
}

export interface ExportTemplate {
    headerImage?: string;
    footerImage?: string;
}

export interface CompanyDetails {
    name: string;
    email: string;
    phone: string;
    address: string;
    description?: string;
    logo?: string | null;
    website?: string;
}

// Default company info (fallback)
const DEFAULT_COMPANY: CompanyDetails = {
    name: "PT Hokiindo Raya",
    email: "info@hokiindo.co.id",
    phone: "(021) 2784 8777",
    address: "Jl. Raya Serpong Kilometer 7 No.50 Blok Q, Lengkong Karya",
    description: "Sustainable Solutions, Built on Trust",
    website: "hokiindo.co.id",
};

// WhatsApp number
const WA_NUMBER = "+628111086180";

const formatStockStatus = (status?: string) => {
    if (!status) return "-";
    if (status === 'READY') return "Ready Stock";
    if (status === 'INDENT') return "Indent";
    return status;
};

const formatPrice = (price: number) =>
    new Intl.NumberFormat("id-ID").format(Math.round(price));

const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("id-ID", { day: "2-digit", month: "long", year: "numeric" });
};

// Helper: load image as base64 data URL for jsPDF
async function loadImageAsBase64(url: string): Promise<{ data: string; width: number; height: number } | null> {
    try {
        return new Promise((resolve) => {
            const img = new window.Image();
            img.crossOrigin = "anonymous";
            img.onload = () => {
                const canvas = document.createElement("canvas");
                canvas.width = img.naturalWidth;
                canvas.height = img.naturalHeight;
                const ctx = canvas.getContext("2d");
                ctx?.drawImage(img, 0, 0);
                resolve({
                    data: canvas.toDataURL("image/png"),
                    width: img.naturalWidth,
                    height: img.naturalHeight,
                });
            };
            img.onerror = () => resolve(null);
            img.src = url;
        });
    } catch {
        return null;
    }
}

// Fetch company details from API/settings
async function fetchCompanyDetails(): Promise<CompanyDetails> {
    try {
        const { getSiteSetting } = await import("@/app/actions/settings");
        const companyData = await getSiteSetting("company_details") as CompanyDetails | null;

        if (companyData && companyData.name) {
            return {
                ...DEFAULT_COMPANY,
                ...companyData,
            };
        }
    } catch (error) {
        console.error("Failed to fetch company details:", error);
    }
    return DEFAULT_COMPANY;
}

// Draw simple icon using PDF primitives
function drawPhoneIcon(doc: jsPDF, x: number, y: number, size: number = 2.5) {
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    // Simple phone rectangle
    doc.roundedRect(x, y - size + 0.5, size * 0.6, size, 0.3, 0.3, "S");
}

function drawEmailIcon(doc: jsPDF, x: number, y: number, size: number = 2.5) {
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    // Simple envelope
    doc.rect(x, y - size + 1, size, size * 0.7, "S");
    doc.line(x, y - size + 1, x + size / 2, y - size / 2 + 1);
    doc.line(x + size, y - size + 1, x + size / 2, y - size / 2 + 1);
}

function drawWebIcon(doc: jsPDF, x: number, y: number, size: number = 2.5) {
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    // Simple globe circle
    doc.circle(x + size / 2, y - size / 2 + 0.5, size / 2, "S");
    doc.line(x, y - size / 2 + 0.5, x + size, y - size / 2 + 0.5);
}

function drawWhatsAppIcon(doc: jsPDF, x: number, y: number, size: number = 2.5) {
    doc.setDrawColor(80, 80, 80);
    doc.setLineWidth(0.3);
    // Simple chat bubble
    doc.circle(x + size / 2, y - size / 2 + 0.3, size / 2, "S");
}

// ─────────────────────────────────────────────
// PDF Export
// ─────────────────────────────────────────────
export async function exportQuotationPDF(q: QuotationExportData, template?: ExportTemplate) {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // Fetch company details from database
    const company = await fetchCompanyDetails();

    // Load siemens badge
    const siemensBadge = await loadImageAsBase64("/siemens-auth.png");

    // ── Header (White/Light background) ──
    if (template?.headerImage) {
        const img = await loadImageAsBase64(template.headerImage);
        if (img) {
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (img.height / img.width) * imgWidth;
            doc.addImage(img.data, "PNG", margin, y, imgWidth, Math.min(imgHeight, 35));
            y += Math.min(imgHeight, 35) + 5;
        } else {
            y = await drawHeader(doc, pageWidth, margin, company);
        }
    } else {
        y = await drawHeader(doc, pageWidth, margin, company);
    }

    // ── Title Section ──
    y += 5;

    // Red accent line
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(1);
    doc.line(margin, y, margin + 40, y);
    y += 8;

    doc.setTextColor(30, 30, 30);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(q.title || "ESTIMASI HARGA", margin, y);
    y += 12;

    // ── Quotation Info ──
    doc.setFontSize(9);
    doc.setTextColor(80, 80, 80);

    const infoData: [string, string][] = [
        [q.typeLabel || "Nomor Estimasi", q.quotationNo],
        ["Tanggal", formatDate(q.createdAt)],
        ["Status", q.status || "ESTIMASI"],
    ];

    // Add project name if available
    if (q.clientName) {
        infoData.push(["Proyek", q.clientName]);
    }

    infoData.forEach(([label, value]) => {
        doc.setFont("helvetica", "normal");
        doc.setTextColor(100, 100, 100);
        doc.text(`${label}:`, margin, y);
        doc.setFont("helvetica", "bold");
        doc.setTextColor(30, 30, 30);
        doc.text(value, margin + 35, y);
        y += 6;
    });

    y += 8;

    // ── Items Table ──
    const tableData = q.items.map((item, idx) => [
        String(idx + 1),
        item.productSku,
        `${item.brand} - ${item.productName}`,
        formatStockStatus(item.stockStatus),
        String(item.quantity),
        `Rp ${formatPrice(item.price)}`,
        `Rp ${formatPrice(item.price * item.quantity)}`,
    ]);

    autoTable(doc, {
        startY: y,
        head: [["#", "SKU", "Produk", "Status", "Qty", "Harga Satuan", "Subtotal"]],
        body: tableData,
        margin: { left: margin, right: margin },
        theme: "striped",
        headStyles: {
            fillColor: [220, 38, 38],
            textColor: 255,
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
            cellPadding: 4,
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50],
            cellPadding: 3,
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 10 },
            1: { cellWidth: 25 },
            2: { cellWidth: "auto" },
            3: { halign: "center", cellWidth: 20 },
            4: { halign: "center", cellWidth: 16 },
            5: { halign: "right", cellWidth: 28 },
            6: { halign: "right", cellWidth: 28 },
        },
        alternateRowStyles: {
            fillColor: [250, 250, 250],
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 8;

    // ── Total Section ──
    const totalBoxWidth = 70;
    const totalBoxX = pageWidth - margin - totalBoxWidth;

    doc.setFillColor(220, 38, 38);
    doc.roundedRect(totalBoxX, finalY, totalBoxWidth, 12, 2, 2, "F");

    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(255, 255, 255);
    doc.text("Total Estimasi:", totalBoxX + 4, finalY + 8);
    doc.setFontSize(10);
    doc.text(`Rp ${formatPrice(q.totalAmount)}`, totalBoxX + totalBoxWidth - 4, finalY + 8, { align: "right" });

    // ── VAT Note ──
    doc.setFontSize(8);
    doc.setFont("helvetica", "italic");
    doc.setTextColor(120, 120, 120);
    doc.text("* Harga sudah termasuk PPN 11%", totalBoxX + totalBoxWidth, finalY + 18, { align: "right" });

    // ── Footer (Red background) ──
    drawFooter(doc, pageWidth, pageHeight, company, siemensBadge);

    doc.save(`${q.quotationNo.replace(/\//g, '-')}.pdf`);
}

async function drawHeader(doc: jsPDF, pageWidth: number, margin: number, company: CompanyDetails): Promise<number> {
    const headerHeight = 28;

    // Light gray background for header
    doc.setFillColor(250, 250, 250);
    doc.rect(0, 0, pageWidth, headerHeight, "F");

    // Bottom border line (red accent)
    doc.setDrawColor(220, 38, 38);
    doc.setLineWidth(0.8);
    doc.line(0, headerHeight, pageWidth, headerHeight);

    // Left side - Logo or Company Name
    let hasLogo = false;
    if (company.logo) {
        const logoImg = await loadImageAsBase64(company.logo);
        if (logoImg) {
            hasLogo = true;
            const logoHeight = 12;
            const logoWidth = (logoImg.width / logoImg.height) * logoHeight;
            doc.addImage(logoImg.data, "PNG", margin, 7, logoWidth, logoHeight);
        }
    }

    // If no logo, show company name
    if (!hasLogo) {
        doc.setTextColor(220, 38, 38);
        doc.setFontSize(14);
        doc.setFont("helvetica", "bold");
        doc.text(company.name, margin, 12);

        doc.setTextColor(100, 100, 100);
        doc.setFontSize(8);
        doc.setFont("helvetica", "normal");
        doc.text(company.description || "Sustainable Solutions, Built on Trust", margin, 18);
    }

    // Right side - Contact info (Clean text, no icons)
    const rightX = pageWidth - margin;
    doc.setFontSize(8);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(60, 60, 60);

    let lineY = 8;
    doc.text(company.phone, rightX, lineY, { align: "right" });
    lineY += 4.5;
    doc.text(company.email, rightX, lineY, { align: "right" });
    lineY += 4.5;
    doc.text(`WA: ${WA_NUMBER}`, rightX, lineY, { align: "right" });
    lineY += 4.5;
    doc.text(company.website || "hokiindo.co.id", rightX, lineY, { align: "right" });

    return headerHeight + 5;
}

function drawFooter(
    doc: jsPDF,
    pageWidth: number,
    pageHeight: number,
    company: CompanyDetails,
    siemensBadge: { data: string; width: number; height: number } | null
) {
    const footerHeight = 22;
    const footerY = pageHeight - footerHeight;

    // Red footer background
    doc.setFillColor(220, 38, 38);
    doc.rect(0, footerY, pageWidth, footerHeight, "F");

    // Left side - Address info
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.text(company.name, 15, footerY + 7);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.text(company.address, 15, footerY + 12);
    doc.text(`Tel: ${company.phone} | Email: ${company.email}`, 15, footerY + 17);

    // Right side - Siemens badge (no box, direct on red background)
    if (siemensBadge) {
        const badgeHeight = 16;
        const badgeWidth = (siemensBadge.width / siemensBadge.height) * badgeHeight;
        const badgeX = pageWidth - 15 - badgeWidth;
        const badgeY = footerY + (footerHeight - badgeHeight) / 2;

        doc.addImage(siemensBadge.data, "PNG", badgeX, badgeY, badgeWidth, badgeHeight);
    }
}

// ─────────────────────────────────────────────
// Excel Export
// ─────────────────────────────────────────────
export async function exportQuotationExcel(q: QuotationExportData, _template?: ExportTemplate) {
    const company = await fetchCompanyDetails();
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet("Estimasi");

    let logoOffset = 0;

    // Load logo if exists
    if (company.logo) {
        try {
            const logoData = await loadImageAsBase64(company.logo);
            if (logoData) {
                const imageId = workbook.addImage({
                    base64: logoData.data,
                    extension: 'png',
                });
                
                // Set proportional width based on a fixed height of 40px
                const targetHeight = 40;
                const targetWidth = (logoData.width / logoData.height) * targetHeight;

                worksheet.addImage(imageId, {
                    tl: { col: 0, row: 0 },
                    ext: { width: targetWidth, height: targetHeight }
                });
                logoOffset = 3;
            }
        } catch (err) {
            console.error("Failed to add logo to Excel:", err);
        }
    }

    // Header Info
    const startRow = logoOffset + 1;
    
    worksheet.mergeCells(startRow, 1, startRow, 8);
    const companyNameCell = worksheet.getCell(startRow, 1);
    companyNameCell.value = company.name;
    companyNameCell.font = { bold: true, size: 14, color: { argb: 'FFDC2626' } };

    const descRow = worksheet.getRow(startRow + 1);
    descRow.getCell(1).value = company.description || "Sustainable Solutions, Built on Trust";
    descRow.getCell(1).font = { size: 10, color: { argb: 'FF666666' } };

    const addrRow = worksheet.getRow(startRow + 2);
    addrRow.getCell(1).value = company.address;
    addrRow.getCell(1).font = { size: 9, color: { argb: 'FF666666' } };

    const contactRow = worksheet.getRow(startRow + 3);
    contactRow.getCell(1).value = `Tel: ${company.phone} | Email: ${company.email} | WA: ${WA_NUMBER}`;
    contactRow.getCell(1).font = { size: 9, color: { argb: 'FF666666' } };

    const titleRowIdx = startRow + 5;
    worksheet.mergeCells(titleRowIdx, 1, titleRowIdx, 8);
    const titleCell = worksheet.getCell(titleRowIdx, 1);
    titleCell.value = q.title || "ESTIMASI HARGA";
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center' };

    // Details
    const detailsStart = titleRowIdx + 2;
    worksheet.getCell(detailsStart, 1).value = q.typeLabel || "Nomor Estimasi";
    worksheet.getCell(detailsStart, 2).value = q.quotationNo;
    
    worksheet.getCell(detailsStart + 1, 1).value = "Tanggal";
    worksheet.getCell(detailsStart + 1, 2).value = formatDate(q.createdAt);
    
    worksheet.getCell(detailsStart + 2, 1).value = "Status";
    worksheet.getCell(detailsStart + 2, 2).value = q.status || "ESTIMASI";

    if (q.clientName) {
        worksheet.getCell(detailsStart + 3, 1).value = "Proyek";
        worksheet.getCell(detailsStart + 3, 2).value = q.clientName;
    }

    // Table Header
    const tableHeaderIdx = detailsStart + 5;
    const headerRow = worksheet.getRow(tableHeaderIdx);
    headerRow.values = ["#", "SKU", "Produk", "Status", "Qty", "Harga Satuan", "Subtotal"];
    headerRow.eachCell((cell) => {
        cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFDC2626' }
        };
        cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
        };
    });

    // Data Rows
    let currentIdx = tableHeaderIdx + 1;
    q.items.forEach((item, idx) => {
        const row = worksheet.getRow(currentIdx++);
        row.values = [
            idx + 1,
            item.productSku,
            item.productName,
            formatStockStatus(item.stockStatus),
            item.quantity,
            item.price,
            item.price * item.quantity
        ];

        // Rp Formatting
        row.getCell(6).numFmt = '"Rp" #,##0';
        row.getCell(7).numFmt = '"Rp" #,##0';
        
        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle' };
        });
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(6).alignment = { horizontal: 'center' };
    });

    // Total Row
    const totalRowIdx = currentIdx + 1;
    const totalRow = worksheet.getRow(totalRowIdx);
    totalRow.getCell(6).value = "Total:";
    totalRow.getCell(6).font = { bold: true };
    totalRow.getCell(7).value = q.totalAmount;
    totalRow.getCell(7).font = { bold: true, color: { argb: 'FFDC2626' } };
    totalRow.getCell(7).numFmt = '"Rp" #,##0';

    // VAT Note
    const vatRowIdx = totalRowIdx + 1;
    const vatRow = worksheet.getRow(vatRowIdx);
    vatRow.getCell(1).value = "* Harga sudah termasuk PPN 11%";
    vatRow.getCell(1).font = { italic: true, size: 9, color: { argb: 'FF888888' } };

    // Column Widths
    worksheet.columns = [
        { width: 5 },   // #
        { width: 22 },  // SKU
        { width: 50 },  // Produk
        { width: 15 },  // Status
        { width: 10 },  // Qty
        { width: 22 },  // Harga Satuan
        { width: 22 },  // Subtotal
    ];

    // Export
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${q.quotationNo.replace(/\//g, '-')}.xlsx`;
    a.click();
    window.URL.revokeObjectURL(url);
}
