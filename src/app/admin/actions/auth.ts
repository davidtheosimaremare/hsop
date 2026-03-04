"use server";

import { redirect } from "next/navigation";
import { db } from "@/lib/db";
import { compare } from "bcryptjs";

export async function adminLoginAction(prevState: any, formData: FormData) {
    const email = formData.get("email") as string;
    const password = formData.get("password") as string;
    const remember = formData.get("remember") === "on";

    if (!email || !password) {
        return { error: "Email dan password wajib diisi." };
    }

    try {
        // 1. Find user
        const user = await db.user.findUnique({
            where: { email },
        });

        if (!user) {
            return { error: "Email atau password salah." };
        }

        // 2. Verify password
        const isValid = await compare(password, user.password);

        if (!isValid) {
            return { error: "Email atau password salah." };
        }

        // 3. Check if user has admin role
        const adminRoles = ["SUPER_ADMIN", "ADMIN", "MANAGER"];
        if (!user.role || !adminRoles.includes(user.role)) {
            return { error: "Anda tidak memiliki akses admin." };
        }

        // 4. Check Verification
        if (!user.isVerified) {
            return {
                error: "Akun belum diverifikasi.",
                unverified: true,
                email: email
            };
        }

        // 5. Create session
        const { encrypt } = await import("@/lib/auth");
        const expires = new Date(Date.now() + (remember ? 30 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000));
        const session = await encrypt({
            user: {
                id: user.id,
                email: user.email,
                role: user.role,
                name: user.name,
                isActive: user.isActive,
                customerId: user.customerId,
            },
            expires
        });

        const { cookies } = await import("next/headers");
        (await cookies()).set("session", session, { expires, httpOnly: true });

    } catch (error) {
        if (isRedirectError(error)) throw error;
        console.error("Admin login error:", error);
        return { error: "Terjadi kesalahan sistem." };
    }

    return { success: true };
}

function isRedirectError(error: any) {
    return error && typeof error === 'object' && (
        error.digest?.startsWith('NEXT_REDIRECT') ||
        error.message?.includes('NEXT_REDIRECT')
    );
}
