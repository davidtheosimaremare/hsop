import nodemailer from 'nodemailer';
import { db } from "@/lib/db";

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

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Hokiindo Shop</h1>
        </div>
        <div style="padding: 30px;">
            <p style="color: #333; font-size: 16px;">Halo,</p>
            <p style="color: #333; font-size: 16px;">Terima kasih telah mendaftar. Gunakan kode berikut untuk memverifikasi akun Anda:</p>
            
            <div style="text-align: center; margin: 30px 0;">
                <span style="background-color: #f3f4f6; padding: 15px 30px; font-size: 24px; font-weight: bold; letter-spacing: 5px; border-radius: 8px; color: #1f2937; border: 1px solid #d1d5db;">
                    ${otp}
                </span>
            </div>
            
            <p style="color: #666; font-size: 14px;">Kode ini berlaku selama 10 menit. Jangan berikan kode ini kepada siapapun.</p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Hokiindo Shop. All rights reserved.
        </div>
    </div>
    `;

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
    totalPrice: number
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

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Permintaan Penawaran Harga</h1>
        </div>
        <div style="padding: 30px;">
            <h2 style="color: #333; font-size: 18px; margin-bottom: 20px;">Informasi Pelanggan</h2>
            <p style="color: #333; font-size: 14px; margin: 5px 0;"><strong>Email:</strong> ${customerEmail}</p>
            <p style="color: #333; font-size: 14px; margin: 5px 0;"><strong>No. HP:</strong> ${customerPhone}</p>
            
            <h2 style="color: #333; font-size: 18px; margin: 30px 0 20px;">Detail Produk</h2>
            <table style="width: 100%; border-collapse: collapse; font-size: 13px;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">SKU</th>
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">Produk</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e0e0e0;">Qty</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Harga</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Subtotal</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    <tr style="background-color: #f9fafb;">
                        <td colspan="4" style="padding: 15px; text-align: right; font-weight: bold;">Total Estimasi:</td>
                        <td style="padding: 15px; text-align: right; font-weight: bold; color: #dc2626;">Rp ${formatPrice(totalPrice)}</td>
                    </tr>
                </tfoot>
            </table>
            
            <p style="color: #666; font-size: 12px; margin-top: 30px; padding: 15px; background-color: #fef3c7; border-radius: 8px;">
                <strong>⚠️ Catatan:</strong> Harga belum termasuk ongkos kirim. Tim sales kami akan menghubungi Anda secepatnya.
            </p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Hokiindo Shop. All rights reserved.
        </div>
    </div>
    `;

    try {
        console.log(`[Mail] Sending cart quotation to ${salesEmail} and ${customerEmail}`);

        // Send to sales
        await transporter.sendMail({
            from: smtpFrom,
            to: salesEmail,
            subject: `[RFQ] Permintaan Penawaran dari ${customerEmail}`,
            html: htmlContent,
        });

        // Send copy to customer
        await transporter.sendMail({
            from: smtpFrom,
            to: customerEmail,
            subject: `Permintaan Penawaran Anda - Hokiindo Shop`,
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

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Penawaran Harga - ${data.quotationNo}</h1>
        </div>
        <div style="padding: 30px;">
            <p style="color: #333; font-size: 15px;">Yth. Pelanggan,</p>
            <p style="color: #333; font-size: 14px;">Terima kasih atas permintaan penawaran harga Anda. Berikut adalah penawaran kami:</p>

            <table style="width: 100%; border-collapse: collapse; font-size: 13px; margin-top: 20px;">
                <thead>
                    <tr style="background-color: #f3f4f6;">
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">SKU</th>
                        <th style="padding: 10px; text-align: left; border-bottom: 2px solid #e0e0e0;">Produk</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e0e0e0;">Qty</th>
                        <th style="padding: 10px; text-align: right; border-bottom: 2px solid #e0e0e0;">Harga</th>
                        <th style="padding: 10px; text-align: center; border-bottom: 2px solid #e0e0e0;">Status</th>
                    </tr>
                </thead>
                <tbody>
                    ${itemsHtml}
                </tbody>
                <tfoot>
                    ${discountHtml}
                    <tr style="background-color: #fef2f2;">
                        <td colspan="3" style="padding: 15px; text-align: right; font-weight: bold;">Total:</td>
                        <td colspan="2" style="padding: 15px; text-align: right; font-weight: bold; color: #dc2626; font-size: 16px;">Rp ${formatPrice(finalTotal)}</td>
                    </tr>
                </tfoot>
            </table>

            ${adminNotesHtml}

            <p style="color: #666; font-size: 12px; margin-top: 25px; padding: 15px; background-color: #f0fdf4; border-radius: 8px;">
                ✅ Penawaran ini berlaku selama 7 hari kerja. Hubungi tim sales kami untuk konfirmasi pesanan.
            </p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Hokiindo Shop. All rights reserved.
        </div>
    </div>
    `;

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

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: ${config.color}; padding: 30px; text-align: center;">
            <div style="font-size: 48px; margin-bottom: 10px;">${config.icon}</div>
            <h1 style="color: white; margin: 0; font-size: 22px;">${config.title}</h1>
        </div>
        <div style="padding: 30px;">
            <p style="color: #333; font-size: 15px;">Yth. Pelanggan,</p>
            <p style="color: #333; font-size: 14px;">${config.message}</p>

            <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <p style="font-size: 13px; color: #6b7280; margin: 0;">No. Quotation</p>
                <p style="font-size: 16px; font-weight: bold; color: #111827; margin: 4px 0 0 0;">${data.quotationNo}</p>
            </div>

            ${trackingHtml}
            ${shippingCostHtml}

            <p style="color: #666; font-size: 12px; margin-top: 25px; padding: 15px; background-color: #f0fdf4; border-radius: 8px;">
                Jika ada pertanyaan, hubungi tim sales kami.
            </p>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            &copy; ${new Date().getFullYear()} Hokiindo Shop. All rights reserved.
        </div>
    </div>
    `;

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

    const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #e0e0e0; border-radius: 8px; overflow: hidden;">
        <div style="background-color: #dc2626; padding: 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 22px;">Permintaan Upgrade Reseller</h1>
        </div>
        <div style="padding: 30px;">
            <p style="color: #333; font-size: 15px;">Halo Admin,</p>
            <p style="color: #333; font-size: 14px;">Ada permintaan upgrade akun baru menjadi Reseller.</p>

            <div style="margin-top: 20px; padding: 15px; background-color: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px;">
                <p style="margin: 5px 0;"><strong>Nama User:</strong> ${data.userName}</p>
                <p style="margin: 5px 0;"><strong>Email:</strong> ${data.userEmail}</p>
                <p style="margin: 5px 0;"><strong>No. HP:</strong> ${data.phone}</p>
                <hr style="border: 0; border-top: 1px solid #e5e7eb; margin: 10px 0;">
                <p style="margin: 5px 0;"><strong>Nama Sesuai KTP:</strong> ${data.ktpName}</p>
            </div>

            <div style="margin-top: 20px;">
                <p style="margin-bottom: 10px;"><strong>Dokumen:</strong></p>
                <p><a href="${data.ktpUrl}" style="color: #dc2626; text-decoration: none;">📄 Lihat Foto KTP</a></p>
                ${data.npwpUrl ? `<p><a href="${data.npwpUrl}" style="color: #dc2626; text-decoration: none;">📄 Lihat Foto NPWP</a></p>` : ''}
            </div>
            
            <div style="margin-top: 30px; text-align: center;">
                <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/admin/upgrades" 
                   style="background-color: #dc2626; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">
                   Proses Permintaan di Dashboard
                </a>
            </div>
        </div>
        <div style="background-color: #f9fafb; padding: 15px; text-align: center; font-size: 12px; color: #9ca3af;">
            System Notification
        </div>
    </div>
    `;

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
