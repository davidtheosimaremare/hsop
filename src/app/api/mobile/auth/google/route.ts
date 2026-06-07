import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { validateApiKey, createMobileToken, mobileResponse } from "@/lib/mobile-api-auth";
import { OAuth2Client } from "google-auth-library";
import { hash } from "bcryptjs";

const googleClient = new OAuth2Client();

export async function OPTIONS(request: NextRequest) {
    return validateApiKey(request) ?? mobileResponse({}, 204);
}

export async function POST(request: NextRequest) {
    const apiKeyError = validateApiKey(request);
    if (apiKeyError) return apiKeyError;

    try {
        const body = await request.json();
        const { idToken } = body;

        if (!idToken) {
            return mobileResponse({ success: false, error: "idToken wajib diisi." }, 400);
        }

        const ticket = await googleClient.verifyIdToken({
            idToken: idToken,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });

        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return mobileResponse({ success: false, error: "Data Google tidak lengkap." }, 400);
        }

        const { email, name } = payload;

        let user = await db.user.findUnique({
            where: { email },
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
            // Create new incomplete user
            const randomPassword = await hash(Math.random().toString(36), 12);
            user = await db.user.create({
                data: {
                    email,
                    name: name || "",
                    password: randomPassword,
                    role: "CUSTOMER",
                    isActive: true,
                    isVerified: true, // Google emails are already verified
                },
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
        } else if (!user.isActive) {
            return mobileResponse({ success: false, error: "Akun ini dinonaktifkan." }, 401);
        }

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
                isVerified: user.isVerified,
                customerId: user.customerId,
                customer: user.customer,
            },
        });
    } catch (err: any) {
        console.error("[MOBILE] Google Login error:", err);
        return mobileResponse({ success: false, error: "Server error atau token tidak valid." }, 500);
    }
}
