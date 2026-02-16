"use server";

import { sendCartQuotation } from "@/lib/mail";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// Generate sequential SQ-XXXXX quotation number
async function generateQuotationNo(): Promise<string> {
    const latest = await db.salesQuotation.findFirst({
        where: { quotationNo: { startsWith: 'SQ-' } },
        orderBy: { createdAt: 'desc' },
        select: { quotationNo: true },
    });
    let nextNum = 1;
    if (latest?.quotationNo) {
        const num = parseInt(latest.quotationNo.replace('SQ-', ''), 10);
        if (!isNaN(num)) nextNum = num + 1;
    }
    return `SQ-${String(nextNum).padStart(5, '0')}`;
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
    quantity: number;
    readyStock?: number;
    indent?: number;
}

// For guest users - send via email AND save to database
export async function submitCartQuotation(
    email: string,
    phone: string,
    items: CartItem[],
    totalPrice: number
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
        // Generate SQ number
        const quotationNo = await generateQuotationNo();

        // Save to database (without userId for guest)
        const quotation = await db.salesQuotation.create({
            data: {
                quotationNo,
                email,
                phone,
                totalAmount: totalPrice,
                status: "PENDING",
                items: {
                    create: items.map(item => ({
                        productSku: item.sku,
                        productName: item.name,
                        brand: item.brand,
                        quantity: item.quantity,
                        price: item.price,
                    })),
                },
            },
        });
        console.log("[submitCartQuotation] Guest quotation saved:", quotation.quotationNo);

        // Send email notification
        try {
            await sendCartQuotation(email, phone, items, totalPrice);
        } catch (emailError) {
            console.error("[submitCartQuotation] Email failed:", emailError);
        }

        // Send WhatsApp notification via Fontee
        const { salesPhone } = await getNotifSettings();
        const message = `[RFQ Guest] Quotation baru dari ${email}\nNomor: ${quotation.quotationNo}\nTotal: Rp ${new Intl.NumberFormat("id-ID").format(totalPrice)}\nItem: ${items.length} produk\nHP: ${phone}`;
        try {
            await sendFonteeMessage(salesPhone, message);
        } catch (waError) {
            console.error("[submitCartQuotation] WA failed:", waError);
        }

        return { success: true, quotationNo: quotation.quotationNo };
    } catch (error) {
        console.error("[submitCartQuotation] Error:", error);
        // Fallback: at least try to send email
        const result = await sendCartQuotation(email, phone, items, totalPrice);
        return result;
    }
}

// For logged-in users - save to database and send notifications
export async function saveQuotationToDb(
    items: CartItem[],
    totalPrice: number
) {
    console.log("[saveQuotationToDb] Starting...");
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
            select: { id: true, email: true, name: true, phone: true }
        });

        if (!user) {
            console.error("[saveQuotationToDb] User not found in DB:", session.user.id);
            return { success: false, error: "User tidak ditemukan di database" };
        }
        console.log("[saveQuotationToDb] User found:", user.email);

        console.log("[saveQuotationToDb] Creating quotation...");
        const quotationNo = await generateQuotationNo();
        const quotation = await db.salesQuotation.create({
            data: {
                quotationNo,
                userId: user.id,
                email: user.email,
                phone: user.phone || "",
                totalAmount: totalPrice,
                status: "PENDING",
                items: {
                    create: items.map(item => ({
                        productSku: item.sku,
                        productName: item.name,
                        brand: item.brand,
                        quantity: item.quantity,
                        price: item.price,
                        // Note: readyStock and indent are not currently saved to DB item lines if the schema doesn't support it,
                        // but they will be passed to the email.
                    })),
                },
            },
        });
        console.log("[saveQuotationToDb] Quotation created:", quotation.id, quotation.quotationNo);

        // Send email notification to sales and customer
        try {
            console.log("[saveQuotationToDb] Sending email...");
            await sendCartQuotation(
                user.email,
                user.phone || "",
                items,
                totalPrice
            );
            console.log("[saveQuotationToDb] Email sent");
        } catch (emailError) {
            console.error("[saveQuotationToDb] Failed to send quotation email:", emailError);
            // Don't fail the whole operation if email fails
        }

        // Send WhatsApp notification via Fontee
        const { salesPhone } = await getNotifSettings();
        const message = `[RFQ] Quotation baru dari ${user.name || user.email}\nNomor: ${quotation.quotationNo}\nTotal: Rp ${new Intl.NumberFormat("id-ID").format(totalPrice)}\nItem: ${items.length} produk`;

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

