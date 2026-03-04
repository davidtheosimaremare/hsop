"use server";

import { db } from "@/lib/db";
import { revalidatePath } from "next/cache";
import { getSession } from "@/lib/auth";
import { updateAccurateCustomerAddresses } from "@/lib/accurate";

export async function addCustomerAddressAction(customerId: string, formData: FormData) {
    try {
        const address = formData.get("address") as string;
        const label = formData.get("label") as string;
        const recipient = formData.get("recipient") as string;
        const phone = formData.get("phone") as string;
        const district = formData.get("district") as string;
        const city = formData.get("city") as string;
        const province = formData.get("province") as string;
        const postalCode = formData.get("postalCode") as string;
        const setAsPrimary = formData.get("setAsPrimary") === "on";
        const setAsBilling = formData.get("setAsBilling") === "on";

        if (!address) return { success: false, error: "Alamat wajib diisi" };

        const fullAddress = [address, district, city, province, postalCode].filter(Boolean).join(", ");

        const createdAddress = await db.$transaction(async (tx) => {
            const count = await tx.customerAddress.count({ where: { customerId } });
            const isFirstAddress = count === 0;

            // First address is always primary + billing (default behavior)
            // Subsequent: only set flags if explicitly requested
            const finalIsPrimary = isFirstAddress ? true : setAsPrimary;
            const finalIsBilling = isFirstAddress ? true : setAsBilling;

            // If making this the new primary, unset all existing primary flags
            if (finalIsPrimary) {
                // Before unsetting, check if old primary was also billing
                const oldPrimary = await tx.customerAddress.findFirst({
                    where: { customerId, isPrimary: true }
                });
                const oldPrimaryWasBilling = oldPrimary?.isBilling ?? false;

                // Unset all primary flags
                await tx.customerAddress.updateMany({
                    where: { customerId },
                    data: { isPrimary: false }
                });

                // If old primary was billing AND we're not explicitly setting billing here,
                // billing needs to follow to the new primary
                if (oldPrimaryWasBilling && !finalIsBilling) {
                    // Billing will be set on new address below (implicit: new primary inherits billing)
                    // We need to unset billing from old primary since we already cleared isPrimary above
                    if (oldPrimary) {
                        await tx.customerAddress.update({
                            where: { id: oldPrimary.id },
                            data: { isBilling: false }
                        });
                    }
                }

                // Update customer legacy address fields
                await tx.customer.update({
                    where: { id: customerId },
                    data: { address: fullAddress, district, city, province, postalCode }
                });
            }

            // Determine actual billing flag:
            // - If explicitly set as billing: yes
            // - If set as primary AND old primary was billing AND new address is now primary: inherit billing
            // - If first address: always billing
            let actualIsBilling = finalIsBilling;
            if (!actualIsBilling && finalIsPrimary && !isFirstAddress) {
                // Check if old primary had billing (already handled above by unset)
                // New primary inherits billing role by default if no other billing exists
                const existingBilling = await tx.customerAddress.findFirst({
                    where: { customerId, isBilling: true }
                });
                if (!existingBilling) {
                    actualIsBilling = true;
                }
            }

            // If this address will be billing, unset billing from all others
            if (actualIsBilling) {
                await tx.customerAddress.updateMany({
                    where: { customerId },
                    data: { isBilling: false }
                });
            }

            return await tx.customerAddress.create({
                data: {
                    customerId,
                    address,
                    district,
                    city,
                    province,
                    postalCode,
                    label,
                    recipient,
                    phone,
                    isPrimary: finalIsPrimary,
                    isBilling: actualIsBilling
                }
            });
        });

        console.log(`[Address Action] Added new address: ${createdAddress.id} (Primary: ${createdAddress.isPrimary}, Billing: ${createdAddress.isBilling})`);

        // Sync to Accurate
        await syncCustomerWithAccurate(customerId);

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true, address: createdAddress };
    } catch (error) {
        console.error("Add Address Error:", error);
        return { success: false, error: "Gagal menambah alamat" };
    }
}

export async function setPrimaryAddressAction(customerId: string, addressId: string) {
    try {
        const newPrimary = await db.customerAddress.findUnique({ where: { id: addressId } });
        if (!newPrimary) return { error: "Alamat tidak ditemukan" };

        await db.$transaction(async (tx) => {
            // Find current primary to check if it was also billing
            const oldPrimary = await tx.customerAddress.findFirst({
                where: { customerId, isPrimary: true }
            });
            const oldPrimaryWasBilling = oldPrimary?.isBilling ?? false;

            // Check if there's a separate billing address (not the old primary)
            const separateBilling = await tx.customerAddress.findFirst({
                where: { customerId, isBilling: true, isPrimary: false }
            });

            // Unset all primary flags
            await tx.customerAddress.updateMany({
                where: { customerId },
                data: { isPrimary: false }
            });

            // Set new primary
            await tx.customerAddress.update({
                where: { id: addressId },
                data: { isPrimary: true }
            });

            // Billing logic:
            // - If old primary was also billing AND there's no separate billing address,
            //   billing should move to the new primary (they stay "same")
            if (oldPrimaryWasBilling && !separateBilling) {
                // Transfer billing from old primary to new primary
                if (oldPrimary) {
                    await tx.customerAddress.update({
                        where: { id: oldPrimary.id },
                        data: { isBilling: false }
                    });
                }
                await tx.customerAddress.update({
                    where: { id: addressId },
                    data: { isBilling: true }
                });
            }
            // If old primary was billing AND there IS a separate billing, keep separate billing as-is

            // Update customer legacy address fields to match new primary
            await tx.customer.update({
                where: { id: customerId },
                data: {
                    address: newPrimary.address,
                    province: newPrimary.province || null,
                    city: newPrimary.city || null,
                    district: newPrimary.district || null,
                    postalCode: newPrimary.postalCode || null
                }
            });
        });

        await syncCustomerWithAccurate(customerId);

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

        // If this was the billing address, reassign billing flag to primary address
        if (address.isBilling) {
            await db.customerAddress.updateMany({
                where: { customerId, isPrimary: true },
                data: { isBilling: true }
            });
        }

        await db.customerAddress.delete({ where: { id: addressId } });

        const updatedCustomer = await db.customer.findUnique({
            where: { id: customerId },
            include: { addresses: true }
        });

        if (updatedCustomer) {
            await syncCustomerWithAccurate(customerId);
        }

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        return { error: "Gagal menghapus alamat" };
    }
}

export async function setBillingAddressAction(customerId: string, addressId: string) {
    try {
        await db.$transaction(async (tx) => {
            // Unset isBilling from all addresses
            await tx.customerAddress.updateMany({
                where: { customerId },
                data: { isBilling: false }
            });

            // Set new billing address
            await tx.customerAddress.update({
                where: { id: addressId },
                data: { isBilling: true }
            });
        });

        await syncCustomerWithAccurate(customerId);

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Set Billing Error:", error);
        return { error: "Gagal mengubah alamat penagihan" };
    }
}

// Resets billing back to same as primary (billing = primary)
export async function resetBillingToPrimaryAction(customerId: string) {
    try {
        await db.$transaction(async (tx) => {
            const primary = await tx.customerAddress.findFirst({
                where: { customerId, isPrimary: true }
            });
            if (!primary) return;

            // Unset all billing flags
            await tx.customerAddress.updateMany({
                where: { customerId },
                data: { isBilling: false }
            });

            // Set billing to primary
            await tx.customerAddress.update({
                where: { id: primary.id },
                data: { isBilling: true }
            });
        });

        await syncCustomerWithAccurate(customerId);

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Reset Billing Error:", error);
        return { error: "Gagal mereset alamat penagihan" };
    }
}

export async function getUserAddresses() {
    try {
        const session = await getSession();
        if (!session?.user?.id) return { success: false, addresses: [], error: "Unauthorized" };
        const addresses = await db.customerAddress.findMany({ where: { customerId: session.user.id }, orderBy: { isPrimary: 'desc' } });
        return { success: true, addresses, error: undefined };
    } catch (e) { return { success: false, addresses: [], error: "Gagal mengambil alamat" }; }
}

export async function addUserAddress(formData: FormData) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return { success: false, error: "Unauthorized" };
        return addCustomerAddressAction(session.user.id, formData);
    } catch (e) { return { success: false, error: "Gagal menambah alamat" }; }
}

export async function updateUserAddress(addressId: string, formData: FormData) {
    try {
        const address = formData.get("address") as string;
        const label = formData.get("label") as string;
        const recipient = formData.get("recipient") as string;
        const phone = formData.get("phone") as string;
        const isPrimary = formData.get("isPrimary") === "on";

        const session = await getSession();
        if (!session?.user?.id) return { error: "Unauthorized" };

        if (isPrimary) {
            await db.customerAddress.updateMany({ where: { customerId: session.user.id }, data: { isPrimary: false } });
        }
        await db.customerAddress.update({
            where: { id: addressId, customerId: session.user.id },
            data: { address, label, recipient, phone, isPrimary }
        });
        revalidatePath("/dashboard/alamat");
        return { success: true };
    } catch (e) { return { error: "Gagal mengupdate alamat" }; }
}

export async function setPrimaryUserAddress(addressId: string) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return { error: "Unauthorized" };
        const result = await setPrimaryAddressAction(session.user.id, addressId);
        revalidatePath("/dashboard/alamat");
        return result;
    } catch (e) { return { error: "Gagal mengatur primary address" }; }
}

export async function deleteUserAddress(addressId: string) {
    try {
        const session = await getSession();
        if (!session?.user?.id) return { error: "Unauthorized" };
        const result = await deleteCustomerAddressAction(addressId, session.user.id);
        revalidatePath("/dashboard/alamat");
        return result;
    } catch (e) { return { error: "Gagal menghapus alamat" }; }
}

export async function syncCustomerWithAccurate(customerId: string) {
    try {
        const customer = await db.customer.findUnique({
            where: { id: customerId },
            include: {
                addresses: true,
                users: true
            }
        });

        if (!customer || !customer.accurateId) return;

        const addresses = customer.addresses as any[];
        const primary = addresses.find(a => a.isPrimary);
        const billing = addresses.find(a => a.isBilling);

        // Logical fallback: if NO address is marked as billing, then use primary.
        // But if there IS a billing address, use it even if it's different.
        const effectiveBilling = billing || primary;

        console.log(`[Accurate Sync] Customer: ${customer.company || customer.name}`);
        console.log(`[Accurate Sync] Primary (Ship): ${primary?.address}`);
        console.log(`[Accurate Sync] Billing: ${effectiveBilling?.address}`);

        // 0. Fetch existing contacts from Accurate to prevent duplicates
        const { getAccurateCustomerDetail } = await import("@/lib/accurate");
        const accurateCustomer = await getAccurateCustomerDetail(Number(customer.accurateId));
        const existingAccurateContacts = accurateCustomer?.detailContact || [];

        console.log(`[Accurate Sync] Existing contacts in Accurate: ${existingAccurateContacts.length}`);

        const contactList = [];
        const shipAddressList = [];
        const contactNames = new Set<string>();

        // 1. Add Users to Contact List
        for (const user of customer.users) {
            if (user.name && !contactNames.has(user.name)) {
                // @ts-ignore
                const positionStr = user.position || (user.isPrimaryContact ? "Primary Contact" : "Staff");

                const existing = existingAccurateContacts.find((c: any) =>
                    (user.email && c.email?.toLowerCase() === user.email.toLowerCase()) ||
                    (user.phone && (c.mobilePhone === user.phone || c.bbmPin === user.phone))
                );

                contactList.push({
                    id: existing?.id,
                    name: user.name || user.username || "Staff",
                    mobilePhone: user.phone || "",
                    bbmPin: user.phone || "",
                    email: user.email || "",
                    position: positionStr,
                    // @ts-ignore
                    primary: !!user.isPrimaryContact,
                    salutation: "MR"
                });
                contactNames.add(user.name);
            }
        }

        // 2. Add Address Recipients to Contact List (if not already there)
        const existingAccurateAddresses = accurateCustomer?.detailShipAddress || [];
        console.log(`[Accurate Sync] Existing auxiliary addresses in Accurate: ${existingAccurateAddresses.length}`);

        for (const addr of addresses) {
            if (addr.recipient && !contactNames.has(addr.recipient)) {
                const existing = existingAccurateContacts.find((c: any) =>
                    (addr.phone && (c.mobilePhone === addr.phone || c.bbmPin === addr.phone))
                );

                contactList.push({
                    id: existing?.id,
                    name: addr.recipient,
                    mobilePhone: addr.phone || "",
                    bbmPin: addr.phone || "",
                    position: addr.label || "Address CP",
                    salutation: "MR"
                });
                contactNames.add(addr.recipient);
            }

            // Collect Additional (non-primary) Addresses for Accurate's shipAddressList
            if (!addr.isPrimary) {
                const street = addr.district ? `${addr.address}, ${addr.district}` : addr.address;

                const existingAddr = existingAccurateAddresses.find((a: any) =>
                    a.street === street || (addr.phone && a.picMobileNo === addr.phone)
                );

                shipAddressList.push({
                    id: existingAddr?.id,
                    street: street,
                    city: addr.city || undefined,
                    province: addr.province || undefined,
                    zipCode: addr.postalCode || undefined,
                    picName: addr.recipient || undefined,
                    picMobileNo: addr.phone || undefined
                });
            }
        }

        // 3. Identify and Mark Deleted Addresses in Accurate
        for (const accAddr of existingAccurateAddresses) {
            const isStillUsedLocally = addresses.some(localAddr => {
                const localStreet = localAddr.district ? `${localAddr.address}, ${localAddr.district}` : localAddr.address;
                return accAddr.street === localStreet;
            });

            if (!isStillUsedLocally) {
                console.log(`[Accurate Sync] Flagging address for removal in Accurate: ${accAddr.street} (ID: ${accAddr.id})`);
                shipAddressList.push({
                    id: accAddr.id,
                    deleteRow: true
                });
            }
        }

        console.log(`[Accurate Sync] Contact List to sync:`, JSON.stringify(contactList, null, 2));

        const res = await updateAccurateCustomerAddresses(Number(customer.accurateId), {
            name: customer.company || customer.name || undefined,
            shipSameAsBill: primary?.id === effectiveBilling?.id,
            shipAddress: primary ? {
                street: primary.address,
                // @ts-ignore
                district: primary.district || undefined,
                city: primary.city || undefined,
                province: primary.province || undefined,
                zipCode: primary.postalCode || undefined
            } : undefined,
            billAddress: effectiveBilling ? {
                street: effectiveBilling.address,
                // @ts-ignore
                district: effectiveBilling.district || undefined,
                city: effectiveBilling.city || undefined,
                province: effectiveBilling.province || undefined,
                zipCode: effectiveBilling.postalCode || undefined
            } : undefined,
            contactList: contactList.length > 0 ? contactList : undefined,
            shipAddressList: shipAddressList.length > 0 ? shipAddressList : undefined
        });

        console.log(`[Accurate Sync] Bulk Save Response:`, JSON.stringify(res, null, 2));

        return res;
    } catch (error) {
        console.error("Accurate Sync Error:", error);
    }
}

export async function pullCustomerAddressesFromAccurate(customerId: string) {
    try {
        const customer = await db.customer.findUnique({
            where: { id: customerId }
        });

        if (!customer || !customer.accurateId) return { error: "Customer belum terhubung ke Accurate" };

        const { getAccurateCustomerDetail } = await import("@/lib/accurate");
        const acc = await getAccurateCustomerDetail(Number(customer.accurateId));

        if (!acc) return { error: "Gagal mengambil data dari Accurate" };

        await db.$transaction(async (tx) => {
            // Unset current flags to start fresh
            await tx.customerAddress.updateMany({
                where: { customerId },
                data: { isPrimary: false, isBilling: false }
            });

            // 1. Process Main Shipping Address (becomes Primary)
            if (acc.shipStreet) {
                const existing = await tx.customerAddress.findFirst({
                    where: { customerId, address: acc.shipStreet }
                });

                const shipSameAsBill = acc.shipStreet === acc.billStreet;

                if (existing) {
                    await tx.customerAddress.update({
                        where: { id: existing.id },
                        data: {
                            isPrimary: true,
                            isBilling: shipSameAsBill,
                            city: acc.shipCity || null,
                            province: acc.shipProvince || null,
                            postalCode: acc.shipZipCode || null
                        }
                    });
                } else {
                    await tx.customerAddress.create({
                        data: {
                            customerId,
                            address: acc.shipStreet,
                            city: acc.shipCity || null,
                            province: acc.shipProvince || null,
                            postalCode: acc.shipZipCode || null,
                            label: "Utama (Accurate)",
                            isPrimary: true,
                            isBilling: shipSameAsBill
                        }
                    });
                }
            }

            // 2. Process Billing Address (only if different from shipping)
            if (acc.billStreet && acc.billStreet !== acc.shipStreet) {
                const existing = await tx.customerAddress.findFirst({
                    where: { customerId, address: acc.billStreet }
                });

                if (existing) {
                    await tx.customerAddress.update({
                        where: { id: existing.id },
                        data: {
                            isBilling: true,
                            city: acc.billCity || null,
                            province: acc.billProvince || null,
                            postalCode: acc.billZipCode || null
                        }
                    });
                } else {
                    await tx.customerAddress.create({
                        data: {
                            customerId,
                            address: acc.billStreet,
                            city: acc.billCity || null,
                            province: acc.billProvince || null,
                            postalCode: acc.billZipCode || null,
                            label: "Penagihan (Accurate)",
                            isPrimary: false,
                            isBilling: true
                        }
                    });
                }
            }

            // 3. Process Auxiliary Addresses (detailShipAddress)
            const detailShip = acc.detailShipAddress || [];
            for (const addr of detailShip) {
                if (!addr.street) continue;

                const existing = await tx.customerAddress.findFirst({
                    where: { customerId, address: addr.street }
                });

                if (!existing) {
                    await tx.customerAddress.create({
                        data: {
                            customerId,
                            address: addr.street,
                            city: addr.city || null,
                            province: addr.province || null,
                            postalCode: addr.zipCode || null,
                            recipient: addr.picName || null,
                            phone: addr.picMobileNo || null,
                            label: addr.locationLabel || "Cabang (Accurate)",
                            isPrimary: false,
                            isBilling: false
                        }
                    });
                }
            }
        });

        revalidatePath(`/admin/customers/${customerId}`);
        return { success: true };
    } catch (error) {
        console.error("Pull Sync Error:", error);
        return { error: "Terjadi kesalahan saat sinkronisasi dari Accurate" };
    }
}
