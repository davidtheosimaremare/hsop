"use server";

import { db } from "@/lib/db";
import { hash } from "bcryptjs";
import { v4 as uuidv4 } from "uuid";
import { sendFonteeOTP } from "@/lib/fontee";
import { sendEmailOTP } from "@/lib/mail";

export type RegisterState = {
    error?: string;
    success?: boolean;
    message?: string;
    verifyRedirect?: string;
};

export async function registerUser(prevState: RegisterState, formData: FormData): Promise<RegisterState> {
    try {
        const name = formData.get("name") as string;
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const phone = formData.get("phone") as string;

        const isCompany = formData.get("isCompany") === "true";
        const companyName = formData.get("companyName") as string;
        const businessType = formData.get("businessType") as string;
        const address = formData.get("address") as string;

        // Basic validation
        if (!name || !email || !password || !phone) {
            return { error: "Mohon lengkapi semua field wajib." };
        }

        // Check if user already exists
        const existingUser = await db.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            if (existingUser.isVerified) {
                return { error: "Email sudah terdaftar." };
            }

            // Resume registration for unverified user
            console.log(`[Register] Unverified user found: ${email}. Resending OTP.`);

            const otp = Math.floor(100000 + Math.random() * 900000).toString();
            const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

            // Update user details (in case they changed) and new OTP
            await db.user.update({
                where: { id: existingUser.id },
                data: {
                    name: name,
                    phone: phone,
                    otp: otp,
                    otpExpiresAt: otpExpiresAt,
                    // We don't update password for security/simplicity in this flow, 
                    // or maybe we should? For now, let's assume they know their password 
                    // or we can allow resetting it here since they are proving ownership via OTP.
                    // Let's update password too to prevent "forgot password" during unverified state.
                    password: await hash(password, 12)
                }
            });

            // Send OTP via WhatsApp and Email in parallel
            console.log(`[Register] Attempting to send OTP to ${phone} and ${email}`);

            const [waSent, emailSent] = await Promise.all([
                sendFonteeOTP(phone, otp),
                sendEmailOTP(email, otp)
            ]);

            if (waSent || emailSent) {
                return { success: true, verifyRedirect: `/verifikasi?email=${encodeURIComponent(email)}` };
            } else {
                return { success: true, verifyRedirect: `/verifikasi?email=${encodeURIComponent(email)}&error=send_failed` };
            }
        }

        const hashedPassword = await hash(password, 12);
        const customerId = uuidv4();

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Determine Customer Data
        const customerName = isCompany ? companyName : name;
        const customerType = isCompany ? "BISNIS" : "PERORANGAN";
        const customerCompany = isCompany ? companyName : null;
        const customerBusinessCategory = isCompany ? businessType : null;

        // Check if customer exists
        let existingCustomer = await db.customer.findUnique({
            where: { email }
        });

        let targetCustomerId = existingCustomer ? existingCustomer.id : customerId;

        await db.$transaction(async (tx) => {
            // 1. Create Customer if not exists
            if (!existingCustomer) {
                await tx.customer.create({
                    data: {
                        id: targetCustomerId,
                        name: customerName,
                        email: email,
                        phone: phone,
                        address: address,
                        type: customerType,
                        company: customerCompany,
                        businessCategory: customerBusinessCategory,
                    },
                });
            } else {
                // Optional: Update customer data if needed, but for now let's respect existing data
                // console.log("Linking to existing customer:", existingCustomer.id);
            }

            // 2. Create User linked to Customer with OTP
            await tx.user.create({
                data: {
                    email,
                    password: hashedPassword,
                    name: name,
                    phone: phone,
                    role: "USER",
                    customer: {
                        connect: { id: targetCustomerId }
                    },
                    isActive: false, // Inactive until verified
                    isVerified: false,
                    otp: otp,
                    otpExpiresAt: otpExpiresAt
                },
            });
        });

        // Send OTP via WhatsApp and Email in parallel
        console.log(`[Register] Attempting to send OTP to ${phone} and ${email}`);

        const [waSent, emailSent] = await Promise.all([
            sendFonteeOTP(phone, otp),
            sendEmailOTP(email, otp)
        ]);

        console.log(`[Register] OTP Sent result - WA: ${waSent}, Email: ${emailSent}`);

        if (waSent || emailSent) {
            // Success if at least one method works
            let message = "Kode verifikasi dikirim ke ";
            if (waSent && emailSent) message += "WhatsApp dan Email Anda.";
            else if (waSent) message += "WhatsApp Anda.";
            else message += "Email Anda.";

            return {
                success: true,
                message: message,
                verifyRedirect: `/verifikasi?email=${encodeURIComponent(email)}`
            };
        } else {
            console.error("[Register] Failed to send OTP via both WA and Email.");
            // Still redirect to verification to allow retry
            return { success: true, verifyRedirect: `/verifikasi?email=${encodeURIComponent(email)}&error=send_failed` };
        }

    } catch (error) {
        console.error("[Register] Fatal Error:", error);
        return { error: "Terjadi kesalahan saat registrasi. Cek console log." };
    }
}
