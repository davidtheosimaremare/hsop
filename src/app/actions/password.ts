"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hash, compare } from "bcryptjs";

export async function changePasswordAction(
    currentPassword: string,
    newPassword: string
) {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Unauthenticated" };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return { error: "User tidak ditemukan" };
        }

        // Verify current password
        const isValid = await compare(currentPassword, user.password);
        if (!isValid) {
            return { error: "Password lama salah" };
        }

        // Hash new password
        const hashedPassword = await hash(newPassword, 12);

        // Update password
        await db.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword
            }
        });

        // Create notification
        await db.notification.create({
            data: {
                userId: user.id,
                title: "Kata Sandi Diubah",
                message: "Kata sandi akun Anda telah berhasil diubah.",
                type: "PROFILE",
                link: "/dashboard/password"
            }
        });

        return { success: true, message: "Password berhasil diubah" };
    } catch (error) {
        console.error("Change password error:", error);
        return { error: "Terjadi kesalahan sistem" };
    }
}
