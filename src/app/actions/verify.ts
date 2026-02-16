"use server";

import { db } from "@/lib/db";
import { sendFonteeOTP } from "@/lib/fontee";
import { sendEmailOTP } from "@/lib/mail";

export async function verifyOTP(email: string, otp: string) {
    try {
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "User tidak ditemukan." };
        }

        if (user.isVerified) {
            return { success: true, message: "Akun sudah terverifikasi." };
        }

        if (!user.otp || !user.otpExpiresAt) {
            return { error: "Kode verifikasi tidak valid atau sudah kadaluarsa." };
        }

        if (user.otp !== otp) {
            return { error: "Kode verifikasi salah." };
        }

        if (new Date() > user.otpExpiresAt) {
            return { error: "Kode verifikasi sudah kadaluarsa. Silakan minta kode baru." };
        }

        // Verify User
        await db.user.update({
            where: { id: user.id },
            data: {
                isActive: true, // Only activate after verification
                isVerified: true,
                otp: null,
                otpExpiresAt: null,
            },
        });

        return { success: true, message: "Verifikasi berhasil!" };

    } catch (error) {
        console.error("Verification error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }
}

export async function resendOTP(email: string) {
    try {
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "User tidak ditemukan." };
        }

        if (user.isVerified) {
            return { error: "Akun sudah terverifikasi." };
        }

        // Generate new OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.user.update({
            where: { id: user.id },
            data: {
                otp,
                otpExpiresAt,
            },
        });

        const [waSent, emailSent] = await Promise.all([
            sendFonteeOTP(user.phone || '', otp),
            sendEmailOTP(user.email, otp)
        ]);

        if (waSent || emailSent) {
            let message = "Kode baru dikirim ke ";
            if (waSent && emailSent) message += "WhatsApp dan Email.";
            else if (waSent) message += "WhatsApp.";
            else message += "Email.";

            return { success: true, message: message };
        } else {
            return { error: "Gagal mengirim kode ke WhatsApp maupun Email." };
        }

    } catch (error) {
        console.error("Resend OTP error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }
}
