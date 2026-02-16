"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";

export async function addCustomerAddressAction(customerId: string, formData: FormData) {
    try {
        const address = formData.get("address") as string;
        const label = formData.get("label") as string;
        const recipient = formData.get("recipient") as string;
        const phone = formData.get("phone") as string;
        const isPrimary = formData.get("isPrimary") === "on";

        if (!address) return { error: "Alamat wajib diisi" };

        // If primary, unset others first
        if (isPrimary) {
            await db.customerAddress.updateMany({
                where: { customerId },
                data: { isPrimary: false }
            });
            // Update customer legacy address field
            await db.customer.update({
                where: { id: customerId },
                data: { address }
            });
        }

        // If this is the FIRST address, make it primary automatically
        const count = await db.customerAddress.count({ where: { customerId } });
        const shouldBePrimary = isPrimary || count === 0;

        if (count === 0 && !isPrimary) {
            // Update customer legacy address field
            await db.customer.update({
                where: { id: customerId },
                data: { address }
            });
        }

        await db.customerAddress.create({
            data: {
                customerId,
                address,
                label,
                recipient,
                phone,
                isPrimary: shouldBePrimary
            }
        });

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Add Address Error:", error);
        return { error: "Gagal menambah alamat" };
    }
}

export async function setPrimaryAddressAction(customerId: string, addressId: string) {
    try {
        const address = await db.customerAddress.findUnique({ where: { id: addressId } });
        if (!address) return { error: "Alamat tidak ditemukan" };

        // Unset all first
        await db.customerAddress.updateMany({
            where: { customerId },
            data: { isPrimary: false }
        });

        // Set new primary
        await db.customerAddress.update({
            where: { id: addressId },
            data: { isPrimary: true }
        });

        // Update customer legacy address
        await db.customer.update({
            where: { id: customerId },
            data: { address: address.address }
        });

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Set Primary Error:", error);
        return { error: "Gagal mengubah prioritas alamat" };
    }
}

export async function deleteCustomerAddressAction(addressId: string, customerId: string) {
    try {
        const address = await db.customerAddress.findUnique({ where: { id: addressId } });
        if (!address) return { error: "Alamat tidak ditemukan" };

        if (address.isPrimary) {
            return { error: "Tidak bisa menghapus alamat utama. Set alamat lain sebagai utama terlebih dahulu." };
        }

        await db.customerAddress.delete({ where: { id: addressId } });
        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        return { error: "Gagal menghapus alamat" };
    }
}
