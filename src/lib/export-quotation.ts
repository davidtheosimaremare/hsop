import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import ExcelJS from "exceljs";

export interface QuotationExportData {
    quotationNo: string;
    createdAt: string;
    status: string;
    totalAmount: number; // Subtotal
    clientName?: string; // Project name
    title?: string;      // Custom title (e.g. PENAWARAN HARGA)
    typeLabel?: string;  // Custom label for the ID (e.g. Nomor Penawaran)
    customerName?: string;
    customerAddress?: string;
    customerPhone?: string;
    customerAttention?: string;
    paymentTerm?: string;
    subTotal?: number;
    discountAmount?: number;
    taxAmount?: number;
    otherFees?: number;
    grandTotal?: number;
    items: {
        productSku: string;
        productName: string;
        brand: string;
        quantity: number;
        price: number;
        stockStatus?: string;
        note?: string;
        discountStr?: string;
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
    const margin = 15;
    let y = margin;

    // Fetch company details from database
    const company = await fetchCompanyDetails();

    // Default font to Helvetica (Arial equivalent)
    doc.setFont("helvetica", "normal");
    doc.setTextColor(0, 0, 0);

    // ── Header Logo & Company Info ──
    let logoWidth = 0;
    if (company.logo) {
        const logoImg = await loadImageAsBase64(company.logo);
        if (logoImg) {
            const logoHeight = 12; // Reduced logo size
            logoWidth = (logoImg.width / logoImg.height) * logoHeight;
            doc.addImage(logoImg.data, "PNG", margin, y, logoWidth, logoHeight);
        }
    }

    const companyTextX = margin + logoWidth + 5;
    let companyY = y + 4;
    
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PT HOKIINDO RAYA", companyTextX, companyY);
    
    companyY += 5;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    
    const addressLines = [
        "Ruko Golden Boulevard BSD Blok Q No. 50",
        "Jl. Raya Serpong KM 7, Lengkong Karya, Kec. Serpong Utara",
        "Kota Tangerang Selatan Banten 15310",
        "Telp : 021 - 7568-6000",
        "Email : info@hokiindo.co.id"
    ];
    
    addressLines.forEach(line => {
        doc.text(line, companyTextX, companyY);
        companyY += 4;
    });

    y = companyY > y + 16 ? companyY + 8 : y + 24;

    // ── Customer (Kepada) & Document Info ──
    const leftWidth = 85;
    const rightX = pageWidth - margin - 85;
    const rightWidth = 85;

    // Left: Kepada
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text("Kepada", margin, y);
    y += 2;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.5);
    doc.line(margin, y, margin + leftWidth, y);
    y += 5;
    
    doc.setFont("helvetica", "bold");
    doc.text(q.customerName || "Customer", margin, y);
    y += 5;
    
    doc.setFont("helvetica", "normal");
    const addressSplit = doc.splitTextToSize(q.customerAddress || "-", leftWidth);
    doc.text(addressSplit, margin, y);
    y += (addressSplit.length * 4) + 4;

    doc.text(`Attn: Bapak   ${q.customerAttention || q.customerName || "-"}`, margin, y);
    
    // Right: PENAWARAN PENJUALAN
    let rightY = y - (addressSplit.length * 4) - 14;
    
    doc.setLineWidth(0.5);
    doc.line(rightX, rightY, rightX + rightWidth, rightY);
    rightY += 5;
    
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    const titleText = q.title || "PENAWARAN PENJUALAN";
    const titleWidth = doc.getTextWidth(titleText);
    doc.text(titleText, rightX + (rightWidth - titleWidth) / 2, rightY);
    rightY += 3;
    
    doc.line(rightX, rightY, rightX + rightWidth, rightY);
    rightY += 6;
    
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    
    const docInfo = [
        ["Nomor", ":", q.quotationNo],
        ["Tanggal", ":", formatDate(q.createdAt)],
        ["Pembayaran", ":", q.paymentTerm || "Cash Before Delivery"]
    ];
    
    docInfo.forEach(([lbl, colon, val]) => {
        doc.text(lbl, rightX, rightY);
        doc.text(colon, rightX + 25, rightY);
        doc.text(val, rightX + 28, rightY);
        rightY += 5;
    });

    y = Math.max(y, rightY) + 5;

    // ── Items Table ──
    const tableData = q.items.map((item, idx) => [
        String(idx + 1),
        item.productSku,
        item.productName,
        item.note || formatStockStatus(item.stockStatus),
        String(item.quantity),
        formatPrice(item.price),
        item.discountStr || "%",
        formatPrice(item.finalPrice !== undefined ? item.finalPrice * item.quantity : item.price * item.quantity),
    ]);

    autoTable(doc, {
        startY: y,
        head: [["NO", "KODE BARANG", "NAMA BARANG", "NOTE", "QTY", "HARGA/UNIT", "DISKON", "TOTAL HARGA"]],
        body: tableData,
        margin: { left: margin, right: margin },
        theme: "plain",
        headStyles: {
            fillColor: [255, 255, 255],
            textColor: [0, 0, 0],
            fontSize: 9,
            fontStyle: "bold",
            halign: "center",
            valign: "middle",
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
        },
        bodyStyles: {
            fontSize: 9,
            textColor: [0, 0, 0],
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 8 },
            1: { halign: "center", cellWidth: 28 },
            2: { cellWidth: "auto" },
            3: { halign: "center", cellWidth: 16 },
            4: { halign: "center", cellWidth: 10 },
            5: { halign: "right", cellWidth: 26 },
            6: { halign: "center", cellWidth: 14 },
            7: { halign: "right", cellWidth: 28 },
        }
    });

    let finalY = (doc as any).lastAutoTable.finalY;

    // ── Footer Section ──
    
    // Left: Keterangan
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Keterangan :", margin, finalY + 5);
    
    const notesText = q.notes || `Status STOCK tidak mengikat\nStatus NO STOCK indent 14-16 weeks\nPrice Loco Jabodetabek\nValidity for a month`;
    const notesLines = notesText.split('\n');
    let noteY = finalY + 10;
    notesLines.forEach(line => {
        doc.text(line, margin, noteY);
        noteY += 4.5;
    });

    // Right: Totals Sub-Table
    const totalsWidth = 70;
    const totalsX = pageWidth - margin - totalsWidth;
    
    const totalsData = [
        ["Sub Total", ":", formatPrice(q.subTotal || q.totalAmount)],
        ["Diskon", ":", formatPrice(q.discountAmount || 0)],
        ["Total", ":", formatPrice((q.subTotal || q.totalAmount) - (q.discountAmount || 0))],
        ["PPN (11%)", ":", formatPrice(q.taxAmount || 0)],
        ["Biaya Lain-lain", ":", formatPrice(q.otherFees || 0)],
        ["Grand Total", ":", formatPrice(q.grandTotal || q.totalAmount)]
    ];

    autoTable(doc, {
        startY: finalY,
        margin: { left: totalsX },
        tableWidth: totalsWidth,
        theme: "plain",
        body: totalsData,
        bodyStyles: {
            fontSize: 9,
            textColor: [0, 0, 0],
            cellPadding: { top: 1.5, right: 2, bottom: 1.5, left: 2 },
            lineWidth: 0.5,
            lineColor: [0, 0, 0]
        },
        columnStyles: {
            0: { fontStyle: "normal", cellWidth: 35 },
            1: { halign: "center", cellWidth: 5 },
            2: { halign: "right", cellWidth: 30 }
        },
        didParseCell: function(data) {
            // Make the last row bold
            if (data.row.index === totalsData.length - 1) {
                data.cell.styles.fontStyle = "bold";
            }
        }
    });

    doc.save(`${q.quotationNo.replace(/\//g, '-')}.pdf`);
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

                // Set proportional width based on a fixed height
                const targetHeight = 25; // Reduced logo size
                const targetWidth = (logoData.width / logoData.height) * targetHeight;

                worksheet.addImage(imageId, {
                    tl: { col: 0, row: 0 },
                    ext: { width: targetWidth, height: targetHeight }
                });
                logoOffset = 2;
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
    // Details
    const detailsStart = titleRowIdx + 2;

    // Left: Kepada
    worksheet.getCell(detailsStart, 1).value = "Kepada";
    worksheet.getCell(detailsStart, 1).font = { bold: true };
    worksheet.getCell(detailsStart + 1, 1).value = q.customerName || "Customer";
    worksheet.getCell(detailsStart + 1, 1).font = { bold: true };
    worksheet.getCell(detailsStart + 2, 1).value = q.customerAddress || "-";
    worksheet.getCell(detailsStart + 4, 1).value = `Attn: Bapak ${q.customerAttention || q.customerName || "-"}`;

    // Right: PENAWARAN PENJUALAN
    worksheet.getCell(detailsStart, 6).value = "PENAWARAN PENJUALAN";
    worksheet.getCell(detailsStart, 6).font = { bold: true, size: 12 };
    
    worksheet.getCell(detailsStart + 2, 5).value = "Nomor";
    worksheet.getCell(detailsStart + 2, 6).value = `: ${q.quotationNo}`;
    worksheet.getCell(detailsStart + 3, 5).value = "Tanggal";
    worksheet.getCell(detailsStart + 3, 6).value = `: ${formatDate(q.createdAt)}`;
    worksheet.getCell(detailsStart + 4, 5).value = "Pembayaran";
    worksheet.getCell(detailsStart + 4, 6).value = `: ${q.paymentTerm || "Cash Before Delivery"}`;

    // Table Header
    const tableHeaderIdx = detailsStart + 7;
    const headerRow = worksheet.getRow(tableHeaderIdx);
    headerRow.values = ["NO", "KODE BARANG", "NAMA BARANG", "NOTE", "QTY", "HARGA/UNIT", "DISKON", "TOTAL HARGA"];
    headerRow.eachCell((cell) => {
        cell.font = { bold: true };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
        cell.border = {
            top: { style: 'thin' }, left: { style: 'thin' },
            bottom: { style: 'thin' }, right: { style: 'thin' }
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
            item.note || formatStockStatus(item.stockStatus),
            item.quantity,
            item.price,
            item.discountStr || "%",
            item.finalPrice !== undefined ? item.finalPrice * item.quantity : item.price * item.quantity
        ];

        // Rp Formatting
        row.getCell(6).numFmt = '"Rp" #,##0';
        row.getCell(8).numFmt = '"Rp" #,##0';

        row.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            cell.alignment = { vertical: 'middle' };
        });
        row.getCell(1).alignment = { horizontal: 'center' };
        row.getCell(4).alignment = { horizontal: 'center' };
        row.getCell(5).alignment = { horizontal: 'center' };
        row.getCell(7).alignment = { horizontal: 'center' };
    });

    // Totals Section
    const totalsStartIdx = currentIdx + 2;
    
    // Notes Left
    worksheet.getCell(totalsStartIdx, 1).value = "Keterangan :";
    const notesLines = (q.notes || `Status STOCK tidak mengikat\nStatus NO STOCK indent 14-16 weeks\nPrice Loco Jabodetabek\nValidity for a month`).split('\n');
    notesLines.forEach((line, idx) => {
        worksheet.getCell(totalsStartIdx + 1 + idx, 1).value = line;
    });

    // Totals Right
    const addTotalRow = (rowOffset: number, label: string, value: number, isBold: boolean = false) => {
        const r = worksheet.getRow(totalsStartIdx + rowOffset);
        r.getCell(6).value = label;
        r.getCell(7).value = ":";
        r.getCell(8).value = value;
        r.getCell(8).numFmt = '"Rp" #,##0';
        
        [6, 7, 8].forEach(col => {
            r.getCell(col).border = {
                top: { style: 'thin' }, left: { style: 'thin' },
                bottom: { style: 'thin' }, right: { style: 'thin' }
            };
            if (isBold) r.getCell(col).font = { bold: true };
        });
        r.getCell(7).alignment = { horizontal: 'center' };
    };

    addTotalRow(0, "Sub Total", q.subTotal || q.totalAmount);
    addTotalRow(1, "Diskon", q.discountAmount || 0);
    addTotalRow(2, "Total", (q.subTotal || q.totalAmount) - (q.discountAmount || 0));
    addTotalRow(3, "PPN (11%)", q.taxAmount || 0);
    addTotalRow(4, "Biaya Lain-lain", q.otherFees || 0);
    addTotalRow(5, "Grand Total", q.grandTotal || q.totalAmount, true);

    // Column Widths
    worksheet.columns = [
        { width: 5 },   // NO
        { width: 22 },  // KODE
        { width: 50 },  // NAMA
        { width: 12 },  // NOTE
        { width: 8 },   // QTY
        { width: 22 },  // HARGA/UNIT
        { width: 10 },  // DISKON
        { width: 22 },  // TOTAL HARGA
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
