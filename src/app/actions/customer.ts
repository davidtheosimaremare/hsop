"use server";

import { db } from "@/lib/db";
import { fetchAllCustomers, createAccurateCustomer } from "@/lib/accurate";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { hash } from "bcryptjs";

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

/**
 * Sync a single customer by its customer number (no)
 * Used by webhooks for real-time updates
 */
export async function syncSingleCustomerAction(customerNo: string) {
    try {
        console.log(`Syncing single customer: ${customerNo}`);
        const accurateCustomers = await fetchAllCustomers();
        const ac = accurateCustomers.find(c => c.no === customerNo);

        if (!ac) {
            console.error(`Customer ${customerNo} not found in Accurate during sync.`);
            return { success: false, message: `Customer ${customerNo} not found.` };
        }

        let email = ac.contactInfo?.email || null;
        if (email === "") email = null;
        const phone = ac.contactInfo?.mobilePhone || ac.contactInfo?.businessPhone || null;
        const address = ac.billAddress?.street || null;

        // Determine DB ID
        let dbId = ac.no || `ACC-${ac.id}`;

        await db.customer.upsert({
            where: { accurateId: ac.id },
            update: {
                name: ac.name,
                email: email,
                phone: phone,
                address: address,
                businessCategory: ac.category?.name || null,
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
            }
        });

        // revalidatePath moved to caller (processQueueAction)
        return { success: true, message: `Synced ${customerNo}` };
    } catch (error: any) {
        console.error(`Failed to sync customer ${customerNo}:`, error);
        return { success: false, message: error.message };
    }
}

export async function updateCustomerDiscounts(
    id: string,
    discountLP: string,
    discountLPIndent: string,
    discountCP: string,
    discountCPIndent: string,
    discountLighting: string,
    discountLightingIndent: string
) {
    console.log("[updateCustomerDiscounts] Updating:", { id, discountLP, discountLPIndent, discountCP, discountCPIndent, discountLighting, discountLightingIndent });
    try {
        await db.customer.update({
            where: { id },
            data: {
                discountLP,
                discountLPIndent,
                discountCP,
                discountCPIndent,
                discountLighting,
                discountLightingIndent,
            },
        });
        revalidatePath(`/admin/customers`);
        revalidatePath(`/admin/customers/${id}`);
        return { success: true };
    } catch (error) {
        console.error("Failed to update discounts:", error);
        return { success: false, error: error instanceof Error ? error.message : "Failed to update discounts" };
    }
}

export async function createManualCustomer(data: {
    type: "BISNIS" | "RETAIL" | "RESELLER" | "GENERAL";
    name: string; // Contact Person Name
    email: string; // Login Email
    phone: string; // CP Phone
    company?: string | null; // Company Name
    companyEmail?: string | null; // Company Email
    companyPhone?: string | null; // Company Phone
    address?: string | null;
    password?: string | null;
}) {
    try {
        // validate email
        if (data.email) {
            const existingCust = await db.customer.findFirst({
                where: { email: data.email },
            });
            const existingUser = await db.user.findFirst({
                where: { email: data.email },
            });
            if (existingCust || existingUser) {
                return { success: false, error: "Email sudah terdaftar." };
            }
        }

        // 1. Sync to Accurate first to get the official ID/Number
        // This is necessary because the user wants the Accurate Number to be the PRIMARY ID in our DB.
        const isEntity = !!data.company;
        const accurateRes = await createAccurateCustomer({
            name: (isEntity && data.company) ? data.company : data.name,
            email: isEntity ? (data.companyEmail || undefined) : data.email,
            phone: isEntity ? (data.companyPhone || undefined) : data.phone,
            address: data.address || undefined,
            // Contact Person info (Login account)
            cpName: isEntity ? data.name : undefined,
            cpEmail: isEntity ? data.email : undefined,
            cpPhone: isEntity ? data.phone : undefined,
        });

        if (!accurateRes.s) {
            return { success: false, error: `Gagal sinkron ke Accurate: ${accurateRes.message}` };
        }

        console.log("[Accurate Sync Result]:", JSON.stringify(accurateRes.r));

        const accurateId = accurateRes.r?.id;
        const accurateNo = accurateRes.r?.customerNo || accurateRes.r?.number || accurateRes.r?.no;

        if (!accurateNo) {
            return { success: false, error: "Gagal mendapatkan nomor Pelanggan dari Accurate." };
        }

        // 2. Create in our DB using Accurate No as IDs
        await db.$transaction(async (tx) => {
            const customer = await tx.customer.create({
                data: {
                    id: accurateNo, // Use Accurate No as the Primary Key ID
                    type: data.type,
                    name: data.name,
                    email: data.email,
                    phone: data.phone,
                    company: data.company,
                    // Use @ts-ignore if the client is still using old cached types
                    // @ts-ignore
                    companyEmail: data.companyEmail,
                    // @ts-ignore
                    companyPhone: data.companyPhone,
                    address: data.address || undefined,
                    accurateId: Number(accurateId),
                    accurateCustomerCode: accurateNo,
                    discount1: 0,
                    discount2: 0,
                },
            });

            if (data.email && data.password && data.password.trim() !== "") {
                const hashedPassword = await hash(data.password, 12);
                await tx.user.create({
                    data: {
                        email: data.email,
                        password: hashedPassword,
                        name: data.name,
                        phone: data.phone,
                        role: "CUSTOMER",
                        isActive: true,
                        isVerified: true,
                        customerId: accurateNo,
                        isPrimaryContact: true,
                    }
                });
            }
        });

        revalidatePath("/admin/customers");
        return { success: true, id: accurateNo };
    } catch (error) {
        console.error("Failed to create customer:", error);
        return { success: false, error: "Gagal membuat customer." };
    }
}

export async function updateCustomer(id: string, data: {
    type: "BISNIS" | "RETAIL" | "RESELLER";
    name: string;
    email: string;
    phone: string;
    company?: string | null;
    companyEmail?: string | null;
    companyPhone?: string | null;
    address?: string | null;
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
                // @ts-ignore
                companyEmail: data.companyEmail,
                // @ts-ignore
                companyPhone: data.companyPhone,
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

export async function upgradeCustomerAction(formData: FormData) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return { error: "Unauthorized" };
        }

        const user = await db.user.findUnique({
            where: { email: session.user.email },
            include: { customer: true }
        });

        if (!user || !user.customer) {
            return { error: "Data customer tidak ditemukan." };
        }

        const companyName = formData.get("companyName") as string;
        const address = formData.get("address") as string;
        const phone = formData.get("phone") as string;

        if (!companyName || !address || !phone) {
            return { error: "Nama Perusahaan, Alamat, dan Telepon wajib diisi." };
        }

        // Update Customer
        await db.customer.update({
            where: { id: user.customer.id },
            data: {
                type: "BISNIS",
                company: companyName,
                address: address,
                phone: phone,
            }
        });

        revalidatePath("/dashboard");
        return { success: true };

    } catch (error) {
        console.error("Upgrade error:", error);
        return { error: "Gagal mengupdate akun." };
    }
}

export async function adminUpgradeCustomerAction(customerId: string, formData: FormData) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return { error: "Unauthorized" };
        }

        const companyName = formData.get("companyName") as string;
        const address = formData.get("address") as string;
        const phone = formData.get("phone") as string;
        const email = formData.get("email") as string;

        if (!companyName || !address || !phone || !email) {
            return { error: "Nama Perusahaan, Alamat, Telepon, dan Email wajib diisi." };
        }

        // Check email uniqueness
        const existing = await db.customer.findFirst({
            where: {
                email: email,
                id: { not: customerId }
            }
        });
        if (existing) {
            return { error: "Email sudah digunakan oleh customer lain." };
        }

        // Update Customer
        await db.customer.update({
            where: { id: customerId },
            data: {
                type: "BISNIS",
                company: companyName,
                address: address,
                phone: phone,
                email: email,
            }
        });

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };

    } catch (error) {
        console.error("Admin Upgrade error:", error);
        return { error: "Gagal mengupdate akun." };
    }
}

export async function updateCustomerBasicInfoAction(customerId: string, formData: FormData) {
    try {
        const session = await getSession();
        if (!session?.user?.email) {
            return { error: "Unauthorized" };
        }

        const email = formData.get("email") as string;
        const phone = formData.get("phone") as string;
        // Address managed via Address Actions now
        const businessCategory = formData.get("businessCategory") as string;

        // Basic validation
        if (!email) {
            return { error: "Email wajib diisi." };
        }

        // Check email uniqueness if changed
        const existing = await db.customer.findFirst({
            where: {
                email: email,
                id: { not: customerId }
            }
        });

        if (existing) {
            return { error: "Email sudah digunakan oleh customer lain." };
        }

        await db.customer.update({
            where: { id: customerId },
            data: {
                email,
                phone,
                businessCategory
            }
        });

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Update Basic Info Error:", error);
        return { error: "Gagal mengupdate informasi dasar." };
    }
}


export async function updateCustomerAvatarAction(customerId: string, imageUrl: string) {
    console.log(`Updating avatar for ${customerId} with url: ${imageUrl}`);
    try {
        await db.customer.update({
            where: { id: customerId },
            data: { image: imageUrl }
        });
        console.log("Database updated successfully");
        revalidatePath("/admin/customers");
        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Update Avatar DB Error:", error);
        return { error: "Gagal update avatar: " + (error as Error).message };
    }
}

export async function upgradeCustomerType(id: string, type: "CORPORATE" | "RETAIL") {
    try {
        await db.customer.update({
            where: { id },
            data: { type }
        });
        revalidatePath("/admin/customers");
        revalidatePath(`/admin/customers/${id}`);
        return { success: true, message: "Berhasil mengupgrade tipe customer" };
    } catch (error) {
        return { success: false, error: "Gagal mengupgrade tipe customer: " + (error as Error).message };
    }
}

export async function deleteCustomerAction(id: string) {
    try {
        await db.$transaction(async (tx) => {
            // Delete associated data first
            await tx.user.deleteMany({
                where: { customerId: id }
            });
            await tx.customerAddress.deleteMany({
                where: { customerId: id }
            });
            // We keep Orders and SalesQuotations usually for accounting, 
            // but if they are linked to the customer, they will block deletion if not handled.
            // Let's check schema.prisma again or just try deleting.
            // In Prisma, if no cascade is set, delete will fail.
            // Let's assume we want to truly delete the customer record.

            await tx.customer.delete({
                where: { id }
            });
        });
        revalidatePath("/admin/customers");
        return { success: true };
    } catch (error) {
        console.error("Delete Customer Error:", error);
        return { success: false, error: "Gagal menghapus customer: " + (error as Error).message };
    }
}
