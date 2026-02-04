"use server";

import { db } from "@/lib/db";
import { fetchAllCustomers } from "@/lib/accurate";
import { revalidatePath } from "next/cache";

export async function syncCustomersAction() {
    try {
        console.log("Starting customer sync...");
        const accurateCustomers = await fetchAllCustomers();
        console.log(`Fetched ${accurateCustomers.length} customers from Accurate.`);

        let syncedCount = 0;
        let errorCount = 0;

        for (const ac of accurateCustomers) {
            try {
                let email = ac.contactInfo?.email || null;
                if (email === "") email = null;

                const phone = ac.contactInfo?.mobilePhone || ac.contactInfo?.businessPhone || null;
                const address = ac.billAddress?.street || null;

                // Validate Accurate ID exist
                if (!ac.id) {
                    console.warn(`Skipping customer with missing Accurate ID:`, ac);
                    continue;
                }

                // Determine DB ID (CustomerNo doesn't exist in DB anymore, we use ID)
                let dbId = ac.no;
                if (!dbId) {
                    // Fallback if Accurate 'no' is missing
                    dbId = `ACC-${ac.id}`;
                    console.warn(`Customer ${ac.name} (Accurate ID: ${ac.id}) has no CustomerNo. Using fallback ID '${dbId}'.`);
                }

                // 1. Check if email is already taken by ANOTHER customer
                if (email) {
                    const existingWithEmail = await db.customer.findFirst({
                        where: {
                            email: email,
                            accurateId: { not: ac.id }, // ID mismatch
                        }
                    });

                    if (existingWithEmail) {
                        console.warn(`Duplicate email '${email}' found for Customer '${dbId}'. Skipping email sync to avoid unique constraint error. (Owned by: ${existingWithEmail.id})`);
                        email = null; // Fallback to null to save other data
                    }
                }

                // 2. Upsert
                await db.customer.upsert({
                    where: { accurateId: ac.id },
                    update: {
                        name: ac.name,
                        email: email,
                        phone: phone,
                        address: address,
                        businessCategory: ac.category?.name || null,
                        // customerNo removed
                    },
                    create: {
                        id: dbId,
                        accurateId: ac.id,
                        name: ac.name,
                        email: email,
                        phone: phone,
                        address: address,
                        businessCategory: ac.category?.name || null,
                        discount1: 0,
                        discount2: 0,
                        // customerNo removed
                    }
                });
                syncedCount++;
            } catch (err) {
                console.warn(`Failed to sync customer ${ac.name} (ID: ${ac.id}):`, err);
                errorCount++;
            }
        }

        revalidatePath("/admin/customers");
        return {
            success: true,
            message: `Sync complete. Synced: ${syncedCount}, Errors: ${errorCount}. Check logs for details.`
        };

    } catch (error) {
        console.error("Sync customers failed:", error);
        return { success: false, message: "Failed to sync customers." };
    }
}

export async function updateCustomerDiscounts(id: string, discountLP: string, discountCP: string, discountLighting: string) {
    try {
        await db.customer.update({
            where: { id },
            data: {
                discountLP,
                discountCP,
                discountLighting,
            },
        });
        revalidatePath(`/admin/customers`);
        revalidatePath(`/admin/customers/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update discounts:", error);
        return { success: false, error: "Failed to update discounts" };
    }
}

export async function createManualCustomer(data: {
    type: "BISNIS" | "RETAIL";
    name: string;
    email: string;
    phone: string;
    company?: string;
    address?: string;
}) {
    try {
        // validate email
        if (data.email) {
            const existing = await db.customer.findFirst({
                where: { email: data.email },
            });
            if (existing) {
                return { success: false, error: "Email sudah terdaftar." };
            }
        }

        const id = `MANUAL-${Date.now()}`; // Simple Unique ID logic

        await db.customer.create({
            data: {
                id: id,
                type: data.type,
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company,
                address: data.address,
                accurateId: null, // Manual customer
                discount1: 0,
                discount2: 0,
            },
        });

        revalidatePath("/admin/customers");
        return { success: true, id };
    } catch (error) {
        console.error("Failed to create customer:", error);
        return { success: false, error: "Gagal membuat customer." };
    }
}

export async function updateCustomer(id: string, data: {
    type: "BISNIS" | "RETAIL";
    name: string;
    email: string;
    phone: string;
    company?: string;
    address?: string;
}) {
    try {
        // Validation: Check if email is taken by ANOTHER user
        if (data.email) {
            const existing = await db.customer.findFirst({
                where: {
                    email: data.email,
                    id: { not: id } // Exclude self
                },
            });
            if (existing) {
                return { success: false, error: "Email sudah digunakan oleh customer lain." };
            }
        }

        await db.customer.update({
            where: { id },
            data: {
                type: data.type,
                name: data.name,
                email: data.email,
                phone: data.phone,
                company: data.company,
                address: data.address,
            },
        });

        revalidatePath(`/admin/customers/${id}`);
        revalidatePath("/admin/customers");
        return { success: true };
    } catch (error) {
        console.error("Failed to update customer:", error);
        return { success: false, error: "Gagal mengupdate customer." };
    }
}
