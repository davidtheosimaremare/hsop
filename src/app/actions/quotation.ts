"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function getUserQuotations() {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, error: "Tidak terautentikasi", quotations: [] };
    }

    try {
        const quotations = await db.salesQuotation.findMany({
            where: { userId: session.user.id },
            include: {
                items: true,
            },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            quotations: quotations.map(q => ({
                id: q.id,
                quotationNo: q.quotationNo,
                status: q.status,
                totalAmount: q.totalAmount,
                notes: q.notes,
                adminNotes: q.adminNotes,
                specialDiscount: q.specialDiscount,
                offeredAt: q.offeredAt?.toISOString() || null,
                confirmedAt: q.confirmedAt?.toISOString() || null,
                shippedAt: q.shippedAt?.toISOString() || null,
                completedAt: q.completedAt?.toISOString() || null,
                trackingNumber: q.trackingNumber,
                shippingNotes: q.shippingNotes,
                shippingCost: q.shippingCost,
                freeShipping: q.freeShipping,
                createdAt: q.createdAt.toISOString(),
                updatedAt: q.updatedAt.toISOString(),
                items: q.items.map(item => ({
                    id: item.id,
                    productSku: item.productSku,
                    productName: item.productName,
                    brand: item.brand,
                    quantity: item.quantity,
                    price: item.price,
                    isAvailable: item.isAvailable,
                    availableQty: item.availableQty,
                    adminNote: item.adminNote,
                })),
            })),
        };
    } catch (error) {
        console.error("[getUserQuotations] Error:", error);
        return { success: false, error: "Gagal mengambil data", quotations: [] };
    }
}

// ── Admin: Get all quotations ──
export async function getAllQuotations() {
    try {
        const quotations = await db.salesQuotation.findMany({
            include: { items: true },
            orderBy: { createdAt: "desc" },
        });

        return {
            success: true,
            quotations: quotations.map(q => ({
                id: q.id,
                quotationNo: q.quotationNo,
                email: q.email,
                phone: q.phone,
                userId: q.userId,
                status: q.status,
                totalAmount: q.totalAmount,
                notes: q.notes,
                adminNotes: q.adminNotes,
                specialDiscount: q.specialDiscount,
                processedBy: q.processedBy,
                processedAt: q.processedAt?.toISOString() || null,
                offeredAt: q.offeredAt?.toISOString() || null,
                confirmedAt: q.confirmedAt?.toISOString() || null,
                shippedAt: q.shippedAt?.toISOString() || null,
                completedAt: q.completedAt?.toISOString() || null,
                trackingNumber: q.trackingNumber,
                shippingNotes: q.shippingNotes,
                shippingCost: q.shippingCost,
                freeShipping: q.freeShipping,
                createdAt: q.createdAt.toISOString(),
                updatedAt: q.updatedAt.toISOString(),
                items: q.items.map(item => ({
                    id: item.id,
                    productSku: item.productSku,
                    productName: item.productName,
                    brand: item.brand,
                    quantity: item.quantity,
                    price: item.price,
                    isAvailable: item.isAvailable,
                    availableQty: item.availableQty,
                    adminNote: item.adminNote,
                })),
            })),
        };
    } catch (error) {
        console.error("[getAllQuotations] Error:", error);
        return { success: false, error: "Gagal mengambil data", quotations: [] };
    }
}

// ── Admin: Get pending count for notification badge ──
export async function getPendingQuotationCount() {
    try {
        const count = await db.salesQuotation.count({
            where: { status: { in: ["PENDING", "PROCESSING"] } },
        });
        return count;
    } catch {
        return 0;
    }
}

// ── Admin: Update quotation status ──
export async function updateQuotationStatus(id: string, status: string) {
    try {
        await db.salesQuotation.update({
            where: { id },
            data: { status },
        });
        return { success: true };
    } catch (error) {
        console.error("[updateQuotationStatus] Error:", error);
        return { success: false, error: "Gagal mengupdate status" };
    }
}

// ── Admin: Get quotation detail with real-time stock info ──
export async function getQuotationDetail(id: string) {
    try {
        const quotation = await db.salesQuotation.findUnique({
            where: { id },
            include: { items: true },
        });

        if (!quotation) {
            return { success: false, error: "Quotation tidak ditemukan" };
        }

        // Fetch real-time stock for each product SKU
        const skus = quotation.items.map(item => item.productSku);
        const products = await db.product.findMany({
            where: { sku: { in: skus } },
            select: { sku: true, availableToSell: true, name: true, price: true },
        });
        const stockMap = new Map(products.map(p => [p.sku, p]));

        return {
            success: true,
            quotation: {
                id: quotation.id,
                quotationNo: quotation.quotationNo,
                email: quotation.email,
                phone: quotation.phone,
                userId: quotation.userId,
                customerId: quotation.customerId,
                status: quotation.status,
                totalAmount: quotation.totalAmount,
                notes: quotation.notes,
                adminNotes: quotation.adminNotes,
                specialDiscount: quotation.specialDiscount,
                processedBy: quotation.processedBy,
                processedAt: quotation.processedAt?.toISOString() || null,
                offeredAt: quotation.offeredAt?.toISOString() || null,
                createdAt: quotation.createdAt.toISOString(),
                updatedAt: quotation.updatedAt.toISOString(),
                items: quotation.items.map(item => {
                    const product = stockMap.get(item.productSku);
                    return {
                        id: item.id,
                        productSku: item.productSku,
                        productName: item.productName,
                        brand: item.brand,
                        quantity: item.quantity,
                        price: item.price,
                        isAvailable: item.isAvailable,
                        availableQty: item.availableQty,
                        adminNote: item.adminNote,
                        // Real-time stock info
                        currentStock: product?.availableToSell ?? 0,
                        currentPrice: product?.price ?? item.price,
                    };
                }),
            },
        };
    } catch (error) {
        console.error("[getQuotationDetail] Error:", error);
        return { success: false, error: "Gagal mengambil detail quotation" };
    }
}

// ── Admin: Start processing a quotation ──
export async function processQuotation(id: string) {
    try {
        const session = await getSession();
        const adminName = session?.user?.name || session?.user?.email || "Admin";

        await db.salesQuotation.update({
            where: { id },
            data: {
                status: "PROCESSING",
                processedBy: adminName,
                processedAt: new Date(),
            },
        });
        return { success: true };
    } catch (error) {
        console.error("[processQuotation] Error:", error);
        return { success: false, error: "Gagal memproses quotation" };
    }
}

// ── Admin: Update individual item response ──
export async function updateQuotationItemResponse(
    itemId: string,
    data: {
        isAvailable: boolean | null;
        availableQty: number | null;
        adminNote: string | null;
    }
) {
    try {
        await db.salesQuotationItem.update({
            where: { id: itemId },
            data: {
                isAvailable: data.isAvailable,
                availableQty: data.availableQty,
                adminNote: data.adminNote,
            },
        });
        return { success: true };
    } catch (error) {
        console.error("[updateQuotationItemResponse] Error:", error);
        return { success: false, error: "Gagal mengupdate item" };
    }
}

// ── Admin: Submit the final offer ──
export async function submitQuotationOffer(
    id: string,
    data: {
        adminNotes: string | null;
        specialDiscount: number | null;
        items: {
            id: string;
            isAvailable: boolean | null;
            availableQty: number | null;
            adminNote: string | null;
        }[];
    }
) {
    try {
        // Update all items in a transaction
        const updatedQuotation = await db.$transaction(async (tx) => {
            // Update each item
            for (const item of data.items) {
                await tx.salesQuotationItem.update({
                    where: { id: item.id },
                    data: {
                        isAvailable: item.isAvailable,
                        availableQty: item.availableQty,
                        adminNote: item.adminNote,
                    },
                });
            }

            // Update the quotation itself
            const q = await tx.salesQuotation.update({
                where: { id },
                data: {
                    status: "OFFERED",
                    adminNotes: data.adminNotes,
                    specialDiscount: data.specialDiscount,
                    offeredAt: new Date(),
                },
                include: { items: true },
            });
            return q;
        });

        // ── Send notifications (non-blocking) ──
        sendOfferNotifications(updatedQuotation).catch(err => {
            console.error("[submitQuotationOffer] Notification error:", err);
        });

        return { success: true };
    } catch (error) {
        console.error("[submitQuotationOffer] Error:", error);
        return { success: false, error: "Gagal mengirim penawaran" };
    }
}

// ── Helper: Send email + WA notifications for offer ──
async function sendOfferNotifications(quotation: any) {
    const { sendOfferNotification } = await import("@/lib/mail");
    const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(Math.round(p));

    // 1. Send email notification
    try {
        await sendOfferNotification({
            quotationNo: quotation.quotationNo,
            email: quotation.email,
            totalAmount: quotation.totalAmount,
            specialDiscount: quotation.specialDiscount,
            adminNotes: quotation.adminNotes,
            items: quotation.items.map((item: any) => ({
                productSku: item.productSku,
                productName: item.productName,
                brand: item.brand,
                quantity: item.quantity,
                price: item.price,
                isAvailable: item.isAvailable,
                adminNote: item.adminNote,
            })),
        });
    } catch (err) {
        console.error("[Offer] Email notification failed:", err);
    }

    // 2. Send WhatsApp notification
    if (quotation.phone) {
        try {
            const token = process.env.FONTEE_TOKEN;
            if (!token) {
                console.warn("[Offer] FONTEE_TOKEN not configured, skipping WA");
                return;
            }

            let cleanPhone = quotation.phone.replace(/\D/g, '');
            if (cleanPhone.startsWith('0')) {
                cleanPhone = '62' + cleanPhone.substring(1);
            }

            const discountPercent = quotation.specialDiscount || 0;
            const discountAmount = quotation.totalAmount * (discountPercent / 100);
            const finalTotal = quotation.totalAmount - discountAmount;

            let message = `*Penawaran Harga - ${quotation.quotationNo}*\n\nYth. Pelanggan,\nBerikut penawaran harga dari Hokiindo:\n\n`;

            message += `📦 *Daftar Produk:*\n`;
            quotation.items.forEach((item: any, idx: number) => {
                const status = item.isAvailable === true ? '✅' : item.isAvailable === false ? '❌' : '⏳';
                message += `${idx + 1}. ${status} ${item.productName}\n   SKU: ${item.productSku} | Qty: ${item.quantity}\n   Harga: Rp ${formatPrice(item.price)}\n`;
                if (item.adminNote) {
                    message += `   📝 ${item.adminNote}\n`;
                }
            });

            message += `\n💰 *Total: Rp ${formatPrice(finalTotal)}*`;
            if (discountPercent > 0) {
                message += `\n🏷️ Diskon Spesial: ${discountPercent}%`;
            }

            if (quotation.adminNotes) {
                message += `\n\n💬 *Catatan:* ${quotation.adminNotes}`;
            }

            message += `\n\n✅ Penawaran berlaku 7 hari kerja.\nHubungi kami untuk konfirmasi pesanan.\n\n_Hokiindo Shop_`;

            await sendWAMessage(cleanPhone, message);
        } catch (err) {
            console.error("[Offer] WA notification failed:", err);
        }
    }
}

// ── Helper: Send WA message via Fontee ──
async function sendWAMessage(phone: string, message: string) {
    const token = process.env.FONTEE_TOKEN;
    if (!token) return;

    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    }

    const formData = new FormData();
    formData.append('target', cleanPhone);
    formData.append('message', message);
    formData.append('countryCode', '62');

    const response = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: { 'Authorization': token },
        body: formData,
    });
    const result = await response.json();
    console.log("[Fontee] WA result:", result);
}

// ── Helper: Send status notification (email + WA) ──
async function sendStatusNotifications(
    quotation: { quotationNo: string; email: string; phone: string },
    status: "CONFIRMED" | "SHIPPED" | "COMPLETED",
    extra?: { trackingNumber?: string | null; shippingNotes?: string | null; shippingCost?: number | null; freeShipping?: boolean }
) {
    const { sendOrderStatusNotification } = await import("@/lib/mail");
    const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(Math.round(p));

    // Email
    try {
        await sendOrderStatusNotification({
            quotationNo: quotation.quotationNo,
            email: quotation.email,
            status,
            trackingNumber: extra?.trackingNumber,
            shippingNotes: extra?.shippingNotes,
            shippingCost: extra?.shippingCost,
            freeShipping: extra?.freeShipping,
        });
    } catch (err) {
        console.error(`[${status}] Email failed:`, err);
    }

    // WA
    if (quotation.phone) {
        try {
            const shippingLine = extra?.freeShipping
                ? "\n🎁 *Ongkir: GRATIS* (ditanggung toko)"
                : extra?.shippingCost
                    ? `\n🚚 *Ongkir: Rp ${formatPrice(extra.shippingCost)}*`
                    : "";

            const waMessages: Record<string, string> = {
                CONFIRMED: `✅ *Pesanan Dikonfirmasi - ${quotation.quotationNo}*\n\nYth. Pelanggan,\nPesanan Anda telah dikonfirmasi dan sedang diproses oleh tim kami.${shippingLine}\n\nKami akan segera mengirimkan barang pesanan Anda.\n\n_Hokiindo Shop_`,
                SHIPPED: `🚚 *Pesanan Dikirim - ${quotation.quotationNo}*\n\nYth. Pelanggan,\nBarang pesanan Anda sudah dikirim!${extra?.trackingNumber ? `\n\n📦 *No. Resi:* ${extra.trackingNumber}` : ''}${extra?.shippingNotes ? `\n📝 ${extra.shippingNotes}` : ''}\n\n_Hokiindo Shop_`,
                COMPLETED: `🎉 *Pesanan Selesai - ${quotation.quotationNo}*\n\nYth. Pelanggan,\nPesanan Anda telah selesai.\n\nTerima kasih telah berbelanja di Hokiindo! 🙏\n\n_Hokiindo Shop_`,
            };
            await sendWAMessage(quotation.phone, waMessages[status]);
        } catch (err) {
            console.error(`[${status}] WA failed:`, err);
        }
    }
}


// ── Admin: Confirm order (OFFERED → CONFIRMED) ──
export async function confirmQuotationOrder(
    id: string,
    shippingCost?: number,
    freeShipping?: boolean
) {
    try {
        const quotation = await db.salesQuotation.update({
            where: { id },
            data: {
                status: "CONFIRMED",
                confirmedAt: new Date(),
                shippingCost: freeShipping ? 0 : (shippingCost || 0),
                freeShipping: freeShipping || false,
            },
        });

        sendStatusNotifications(quotation, "CONFIRMED", {
            shippingCost: freeShipping ? 0 : (shippingCost || 0),
            freeShipping: freeShipping || false,
        }).catch(console.error);
        return { success: true };
    } catch (error) {
        console.error("[confirmQuotationOrder] Error:", error);
        return { success: false, error: "Gagal mengkonfirmasi pesanan" };
    }
}

// ── Admin: Ship order (CONFIRMED → SHIPPED) ──
export async function shipQuotationOrder(
    id: string,
    trackingNumber?: string,
    shippingNotes?: string
) {
    try {
        const quotation = await db.salesQuotation.update({
            where: { id },
            data: {
                status: "SHIPPED",
                shippedAt: new Date(),
                trackingNumber: trackingNumber || null,
                shippingNotes: shippingNotes || null,
            },
        });

        sendStatusNotifications(quotation, "SHIPPED", { trackingNumber, shippingNotes }).catch(console.error);
        return { success: true };
    } catch (error) {
        console.error("[shipQuotationOrder] Error:", error);
        return { success: false, error: "Gagal mengirim pesanan" };
    }
}

// ── Admin: Complete order (SHIPPED → COMPLETED) ──
export async function completeQuotationOrder(id: string) {
    try {
        const quotation = await db.salesQuotation.update({
            where: { id },
            data: {
                status: "COMPLETED",
                completedAt: new Date(),
            },
        });

        sendStatusNotifications(quotation, "COMPLETED").catch(console.error);
        return { success: true };
    } catch (error) {
        console.error("[completeQuotationOrder] Error:", error);
        return { success: false, error: "Gagal menyelesaikan pesanan" };
    }
}

