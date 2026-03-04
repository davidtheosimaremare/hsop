/**
 * Base CSS untuk semua PDF template.
 * Menggunakan inline styles agar Puppeteer dapat me-render dengan benar
 * tanpa CDN dependency. Desain dikloning dari layout dokumen Accurate.
 */
export function getBaseStyles(): string {
  return `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');

    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

    body {
      font-family: 'Inter', 'Helvetica Neue', Arial, sans-serif;
      font-size: 10pt;
      color: #1a1a2e;
      background: #ffffff;
      -webkit-print-color-adjust: exact;
      print-color-adjust: exact;
    }

    .page {
      width: 210mm;
      min-height: 297mm;
      padding: 14mm 14mm 18mm 14mm;
      margin: 0 auto;
      background: #fff;
      position: relative;
    }

    /* ── Header ── */
    .doc-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      padding-bottom: 12px;
      border-bottom: 2.5px solid #DC2626;
      margin-bottom: 16px;
    }
    .company-logo {
      height: 36px;
      width: auto;
      object-fit: contain;
    }
    .company-name {
      font-size: 15pt;
      font-weight: 700;
      color: #DC2626;
      letter-spacing: -0.3px;
    }
    .company-sub {
      font-size: 7.5pt;
      color: #6b7280;
      margin-top: 2px;
      line-height: 1.5;
    }
    .doc-title-block {
      text-align: right;
    }
    .doc-type-label {
      font-size: 18pt;
      font-weight: 700;
      color: #1a1a2e;
      line-height: 1;
    }
    .doc-type-label.draft {
      color: #6b7280;
    }
    .doc-number {
      font-size: 9pt;
      color: #DC2626;
      font-weight: 600;
      margin-top: 3px;
    }
    .doc-revision {
      display: inline-block;
      background: #FEF3C7;
      color: #92400E;
      font-size: 7pt;
      font-weight: 700;
      padding: 1px 6px;
      border-radius: 4px;
      margin-top: 3px;
    }

    /* ── Meta Info Grid ── */
    .meta-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 14px;
      margin-bottom: 16px;
    }
    .meta-block {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px 12px;
    }
    .meta-block-label {
      font-size: 6.5pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.6px;
      color: #9ca3af;
      margin-bottom: 6px;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 8.5pt;
      line-height: 1.7;
    }
    .meta-key {
      color: #6b7280;
      flex-shrink: 0;
      margin-right: 8px;
    }
    .meta-val {
      color: #111827;
      font-weight: 500;
      text-align: right;
    }
    .meta-val.highlight {
      color: #DC2626;
    }

    /* ── Table ── */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      font-size: 8.5pt;
    }
    .items-table thead tr {
      background: #1a1a2e;
      color: #ffffff;
    }
    .items-table thead th {
      padding: 7px 10px;
      text-align: left;
      font-weight: 600;
      font-size: 7.5pt;
      letter-spacing: 0.3px;
      white-space: nowrap;
    }
    .items-table thead th.right { text-align: right; }
    .items-table thead th.center { text-align: center; }

    .items-table tbody tr { border-bottom: 1px solid #f3f4f6; }
    .items-table tbody tr:nth-child(even) { background: #f9fafb; }
    .items-table tbody tr:last-child { border-bottom: 1.5px solid #e5e7eb; }

    .items-table tbody td {
      padding: 7px 10px;
      vertical-align: top;
      color: #374151;
    }
    .items-table tbody td.right { text-align: right; }
    .items-table tbody td.center { text-align: center; }
    .items-table tbody td.muted { color: #9ca3af; font-size: 7.5pt; }

    .item-name { font-weight: 600; color: #111827; }
    .item-sku { font-size: 7pt; color: #9ca3af; margin-top: 1px; }
    .item-brand { font-size: 7pt; color: #6b7280; }
    .item-note { font-size: 7pt; color: #f59e0b; font-style: italic; margin-top: 2px; }

    /* ── Totals ── */
    .totals-block {
      display: flex;
      justify-content: flex-end;
      margin-bottom: 16px;
    }
    .totals-inner {
      width: 230px;
    }
    .totals-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      font-size: 8.5pt;
      border-bottom: 1px dashed #e5e7eb;
    }
    .totals-row:last-child { border-bottom: none; }
    .totals-row .tlabel { color: #6b7280; }
    .totals-row .tval { font-weight: 600; color: #111827; }
    .totals-row.grand {
      padding-top: 6px;
      margin-top: 2px;
      border-top: 2px solid #1a1a2e;
      border-bottom: none;
    }
    .totals-row.grand .tlabel { font-size: 9.5pt; font-weight: 700; color: #1a1a2e; }
    .totals-row.grand .tval { font-size: 11pt; font-weight: 700; color: #DC2626; }

    /* ── Badges / Status ── */
    .badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 20px;
      font-size: 7pt;
      font-weight: 700;
      letter-spacing: 0.3px;
    }
    .badge-top { background: #EFF6FF; color: #1D4ED8; }
    .badge-cash { background: #F0FDF4; color: #166534; }
    .badge-transfer { background: #F5F3FF; color: #6D28D9; }

    /* ── Notes & Terms ── */
    .notes-section {
      background: #fffbeb;
      border: 1px solid #fde68a;
      border-radius: 6px;
      padding: 10px 12px;
      margin-bottom: 14px;
      font-size: 8pt;
      color: #78350f;
    }
    .notes-title {
      font-weight: 700;
      font-size: 7.5pt;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin-bottom: 4px;
      color: #92400e;
    }

    /* ── Signature Block ── */
    .signature-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-top: 20px;
    }
    .signature-box {
      border: 1px solid #e5e7eb;
      border-radius: 6px;
      padding: 10px 12px;
      text-align: center;
    }
    .signature-title {
      font-size: 7pt;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: #9ca3af;
      margin-bottom: 40px;
    }
    .signature-line {
      border-top: 1px solid #d1d5db;
      margin-bottom: 4px;
    }
    .signature-name {
      font-size: 8pt;
      font-weight: 600;
      color: #374151;
    }

    /* ── Footer ── */
    .doc-footer {
      position: absolute;
      bottom: 10mm;
      left: 14mm;
      right: 14mm;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 8px;
      border-top: 1px solid #e5e7eb;
      font-size: 7pt;
      color: #9ca3af;
    }

    /* ── Print ── */
    @media print {
      body { background: white; }
      .page { margin: 0; padding: 10mm 12mm 16mm 12mm; }
    }
  `;
}

/** Format angka ke Rupiah */
export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

/** Format tanggal ke bahasa Indonesia */
export function formatDate(dateStr: string | Date | null | undefined): string {
  if (!dateStr) return "-";
  const d = typeof dateStr === "string" ? new Date(dateStr) : dateStr;
  return d.toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

/** Generate address satu baris */
export function formatAddress(addr?: {
  street?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
} | null): string {
  if (!addr) return "-";
  return [addr.street, addr.district, addr.city, addr.province, addr.postalCode]
    .filter(Boolean)
    .join(", ");
}
