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

        // 3. Create session
        // We reuse the 'login' function from lib/auth but modify it to accept user object or payload
        // Actually lib/auth.login(formData) was a placeholder. We should use the encrypt logic here or refactor.
        // Let's refactor lib/auth to just handle session creation, and do logic here.

        // Check lib/auth implementation (from memory, it had login(formData) which did nothing real)
        // I will rewrite lib/auth login logic here for simplicity or use the helper.

        // Let's use the encrypt helper from lib/auth
        const { encrypt } = await import("@/lib/auth");
        const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours
        const session = await encrypt({ user: { id: user.id, email: user.email, role: user.role }, expires });

        const { cookies } = await import("next/headers");
        (await cookies()).set("session", session, { expires, httpOnly: true });
        console.log("Session cookie set.");

    } catch (error) {
        console.error("Login error DETAILS:", error);
        return { error: "Terjadi kesalahan sistem." };
    }

    redirect("/admin");
}

export async function logoutAction() {
    const { logout } = await import("@/lib/auth");
    await logout();
    redirect("/admin/login");
}
