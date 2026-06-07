import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, mobileResponse } from "@/lib/mobile-api-auth";
import { sendOTP } from "@/lib/fontee";
import { hash } from "bcryptjs";

export async function OPTIONS(request: NextRequest) {
    return validateApiKey(request) ?? mobileResponse({}, 204);
}

export async function POST(request: NextRequest) {
    const apiKeyError = validateApiKey(request);
    if (apiKeyError) return apiKeyError;

    try {
        const body = await request.json();
        let { phone } = body;

        if (!phone) {
            return mobileResponse({ success: false, error: "Nomor HP wajib diisi." }, 400);
        }

        phone = phone.replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) phone = "62" + phone.substring(1);
        if (!phone.startsWith("62")) phone = "62" + phone;

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes

        let user = await db.user.findFirst({
            where: { phone }
        });

        if (!user) {
            // Create dummy user
            const randomPassword = await hash(Math.random().toString(36), 12);
            const dummyEmail = `phone_${phone}_${Date.now()}@hokiindo.local`;
            
            user = await db.user.create({
                data: {
                    email: dummyEmail,
                    phone: phone,
                    name: "",
                    password: randomPassword,
                    role: "CUSTOMER",
                    isActive: true,
                    isVerified: false,
                    otp,
                    otpExpiresAt,
                }
            });
        } else {
            if (!user.isActive) {
                return mobileResponse({ success: false, error: "Akun dinonaktifkan." }, 401);
            }
            await db.user.update({
                where: { id: user.id },
                data: { otp, otpExpiresAt }
            });
        }

        // Send OTP via WhatsApp
        const fonteeResponse = await sendOTP(phone, otp);
        if (!fonteeResponse.status) {
            return mobileResponse({ success: false, error: "Gagal mengirim pesan WhatsApp. Coba lagi." }, 500);
        }

        return mobileResponse({ 
            success: true, 
            message: "OTP berhasil dikirim ke WhatsApp Anda.",
            phone: phone
        });

    } catch (error) {
        console.error("[MOBILE] Request OTP error:", error);
        return mobileResponse({ success: false, error: "Terjadi kesalahan sistem saat memproses request." }, 500);
    }
}
