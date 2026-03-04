"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { hash } from "bcryptjs";
import { syncCustomerWithAccurate } from "./address";

export async function createCustomerUser(data: {
    customerId: string;
    name: string;
    email: string;
    phone: string;
    password?: string;
    position?: string;
    isPrimary?: boolean;
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

        const hashedPassword = data.password ? await hash(data.password, 10) : undefined;

        await db.user.create({
            data: {
                customerId: data.customerId,
                name: data.name,
                username: data.email.split("@")[0] + "_" + Math.floor(Math.random() * 1000),
                email: data.email,
                phone: data.phone,
                password: hashedPassword || "temp_pass_" + Math.random(),
                role: "CUSTOMER",
                isActive: true,
                position: data.position,
                isPrimaryContact: data.isPrimary || false,
            }
        });

        // Trigger sync
        await syncContactsToAccurate(data.customerId);

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
        const user = await db.user.findUnique({ where: { id: userId } });
        if (!user) return { success: false, error: "User tidak ditemukan." };
        if (user.isPrimaryContact) return { success: false, error: "CP Utama tidak bisa dihapus." };

        await db.user.delete({
            where: { id: userId }
        });

        if (user.customerId) await syncContactsToAccurate(user.customerId);

        revalidatePath("/admin/customers");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { success: false, error: "Gagal menghapus user." };
    }
}

export async function updateCustomerUser(userId: string, data: {
    name: string;
    email: string;
    phone: string;
    position?: string;
    password?: string;
}) {
    try {
        const updateData: any = {
            name: data.name,
            email: data.email,
            phone: data.phone,
            position: data.position,
        };

        if (data.password) {
            updateData.password = await hash(data.password, 10);
        }

        const user = await db.user.update({
            where: { id: userId },
            data: updateData
        });

        if (user.customerId) await syncContactsToAccurate(user.customerId);

        revalidatePath(`/admin/customers/${user.customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { success: false, error: "Gagal mengupdate user." };
    }
}

async function syncContactsToAccurate(customerId: string) {
    await syncCustomerWithAccurate(customerId);
}
