import nodemailer from 'nodemailer';
import { db } from "@/lib/db";

async function getEmailWrapper(content: string, title: string = "Hokiindo Shop") {
    let settings: any = null;
    try {
        const result = await db.siteSetting.findUnique({ where: { key: "email_template" } });
        settings = result?.value;
    } catch (e) {
        console.error("Failed to fetch email template settings:", e);
    }

    // Fallbacks
    const headerBg = settings?.headerBgColor || "#dc2626";
    const headerText = settings?.headerTextColor || "#ffffff";
    const footerBg = settings?.footerBgColor || "#f9fafb";
    const footerText = settings?.footerTextColor || "#9ca3af";
    const footerContent = settings?.footerText || `&copy; ${new Date().getFullYear()} Hokiindo Shop. All rights reserved.`;
    const logoUrl = settings?.logoUrl;

    return `
    <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eef2f6; border-radius: 16px; overflow: hidden;">
        <div style="background-color: ${headerBg}; padding: 32px 20px; text-align: center;">
            ${logoUrl ? `<img src="${logoUrl}" alt="Logo" style="max-height: 48px; margin-bottom: 12px; display: block; margin-left: auto; margin-right: auto;">` : ''}
            <h1 style="color: ${headerText}; margin: 0; font-size: 24px; font-weight: 800; letter-spacing: -0.025em;">${title}</h1>
        </div>
        <div style="padding: 40px 32px; background-color: #ffffff;">
            ${content}
        </div>
        <div style="background-color: ${footerBg}; padding: 24px; text-align: center; border-top: 1px solid #f1f5f9;">
            <p style="margin: 0; font-size: 12px; color: ${footerText}; font-weight: 500;">
                ${footerContent}
            </p>
            <div style="margin-top: 16px; font-size: 11px; color: #94a3b8;">
                Email ini dikirim secara otomatis oleh sistem Hokiindo. Mohon tidak membalas email ini.
            </div>
        </div>
    </div>
    `;
}

export async function sendEmailOTP(email: string, otp: string) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || '"Hokiindo Auth" <no-reply@hokiindo.co.id>';

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn("SMTP config is missing. Email OTP will not be sent.");
        return false;
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465, // true for 465, false for other ports
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    const body = `
        <p style="color: #334155; font-size: 16px; margin-top: 0;">Halo,</p>
        <p style="color: #334155; font-size: 16px; line-height: 1.6;">Terima kasih telah mendaftar. Gunakan kode berikut untuk memverifikasi akun Anda:</p>
        
        <div style="text-align: center; margin: 40px 0;">
            <div style="display: inline-block; background-color: #f8fafc; padding: 20px 40px; font-size: 32px; font-weight: 800; letter-spacing: 8px; border-radius: 12px; color: #0f172a; border: 2px solid #e2e8f0; font-family: monospace;">
                ${otp}
            </div>
        </div>
        
        <p style="color: #64748b; font-size: 14px; text-align: center;">Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.</p>
    `;

    const htmlContent = await getEmailWrapper(body, "Verifikasi Akun");

    try {
        console.log(`[Mail] Sending OTP to ${email}`);
        await transporter.sendMail({
            from: smtpFrom,
            to: email,
            subject: `Kode Verifikasi: ${otp}`,
            text: `Kode OTP Anda adalah: ${otp}`,
            html: htmlContent,
        });
        console.log(`[Mail] OTP Sent to ${email}`);
        return true;
    } catch (error) {
        console.error("[Mail] Failed to send email:", error);
        return false;
    }
}

interface CartItemForEmail {
    sku: string;
    name: string;
    brand: string;
    price: number;
    quantity: number;
    readyStock?: number;
    indent?: number;
}

export async function sendCartQuotation(
    customerEmail: string,
    customerPhone: string,
    cartItems: CartItemForEmail[],
    totalPrice: number,
    quotationNo?: string
) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || '"Hokiindo Shop" <no-reply@hokiindo.co.id>';

    // Get notification email from SiteSetting, fallback to default
    let salesEmail = 'modibiid@gmail.com';
    try {
        const setting = await db.siteSetting.findUnique({ where: { key: 'notification_email' } });
        if (setting?.value) {
            const val = typeof setting.value === 'string' ? setting.value : (setting.value as any).email;
            if (val && val.includes('@')) salesEmail = val;
        }
    } catch (e) {
        console.warn("[Mail] Could not fetch notification email setting, using default:", salesEmail);
    }


    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn("SMTP config is missing. Cart email will not be sent.");
        return { success: false, error: "SMTP not configured" };
    }

    const transporter = require('nodemailer').createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: {
            user: smtpUser,
            pass: smtpPass,
        },
    });

    const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(Math.round(price));

    const itemsHtml = cartItems.map(item => {
        let stockInfo = '';
        if (item.readyStock && item.readyStock > 0) {
            stockInfo += `<div style="font-size: 11px; color: #16a34a;">• ${item.readyStock} unit (Ready Stock)</div>`;
        }
        if (item.indent && item.indent > 0) {
            stockInfo += `<div style="font-size: 11px; color: #d97706;">• ${item.indent} unit (Indent)</div>`;
        }
        // Fallback or explicit 0 check if needed, but usually we just show what's there.
        // If neither is set but quantity exists (legacy or simple case), we show nothing special or maybe just quantity.

        return `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.sku}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                <div>${item.brand} - ${item.name}</div>
                ${stockInfo ? `<div style="margin-top: 4px;">${stockInfo}</div>` : ''}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; vertical-align: top;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right; vertical-align: top;">Rp ${formatPrice(item.price)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right; vertical-align: top;">Rp ${formatPrice(item.price * item.quantity)}</td>
        </tr>
    `}).join('');

    const body = `
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 24px; font-weight: 700;">Informasi Pelanggan</h2>
        <div style="background-color: #f8fafc; padding: 16px; border-radius: 12px; border: 1px solid #f1f5f9; margin-bottom: 32px;">
            <p style="color: #475569; font-size: 14px; margin: 4px 0;"><strong>Email:</strong> ${customerEmail}</p>
            <p style="color: #475569; font-size: 14px; margin: 4px 0;"><strong>No. HP:</strong> ${customerPhone}</p>
        </div>
        
        <h2 style="color: #0f172a; font-size: 18px; margin-bottom: 16px; font-weight: 700;">Detail Produk</h2>
        <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
            <thead>
                <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #64748b;">SKU</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #64748b;">Produk</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0; color: #64748b;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0; color: #64748b;">Harga</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0; color: #64748b;">Subtotal</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
            <tfoot>
                <tr style="background-color: #fdf2f2;">
                    <td colspan="4" style="padding: 16px; text-align: right; font-weight: 700; color: #0f172a;">Total Estimasi:</td>
                    <td style="padding: 16px; text-align: right; font-weight: 800; color: #dc2626; font-size: 15px;">Rp ${formatPrice(totalPrice)}</td>
                </tr>
            </tfoot>
        </table>
        
        <div style="margin-top: 32px; padding: 16px; background-color: #fffbeb; border: 1px solid #fef3c7; border-radius: 12px; color: #92400e; font-size: 13px;">
            <strong>⚠️ Catatan:</strong> Harga belum termasuk ongkos kirim. Tim sales kami akan menghubungi Anda secepatnya untuk konfirmasi stok dan pengiriman.
        </div>
    `;

    const htmlTitle = quotationNo ? `Permintaan Penawaran - ${quotationNo}` : "Permintaan Penawaran Harga";
    const htmlContent = await getEmailWrapper(body, htmlTitle);

    try {
        console.log(`[Mail] Sending cart quotation to ${salesEmail} and ${customerEmail}`);

        // Send to sales
        await transporter.sendMail({
            from: smtpFrom,
            to: salesEmail,
            subject: `Permintaan Penawaran (${quotationNo || 'Baru'})`,
            html: htmlContent,
        });

        // Send copy to customer
        await transporter.sendMail({
            from: smtpFrom,
            to: customerEmail,
            subject: `Permintaan Penawaran (${quotationNo || 'Baru'})`,
            html: htmlContent,
        });

        console.log(`[Mail] Cart quotation sent successfully`);
        return { success: true };
    } catch (error) {
        console.error("[Mail] Failed to send cart quotation:", error);
        return { success: false, error: "Failed to send email" };
    }
}

// ── Send Offer Notification Email to Customer ──
interface OfferItem {
    productSku: string;
    productName: string;
    brand: string;
    quantity: number;
    price: number;
    isAvailable: boolean | null;
    adminNote: string | null;
}

interface OfferData {
    quotationNo: string;
    email: string;
    totalAmount: number;
    specialDiscount: number | null;
    adminNotes: string | null;
    items: OfferItem[];
}

export async function sendOfferNotification(data: OfferData) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || '587');
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || '"Hokiindo Shop" <no-reply@hokiindo.co.id>';

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn("[Mail] SMTP config missing. Offer email not sent.");
        return { success: false, error: "SMTP not configured" };
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });

    const formatPrice = (price: number) => new Intl.NumberFormat("id-ID").format(Math.round(price));

    const discountPercent = data.specialDiscount || 0;
    const discountAmount = data.totalAmount * (discountPercent / 100);
    const finalTotal = data.totalAmount - discountAmount;

    const itemsHtml = data.items.map((item, idx) => {
        const statusIcon = item.isAvailable === true ? '✅' : item.isAvailable === false ? '❌' : '⏳';
        const statusText = item.isAvailable === true ? 'Tersedia' : item.isAvailable === false ? 'Tidak Tersedia' : 'Menunggu';
        const statusColor = item.isAvailable === true ? '#16a34a' : item.isAvailable === false ? '#dc2626' : '#9ca3af';
        const noteHtml = item.adminNote ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px; font-style: italic;">📝 ${item.adminNote}</div>` : '';

        return `
        <tr style="background-color: ${idx % 2 === 0 ? '#ffffff' : '#f9fafb'};">
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">${item.productSku}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0;">
                <div>${item.brand} - ${item.productName}</div>
                ${noteHtml}
            </td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center;">${item.quantity}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: right;">Rp ${formatPrice(item.price)}</td>
            <td style="padding: 10px; border-bottom: 1px solid #e0e0e0; text-align: center; color: ${statusColor}; font-size: 12px;">
                ${statusIcon} ${statusText}
            </td>
        </tr>`;
    }).join('');

    const discountHtml = discountPercent > 0 ? `
        <tr>
            <td colspan="3"></td>
            <td style="padding: 8px 10px; text-align: right; font-size: 13px;">Subtotal:</td>
            <td style="padding: 8px 10px; text-align: right; font-size: 13px;">Rp ${formatPrice(data.totalAmount)}</td>
        </tr>
        <tr>
            <td colspan="3"></td>
            <td style="padding: 8px 10px; text-align: right; font-size: 13px; color: #dc2626;">Diskon Spesial (${discountPercent}%):</td>
            <td style="padding: 8px 10px; text-align: right; font-size: 13px; color: #dc2626;">- Rp ${formatPrice(discountAmount)}</td>
        </tr>
    ` : '';

    const adminNotesHtml = data.adminNotes ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
            <p style="font-size: 13px; color: #1e40af; margin: 0;"><strong>💬 Catatan dari Tim Sales:</strong></p>
            <p style="font-size: 13px; color: #1e40af; margin: 8px 0 0 0;">${data.adminNotes}</p>
        </div>
    ` : '';

    const body = `
        <p style="color: #334155; font-size: 15px; margin-top: 0;">Yth. Pelanggan,</p>
        <p style="color: #334155; font-size: 15px; line-height: 1.6;">Terima kasih atas permintaan penawaran harga Anda. Berikut adalah penawaran resmi dari kami:</p>

        <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 24px;">
            <thead>
                <tr style="background-color: #f8fafc;">
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #64748b;">SKU</th>
                    <th style="padding: 12px; text-align: left; border-bottom: 2px solid #e2e8f0; color: #64748b;">Produk</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0; color: #64748b;">Qty</th>
                    <th style="padding: 12px; text-align: right; border-bottom: 2px solid #e2e8f0; color: #64748b;">Harga</th>
                    <th style="padding: 12px; text-align: center; border-bottom: 2px solid #e2e8f0; color: #64748b;">Status</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
            <tfoot>
                ${discountHtml}
                <tr style="background-color: #fef2f2;">
                    <td colspan="3" style="padding: 16px; text-align: right; font-weight: 700; color: #0f172a;">Total:</td>
                    <td colspan="2" style="padding: 16px; text-align: right; font-weight: 800; color: #dc2626; font-size: 18px;">Rp ${formatPrice(finalTotal)}</td>
                </tr>
            </tfoot>
        </table>

        ${adminNotesHtml}

        <div style="margin-top: 32px; padding: 16px; background-color: #f0fdf4; border: 1px solid #dcfce7; border-radius: 12px; color: #166534; font-size: 13px; text-align: center;">
            ✅ Penawaran ini berlaku selama 7 hari kerja. Silakan masuk ke dashboard untuk konfirmasi pesanan.
        </div>
    `;

    const htmlContent = await getEmailWrapper(body, `Penawaran Harga - ${data.quotationNo}`);

    try {
        console.log(`[Mail] Sending offer notification to ${data.email} for ${data.quotationNo}`);
        await transporter.sendMail({
            from: smtpFrom,
            to: data.email,
            subject: `Penawaran Harga ${data.quotationNo} - Hokiindo Shop`,
            html: htmlContent,
        });
        console.log(`[Mail] Offer notification sent to ${data.email}`);
        return { success: true };
    } catch (error) {
        console.error("[Mail] Failed to send offer notification:", error);
        return { success: false, error: "Failed to send email" };
    }
}

// ── Send Order Status Notification Email ──
interface OrderStatusData {
    quotationNo: string;
    email: string;
    status: "CONFIRMED" | "SHIPPED" | "COMPLETED";
    trackingNumber?: string | null;
    shippingNotes?: string | null;
    shippingCost?: number | null;
    freeShipping?: boolean;
}

const STATUS_EMAIL_CONFIG: Record<string, { subject: string; title: string; icon: string; color: string; message: string }> = {
    CONFIRMED: {
        subject: "Pesanan Dikonfirmasi",
        title: "Pesanan Anda Dikonfirmasi! ✅",
        icon: "✅",
        color: "#16a34a",
        message: "Pesanan Anda telah kami konfirmasi dan sedang disiapkan. Kami akan segera mengirimkan barang Anda."
    },
    SHIPPED: {
        subject: "Pesanan Dikirim",
        title: "Pesanan Sedang Dikirim! 🚚",
        icon: "🚚",
        color: "#0ea5e9",
        message: "Barang pesanan Anda sudah diserahkan ke kurir pengiriman."
    },
    COMPLETED: {
        subject: "Pesanan Selesai",
        title: "Pesanan Selesai! 🎉",
        icon: "🎉",
        color: "#22c55e",
        message: "Terima kasih telah berbelanja di Hokiindo Shop. Semoga Anda puas dengan layanan kami."
    },
};

export async function sendOrderStatusNotification(data: OrderStatusData) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || '"Hokiindo Shop" <no-reply@hokiindo.com>';

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn("[Mail] SMTP credentials missing, skipping email.");
        return { success: false, error: "SMTP config missing" };
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });

    const config = STATUS_EMAIL_CONFIG[data.status];
    if (!config) return { success: false, error: "Unknown status" };

    const formatPrice = (p: number) => new Intl.NumberFormat("id-ID").format(Math.round(p));

    const trackingHtml = data.status === "SHIPPED" && data.trackingNumber ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #eff6ff; border: 1px solid #bfdbfe; border-radius: 8px;">
            <p style="font-size: 13px; color: #1e40af; margin: 0;"><strong>📦 Nomor Resi:</strong></p>
            <p style="font-size: 18px; font-weight: bold; color: #1e40af; margin: 8px 0 0 0; letter-spacing: 1px;">${data.trackingNumber}</p>
            ${data.shippingNotes ? `<p style="font-size: 12px; color: #3b82f6; margin: 8px 0 0 0;">${data.shippingNotes}</p>` : ''}
        </div>
    ` : '';

    const shippingCostHtml = data.status === "CONFIRMED" ? `
        <div style="margin-top: 20px; padding: 15px; background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px;">
            <p style="font-size: 13px; color: #15803d; margin: 0;"><strong>🚚 Biaya Pengiriman:</strong></p>
            ${data.freeShipping
            ? `<p style="font-size: 16px; font-weight: bold; color: #15803d; margin: 5px 0 0 0;">GRATIS (Ditanggung Toko)</p>`
            : `<p style="font-size: 16px; font-weight: bold; color: #15803d; margin: 5px 0 0 0;">Rp ${formatPrice(data.shippingCost || 0)}</p>`
        }
        </div>
    ` : '';

    const body = `
        <div style="text-align: center; margin-bottom: 32px;">
            <div style="font-size: 56px; margin-bottom: 16px;">${config.icon}</div>
            <h2 style="color: #0f172a; margin: 0; font-size: 24px; font-weight: 800;">${config.title}</h2>
        </div>

        <p style="color: #334155; font-size: 15px; text-align: center; line-height: 1.6;">${config.message}</p>

        <div style="margin-top: 32px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; text-align: center;">
            <p style="font-size: 12px; color: #64748b; margin: 0; text-transform: uppercase; font-weight: 700; letter-spacing: 0.05em;">Nomor Pesanan</p>
            <p style="font-size: 20px; font-weight: 800; color: #0f172a; margin: 8px 0 0 0;">${data.quotationNo}</p>
        </div>

        ${trackingHtml}
        ${shippingCostHtml}

        <p style="color: #64748b; font-size: 13px; margin-top: 32px; text-align: center; font-style: italic;">
            Jika Anda memiliki pertanyaan mengenai pesanan ini, silakan hubungi tim dukungan kami melalui dashboard atau WhatsApp.
        </p>
    `;

    const htmlContent = await getEmailWrapper(body, config.subject);

    try {
        console.log(`[Mail] Sending ${data.status} notification to ${data.email}`);
        await transporter.sendMail({
            from: smtpFrom,
            to: data.email,
            subject: `${config.subject} - ${data.quotationNo} | Hokiindo Shop`,
            html: htmlContent,
        });
        console.log(`[Mail] ${data.status} notification sent to ${data.email}`);
        return { success: true };
    } catch (error) {
        console.error(`[Mail] Failed to send ${data.status} notification:`, error);
        return { success: false, error: "Failed to send email" };
    }
}

// ── Send Upgrade Request Notification to Admin ──
interface UpgradeRequestNotificationData {
    userName: string;
    userEmail: string;
    phone: string;
    ktpName: string;
    ktpUrl: string;
    npwpUrl?: string;
}

export async function sendUpgradeRequestNotification(data: UpgradeRequestNotificationData) {
    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = parseInt(process.env.SMTP_PORT || "587");
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASSWORD;
    const smtpFrom = process.env.SMTP_FROM || '"Hokiindo Shop" <no-reply@hokiindo.co.id>';

    // Get notification email from SiteSetting, fallback to default
    let adminEmail = 'modibiid@gmail.com';
    try {
        const setting = await db.siteSetting.findUnique({ where: { key: 'notification_email' } });
        if (setting?.value) {
            const val = typeof setting.value === 'string' ? setting.value : (setting.value as any).email;
            if (val && val.includes('@')) adminEmail = val;
        }
    } catch (e) {
        console.warn("[Mail] Could not fetch notification email setting, using default:", adminEmail);
    }

    if (!smtpHost || !smtpUser || !smtpPass) {
        console.warn("[Mail] SMTP config missing. Upgrade notification not sent.");
        return { success: false, error: "SMTP not configured" };
    }

    const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth: { user: smtpUser, pass: smtpPass },
    });

    const body = `
        <p style="color: #334155; font-size: 15px; margin-top: 0;">Halo Admin,</p>
        <p style="color: #334155; font-size: 15px;">Terdapat permintaan baru untuk upgrade akun menjadi <strong>Reseller</strong>.</p>

        <div style="margin-top: 24px; padding: 20px; background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px;">
            <p style="margin: 8px 0; font-size: 14px; color: #475569;"><strong>Nama User:</strong> ${data.userName}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #475569;"><strong>Email:</strong> ${data.userEmail}</p>
            <p style="margin: 8px 0; font-size: 14px; color: #475569;"><strong>No. HP:</strong> ${data.phone}</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 16px 0;">
            <p style="margin: 8px 0; font-size: 14px; color: #475569;"><strong>Nama Sesuai KTP:</strong> ${data.ktpName}</p>
        </div>

        <div style="margin-top: 24px;">
            <p style="margin-bottom: 12px; font-size: 14px; font-weight: 700; color: #0f172a;">Dokumen Terlampir:</p>
            <div style="margin-bottom: 8px;">
                <a href="${data.ktpUrl}" style="display: inline-block; color: #dc2626; text-decoration: none; font-size: 14px; font-weight: 600;">📄 Lihat Foto KTP &rarr;</a>
            </div>
            ${data.npwpUrl ? `
            <div>
                <a href="${data.npwpUrl}" style="display: inline-block; color: #dc2626; text-decoration: none; font-size: 14px; font-weight: 600;">📄 Lihat Foto NPWP &rarr;</a>
            </div>` : ''}
        </div>
        
        <div style="margin-top: 40px; text-align: center;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/upgrades" 
               style="display: inline-block; background-color: #dc2626; color: #ffffff; padding: 14px 28px; text-decoration: none; border-radius: 12px; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">
               Proses Permintaan Sekarang
            </a>
        </div>
    `;

    const htmlContent = await getEmailWrapper(body, "Permintaan Upgrade Reseller");

    try {
        console.log(`[Mail] Sending upgrade notification to ${adminEmail}`);
        await transporter.sendMail({
            from: smtpFrom,
            to: adminEmail,
            subject: `[Upgrade Reseller] Permintaan Baru - ${data.userName}`,
            html: htmlContent,
        });
        return { success: true };
    } catch (error) {
        console.error(`[Mail] Failed to send upgrade notification:`, error);
        return { success: false, error: "Failed to send email" };
    }
}
