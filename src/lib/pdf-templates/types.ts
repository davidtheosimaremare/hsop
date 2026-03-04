/**
 * Shared types untuk PDF template data.
 * Semua field sudah di-resolve dari DB — tidak ada Accurate API call di sini.
 */

export interface PdfAddress {
  recipient?: string | null;
  street?: string | null;
  district?: string | null;
  city?: string | null;
  province?: string | null;
  postalCode?: string | null;
  phone?: string | null;
}

export interface PdfItem {
  no: number;
  sku: string;
  name: string;
  brand?: string | null;
  qty: number;
  unit: string;
  unitPrice: number;
  discount?: number;
  subtotal: number;
  notes?: string | null;
}

export interface PdfCompany {
  name: string;
  address: string;
  phone: string;
  email: string;
  npwp?: string;
  logoUrl?: string;
}

/** Data untuk template HSQ (Sales Quotation) */
export interface HsqTemplateData {
  company: PdfCompany;
  documentNo: string;           // Nomor HSQ dari Accurate, e.g. "HSQ/26/03/001"
  revisionLabel?: string;       // e.g. "R1", "R2" — kosong jika original
  date: string;                 // Tanggal formatted
  validUntil?: string;
  customerName: string;
  customerAddress?: PdfAddress;
  customerPhone?: string;
  customerEmail?: string;
  paymentMethod: "CASH" | "TOP" | "TRANSFER";
  topDays?: number;             // e.g. 30, 45
  items: PdfItem[];
  subtotal: number;
  discountTotal?: number;
  shipping?: number;
  grandTotal: number;
  notes?: string;
  preparedBy?: string;
}

/** Data untuk template HSO (Sales Order) */
export interface HsoTemplateData extends HsqTemplateData {
  hsqRef: string;               // Referensi HSQ
  poNumber?: string;            // Nomor PO dari customer (Corporate)
  poDate?: string;
  orderDate: string;
}

/** Data untuk template HDO (Delivery Order) */
export interface HdoTemplateData {
  company: PdfCompany;
  documentNo: string;           // Nomor HDO
  hsoRef: string;               // Referensi HSO
  date: string;
  customerName: string;
  shippingAddress: PdfAddress;
  items: PdfItem[];
  trackingNumber?: string;
  courier?: string;
  shippingNotes?: string;
  preparedBy?: string;
}

/** Data untuk template HSI (Sales Invoice) */
export interface HsiTemplateData {
  company: PdfCompany;
  documentNo: string;           // Nomor HSI
  hsoRef: string;               // Referensi HSO
  invoiceDate: string;
  dueDate?: string;
  customerName: string;
  customerAddress?: PdfAddress;
  taxId?: string;               // NPWP customer
  items: PdfItem[];
  subtotal: number;
  taxRate?: number;             // PPN %
  taxAmount?: number;
  discountTotal?: number;
  shipping?: number;
  grandTotal: number;
  paidAmount?: number;
  remainingAmount?: number;
  paymentMethod: "CASH" | "TOP" | "TRANSFER";
  bankInfo?: {
    bankName: string;
    accountNo: string;
    accountName: string;
  };
  notes?: string;
  preparedBy?: string;
}

export type PdfDocumentType = "hsq" | "hso" | "hdo" | "hsi";
