"use server";

import { redirect } from "next/navigation";
import { login, logout } from "@/lib/auth";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

export async function loginAction(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on";

    if (!email || !password) {
        console.log("Missing credentials. Email:", email, "Password length:", password?.length);
        return { error: "Email dan password wajib diisi." };
    }
    console.log("Login Action triggered. Email:", email, "Password length:", password.length);

    try {
        console.log("Attempting login for:", email);

        // 1. Find user
        const user = await db.user.findUnique({
            where: { email },
        });
        console.log("User found:", user ? "YES" : "NO");

        if (!user) {
            return { error: "Email atau password salah." };
        }

        // 2. Verify password
        const isValid = await compare(password, user.password);
        console.log("Password valid:", isValid ? "YES" : "NO");

        if (!isValid) {
            return { error: "Email atau password salah." };
        }

        // 3. Check Verification
        if (!user.isVerified) {
            return {
                error: "Akun belum diverifikasi.",
                // We can rely on frontend using this flag to redirect, or do it here if possible. 
                // But redirects in server actions with error state are tricky if we want to preserve state?
                // Let's return a specific error code/flag or just rely on the message.
                // Better: return a specific field.
                unverified: true,
                email: email
            };
        }

        // 4. Create session
        const { encrypt } = await import("@/lib/auth");
        // Expires in 30 days if remember me is checked, otherwise 24 hours
        const expires = new Date(Date.now() + (remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
        const session = await encrypt({ user: { id: user.id, email: user.email, role: user.role, name: user.name }, expires });

        const { cookies } = await import("next/headers");
        (await cookies()).set("session", session, { expires, httpOnly: true });
        console.log("Session cookie set.");

        // Redirect based on role
        if (user.role === "ADMIN" || user.role === "SUPER_ADMIN") {
            redirect("/admin");
        } else {
            redirect("/");
        }

    } catch (error) {
        if (isRedirectError(error)) throw error; // Re-throw redirect errors
        console.error("Login error DETAILS:", error);
        return { error: "Terjadi kesalahan sistem." };
    }
}

// Helper to check for redirect error type
function isRedirectError(error: any) {
    return error && typeof error === 'object' && (
        error.digest?.startsWith('NEXT_REDIRECT') ||
        error.message?.includes('NEXT_REDIRECT')
    );
}

import { sendFonteeOTP } from "@/lib/fontee";
import { sendEmailOTP } from "@/lib/mail";
import { hash } from "bcryptjs";

export async function requestPasswordReset(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;

    if (!email) {
        return { error: "Email wajib diisi." };
    }

    try {
        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
            // Security: Don't reveal if user exists. Just say success.
            return { success: true, message: "Jika email terdaftar, kode OTP telah dikirim.", redirect: `/reset-password?email=${encodeURIComponent(email)}` };
        }

        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        await db.user.update({
            where: { id: user.id },
            data: {
                otp,
                otpExpiresAt
            }
        });

        // Send OTP
        await Promise.all([
            sendFonteeOTP(user.phone || '', otp),
            sendEmailOTP(user.email, otp)
        ]);

        return { success: true, message: "Kode OTP telah dikirim.", redirect: `/reset-password?email=${encodeURIComponent(email)}` };

    } catch (error) {
        console.error("Reset request error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }
}

export async function resetPasswordAction(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const otp = formData.get("otp") as string;
    const password = formData.get("password") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!email || !otp || !password || !confirmPassword) {
        return { error: "Semua field wajib diisi." };
    }

    if (password !== confirmPassword) {
        return { error: "Konfirmasi kata sandi tidak cocok." };
    }

    try {
        const user = await db.user.findUnique({ where: { email } });

        if (!user) {
            return { error: "User tidak ditemukan." };
        }

        if (!user.otp || !user.otpExpiresAt) {
            return { error: "Kode OTP tidak valid atau sudah kadaluarsa." };
        }

        if (user.otp !== otp) {
            return { error: "Kode OTP salah." };
        }

        if (new Date() > user.otpExpiresAt) {
            return { error: "Kode OTP sudah kadaluarsa." };
        }

        const hashedPassword = await hash(password, 12);

        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                otp: null,
                otpExpiresAt: null,
                isVerified: true // Implicitly verify
            }
        });

        return { success: true, message: "Password berhasil diubah. Silakan masuk.", redirect: "/masuk" };

    } catch (error) {
        console.error("Reset password error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }
}



export async function logoutAction() {
    const { logout } = await import("@/lib/auth");
    await logout();
    redirect("/admin/login");
}
