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
        if (user.role !== "CUSTOMER") {
            return { error: "Akses ditolak. Silakan gunakan portal login yang sesuai (Admin/Vendor)." };
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

        return { success: true, redirectUrl: "/" };

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
