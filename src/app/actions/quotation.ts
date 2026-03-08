"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { updateAccurateHSQ, fetchAccurateHSQ } from "@/lib/accurate";
import { logActivity } from "./activity";
import { createNotification } from "./notification";

export async function deleteQuotationUser(id: string) {
    try {
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Tidak terautentikasi" };

        const quotation = await db.salesQuotation.findUnique({
            where: { id }
        });

        if (!quotation) return { success: false, error: "Estimasi tidak ditemukan" };

        // Only allow user to delete their own DRAFT
        if (quotation.userId !== session.user.id && quotation.userClientId !== session.user.id) {
            return { success: false, error: "Unauthorized" };
        }

        if (quotation.status !== "DRAFT") {
            return { success: false, error: "Hanya estimasi (draft) yang dapat dihapus" };
        }

        await db.salesQuotation.delete({
            where: { id }
        });

        revalidatePath("/dashboard/estimasi");
        return { success: true };
    } catch (error) {
        console.error("[deleteQuotationUser] Error:", error);
        return { success: false, error: "Gagal menghapus estimasi" };
    }
}

export async function deleteQuotation(id: string) {
    try {
        const session = await getSession();
        const adminRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
        if (!session?.user?.role || !adminRoles.includes(session.user.role)) {
            return { success: false, error: "Unauthorized" };
        }

        // Delete associated invoice if exists (Prisma doesn't have cascade for this in schema shown)
        await db.salesInvoice.deleteMany({
            where: { quotationId: id }
        });

        await db.salesQuotation.delete({
            where: { id }
        });

        revalidatePath("/admin/sales/quotations");
        return { success: true };
    } catch (error) {
        console.error("[deleteQuotation] Error:", error);
        return { success: false, error: "Gagal menghapus penawaran" };
    }
}

export async function getUserQuotations() {
    const session = await getSession();
    if (!session?.user) {
        return { success: false, error: "Tidak terautentikasi", quotations: [] };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { customer: true }
        });
        const userType = user?.customer?.type || "RETAIL";

        const quotations = await db.salesQuotation.findMany({
            where: {
                OR: [
                    { userId: session.user.id },
                    ...(session.user.customerId ? [{ customerId: session.user.customerId }] : [])
                ]
            },
            include: {
                items: true,
                customer: { select: { type: true } },
            },
            orderBy: { createdAt: "desc" },
        });

        // Fetch product images for items
        const allSkus = Array.from(new Set(quotations.flatMap(q => q.items.map(i => i.productSku))));
        const products = await db.product.findMany({
            where: { sku: { in: allSkus } },
            select: { sku: true, image: true }
        });
        const productMap = new Map(products.map(p => [p.sku, p]));

        return {
            success: true,
            userType,
            quotations: quotations.map(q => ({
                ...q,
                customerType: q.customer?.type || userType,
                sentQuotationNo: q.sentQuotationNo || null,
                offeredAt: q.offeredAt?.toISOString() || null,
                confirmedAt: q.confirmedAt?.toISOString() || null,
                shippedAt: q.shippedAt?.toISOString() || null,
                completedAt: q.completedAt?.toISOString() || null,
                createdAt: q.createdAt.toISOString(),
                updatedAt: q.updatedAt.toISOString(),
                items: q.items.map(item => {
                    const product = productMap.get(item.productSku);
                    return {
                        id: item.id,
                        productSku: item.productSku,
                        productName: item.productName,
                        brand: item.brand,
                        quantity: item.quantity,
                        price: item.price,
                        basePrice: item.basePrice,
                        discountPercent: item.discountPercent,
                        discountAmount: item.discountAmount,
                        discountStr: item.discountStr,
                        isAvailable: item.isAvailable,
                        availableQty: item.availableQty,
                        stockStatus: item.stockStatus,
                        adminNote: item.adminNote,
                        image: product?.image,
                    };
                }),
            })),
        };
    } catch (error) {
        console.error("[getUserQuotations] Error:", error);
        return { success: false, error: "Gagal mengambil data", quotations: [], userType: "RETAIL" };
    }
}

// ── Admin: Get all quotations ──
export async function getAllQuotations(page = 1, limit = 10, statusFilter?: string) {
    try {
        const where: any = {};
        if (statusFilter && statusFilter !== "ALL") {
            where.status = statusFilter;
        }

        const [quotations, total] = await Promise.all([
            db.salesQuotation.findMany({
                where,
                include: {
                    items: true,
                    user: { select: { name: true } },
                    customer: { select: { name: true } }
                },
                orderBy: { createdAt: "desc" },
                skip: (page - 1) * limit,
                take: limit,
            }),
            db.salesQuotation.count({ where })
        ]);

        return {
            success: true,
            quotations: quotations.map(q => ({
                ...q,
                customerName: q.clientName || q.customer?.name || q.user?.name || "No Name",
                processedAt: q.processedAt?.toISOString() || null,
                offeredAt: q.offeredAt?.toISOString() || null,
                confirmedAt: q.confirmedAt?.toISOString() || null,
                shippedAt: q.shippedAt?.toISOString() || null,
                completedAt: q.completedAt?.toISOString() || null,
                createdAt: q.createdAt.toISOString(),
                updatedAt: q.updatedAt.toISOString(),
                items: q.items.map(item => ({
                    id: item.id,
                    productSku: item.productSku,
                    productName: item.productName,
                    brand: item.brand,
                    quantity: item.quantity,
                    price: item.price,
                    basePrice: item.basePrice,
                    discountPercent: item.discountPercent,
                    discountAmount: item.discountAmount,
                    isAvailable: item.isAvailable,
                    availableQty: item.availableQty,
                    adminNote: item.adminNote,
                })),
            })),
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                currentPage: page
            }
        };
    } catch (error) {
        console.error("[getAllQuotations] Error:", error);
        return { success: false, error: "Gagal mengambil data", quotations: [] };
    }
}

// ── Admin: Get status counts ──
export async function getQuotationStatusCounts() {
    try {
        const counts = await db.salesQuotation.groupBy({
            by: ['status'],
            _count: true
        });

        const result: Record<string, number> = {};
        counts.forEach(c => {
            result[c.status] = c._count;
        });

        return { success: true, counts: result };
    } catch (error) {
        return { success: false, error: "Gagal mengambil statistik" };
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
export async function getQuotationDetail(idOrNo: string) {
    try {
        // Decode in case it's a URL-encoded quotation number
        const decodedIdOrNo = decodeURIComponent(idOrNo);

        // Extract base number securely for cross-prefix lookup (e.g., "SQ-26-03-1" -> "26/03/1")
        const baseNo = decodedIdOrNo.replace(/^[A-Z]+-/, "").replace(/-/g, "/");
        const slashNo = decodedIdOrNo.replace(/-/g, "/");

        const quotation = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: decodedIdOrNo },
                    { quotationNo: { equals: decodedIdOrNo, mode: 'insensitive' } },
                    { quotationNo: { equals: slashNo, mode: 'insensitive' } },
                    // Strip the leading prefix and try as SQ/xx/xx
                    { quotationNo: { contains: baseNo, mode: 'insensitive' } },
                    // Also check accurate fields to be safe
                    { accurateHsqNo: { equals: slashNo, mode: 'insensitive' } },
                    { accurateHsoNo: { equals: slashNo, mode: 'insensitive' } }
                ]
            },
            include: {
                customer: true,
                user: { select: { name: true } },
                activities: {
                    orderBy: {
                        createdAt: "desc"
                    }
                },
                items: {
                    include: {
                        SalesQuotationItemAlternative: true
                    }
                }
            },
        });

        if (!quotation) {
            return { success: false, error: "Quotation tidak ditemukan" };
        }

        // Verify ownership for non-admin users
        const session = await getSession();
        if (!session?.user) return { success: false, error: "Unauthorized" };

        const isAdmin = ["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role);
        if (!isAdmin) {
            const isOwner = quotation.userId === session.user.id;
            const isBelongToCustomer = session.user.customerId && quotation.customerId === session.user.customerId;
            if (!isOwner && !isBelongToCustomer) return { success: false, error: "Unauthorized" };
        }

        // Fetch real-time stock for each product SKU
        const skus = quotation.items.map(item => item.productSku);
        // Also fetch skus for alternatives
        const altSkus = quotation.items.flatMap((item: any) => item.SalesQuotationItemAlternative?.map((a: any) => a.productSku) || []);
        const allSkus = Array.from(new Set([...skus, ...altSkus]));

        const products = await db.product.findMany({
            where: { sku: { in: allSkus } },
            select: { sku: true, availableToSell: true, name: true, price: true, image: true, category: true },
        });
        const stockMap = new Map(products.map(p => [p.sku, p]));

        return {
            success: true,
            quotation: {
                ...quotation,
                customerName: quotation.clientName || quotation.customer?.name || (quotation as any).user?.name || "No Name",
                customerCompany: quotation.customer?.company || null,
                processedAt: quotation.processedAt?.toISOString() || null,
                offeredAt: quotation.offeredAt?.toISOString() || null,
                confirmedAt: quotation.confirmedAt?.toISOString() || null,
                shippedAt: quotation.shippedAt?.toISOString() || null,
                completedAt: quotation.completedAt?.toISOString() || null,
                createdAt: quotation.createdAt.toISOString(),
                updatedAt: quotation.updatedAt.toISOString(),
                activities: (quotation.activities || []).map(a => ({
                    ...a,
                    createdAt: a.createdAt.toISOString(),
                })),
                items: quotation.items.map((item: any) => {
                    const product = stockMap.get(item.productSku);
                    return {
                        id: item.id,
                        productSku: item.productSku,
                        productName: item.productName,
                        brand: item.brand,
                        quantity: item.quantity,
                        price: item.price,
                        basePrice: item.basePrice,
                        discountPercent: item.discountPercent,
                        discountAmount: item.discountAmount,
                        discountStr: item.discountStr,
                        isAvailable: item.isAvailable,
                        availableQty: item.availableQty,
                        stockStatus: item.stockStatus,
                        adminNote: item.adminNote,
                        image: product?.image || item.image,
                        category: product?.category,
                        currentStock: product?.availableToSell ?? 0,
                        currentPrice: product?.price ?? item.price,
                        alternatives: (item.SalesQuotationItemAlternative || []).map((alt: any) => {
                            const altProd = stockMap.get(alt.productSku);
                            return {
                                id: alt.id,
                                productSku: alt.productSku,
                                productName: alt.productName,
                                price: alt.price,
                                image: altProd?.image,
                                category: altProd?.category,
                                availableToSell: altProd?.availableToSell ?? 0
                            };
                        })
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
export async function processQuotation(idOrNo: string, data?: {
    officialNo?: string;
    accurateId?: number;
    pdfPath?: string;
}) {
    const session = await getSession();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const decodedIdOrNo = decodeURIComponent(idOrNo);
        const baseNo = decodedIdOrNo.replace(/^[A-Z]+-/, "").replace(/-/g, "/");
        const q = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo.replace(/-/g, "/") },
                    { quotationNo: "SQ/" + baseNo },
                    { quotationNo: { endsWith: baseNo } },
                    { accurateHsqNo: decodedIdOrNo.replace(/-/g, "/") }
                ]
            }
        });
        if (!q) return { success: false, error: "Not found" };

        // Cek apakah nomor HSQ sudah dipakai quotation lain
        if (data?.officialNo) {
            const existing = await db.salesQuotation.findFirst({
                where: {
                    quotationNo: data.officialNo,
                    id: { not: q.id },
                },
            });
            if (existing) {
                return {
                    success: false,
                    error: `Nomor ${data.officialNo} sudah terdaftar pada penawaran lain. Silakan gunakan nomor yang berbeda.`,
                };
            }
        }

        const session = await getSession();
        const adminName = session?.user?.name || session?.user?.email || "Admin";

        await db.salesQuotation.update({
            where: { id: q.id },
            data: {
                status: "OFFERED",
                processedBy: adminName,
                processedAt: new Date(),
                // Update quotationNo to the official HSQ number if provided
                quotationNo: data?.officialNo || q.quotationNo,
                accurateHsqNo: data?.officialNo || null,
                accurateHsqId: data?.accurateId || null,
                adminQuotePdfPath: data?.pdfPath || null,
            },
        });

        let msg = `Admin mengirimkan penawaran yang telah disetujui.`;
        if (data?.pdfPath) {
            msg += ` Download file pdf berikut: [Buka PDF Resmi](${data.pdfPath})`;
        } else if (data?.officialNo) {
            msg += ` Nomor resmi: ${data.officialNo}`;
        }

        await logActivity(q.id, "PROCESSING", "Penawaran Disetujui", msg, "ADMIN");

        // Send Notification to User
        if (q.userId) {
            await createNotification({
                userId: q.userId,
                title: "Penawaran Harga Baru",
                message: `Penawaran resmi untuk ${data?.officialNo || q.quotationNo} telah tersedia. Silakan tinjau dan konfirmasi.`,
                type: "QUOTATION",
                link: `/dashboard/transaksi/${(data?.officialNo || q.quotationNo).replace(/\//g, "-")}`
            });
        }

        // Use accurateHsqNo if provided, otherwise the original SQ no
        const newlyAssignedNo = data?.officialNo || q.quotationNo;

        revalidatePath(`/admin/sales/quotations/${decodeURIComponent(idOrNo)}`);
        return { success: true, quotationNo: newlyAssignedNo };
    } catch (error: any) {
        console.error("[processQuotation] Error:", error);
        if (error?.code === "P2002") {
            return { success: false, error: "Nomor HSQ tersebut sudah terdaftar. Silakan gunakan nomor yang berbeda." };
        }
        return { success: false, error: "Gagal memproses quotation" };
    }
}


// ── Admin: Update HSQ (edit penawaran saat masih HSQ, belum ada HSO) ──
export async function updateQuotationHSQ(idOrNo: string, data: {
    officialNo?: string;
    accurateId?: number;
    pdfPath?: string;
    adminNotes?: string;
    specialDiscount?: number;
    specialDiscountNote?: string;
    items?: Array<{
        id: string;
        productSku: string;
        productName: string;
        brand: string;
        quantity: number;
        price: number;
        basePrice?: number | null;
        isAvailable: boolean | null;
        availableQty: number | null;
        adminNote: string;
        alternatives?: Array<{
            productSku: string;
            productName: string;
            brand?: string;
            quantity: number;
            price: number;
            note?: string;
        }>;
    }>;
}) {
    const session = await getSession();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const decodedIdOrNo = decodeURIComponent(idOrNo);
        const baseNo = decodedIdOrNo.replace(/^[A-Z]+-/, "").replace(/-/g, "/");
        const q = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo.replace(/-/g, "/") },
                    { quotationNo: "SQ/" + baseNo },
                    { quotationNo: { endsWith: baseNo } },
                    { accurateHsqNo: decodedIdOrNo.replace(/-/g, "/") },
                ]
            }
        });
        if (!q) return { success: false, error: "Not found" };

        // Hanya boleh edit jika OFFERED dan belum ada HSO
        if (q.status !== "OFFERED") {
            return { success: false, error: "Hanya bisa diedit saat status Penawaran Disetujui (HSQ)" };
        }
        if (q.isHsqApproved) {
            return { success: false, error: "Penawaran resmi sudah disetujui and dikunci. Tidak bisa diedit." };
        }

        if (q.accurateHsoNo || q.accurateHsoId) {
            return { success: false, error: "Penawaran sudah dikonversi ke HSO, tidak bisa diedit" };
        }

        // Cek duplikat nomor HSQ jika diubah
        if (data.officialNo && data.officialNo !== q.accurateHsqNo) {
            const existing = await db.salesQuotation.findFirst({
                where: {
                    accurateHsqNo: data.officialNo,
                    id: { not: q.id },
                },
            });
            if (existing) {
                return {
                    success: false,
                    error: `Nomor HSQ ${data.officialNo} sudah terdaftar pada penawaran lain.`,
                };
            }
        }

        const session = await getSession();
        const adminName = session?.user?.name || session?.user?.email || "Admin";

        await db.$transaction(async (tx) => {
            // Update header quotation
            const updateData: Record<string, any> = {
                adminNotes: data.adminNotes,
                specialDiscount: data.specialDiscount,
                specialDiscountNote: data.specialDiscountNote,
            };
            if (data.officialNo !== undefined) {
                updateData.accurateHsqNo = data.officialNo || null;
                // Keep quotationNo in sync with official HSQ no if changed
                if (data.officialNo) {
                    updateData.quotationNo = data.officialNo;
                }
            }
            if (data.accurateId !== undefined) {
                updateData.accurateHsqId = data.accurateId || null;
            }
            if (data.pdfPath !== undefined) {
                updateData.adminQuotePdfPath = data.pdfPath || null;
            }

            await tx.salesQuotation.update({
                where: { id: q.id },
                data: updateData,
            });

            // Update items jika diberikan
            if (data.items) {
                const itemIds = data.items.map((i) => i.id).filter((id) => !id.startsWith("new-"));

                // Hapus items yang tidak ada di data baru
                await tx.salesQuotationItem.deleteMany({
                    where: {
                        quotationId: q.id,
                        id: { notIn: itemIds }
                    }
                });

                // Upsert items
                for (const item of data.items) {
                    let dbItem;
                    if (item.id.startsWith("new-")) {
                        dbItem = await tx.salesQuotationItem.create({
                            data: {
                                quotationId: q.id,
                                productSku: item.productSku,
                                productName: item.productName,
                                brand: item.brand || "",
                                quantity: item.quantity,
                                price: item.price,
                                basePrice: item.basePrice || item.price,
                                isAvailable: item.isAvailable,
                                availableQty: item.availableQty,
                                adminNote: item.adminNote,
                            }
                        });
                    } else {
                        dbItem = await tx.salesQuotationItem.update({
                            where: { id: item.id },
                            data: {
                                productSku: item.productSku,
                                productName: item.productName,
                                brand: item.brand || "",
                                quantity: item.quantity,
                                price: item.price,
                                basePrice: item.basePrice || item.price,
                                isAvailable: item.isAvailable,
                                availableQty: item.availableQty,
                                adminNote: item.adminNote,
                            }
                        });
                    }

                    // Handle alternatives
                    if (item.alternatives !== undefined) {
                        await tx.salesQuotationItemAlternative.deleteMany({
                            where: { quotationItemId: dbItem.id }
                        });
                        for (const alt of item.alternatives) {
                            await tx.salesQuotationItemAlternative.create({
                                data: {
                                    quotationItemId: dbItem.id,
                                    productSku: alt.productSku,
                                    productName: alt.productName,
                                    brand: alt.brand || "",
                                    quantity: alt.quantity,
                                    price: alt.price,
                                    note: alt.note,
                                }
                            });
                        }
                    }
                }
            }
        });

        let actMsg = `Admin memperbarui penawaran HSQ`;
        if (data.officialNo && data.officialNo !== q.accurateHsqNo) {
            actMsg += `. Nomor HSQ diubah ke: ${data.officialNo}`;
        }
        if (data.pdfPath && data.pdfPath !== q.adminQuotePdfPath) {
            actMsg += `. File penawaran diperbarui: [Buka PDF Terbaru](${data.pdfPath})`;
        }
        if (data.specialDiscountNote) {
            actMsg += `. Diskon spesial: ${data.specialDiscountNote}`;
        }

        await logActivity(q.id, "HSQ_UPDATED", "Penawaran Diperbarui", actMsg, adminName);

        // Send Notification to User
        if (q.userId) {
            await createNotification({
                userId: q.userId,
                title: "Penawaran Diperbarui",
                message: `Admin telah memperbarui detail penawaran resmi untuk ${data.officialNo || q.accurateHsqNo || q.quotationNo}.`,
                type: "QUOTATION",
                link: `/dashboard/transaksi/${(data.officialNo || q.accurateHsqNo || q.quotationNo).replace(/\//g, "-")}`
            });
        }

        const returnNo = data.officialNo || q.accurateHsqNo || q.quotationNo;
        revalidatePath(`/admin/sales/quotations/${encodeURIComponent(idOrNo)}`);
        return { success: true, quotationNo: returnNo };
    } catch (error: any) {
        console.error("[updateQuotationHSQ] Error:", error);
        return { success: false, error: "Gagal memperbarui penawaran" };
    }
}

export async function fetchAccurateQuotationList(search?: string, page: number = 1) {
    try {
        const pageSize = 20;
        const docs = await fetchAccurateHSQ(page, search, pageSize);
        return { success: true, docs, hasMore: docs.length === pageSize };
    } catch (error) {
        return { success: false, error: "Gagal mengambil data dari Accurate" };
    }
}

// ── Admin: Save draft of offer ──
export async function saveQuotationDraft(idOrNo: string, data: any) {
    const session = await getSession();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const decodedIdOrNo = decodeURIComponent(idOrNo);
        const q = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo.replace(/-/g, "/") }
                ]
            }
        });
        if (!q) return { success: false, error: "Not found" };

        const hasAlternatives = data.items?.some((i: any) => i.alternatives && i.alternatives.length > 0);

        await db.$transaction(async (tx) => {
            await tx.salesQuotation.update({
                where: { id: q.id },
                data: {
                    adminNotes: data.adminNotes,
                    specialDiscount: data.specialDiscount,
                    specialDiscountNote: data.specialDiscountNote,
                }
            });

            // Handle items: Update existing, Create new, Delete removed
            const itemIds = data.items.map((i: any) => i.id).filter((id: string) => !id.startsWith("new-"));

            // 1. Delete items not in data
            await tx.salesQuotationItem.deleteMany({
                where: {
                    quotationId: q.id,
                    id: { notIn: itemIds }
                }
            });

            // 2. Upsert items
            for (const item of data.items) {
                let dbItem;
                if (item.id.startsWith("new-")) {
                    dbItem = await tx.salesQuotationItem.create({
                        data: {
                            quotationId: q.id,
                            productSku: item.productSku,
                            productName: item.productName,
                            brand: item.brand || "",
                            quantity: item.quantity,
                            price: item.price,
                            basePrice: item.basePrice || item.price,
                            isAvailable: item.isAvailable,
                            availableQty: item.availableQty,
                            adminNote: item.adminNote,
                        }
                    });
                } else {
                    dbItem = await tx.salesQuotationItem.update({
                        where: { id: item.id },
                        data: {
                            productSku: item.productSku,
                            productName: item.productName,
                            brand: item.brand || "",
                            quantity: item.quantity,
                            price: item.price,
                            basePrice: item.basePrice || item.price,
                            isAvailable: item.isAvailable,
                            availableQty: item.availableQty,
                            adminNote: item.adminNote,
                        }
                    });
                }

                // Handle alternatives
                if (item.alternatives) {
                    await tx.salesQuotationItemAlternative.deleteMany({
                        where: { quotationItemId: dbItem.id }
                    });
                    if (item.alternatives.length > 0) {
                        for (const alt of item.alternatives) {
                            await tx.salesQuotationItemAlternative.create({
                                data: {
                                    quotationItemId: dbItem.id,
                                    productSku: alt.productSku,
                                    productName: alt.productName,
                                    brand: alt.brand || "",
                                    quantity: alt.quantity,
                                    price: alt.price,
                                    note: alt.note
                                }
                            });
                        }
                    }
                }
            }
        });

        const actMsg = hasAlternatives
            ? `Admin memperbarui draft penawaran. Terdapat produk alternatif yang ditawarkan kepada customer.`
            : `Admin memperbarui detail draft penawaran.`;
        await logActivity(q.id, "DRAFT_UPDATED", "Draft Diperbarui", actMsg, "ADMIN");

        revalidatePath(`/admin/sales/quotations/${idOrNo}`);
        return { success: true };
    } catch (error) {
        console.error("[saveQuotationDraft] Error:", error);
        return { success: false, error: "Gagal menyimpan draft" };
    }
}

// ── Admin: Submit the final offer ──
export async function submitQuotationOffer(idOrNo: string, data: any) {
    const session = await getSession();
    if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
        return { success: false, error: "Unauthorized" };
    }
    try {
        const decodedIdOrNo = decodeURIComponent(idOrNo);
        const q = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo.replace(/-/g, "/") }
                ]
            }
        });
        if (!q) return { success: false, error: "Not found" };

        const session = await getSession();
        const adminName = session?.user?.name || session?.user?.email || "Admin";

        const updatedQuotation = await db.$transaction(async (tx) => {
            await tx.salesQuotation.update({
                where: { id: q.id },
                data: {
                    status: "OFFERED",
                    adminNotes: data.adminNotes,
                    specialDiscount: data.specialDiscount,
                    specialDiscountNote: data.specialDiscountNote,
                    offeredAt: new Date(),
                }
            });

            const itemIds = data.items.map((i: any) => i.id).filter((id: string) => !id.startsWith("new-"));

            // 1. Delete items not in data
            await tx.salesQuotationItem.deleteMany({
                where: {
                    quotationId: q.id,
                    id: { notIn: itemIds }
                }
            });

            // 2. Upsert items
            for (const item of data.items) {
                let dbItem;
                if (item.id.startsWith("new-")) {
                    dbItem = await tx.salesQuotationItem.create({
                        data: {
                            quotationId: q.id,
                            productSku: item.productSku,
                            productName: item.productName,
                            brand: item.brand || "",
                            quantity: item.quantity,
                            price: item.price,
                            basePrice: item.basePrice || item.price,
                            isAvailable: item.isAvailable,
                            availableQty: item.availableQty,
                            adminNote: item.adminNote,
                        }
                    });
                } else {
                    dbItem = await tx.salesQuotationItem.update({
                        where: { id: item.id },
                        data: {
                            productSku: item.productSku,
                            productName: item.productName,
                            brand: item.brand || "",
                            quantity: item.quantity,
                            price: item.price,
                            basePrice: item.basePrice || item.price,
                            isAvailable: item.isAvailable,
                            availableQty: item.availableQty,
                            adminNote: item.adminNote,
                        }
                    });
                }

                if (item.alternatives) {
                    await tx.salesQuotationItemAlternative.deleteMany({
                        where: { quotationItemId: dbItem.id }
                    });
                    if (item.alternatives.length > 0) {
                        for (const alt of item.alternatives) {
                            await tx.salesQuotationItemAlternative.create({
                                data: {
                                    quotationItemId: dbItem.id,
                                    productSku: alt.productSku,
                                    productName: alt.productName,
                                    brand: alt.brand || "",
                                    quantity: alt.quantity,
                                    price: alt.price,
                                    note: alt.note
                                }
                            });
                        }
                    }
                }
            }

            return await tx.salesQuotation.findUnique({
                where: { id: q.id },
                include: {
                    customer: true,
                    items: {
                        include: { SalesQuotationItemAlternative: true }
                    }
                }
            });
        });

        await logActivity(q.id, "OFFER_SENT", "Penawaran dikirim", "Admin telah mengirimkan penawaran harga kepada pelanggan.", "ADMIN");

        // Send Notification to User
        if (q.userId) {
            await createNotification({
                userId: q.userId,
                title: "Penawaran Harga Resmi",
                message: `Admin telah mengirimkan penawaran harga resmi untuk ${q.quotationNo}. Silakan cek detail di dashboard.`,
                type: "QUOTATION",
                link: `/dashboard/transaksi/${q.quotationNo.replace(/\//g, "-")}`
            });
        }

        // --- Sync to Accurate HSQ ---
        if (q.accurateHsqId && updatedQuotation) {
            try {
                await updateAccurateHSQ(q.accurateHsqId, updatedQuotation);
            } catch (syncErr) {
                console.error("[submitQuotationOffer] Accurate sync failed:", syncErr);
            }
        }

        // Send notifications
        if (updatedQuotation) {
            sendOfferNotifications(updatedQuotation).catch(err => {
                console.error("[submitQuotationOffer] Notification error:", err);
            });
        }

        revalidatePath(`/admin/sales/quotations/${decodeURIComponent(idOrNo)}`);
        revalidatePath(`/dashboard/transaksi`);
        // Revalidate the customer's detail page for all possible URL slugs
        revalidatePath(`/dashboard/transaksi/${q.id}`);
        if (q.quotationNo) {
            const no = q.quotationNo;
            const baseNo = no.replace(/^[A-Z]+\//, "");
            const sqSlug = no.replace(/\//g, "-");
            const hsqSlug = updatedQuotation?.accurateHsqNo
                ? updatedQuotation.accurateHsqNo.replace(/\//g, "-")
                : ("HSQ-" + baseNo.replace(/\//g, "-"));
            revalidatePath(`/dashboard/transaksi/${sqSlug}`);
            revalidatePath(`/dashboard/transaksi/${hsqSlug}`);
        }
        return { success: true };
    } catch (error) {
        console.error("[submitQuotationOffer] Error:", error);
        return { success: false, error: "Gagal mengirim penawaran" };
    }
}

// ── User: Send draft quotation ──
export async function sendDraftQuotation(idOrNo: string) {
    try {
        const decodedIdOrNo = decodeURIComponent(idOrNo);
        const slashNo = decodedIdOrNo.replace(/-/g, "/");

        const original = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: decodedIdOrNo },
                    { quotationNo: { equals: decodedIdOrNo, mode: 'insensitive' } },
                    { quotationNo: { equals: slashNo, mode: 'insensitive' } },
                ]
            },
            include: { items: true }
        });

        if (!original) return { success: false, error: "Quotation tidak ditemukan" };

        const { generateRFQNo } = await import("@/app/actions/cart");
        
        let newQuotation;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                const newQuotationNo = await generateRFQNo();

                // Create a copy as a formal PENDING transaction
                newQuotation = await db.salesQuotation.create({
                    data: {
                        quotationNo: newQuotationNo,
                        userId: original.userId,
                        customerId: original.customerId,
                        email: original.email,
                        phone: original.phone,
                        status: "PENDING",
                        isEstimation: false, // This is a real transaction
                        totalAmount: original.totalAmount,
                        notes: original.notes,
                        clientName: original.clientName,
                        shippingAddress: original.shippingAddress,
                        userClientId: original.userClientId,
                        items: {
                            create: original.items.map(item => ({
                                productSku: item.productSku,
                                productName: item.productName,
                                brand: item.brand,
                                quantity: item.quantity,
                                price: item.price,
                                basePrice: item.basePrice,
                                discountPercent: item.discountPercent,
                                discountAmount: item.discountAmount,
                                discountStr: item.discountStr,
                                stockStatus: item.stockStatus
                            }))
                        }
                    },
                    include: { items: true }
                });
                break; // Success!
            } catch (error: any) {
                // P2002 is Prisma's unique constraint error code
                if (error.code === 'P2002' && attempts < maxAttempts - 1) {
                    attempts++;
                    // Wait a bit before retry to let other process finish
                    await new Promise(resolve => setTimeout(resolve, 100));
                    continue;
                }
                throw error;
            }
        }

        if (!newQuotation) {
            throw new Error("Gagal membuat penawaran setelah beberapa percobaan");
        }

        // Update original estimation to mark it as sent and store the SQ number
        await db.salesQuotation.update({
            where: { id: original.id },
            data: { 
                lastSentAt: new Date(),
                sentQuotationNo: newQuotation.quotationNo
            }
        });

        await logActivity(newQuotation.id, "RFQ_CREATED", "Permintaan Dibuat", "User membuat permintaan penawaran dari estimasi.", "USER");

        const { sendCartQuotation } = await import("@/lib/mail");
        await sendCartQuotation(
            newQuotation.email,
            newQuotation.phone || "",
            newQuotation.items.map((item: any) => ({
                sku: item.productSku,
                name: item.productName,
                brand: item.brand,
                price: item.price,
                quantity: item.quantity,
            })),
            newQuotation.totalAmount
        ).catch(console.error);

        revalidatePath("/dashboard/estimasi");
        revalidatePath("/dashboard/transaksi");
        return { success: true, newQuotationNo: newQuotation.quotationNo };
    } catch (error) {
        console.error("[sendDraftQuotation] Error:", error);
        return { success: false, error: "Gagal mengirim draft" };
    }
}

// ── User/Admin: Cancel quotation ──
export async function cancelQuotation(id: string, reason?: string) {
    try {
        const session = await getSession();
        const role = session?.user?.role;
        const performedBy = (role === "ADMIN" || role === "SUPER_ADMIN") ? "ADMIN" : "USER";

        await db.salesQuotation.update({
            where: { id },
            data: { status: "CANCELLED" }
        });

        await logActivity(id, "CANCELLED", "Dibatalkan", reason || "Dibatalkan oleh " + performedBy, performedBy);

        revalidatePath("/dashboard/transaksi");
        revalidatePath("/admin/sales/quotations");
        return { success: true };
    } catch (error) {
        console.error("[cancelQuotation] Error:", error);
        return { success: false, error: "Gagal membatalkan penawaran" };
    }
}

// ── User: Select alternative product ──
export async function userSelectAlternative(quotationId: string, itemId: string, altId: string) {
    try {
        await db.$transaction(async (tx) => {
            const alternative = await (tx as any).salesQuotationItemAlternative.findUnique({
                where: { id: altId }
            });

            if (!alternative) throw new Error("Alternatif tidak ditemukan");

            const currentItem = await tx.salesQuotationItem.findUnique({
                where: { id: itemId }
            });

            if (!currentItem) throw new Error("Item tidak ditemukan");

            // Swap current item with alternative
            await tx.salesQuotationItem.update({
                where: { id: itemId },
                data: {
                    productSku: alternative.productSku,
                    productName: alternative.productName,
                    price: alternative.price,
                    isAvailable: true,
                    adminNote: `(Diganti dari ${currentItem.productName})`
                }
            });

            // Update alternative to hold the old item (for undo)
            await (tx as any).salesQuotationItemAlternative.update({
                where: { id: altId },
                data: {
                    productSku: currentItem.productSku,
                    productName: currentItem.productName,
                    price: currentItem.price
                }
            });
        });

        await logActivity(quotationId, "ALT_SELECTED", "Produk alternatif dipilih", "User memilih produk alternatif yang disarankan.", "USER");

        revalidatePath(`/dashboard/transaksi/${quotationId}`);
        return { success: true };
    } catch (error) {
        console.error("[userSelectAlternative] Error:", error);
        return { success: false, error: error instanceof Error ? error.message : "Gagal memilih alternatif" };
    }
}

// ── User: Undo alternative selection ──
export async function userUndoAlternative(quotationId: string, itemId: string) {
    // Similar logic to swap back
    // For simplicity, let's just use the same logic if we can identify the original
    // But usually we just swap back the first alternative if it's the original
    return { success: false, error: "Not implemented" };
}

// ── User: Accept proforma / Proceed to payment ──
export async function acceptProforma(id: string) {
    try {
        await db.salesQuotation.update({
            where: { id },
            data: { confirmedAt: new Date() }
        });

        await logActivity(id, "PROFORMA_ACCEPTED", "Proforma disetujui", "User menyetujui penawaran dan lanjut ke pembayaran.", "USER");

        revalidatePath(`/dashboard/transaksi/${id}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menyetujui proforma" };
    }
}

// ── User: Update shipping address for quotation ──
export async function updateQuotationAddress(id: string, address: string, addressId?: string) {
    try {
        await db.salesQuotation.update({
            where: { id },
            data: { shippingAddress: address } as any // Use any if field name is different
        });
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal mengupdate alamat" };
    }
}

// ── Admin: Approve special discount request ──
export async function adminApproveDiscount(id: string, adminNotes?: string) {
    try {
        await db.salesQuotation.update({
            where: { id },
            data: {
                adminNotes: adminNotes,
                // Logic for approving discount... 
            }
        });
        await logActivity(id, "DISCOUNT_APPROVED", "Diskon disetujui", adminNotes || "Admin menyetujui permintaan diskon.", "ADMIN");
        revalidatePath(`/admin/sales/quotations/${id}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menyetujui diskon" };
    }
}

// ── Admin: Reject special discount request ──
export async function adminRejectDiscount(id: string, adminNotes?: string) {
    try {
        await db.salesQuotation.update({
            where: { id },
            data: { adminNotes }
        });
        await logActivity(id, "DISCOUNT_REJECTED", "Diskon ditolak", adminNotes || "Admin menolak permintaan diskon.", "ADMIN");
        revalidatePath(`/admin/sales/quotations/${id}`);
        return { success: true };
    } catch (error) {
        return { success: false, error: "Gagal menolak diskon" };
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

            // Compute the HSQ slug for the link
            const no = quotation.quotationNo || "";
            const baseNo = no.replace(/^[A-Z]+\//, "");
            const hsqSlug = quotation.accurateHsqNo
                ? quotation.accurateHsqNo.replace(/\//g, "-")
                : ("HSQ-" + baseNo.replace(/\//g, "-"));
            const appUrl = process.env.NEXT_PUBLIC_APP_URL || process.env.APP_URL || "https://hokiindo.com";
            const detailUrl = `${appUrl}/dashboard/transaksi/${hsqSlug}`;
            const hsqDisplay = quotation.accurateHsqNo || hsqSlug;

            let message = `🎉 *Penawaran Disetujui Hokiindo*\n`;
            message += `📄 *No. HSQ: ${hsqDisplay}*\n\n`;
            message += `Yth. ${quotation.customerName || "Pelanggan"},\nPenawaran harga yang telah disetujui dari Hokiindo telah siap.\n\n`;

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

            message += `\n\n👉 *Lihat Penawaran Lengkap:*\n${detailUrl}`;
            message += `\n\n✅ Penawaran berlaku 7 hari kerja.\nSegera konfirmasi untuk memproses pesanan Anda.\n\n_Hokiindo Shop_`;

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

        // Send Notification to User
        if (quotation.userId) {
            await createNotification({
                userId: quotation.userId,
                title: "Pesanan Dikonfirmasi",
                message: `Pesanan ${quotation.quotationNo} telah dikonfirmasi dan sedang diproses (HSO).`,
                type: "ORDER",
                link: `/dashboard/transaksi/${quotation.quotationNo.replace(/\//g, "-")}`
            });
        }

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

        // Send Notification to User
        if (quotation.userId) {
            await createNotification({
                userId: quotation.userId,
                title: "Pesanan Dikirim",
                message: `Pesanan ${quotation.quotationNo} telah dikirim (HDO).${trackingNumber ? ` No. Resi: ${trackingNumber}` : ""}`,
                type: "ORDER",
                link: `/dashboard/transaksi/${quotation.quotationNo.replace(/\//g, "-")}`
            });
        }

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

// ── Customer: Upload HPO (Purchase Order dari customer) ──
export async function uploadCustomerHPO(
    idOrNo: string,
    hpoUrl: string,
    poNotes?: string
) {
    try {
        const session = await getSession();
        if (!session?.user?.id) {
            return { success: false, error: "Tidak terautentikasi" };
        }

        const decodedIdOrNo = decodeURIComponent(idOrNo);
        const quotation = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo.replace(/-/g, "/") },
                ],
            },
            include: { customer: { select: { type: true } } },
        });

        if (!quotation) {
            return { success: false, error: "Quotation tidak ditemukan" };
        }

        // Ensure customer owns this quotation
        if (quotation.userId !== session.user.id && quotation.userClientId !== session.user.id) {
            return { success: false, error: "Akses ditolak" };
        }

        // Allow all customer types to upload HPO/PO
        // (both BISNIS and retail are allowed)

        // Only allow upload when quotation is in relevant statuses
        const allowedStatuses = ["OFFERED", "CONFIRMED", "PROCESSING"];
        if (!allowedStatuses.includes(quotation.status)) {
            return { success: false, error: "HPO hanya dapat diunggah saat penawaran sedang aktif" };
        }

        await db.salesQuotation.update({
            where: { id: quotation.id },
            data: {
                userPoPath: hpoUrl,
                poNotes: poNotes || null,
            },
        });

        await logActivity(quotation.id, "HPO Diunggah", `Customer mengunggah dokumen HPO${poNotes ? `: ${poNotes}` : ""}`, session.user.name || session.user.email || "Customer");

        revalidatePath(`/dashboard/transaksi/${idOrNo}`);
        revalidatePath(`/admin/sales/quotations/${idOrNo}`);
        return { success: true };
    } catch (error) {
        console.error("[uploadCustomerHPO] Error:", error);
        return { success: false, error: "Gagal mengunggah HPO" };
    }
}

export async function approveHsq(idOrNo: string) {
    try {
        const session = await getSession();
        if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
            return { success: false, error: "Unauthorized" };
        }

        // Cari dulu record databasenya karena id dari URL bisa berupa quotationNo
        const quote = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: idOrNo },
                    { quotationNo: idOrNo },
                    { quotationNo: idOrNo.replace(/-/g, "/") }
                ]
            }
        });

        if (!quote) return { success: false, error: "Quotation not found" };

        const realId = quote.id;

        await db.salesQuotation.update({
            where: { id: realId },
            data: { isHsqApproved: true }
        });

        await logActivity(realId, "HSQ_APPROVED", "HSQ Disetujui", "Admin telah menyetujui penawaran disetujui ini. Penawaran kini terkunci dan tidak dapat diubah.", "ADMIN");

        revalidatePath(`/admin/sales/quotations/${idOrNo}`);
        revalidatePath(`/dashboard/transaksi/${idOrNo}`);
        return { success: true };
    } catch (error) {
        console.error("[approveHsq] Error:", error);
        return { success: false, error: "Gagal menyetujui HSQ" };
    }
}

export async function respondToSpecialDiscountRequest(idOrNo: string, accept: boolean, reason?: string) {
    try {
        const session = await getSession();
        if (!session?.user || !["SUPER_ADMIN", "ADMIN", "MANAGER"].includes(session.user.role)) {
            return { success: false, error: "Unauthorized" };
        }

        // Cari dulu record databasenya karena id dari URL bisa berupa quotationNo
        const decodedIdOrNo = decodeURIComponent(idOrNo);
        const quotation = await db.salesQuotation.findFirst({
            where: {
                OR: [
                    { id: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo },
                    { quotationNo: decodedIdOrNo.replace(/-/g, "/") }
                ]
            },
            select: { id: true, quotationNo: true }
        });

        if (!quotation) {
            return { success: false, error: "Penawaran tidak ditemukan" };
        }

        const realId = quotation.id;

        // Simpan alasan di activity log
        if (!accept) {
            await logActivity(realId, "DISCOUNT_REJECTED", "Permintaan Diskon Ditolak", `Alasan: ${reason || "Tidak ada alasan spesifik"}`, "ADMIN");
            
            // Notification for Rejection
            const q = await db.salesQuotation.findUnique({ where: { id: realId }, select: { userId: true, quotationNo: true } });
            if (q?.userId) {
                await createNotification({
                    userId: q.userId,
                    title: "Permintaan Diskon Ditolak",
                    message: `Permintaan diskon untuk ${q.quotationNo} ditolak. Alasan: ${reason || "-"}`,
                    type: "WARNING",
                    link: `/dashboard/transaksi/${q.quotationNo.replace(/\//g, "-")}`
                });
            }
        } else {
            await logActivity(realId, "DISCOUNT_ACCEPTED", "Permintaan Diskon Diterima", "Admin menindaklanjui permintaan diskon ini.", "ADMIN");
            
            // Notification for Acceptance
            const q = await db.salesQuotation.findUnique({ where: { id: realId }, select: { userId: true, quotationNo: true } });
            if (q?.userId) {
                await createNotification({
                    userId: q.userId,
                    title: "Permintaan Diskon Disetujui",
                    message: `Permintaan diskon untuk ${q.quotationNo} telah disetujui oleh Admin.`,
                    type: "SUCCESS",
                    link: `/dashboard/transaksi/${q.quotationNo.replace(/\//g, "-")}`
                });
            }
        }

        // Tandai sebagai sudah direspon
        await db.salesQuotation.update({
            where: { id: realId },
            data: {
                specialDiscountRequest: false
            }
        });

        revalidatePath(`/admin/sales/quotations/${idOrNo}`);
        revalidatePath(`/dashboard/transaksi/${idOrNo}`);
        return { success: true };
    } catch (err) {
        console.error("[respondToSpecialDiscountRequest] Error:", err);
        return { success: false, error: "Gagal memproses permintaan" };
    }
}
