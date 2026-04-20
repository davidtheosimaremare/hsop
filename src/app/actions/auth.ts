"use server";

import { redirect, isRedirectError } from "next/navigation";
import { encrypt } from "@/lib/auth";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";
import { unstable_noStore as noStore } from "next/cache";
import { cookies } from "next/headers";

export async function loginAction(prevState: any, formData: FormData) {
    noStore();
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on";

    if (!email || !password) {
        return { error: "Email dan password wajib diisi." };
    }

    let userRole = null;
    try {
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "Email atau password salah." };
        }

        const isValid = await compare(password, user.password);
        if (!isValid) {
            return { error: "Email atau password salah." };
        }

        if (!user.isActive) {
            return { error: "Akun Anda dinonaktifkan." };
        }

        userRole = user.role;
        const expires = new Date(Date.now() + (remember ? 30 : 1) * 24 * 60 * 60 * 1000);
        
        // Simpan hanya data penting di Cookie (Hapus password dll)
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

    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Login error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }

    // Redirect di luar try-catch
    const adminRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER", "STAFF", "VIEWER"];
    if (userRole && adminRoles.includes(userRole)) {
        redirect("/admin");
    } else if (userRole === "VENDOR") {
        redirect("/vendor");
    } else {
        redirect("/");
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
        const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

        await db.user.update({
            where: { id: user.id },
            data: { otp, otpExpiry }
        });

        if (user.phone) await sendFonteeOTP(user.phone, otp);
        await sendEmailOTP(user.email, otp);

        return { success: true, email };
    } catch (error) {
        return { error: "Gagal mengirim OTP." };
    }
}

export async function verifyOTPAndReset(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;
    const newPassword = formData.get("password") as string;

    try {
        const user = await db.user.findUnique({ where: { email } });
        if (!user || user.otp !== otp || !user.otpExpiry || user.otpExpiry < new Date()) {
            return { error: "OTP salah atau kedaluwarsa." };
        }

        const hashedPassword = await hash(newPassword, 10);
        await db.user.update({
            where: { id: user.id },
            data: { password: hashedPassword, otp: null, otpExpiry: null }
        });

        return { success: true };
    } catch (error) {
        return { error: "Gagal reset password." };
    }
}

export async function logoutAction() {
    const { logout } = await import("@/lib/auth");
    await logout();
    redirect("/masuk");
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
                image: true,
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
