export async function sendWhatsAppOTP(phone: string, otp: string) {
    const wahaUrl = process.env.WAHA_API_URL;
    const wahaSession = process.env.WAHA_SESSION || "default";

    if (!wahaUrl) {
        console.warn("WAHA_API_URL is not set. OTP will not be sent.");
        return false;
    }

    // Ensure phone number starts with country code and has no '+' or spaces
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    }

    // WAHA usually expects [phone]@c.us
    const chatId = `${cleanPhone}@c.us`;
    const message = `*Kode Verifikasi Hokiindo*
    
Kode OTP Anda adalah: *${otp}*

Jangan berikan kode ini kepada siapa pun. Kode ini berlaku selama 10 menit.`;

    try {
        console.log(`[WAHA] Sending OTP to ${chatId} via ${wahaUrl}`);

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
        };

        const wahaApiKey = process.env.WAHA_API_KEY;
        if (wahaApiKey) {
            headers['X-Api-Key'] = wahaApiKey;
        }

        const response = await fetch(`${wahaUrl}/api/sendText`, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({
                session: wahaSession,
                chatId: chatId,
                text: message,
            }),
        });

        if (!response.ok) {
            const error = await response.text();
            console.error("[WAHA] Error response:", response.status, error);
            return false;
        }

        const data = await response.json();
        console.log("[WAHA] Success:", data);
        return true;
    } catch (error) {
        console.error("[WAHA] Network/System Error:", error);
        return false;
    }
}
