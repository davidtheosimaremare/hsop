"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";

export async function createCustomerUser(data: {
    customerId: string;
    name: string;
    email: string;
    phone: string;
    password: string;
}) {
    try {
        // Validate Email/Phone Uniqueness
        const existing = await db.user.findFirst({
            where: {
                OR: [
                    { email: data.email },
                    { phone: data.phone }
                ]
            }
        });

        if (existing) {
            let errorMsg = "Data sudah digunakan.";
            if (existing.email === data.email) errorMsg = "Email sudah digunakan.";
            if (existing.phone === data.phone) errorMsg = "Nomor telepon sudah digunakan.";

            return {
                success: false,
                error: errorMsg
            };
        }

        const hashedPassword = await hash(data.password, 10);

        await db.user.create({
            data: {
                customerId: data.customerId,
                name: data.name,
                username: data.email.split("@")[0], // Fallback username or just rely on email
                email: data.email,
                phone: data.phone,
                password: hashedPassword,
                role: "CUSTOMER",
                isActive: true,
            }
        });

        revalidatePath(`/admin/customers/${data.customerId}`);
        return { success: true };

    } catch (error) {
        console.error("Failed to create user:", error);
        return { success: false, error: "Gagal membuat user." };
    }
}

export async function toggleUserStatus(userId: string, isActive: boolean) {
    try {
        await db.user.update({
            where: { id: userId },
            data: { isActive }
        });
        revalidatePath("/admin/customers");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle status:", error);
        return { success: false, error: "Gagal mengubah status user." };
    }
}

export async function deleteUser(userId: string) {
    try {
        await db.user.delete({
            where: { id: userId }
        });
        revalidatePath("/admin/customers");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, error: "Gagal menghapus user." };
    }
}
