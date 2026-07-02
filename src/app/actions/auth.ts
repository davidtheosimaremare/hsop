"use server";

import { redirect } from "next/navigation";
import { encrypt } from "@/lib/auth";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";

function isRedirectError(error: any) {
    return error && typeof error === 'object' && (
        error.digest?.startsWith('NEXT_REDIRECT') ||
        error.message?.includes('NEXT_REDIRECT')
    );
}

export async function loginAction(prevState: any, formData: FormData) {
    noStore();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on";

    if (!email || !password) {
        return { error: "Email dan password wajib diisi." };
    }

    try {
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "Email atau password salah." };
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
            return { error: "Email atau password salah.", email };
        }

        // --- STRICT ROLE CHECK FOR CUSTOMER PORTAL ---
        if (user.role !== "CUSTOMER" && user.role !== "SALES") {
            return { error: "Akses ditolak. Silakan gunakan portal login yang sesuai (Admin/Vendor)." };
        }

        if (!user.isVerified && user.role !== "SALES") {
            return { 
                error: "Akun Anda belum diverifikasi.", 
                unverified: true, 
                email 
            };
        }

        if (!user.isActive) {
            return { error: "Akun Anda dinonaktifkan.", email };
        }

        const expires = new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000);
        
        const sessionData = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                customerId: user.customerId
            },
            expires
        };

        const session = await encrypt(sessionData);
        const cookieStore = await cookies();
        
        cookieStore.set("session", session, { 
            expires, 
            httpOnly: true, 
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return { success: true, redirectUrl: user.role === "SALES" ? "/pesanan-besar" : "/" };

    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Login error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }
}

export async function vendorLoginAction(prevState: any, formData: FormData) {
    noStore();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on";

    if (!email || !password) {
        return { error: "Email dan password wajib diisi." };
    }

    try {
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "Email atau password salah." };
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
            return { error: "Email atau password salah.", email };
        }

        // --- STRICT ROLE CHECK FOR VENDOR PORTAL ---
        // Only allow VENDOR
        if (user.role !== "VENDOR") {
            return { error: "Akses ditolak. Akun Anda bukan akun Vendor." };
        }

        if (!user.isVerified) {
            return { 
                error: "Akun Anda belum diverifikasi.", 
                unverified: true, 
                email 
            };
        }

        if (!user.isActive) {
            return { error: "Akun Anda dinonaktifkan.", email };
        }

        const expires = new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000);
        
        const sessionData = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                customerId: user.customerId
            },
            expires
        };

        const session = await encrypt(sessionData);
        const cookieStore = await cookies();
        
        cookieStore.set("session", session, { 
            expires, 
            httpOnly: true, 
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        return { success: true, redirectUrl: "/vendor" };

    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Vendor login error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }
}

import { sendFonteeOTP } from "@/lib/fontee";
import { sendEmailOTP } from "@/lib/mail";
import { hash } from "bcryptjs";

export async function requestPasswordReset(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    if (!email) return { error: "Email wajib diisi." };

    try {
        const user = await db.user.findUnique({ where: { email } });
        if (!user) return { error: "Email tidak terdaftar." };

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000);

        await db.user.update({
            where: { id: user.id },
            data: { otp, otpExpiresAt }
        });

        if (user.phone) await sendFonteeOTP(user.phone, otp);
        await sendEmailOTP(user.email, otp);

        return { success: true, email };
    } catch (error) {
        return { error: "Gagal mengirim OTP." };
    }
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;
    const newPassword = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (newPassword !== confirmPassword) {
        return { error: "Konfirmasi kata sandi tidak cocok." };
    }

    try {
        const user = await db.user.findUnique({ 
            where: { email },
            select: { id: true, otp: true, otpExpiresAt: true }
        });

        if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return { error: "OTP salah atau kedaluwarsa." };
        }

        const hashedPassword = await hash(newPassword, 12);
        await db.user.update({
            where: { id: user.id },
            data: { 
                password: hashedPassword, 
                otp: null, 
                otpExpiresAt: null 
            }
        });

        return { success: true, message: "Kata sandi Anda telah berhasil diubah." };
    } catch (error) {
        console.error("Reset password error:", error);
        return { error: "Gagal mereset kata sandi. Silakan coba lagi." };
    }
}

export async function logoutAction() {
    const { logout } = await import("@/lib/auth");
    await logout();
    redirect("/");
}

export async function getCurrentUserWithCustomer() {
    const { getSession } = await import("@/lib/auth");
    const session = await getSession();

    if (!session?.user?.id) return null;

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                customerId: true,
                customer: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                        type: true
                    }
                }
            }
        });

        return user;
    } catch (error) {
        console.error("Error fetching current user:", error);
        return null;
    }
}

// --- NEW AUTH METHODS (Google & Phone) ---
import { OAuth2Client } from "google-auth-library";

const googleClient = new OAuth2Client(process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID);

export async function requestPhoneOtpAction(prevState: any, formData: FormData) {
    const rawPhone = formData.get("phone") as string;
    if (!rawPhone) return { error: "Nomor HP wajib diisi." };

    let phone = rawPhone.replace(/\D/g, "");
    if (phone.startsWith("0")) phone = "62" + phone.slice(1);

    try {
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Check if user exists
        let user = await db.user.findFirst({
            where: { phone }
        });

        if (!user) {
            // Create temporary incomplete user
            const dummyEmail = `phone_${phone}_${Date.now()}@hokiindo.local`;
            const randomPassword = await hash(Math.random().toString(36), 12);
            
            user = await db.user.create({
                data: {
                    email: dummyEmail,
                    password: randomPassword,
                    phone: phone,
                    role: "CUSTOMER",
                    isActive: true,
                    isVerified: false,
                    otp,
                    otpExpiresAt
                }
            });
        } else {
            await db.user.update({
                where: { id: user.id },
                data: { otp, otpExpiresAt }
            });
        }

        const sent = await sendFonteeOTP(phone, otp);
        if (sent) {
            return { success: true, phone, message: "OTP telah dikirim ke WhatsApp Anda." };
        } else {
            return { error: "Gagal mengirim OTP ke WhatsApp. Coba lagi nanti." };
        }
    } catch (error) {
        console.error("requestPhoneOtp error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }
}

export async function verifyPhoneOtpAction(prevState: any, formData: FormData) {
    const phone = formData.get("phone") as string;
    const otp = formData.get("otp") as string;

    if (!phone || !otp) return { error: "Nomor HP dan OTP wajib diisi." };

    try {
        const user = await db.user.findFirst({
            where: { phone },
            include: { customer: true }
        });

        if (!user || user.otp !== otp || !user.otpExpiresAt || user.otpExpiresAt < new Date()) {
            return { error: "OTP salah atau sudah kedaluwarsa." };
        }

        // Activate user
        await db.user.update({
            where: { id: user.id },
            data: { 
                isVerified: true,
                otp: null,
                otpExpiresAt: null
            }
        });

        // Set Session
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days default
        const sessionData = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                customerId: user.customerId
            },
            expires
        };

        const session = await encrypt(sessionData);
        const cookieStore = await cookies();
        cookieStore.set("session", session, { 
            expires, 
            httpOnly: true, 
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        // Redirect to profile completion if no customerId
        if (!user.customerId || !user.customer?.name || !user.customer?.phone) {
            return { success: true, redirectUrl: "/lengkapi-profil" };
        }

        return { success: true, redirectUrl: "/" };
    } catch (error) {
        console.error("verifyPhoneOtp error:", error);
        return { error: "Terjadi kesalahan sistem saat memverifikasi." };
    }
}

export async function googleLoginAction(token: string) {
    if (!token) return { error: "Token tidak valid." };

    try {
        const ticket = await googleClient.verifyIdToken({
            idToken: token,
            audience: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID,
        });
        
        const payload = ticket.getPayload();
        if (!payload || !payload.email) {
            return { error: "Data Google tidak lengkap." };
        }

        const { email, name, picture } = payload;

        let user = await db.user.findUnique({
            where: { email },
            include: { customer: true }
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
                include: { customer: true }
            });
        }

        // Set Session
        const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); 
        const sessionData = {
            user: {
                id: user.id,
                email: user.email,
                name: user.name,
                role: user.role,
                customerId: user.customerId
            },
            expires
        };

        const session = await encrypt(sessionData);
        const cookieStore = await cookies();
        cookieStore.set("session", session, { 
            expires, 
            httpOnly: true, 
            path: "/",
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax"
        });

        // Redirect to profile completion if incomplete
        if (!user.customerId || !user.customer?.name || !user.customer?.phone) {
            return { success: true, redirectUrl: "/lengkapi-profil" };
        }

        return { success: true, redirectUrl: "/" };
    } catch (error) {
        console.error("googleLogin error:", error);
        return { error: "Autentikasi Google gagal. Cek konfigurasi Client ID." };
    }
}

