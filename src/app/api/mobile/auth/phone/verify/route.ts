import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, createMobileToken, mobileResponse } from "@/lib/mobile-api-auth";

export async function OPTIONS(request: NextRequest) {
    return validateApiKey(request) ?? mobileResponse({}, 204);
}

export async function POST(request: NextRequest) {
    const apiKeyError = validateApiKey(request);
    if (apiKeyError) return apiKeyError;

    try {
        const body = await request.json();
        let { phone, otp } = body;

        if (!phone || !otp) {
            return mobileResponse({ success: false, error: "Nomor HP dan OTP wajib diisi." }, 400);
        }

        phone = phone.replace(/[^0-9]/g, "");
        if (phone.startsWith("0")) phone = "62" + phone.substring(1);
        if (!phone.startsWith("62")) phone = "62" + phone;

        const user = await db.user.findFirst({
            where: { phone },
            include: {
                customer: {
                    select: {
                        id: true,
                        name: true,
                        company: true,
                        phone: true,
                        type: true,
                        discountCP: true,
                        discountLP: true,
                        discountLighting: true,
                    },
                },
            },
        });

        if (!user) {
            return mobileResponse({ success: false, error: "Nomor HP tidak terdaftar." }, 404);
        }

        if (user.otp !== otp) {
            return mobileResponse({ success: false, error: "Kode OTP salah." }, 400);
        }

        if (user.otpExpiresAt && new Date() > user.otpExpiresAt) {
            return mobileResponse({ success: false, error: "Kode OTP sudah kedaluwarsa. Silakan request ulang." }, 400);
        }

        // OTP is valid. Clear OTP and set isVerified = true.
        await db.user.update({
            where: { id: user.id },
            data: {
                otp: null,
                otpExpiresAt: null,
                isVerified: true,
            }
        });

        const token = await createMobileToken({
            userId: user.id,
            email: user.email,
            role: user.role,
            customerId: user.customerId,
        });

        return mobileResponse({
            success: true,
            token,
            user: {
                id: user.id,
                name: user.name,
                email: user.email,
                phone: user.phone,
                role: user.role,
                isVerified: true,
                customerId: user.customerId,
                customer: user.customer,
            },
            needsOnboarding: (!user.customerId || !user.customer?.name || !user.customer?.phone)
        });

    } catch (error) {
        console.error("[MOBILE] Verify OTP error:", error);
        return mobileResponse({ success: false, error: "Terjadi kesalahan sistem saat memverifikasi." }, 500);
    }
}
