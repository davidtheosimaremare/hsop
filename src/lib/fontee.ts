export async function sendFonteeOTP(phone: string, otp: string) {
    const token = process.env.FONTEE_TOKEN;

    if (!token) {
        console.warn("FONTEE_TOKEN is not set. OTP will not be sent via WhatsApp.");
        return false;
    }

    // Ensure phone number has no special characters
    // Fontee handles country codes, but usually better to send just numbers or with 62
    let cleanPhone = phone.replace(/\D/g, '');
    if (cleanPhone.startsWith('0')) {
        cleanPhone = '62' + cleanPhone.substring(1);
    }

    const message = `*Kode Verifikasi Hokiindo*
    
Kode OTP Anda adalah: *${otp}*

Jangan berikan kode ini kepada siapa pun. Kode ini berlaku selama 10 menit.`;

    try {
        console.log(`[Fontee] Sending OTP to ${cleanPhone}`);

        const formData = new FormData();
        formData.append('target', cleanPhone);
        formData.append('message', message);
        formData.append('countryCode', '62'); // Default country code if not present

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                'Authorization': token,
            },
            body: formData,
        });

        const data = await response.json();
        console.log("[Fontee] Response:", data);

        // Fontee success response usually has status: true
        if (data.status) {
            return true;
        } else {
            console.error("[Fontee] Failed:", data.reason || data.detail);
            return false;
        }

    } catch (error) {
        console.error("[Fontee] Network Error:", error);
        return false;
    }
}
