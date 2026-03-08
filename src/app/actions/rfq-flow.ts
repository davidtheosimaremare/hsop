"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { logActivity } from "./activity";
import { notifyAdmins } from "./notification";

async function resolveQuotation(idOrNo: string) {
    const decoded = decodeURIComponent(idOrNo);
    // Standardize number: replace - with / and remove any prefix like SQ- or HSQ-
    const baseNo = decoded.replace(/^[A-Z]+-/, "").replace(/-/g, "/");

    return await db.salesQuotation.findFirst({
        where: {
            OR: [
                { id: decoded },
                { quotationNo: decoded },
                { quotationNo: decoded.replace(/-/g, "/") },
                { quotationNo: "SQ/" + baseNo },
                { quotationNo: { endsWith: baseNo } },
                { accurateHsqNo: decoded.replace(/-/g, "/") },
                { accurateHsoNo: decoded.replace(/-/g, "/") }
            ]
        }
    });
}

// --- Stage 1: Admin Confirm Quotation (Link HRSQ) ---
export async function adminConfirmQuotation(
    quotationId: string,
    accurateHsqId?: number | null,
    accurateHsqNo?: string | null,
    adminQuotePdfPath?: string,
    adminNotes?: string
) {
    const session = await getSession();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: {
                status: "OFFERED",
                accurateHsqId: accurateHsqId || null,
                accurateHsqNo: accurateHsqNo || null,
                adminQuotePdfPath,
                adminNotes,
                offeredAt: new Date()
            }
        });

        // Log Activity: Offer Sent
        const logPromises: Promise<any>[] = [];
        if (accurateHsqNo) {
            logPromises.push(
                logActivity(quote.id, "OFFER_SENT", "Penawaran (SQ) dikirim ke user", `Admin mengirimkan Sales Quotation resmi nomor ${accurateHsqNo}.`, "ADMIN")
            );
        } else {
            logPromises.push(
                logActivity(quote.id, "OFFER_SENT", "Tagihan / Konfirmasi dikirim ke user", `Admin telah mengkonfirmasi pesanan. Tagihan telah tersedia.`, "ADMIN")
            );
        }
        if (adminQuotePdfPath) {
            logPromises.push(
                logActivity(quote.id, "SQ_UPLOADED", "Dokumen SQ diupload", `Admin mengunggah dokumen penawaran disetujui (SQ).`, "ADMIN")
            );
        }
        await Promise.all(logPromises);
        revalidatePath("/admin/sales/quotations");
        revalidatePath(`/admin/sales/quotations/${quote.id}`);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        revalidatePath(`/dashboard/transaksi/${quote.id}`);
        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminConfirmQuotation error:", error);
        return { success: false, error: "Failed to confirm quotation" };
    }
}

// --- Stage 2: User Submit PO & Negotiation ---
export async function userSubmitPO(
    quotationId: string,
    userPoPath: string,
    specialDiscountRequest: boolean,
    specialDiscountNote?: string
) {
    try {
        // Verify ownership
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        const isOwner = quote.userId === session.user.id;
        const isBelongToCustomer = session.user.customerId && quote.customerId === session.user.customerId;

        if (!isOwner && !isBelongToCustomer) return { success: false, error: "Unauthorized" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: {
                userPoPath,
                specialDiscountRequest,
                specialDiscountNote,
                confirmedAt: new Date()
            }
        });

        // Log Activity: PO Upload + Discount Request (separate events)
        await logActivity(quote.id, "PO_UPLOADED", "Purchase Order (PO) diupload", "User mengunggah dokumen Purchase Order untuk dikonfirmasi admin.", "USER");
        if (specialDiscountRequest) {
            const discountDesc = specialDiscountNote
                ? `User mengajukan permintaan diskon tambahan: "${specialDiscountNote}"`
                : "User mengajukan permintaan diskon tambahan tanpa catatan.";
            await logActivity(quote.id, "DISCOUNT_REQUESTED", "Pengajuan diskon tambahan", discountDesc, "USER");
        }

        // Notify Admins
        await notifyAdmins({
            title: specialDiscountRequest ? "PO & Permintaan Diskon" : "PO Baru Diunggah",
            message: `User mengunggah PO untuk ${quote.quotationNo}${specialDiscountRequest ? " dan meminta diskon spesial." : "."}`,
            type: "ORDER",
            link: `/admin/sales/quotations/${quote.quotationNo.replace(/\//g, "-")}`
        });

        revalidatePath("/admin/sales/quotations");
        revalidatePath(`/admin/sales/quotations/${quote.id}`);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        revalidatePath(`/dashboard/transaksi`);
        revalidatePath(`/dashboard/transaksi/${quote.id}`);
        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("userSubmitPO error:", error);
        return { success: false, error: "Failed to submit PO" };
    }
}

// --- Stage 4: Admin Process Order (Link HSO) ---
export async function adminProcessOrder(
    quotationId: string,
    accurateHsoId?: number | null,
    accurateHsoNo?: string | null,
    adminSoPdfPath?: string,
    adminNotes?: string,
    adminInvoicePdfPath?: string,
    nextStatus: string = "PROCESSING"
) {
    const session = await getSession();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: {
                status: nextStatus,
                accurateHsoId: accurateHsoId || null,
                accurateHsoNo: accurateHsoNo || null,
                adminSoPdfPath,
                adminNotes,
                adminInvoicePdfPath,
                processedAt: new Date()
            }
        });

        // Log Activity: SO Processing + document uploads
        const soLogPromises: Promise<any>[] = [];
        if (accurateHsoNo) {
            soLogPromises.push(
                logActivity(quote.id, "SO_UPLOADED", "Sales Order (SO) diterbitkan", `Admin memproses pesanan and menerbitkan SO nomor ${accurateHsoNo}.`, "ADMIN")
            );
        } else {
            soLogPromises.push(
                logActivity(quote.id, "ORDER_PROCESSED", "Pesanan Diterima & Diproses", `Admin memproses pesanan ini untuk disiapkan dan dikirimkan.`, "ADMIN")
            );
        }
        if (adminSoPdfPath) {
            soLogPromises.push(
                logActivity(quote.id, "SO_DOC_UPLOADED", "Dokumen SO diupload", "Admin mengunggah dokumen Sales Order (SO).", "ADMIN")
            );
        }
        if (adminInvoicePdfPath) {
            soLogPromises.push(
                logActivity(quote.id, "INVOICE_UPLOADED", "Invoice/Faktur diupload", "Admin mengunggah dokumen Faktur Penjualan.", "ADMIN")
            );
        }
        if (adminNotes) {
            soLogPromises.push(
                logActivity(quote.id, "ADMIN_NOTE", "Catatan admin diperbarui", adminNotes, "ADMIN")
            );
        }
        await Promise.all(soLogPromises);
        revalidatePath(`/admin/sales/quotations/${quote.id}`);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminProcessOrder error:", error);
        return { success: false, error: "Failed to process order" };
    }
}

// --- User Upload Payment Proof ---
export async function userUploadPaymentProof(quotationId: string, paymentProofPath: string) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        const isOwner = quote.userId === session.user.id;
        const isBelongToCustomer = session.user.customerId && quote.customerId === session.user.customerId;

        if (!isOwner && !isBelongToCustomer) return { success: false, error: "Unauthorized" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: { paymentProofPath }
        });

        // Log Activity
        await logActivity(quote.id, "PAYMENT_UPLOADED", "Bukti bayar diupload", "User telah mengupload bukti pembayaran.", "USER");

        // Notify Admins
        await notifyAdmins({
            title: "Bukti Bayar Diunggah",
            message: `User telah mengunggah bukti pembayaran untuk pesanan ${quote.quotationNo}.`,
            type: "ORDER",
            link: `/admin/sales/payments`
        });

        revalidatePath(`/dashboard/transaksi/${quote.id}`);
        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("userUploadPaymentProof error:", error);
        return { success: false, error: "Gagal mengupload bukti pembayaran" };
    }
}

// --- Admin Rollback Stage ---
const ROLLBACK_MAP: Record<string, string> = {
    "OFFERED": "PENDING",
    "CONFIRMED": "OFFERED",
    "PROCESSING": "CONFIRMED",
    "SHIPPED": "PROCESSING",
};

export async function adminRollbackStage(quotationId: string) {
    try {
        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        const previousStatus = ROLLBACK_MAP[quote.status];
        if (!previousStatus) {
            return { success: false, error: "Tidak bisa kembali dari tahap ini" };
        }

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: { status: previousStatus }
        });

        revalidatePath(`/admin/sales/quotations/${quote.id}`);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true, newStatus: previousStatus };
    } catch (error) {
        console.error("adminRollbackStage error:", error);
        return { success: false, error: "Gagal kembali ke tahap sebelumnya" };
    }
}

export async function adminUploadInvoice(quotationId: string, adminInvoicePdfPath: string) {
    try {
        const session = await getSession();
        if (!session?.user || session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN") {
            return { success: false, error: "Unauthorized" };
        }

        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: { adminInvoicePdfPath }
        });

        // Log Activity
        await logActivity(quote.id, "INVOICE_UPLOADED", "Invoice diterbitkan", "Admin telah mengunggah faktur penjualan.", "ADMIN");

        revalidatePath(`/admin/sales/quotations/${quote.id}`);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminUploadInvoice error:", error);
        return { success: false, error: "Gagal menyimpan invoice" };
    }
}

// --- Stage 6: Admin Ship Order (Link DO) ---
export async function adminShipOrder(
    quotationId: string,
    accurateDoId?: number | null,
    accurateDoNo?: string | null,
    adminDoPdfPath?: string,
    trackingNumber?: string,
    shippingNotes?: string
) {
    const session = await getSession();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: {
                status: "SHIPPED",
                accurateDoId: accurateDoId || null,
                accurateDoNo: accurateDoNo || null,
                adminDoPdfPath,
                trackingNumber,
                shippingNotes,
                shippedAt: new Date()
            }
        });

        // Log Activity
        let desc = "Admin telah memproses dan mengirimkan pesanan";
        if (accurateDoNo) desc += ` menggunakan Surat Jalan (DO) No. ${accurateDoNo}`;
        if (trackingNumber) desc += ` dengan Nomor Resi ${trackingNumber}`;
        if (shippingNotes && shippingNotes.trim() !== "") desc += ` (${shippingNotes})`;
        desc += ".";

        await logActivity(quote.id, "DO_UPLOADED", "Pesanan Dikirim", desc, "ADMIN");
        revalidatePath(`/admin/sales/quotations/${quote.id}`);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminShipOrder error:", error);
        return { success: false, error: "Failed to ship order" };
    }
}

// --- Stage 7: User Confirm Receipt ---
export async function userConfirmReceipt(
    quotationId: string,
    receiptEvidencePath: string
) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        const isOwner = quote.userId === session.user.id;
        const isBelongToCustomer = session.user.customerId && quote.customerId === session.user.customerId;

        if (!isOwner && !isBelongToCustomer) return { success: false, error: "Unauthorized" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: {
                status: "COMPLETED",
                receiptEvidencePath,
                completedAt: new Date()
            }
        });

        // Log Activity
        await logActivity(quote.id, "COMPLETED", "Pesanan selesai", "User telah mengonfirmasi penerimaan barang.", "USER");

        // Notify Admins
        await notifyAdmins({
            title: "Pesanan Diterima User",
            message: `User telah mengonfirmasi penerimaan barang untuk pesanan ${quote.quotationNo}.`,
            type: "SUCCESS",
            link: `/admin/sales/quotations/${quote.quotationNo.replace(/\//g, "-")}`
        });

        revalidatePath(`/dashboard/transaksi`);
        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        revalidatePath(`/dashboard/transaksi/${quote.id}`);
        return { success: true };
    } catch (error) {
        console.error("userConfirmReceipt error:", error);
        return { success: false, error: "Failed to confirm receipt" };
    }
}

// --- Stage 8: User Request Return ---
export async function userRequestReturn(
    quotationId: string,
    returnReason: string,
    returnEvidencePath: string
) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        const isOwner = quote.userId === session.user.id;
        const isBelongToCustomer = session.user.customerId && quote.customerId === session.user.customerId;

        if (!isOwner && !isBelongToCustomer) return { success: false, error: "Unauthorized" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: {
                returnRequest: true,
                returnReason,
                returnEvidencePath
            }
        });

        // Log Activity
        await logActivity(quote.id, "RETURN_REQUESTED", "Pengajuan retur", `User mengajukan pengembalian barang dengan alasan: ${returnReason}`, "USER");

        // Notify Admins
        await notifyAdmins({
            title: "Permintaan Retur Baru",
            message: `User mengajukan retur untuk ${quote.quotationNo}. Alasan: ${returnReason}`,
            type: "WARNING",
            link: `/admin/sales/returns`
        });

        revalidatePath(`/dashboard/transaksi`);
        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        revalidatePath(`/dashboard/transaksi/${quote.id}`);
        return { success: true };
    } catch (error) {
        console.error("userRequestReturn error:", error);
        return { success: false, error: "Failed to request return" };
    }
}

export async function adminJumpToStatus(quotationId: string, targetStatus: string) {
    try {
        const session = await getSession();
        if (!session?.user || (session.user.role !== "SUPER_ADMIN" && session.user.role !== "ADMIN")) {
            return { success: false, error: "Unauthorized" };
        }

        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        const validStatuses = ["PENDING", "OFFERED", "CONFIRMED", "PROCESSING", "SHIPPED", "COMPLETED"];
        if (!validStatuses.includes(targetStatus)) {
            return { success: false, error: "Status tidak valid" };
        }

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: { status: targetStatus }
        });

        revalidatePath(`/admin/sales/quotations/${quote.id}`);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminJumpToStatus error:", error);
        return { success: false, error: "Gagal merubah status" };
    }
}

// --- Admin Upload Tax Invoice (Faktur Pajak) ---
export async function adminUploadTaxInvoice(quotationId: string, taxInvoiceUrl: string) {
    try {
        const quote = await resolveQuotation(quotationId);
        if (!quote) return { success: false, error: "Quotation not found" };

        await db.salesQuotation.update({
            where: { id: quote.id },
            data: { taxInvoiceUrl }
        });

        await logActivity(
            quote.id,
            "TAX_INVOICE_UPLOADED",
            "Faktur Pajak diupload",
            "Admin telah mengunggah dokumen Faktur Pajak (e-Faktur).",
            "ADMIN"
        );

        revalidatePath(`/admin/sales/quotations/${quote.id}`);
        revalidatePath(`/admin/sales/quotations/${quotationId}`);
        revalidatePath(`/dashboard/transaksi/${quote.id}`);
        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("adminUploadTaxInvoice error:", error);
        return { success: false, error: "Failed to upload tax invoice" };
    }
}
