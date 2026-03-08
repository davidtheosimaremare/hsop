"use server";

import { sendCartQuotation } from "@/lib/mail";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { createAccurateHSQ } from "@/lib/accurate";
import { logActivity } from "./activity";
import { notifyAdmins } from "./notification";

// Generate sequential EST/YY/MM/XXXXX quotation number for draft estimations
export async function generateEstimateNo(): Promise<string> {
    const now = new Date();
    const year = String(now.getFullYear()).substring(2); // 2 digit (e.g., 26)
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 2 digit (e.g., 02)
    const prefix = `EST/${year}/${month}/`;

    const latest = await db.salesQuotation.findFirst({
        where: { quotationNo: { startsWith: prefix } },
        orderBy: { quotationNo: 'desc' },
        select: { quotationNo: true },
    });

    let nextNum = 1;
    if (latest?.quotationNo) {
        const parts = latest.quotationNo.split('/');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num)) nextNum = num + 1;
    }
    return `${prefix}${String(nextNum)}`;
}

// Generate sequential HRSQ/YY/MM/XXXXX quotation number for submitted quotations (penawaran)
export async function generateRFQNo(): Promise<string> {
    const now = new Date();
    const year = String(now.getFullYear()).substring(2); // 2 digit (e.g., 26)
    const month = String(now.getMonth() + 1).padStart(2, '0'); // 2 digit (e.g., 02)
    const prefix = `SQ/${year}/${month}/`;

    const latest = await db.salesQuotation.findFirst({
        where: { quotationNo: { startsWith: prefix } },
        orderBy: { quotationNo: 'desc' },
        select: { quotationNo: true },
    });

    let nextNum = 1;
    if (latest?.quotationNo) {
        const parts = latest.quotationNo.split('/');
        const lastPart = parts[parts.length - 1];
        const num = parseInt(lastPart, 10);
        if (!isNaN(num)) nextNum = num + 1;
    }
    return `${prefix}${String(nextNum)}`;
}

// Helper: get notification settings from SiteSetting
async function getNotifSettings() {
    try {
        const setting = await db.siteSetting.findUnique({ where: { key: 'notification_email' } });
        if (setting?.value && typeof setting.value === 'object') {
            const val = setting.value as any;
            return {
                salesPhone: val.phone || '081249009899',
            };
        }
    } catch (e) {
        // fallback
    }
    return { salesPhone: '081249009899' };
}

interface CartItem {
    sku: string;
    name: string;
    brand: string;
    price: number;
    originalPrice?: number;
    quantity: number;
    readyStock?: number;
    indent?: number;
    discountStr?: string;
    stockStatus?: string;
}

// For guest users - send via email AND save to database
export async function submitCartQuotation(
    email: string,
    phone: string,
    items: CartItem[],
    totalPrice: number,
    address?: string
) {
    if (!email || !email.includes("@")) {
        return { success: false, error: "Email tidak valid" };
    }

    if (!phone || phone.length < 8) {
        return { success: false, error: "Nomor HP tidak valid" };
    }

    if (!items || items.length === 0) {
        return { success: false, error: "Keranjang kosong" };
    }

    try {
        // Save to database with retry logic for quotationNo collisions
        let quotation;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                // Guest users always submit as RFQ (not draft)
                const quotationNo = await generateRFQNo();
                quotation = await db.salesQuotation.create({
                    data: {
                        quotationNo,
                        email,
                        phone,
                        totalAmount: totalPrice,
                        status: "PENDING",
                        shippingAddress: address,
                        items: {
                            create: items.map(item => {
                                const basePrice = item.originalPrice || item.price;
                                const discountAmount = basePrice - item.price;
                                const discountPercent = basePrice > 0 ? (discountAmount / basePrice) * 100 : 0;

                                return {
                                    productSku: item.sku,
                                    productName: item.name,
                                    brand: item.brand,
                                    quantity: item.quantity,
                                    price: item.price,
                                    basePrice: basePrice,
                                    discountPercent: discountPercent,
                                    discountAmount: discountAmount,
                                    discountStr: item.discountStr,
                                    stockStatus: item.stockStatus
                                };
                            }),
                        },
                    },
                    include: { items: true }
                });
                break; // Success!
            } catch (error: any) {
                // P2002 is Prisma's unique constraint error code
                if (error.code === 'P2002' && attempts < maxAttempts - 1) {
                    attempts++;
                    // Delay a bit before retrying
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
                    continue;
                }
                throw error;
            }
        }

        if (!quotation) throw new Error("Failed to create quotation after multiple attempts");

        console.log("[submitCartQuotation] Guest quotation saved:", quotation.quotationNo);

        // Log Activity
        await logActivity(quotation.id, "SQ_CREATED", "SQ Baru Dibuat", `Guest (${email}) mengirimkan permintaan penawaran (SQ) nomor ${quotation.quotationNo}.`, "USER");

        // Notify Admins
        await notifyAdmins({
            title: "Permintaan Penawaran Baru (Guest)",
            message: `Terdapat permintaan penawaran baru ${quotation.quotationNo} dari guest ${email}.`,
            type: "QUOTATION",
            link: `/admin/sales/quotations/${quotation.quotationNo.replace(/\//g, "-")}`
        });

        // Send email notification
        try {
            await sendCartQuotation(email, phone, items, totalPrice, quotation.quotationNo);
        } catch (emailError) {
            console.error("[submitCartQuotation] Email failed:", emailError);
        }

        // Send WhatsApp notification via Fontee
        const { salesPhone } = await getNotifSettings();
        const message = `[SQ Guest] Quotation baru dari ${email}\nNomor: ${quotation.quotationNo}\nTotal: Rp ${new Intl.NumberFormat("id-ID").format(totalPrice)}\nItem: ${items.length} produk\nHP: ${phone}`;
        try {
            await sendFonteeMessage(salesPhone, message);
        } catch (waError) {
            console.error("[submitCartQuotation] WA failed:", waError);
        }

        return { success: true, quotationNo: quotation.quotationNo, error: undefined };
    } catch (error) {
        console.error("[submitCartQuotation] Error:", error);
        // Fallback: at least try to send email
        const result = await sendCartQuotation(email, phone, items, totalPrice);
        return { ...result, quotationNo: undefined };
    }
}

// For logged-in users - save to database and send notifications
export async function saveQuotationToDb(
    items: CartItem[],
    totalPrice: number,
    status: 'PENDING' | 'DRAFT' = 'PENDING',
    userClientId?: string,
    clientNameSnapshot?: string,
    address?: string
) {
    console.log("[saveQuotationToDb] Starting...", { status, userClientId, clientNameSnapshot });
    const session = await getSession();
    console.log("[saveQuotationToDb] Session:", session ? "Found" : "Null", session?.user?.id);

    if (!session?.user) {
        console.error("[saveQuotationToDb] No session user found");
        return { success: false, error: "User tidak terautentikasi" };
    }

    if (!items || items.length === 0) {
        return { success: false, error: "Keranjang kosong" };
    }

    try {
        // Fetch full user data from database
        console.log("[saveQuotationToDb] Fetching user:", session.user.id);
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true, email: true, name: true, phone: true, address: true, customerId: true,
                customer: {
                    select: {
                        company: true,
                        accurateCustomerCode: true,
                        address: true
                    }
                }
            }
        });

        if (!user) {
            console.error("[saveQuotationToDb] User not found in DB:", session.user.id);
            return { success: false, error: "User tidak ditemukan di database" };
        }
        console.log("[saveQuotationToDb] User found:", user.email);

        // Update user address if provided to keep profile up to date
        if (address) {
            await db.user.update({
                where: { id: user.id },
                data: { address }
            });
        }

        // Determine final shipping address
        let finalShippingAddress = address || user.address;

        // If still no address, try to fetch primary address from address book
        if (!finalShippingAddress && user.id) {
            const dbUser = await db.user.findUnique({
                where: { id: user.id },
                include: {
                    customer: {
                        include: {
                            addresses: {
                                where: { isPrimary: true },
                                take: 1
                            }
                        }
                    }
                }
            });

            if (dbUser?.customer?.addresses?.[0]) {
                const primary = dbUser.customer.addresses[0];
                finalShippingAddress = `${primary.label ? `[${primary.label}] ` : ""}${primary.address}${primary.recipient ? ` - UP: ${primary.recipient}` : ""}${primary.phone ? ` (${primary.phone})` : ""}`;
            } else if (dbUser?.customer?.address) {
                finalShippingAddress = dbUser.customer.address;
            }
        }

        // If userClientId is provided, fetch client name for snapshot. 
        // Otherwise use the provided snapshot if any.
        let clientName = clientNameSnapshot;
        if (userClientId) {
            const client = await db.userClient.findUnique({
                where: { id: userClientId },
                select: { name: true }
            });
            clientName = client?.name;
        }

        console.log("[saveQuotationToDb] Creating quotation...");

        let quotation;
        let attempts = 0;
        const maxAttempts = 5;

        while (attempts < maxAttempts) {
            try {
                // Use EST number for drafts, RFQ number for submitted quotations
                const quotationNo = status === 'DRAFT'
                    ? await generateEstimateNo()
                    : await generateRFQNo();

                quotation = await db.salesQuotation.create({
                    data: {
                        quotationNo,
                        userId: user.id,
                        customerId: user.customerId,
                        email: user.email,
                        phone: user.phone || "",
                        totalAmount: totalPrice,
                        status: status,
                        isEstimation: status === 'DRAFT',
                        shippingAddress: finalShippingAddress,
                        userClientId: userClientId,
                        clientName: clientName,
                        items: {
                            create: items.map(item => {
                                const basePrice = item.originalPrice || item.price;
                                const discountAmount = basePrice - item.price;
                                const discountPercent = basePrice > 0 ? (discountAmount / basePrice) * 100 : 0;

                                return {
                                    productSku: item.sku,
                                    productName: item.name,
                                    brand: item.brand,
                                    quantity: item.quantity,
                                    price: item.price,
                                    basePrice: basePrice,
                                    discountPercent: discountPercent,
                                    discountAmount: discountAmount,
                                    discountStr: item.discountStr,
                                    stockStatus: item.stockStatus
                                };
                            }),
                        },
                    },
                    include: {
                        items: true,
                        customer: {
                            select: { accurateCustomerCode: true }
                        }
                    }
                });
                break; // Success
            } catch (error: any) {
                if (error.code === 'P2002' && attempts < maxAttempts - 1) {
                    attempts++;
                    await new Promise(resolve => setTimeout(resolve, Math.random() * 200));
                    continue;
                }
                throw error;
            }
        }

        if (!quotation) throw new Error("Failed to create quotation after multiple attempts");

        console.log("[saveQuotationToDb] Quotation saved:", quotation.quotationNo);

        // Don't send notifications if it's a draft
        if (status === 'DRAFT') {
            return { success: true, quotationId: quotation.id, quotationNo: quotation.quotationNo };
        }

        // Send email notification to sales and customer
        try {
            console.log("[saveQuotationToDb] Sending email...");
            await sendCartQuotation(
                user.email,
                user.phone || "",
                items,
                totalPrice,
                quotation.quotationNo
            );
            console.log("[saveQuotationToDb] Email sent");
        } catch (emailError) {
            console.error("[saveQuotationToDb] Failed to send quotation email:", emailError);
            // Don't fail the whole operation if email fails
        }

        // Send WhatsApp notification via Fontee
        const { salesPhone } = await getNotifSettings();
        const message = `[SQ] Quotation baru dari ${user.name || user.email}\nNomor: ${quotation.quotationNo}\nTotal: Rp ${new Intl.NumberFormat("id-ID").format(totalPrice)}\nItem: ${items.length} produk`;

        // Log Activity with PT and User name
        const performerInfo = user.customer?.company
            ? `${user.customer.company} (${user.name || user.email})`
            : (user.name || user.email);
        await logActivity(quotation.id, "SQ_CREATED", "SQ Baru Dibuat", `User mengirimkan permintaan penawaran (SQ) nomor ${quotation.quotationNo}.`, performerInfo);

        // Notify Admins
        await notifyAdmins({
            title: "Permintaan Penawaran Baru",
            message: `Terdapat permintaan penawaran baru ${quotation.quotationNo} dari ${performerInfo}.`,
            type: "QUOTATION",
            link: `/admin/sales/quotations/${quotation.quotationNo.replace(/\//g, "-")}`
        });

        try {
            console.log("[saveQuotationToDb] Sending WA to sales...");
            await sendFonteeMessage(salesPhone, message);
            if (user.phone) {
                console.log("[saveQuotationToDb] Sending WA to customer...");
                await sendFonteeMessage(user.phone, `Quotation Anda telah diterima!\nNomor: ${quotation.quotationNo}\nTotal estimasi: Rp ${new Intl.NumberFormat("id-ID").format(totalPrice)}\nTim sales akan menghubungi Anda.`);
            }
        } catch (waError) {
            console.error("[saveQuotationToDb] Failed to send WhatsApp notification:", waError);
            // Don't fail the whole operation if WA fails
        }

        return { success: true, quotationId: quotation.id, quotationNo: quotation.quotationNo };
    } catch (error) {
        console.error("[saveQuotationToDb] CRITICAL ERROR:", error);
        return { success: false, error: error instanceof Error ? error.message : "Gagal menyimpan quotation" };
    }
}

// Simple WhatsApp message sender using Fontee
async function sendFonteeMessage(phone: string, message: string) {
    const token = process.env.FONTEE_TOKEN;
    if (!token) {
        console.warn("FONTEE_TOKEN not configured for WhatsApp");
        return;
    }

    // Clean phone number
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    }

    try {
        const formData = new FormData();
        formData.append('target', cleanPhone);
        formData.append('message', message);
        formData.append('countryCode', '62');

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
            body: formData,
        });

        const data = await response.json();
        console.log("[Fontee RFQ] Response:", data);
    } catch (error) {
        console.error("[Fontee RFQ] Send error:", error);
    }
}

