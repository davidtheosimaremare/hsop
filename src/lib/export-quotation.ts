import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface QuotationExportData {
    quotationNo: string;
    createdAt: string;
    status: string;
    totalAmount: number;
    items: {
        productSku: string;
        productName: string;
        brand: string;
        quantity: number;
        price: number;
    }[];
}

export interface ExportTemplate {
    headerImage?: string;
    footerImage?: string;
}

const COMPANY = {
    name: "PT Hokiindo Raya",
    tagline: "Distributor Alat Listrik Siemens",
    address: "Jl. Mangga Dua Raya No. 36, Jakarta Pusat 10730",
    phone: "(021) 612-8888",
    email: "sales@hokiindo.co.id",
    website: "www.hokiindo.co.id",
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

// ─────────────────────────────────────────────
// PDF Export
// ─────────────────────────────────────────────
export async function exportQuotationPDF(q: QuotationExportData, template?: ExportTemplate) {
    const doc = new jsPDF("p", "mm", "a4");
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 15;
    let y = margin;

    // ── Header ──
    if (template?.headerImage) {
        const img = await loadImageAsBase64(template.headerImage);
        if (img) {
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (img.height / img.width) * imgWidth;
            doc.addImage(img.data, "PNG", margin, y, imgWidth, Math.min(imgHeight, 35));
            y += Math.min(imgHeight, 35) + 5;
        } else {
            y = drawDefaultHeader(doc, pageWidth, margin);
        }
    } else {
        y = drawDefaultHeader(doc, pageWidth, margin);
    }

    // ── Title ──
    doc.setTextColor(30, 30, 30);
    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text("PERMINTAAN PENAWARAN HARGA", margin, y);
    y += 10;

    // ── Quotation Info ──
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(80, 80, 80);

    const infoLeft = [
        ["Nomor", q.quotationNo],
        ["Tanggal", formatDate(q.createdAt)],
        ["Status", q.status],
    ];

    infoLeft.forEach(([label, value]) => {
        doc.setFont("helvetica", "bold");
        doc.text(`${label}:`, margin, y);
        doc.setFont("helvetica", "normal");
        doc.text(value, margin + 25, y);
        y += 5;
    });

    y += 5;

    // ── Items Table ──
    const tableData = q.items.map((item, idx) => [
        String(idx + 1),
        item.productSku,
        `${item.brand} - ${item.productName}`,
        String(item.quantity),
        `Rp ${formatPrice(item.price)}`,
        `Rp ${formatPrice(item.price * item.quantity)}`,
    ]);

    autoTable(doc, {
        startY: y,
        head: [["#", "SKU", "Produk", "Qty", "Harga Satuan", "Subtotal"]],
        body: tableData,
        margin: { left: margin, right: margin },
        theme: "grid",
        headStyles: {
            fillColor: [220, 38, 38],
            textColor: 255,
            fontSize: 8,
            fontStyle: "bold",
            halign: "center",
        },
        bodyStyles: {
            fontSize: 8,
            textColor: [50, 50, 50],
        },
        columnStyles: {
            0: { halign: "center", cellWidth: 10 },
            1: { cellWidth: 28 },
            2: { cellWidth: "auto" },
            3: { halign: "center", cellWidth: 14 },
            4: { halign: "right", cellWidth: 30 },
            5: { halign: "right", cellWidth: 30 },
        },
        alternateRowStyles: {
            fillColor: [252, 252, 252],
        },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 5;

    // ── Total ──
    doc.setFillColor(249, 250, 251);
    doc.rect(pageWidth - margin - 65, finalY, 65, 10, "F");
    doc.setDrawColor(220, 38, 38);
    doc.rect(pageWidth - margin - 65, finalY, 65, 10, "S");
    doc.setFontSize(9);
    doc.setFont("helvetica", "bold");
    doc.setTextColor(30, 30, 30);
    doc.text("Total Estimasi:", pageWidth - margin - 62, finalY + 7);
    doc.setTextColor(220, 38, 38);
    doc.text(`Rp ${formatPrice(q.totalAmount)}`, pageWidth - margin - 3, finalY + 7, { align: "right" });

    // ── Notes ──
    const noteY = finalY + 20;
    doc.setTextColor(100, 100, 100);
    doc.setFontSize(7);
    doc.setFont("helvetica", "italic");
    doc.text("Catatan:", margin, noteY);
    doc.setFont("helvetica", "normal");
    doc.text("• Harga belum termasuk PPN dan ongkos kirim.", margin, noteY + 4);
    doc.text("• Penawaran ini berlaku 14 hari sejak tanggal diterbitkan.", margin, noteY + 8);
    doc.text("• Ketersediaan barang dapat berubah sewaktu-waktu.", margin, noteY + 12);

    // ── Footer ──
    if (template?.footerImage) {
        const img = await loadImageAsBase64(template.footerImage);
        if (img) {
            const imgWidth = pageWidth - margin * 2;
            const imgHeight = (img.height / img.width) * imgWidth;
            const footerH = Math.min(imgHeight, 25);
            doc.addImage(img.data, "PNG", margin, pageHeight - footerH - 5, imgWidth, footerH);
        } else {
            drawDefaultFooter(doc, pageWidth, pageHeight);
        }
    } else {
        drawDefaultFooter(doc, pageWidth, pageHeight);
    }

    doc.save(`${q.quotationNo}.pdf`);
}

function drawDefaultHeader(doc: jsPDF, pageWidth: number, margin: number): number {
    doc.setFillColor(220, 38, 38);
    doc.rect(0, 0, pageWidth, 28, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text(COMPANY.name, margin, 12);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.text(COMPANY.tagline, margin, 18);
    doc.setFontSize(7);
    doc.text(COMPANY.address, pageWidth - margin, 10, { align: "right" });
    doc.text(`Tel: ${COMPANY.phone} | ${COMPANY.email}`, pageWidth - margin, 15, { align: "right" });
    doc.text(COMPANY.website, pageWidth - margin, 20, { align: "right" });
    return 35;
}

function drawDefaultFooter(doc: jsPDF, pageWidth: number, pageHeight: number) {
    doc.setFillColor(245, 245, 245);
    doc.rect(0, pageHeight - 15, pageWidth, 15, "F");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
        `${COMPANY.name} | ${COMPANY.address} | ${COMPANY.phone}`,
        pageWidth / 2,
        pageHeight - 7,
        { align: "center" }
    );
}

// ─────────────────────────────────────────────
// Excel Export
// ─────────────────────────────────────────────
export function exportQuotationExcel(q: QuotationExportData, _template?: ExportTemplate) {
    // Note: xlsx library (SheetJS community) doesn't support embedding images natively.
    // Header/footer images are handled via text branding instead.
    const wb = XLSX.utils.book_new();

    const rows: any[][] = [
        [COMPANY.name],
        [COMPANY.tagline],
        [COMPANY.address],
        [`Tel: ${COMPANY.phone} | Email: ${COMPANY.email}`],
        [],
        ["PERMINTAAN PENAWARAN HARGA"],
        [],
        ["Nomor", q.quotationNo],
        ["Tanggal", formatDate(q.createdAt)],
        ["Status", q.status],
        [],
        ["#", "SKU", "Produk", "Brand", "Qty", "Harga Satuan", "Subtotal"],
    ];

    q.items.forEach((item, idx) => {
        rows.push([
            idx + 1,
            item.productSku,
            item.productName,
            item.brand,
            item.quantity,
            item.price,
            item.price * item.quantity,
        ]);
    });

    rows.push([]);
    rows.push(["", "", "", "", "", "Total Estimasi:", q.totalAmount]);
    rows.push([]);
    rows.push(["Catatan:"]);
    rows.push(["• Harga belum termasuk PPN dan ongkos kirim."]);
    rows.push(["• Penawaran ini berlaku 14 hari sejak tanggal diterbitkan."]);
    rows.push(["• Ketersediaan barang dapat berubah sewaktu-waktu."]);

    const ws = XLSX.utils.aoa_to_sheet(rows);

    ws["!cols"] = [
        { wch: 5 },
        { wch: 18 },
        { wch: 40 },
        { wch: 15 },
        { wch: 8 },
        { wch: 18 },
        { wch: 18 },
    ];

    ws["!merges"] = [
        { s: { r: 0, c: 0 }, e: { r: 0, c: 6 } },
        { s: { r: 1, c: 0 }, e: { r: 1, c: 6 } },
        { s: { r: 2, c: 0 }, e: { r: 2, c: 6 } },
        { s: { r: 3, c: 0 }, e: { r: 3, c: 6 } },
        { s: { r: 5, c: 0 }, e: { r: 5, c: 6 } },
    ];

    XLSX.utils.book_append_sheet(wb, ws, "Quotation");
    XLSX.writeFile(wb, `${q.quotationNo}.xlsx`);
}
