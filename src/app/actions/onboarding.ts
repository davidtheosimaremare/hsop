"use server";

import { db } from "@/lib/db";
import { getCurrentUserWithCustomer } from "@/app/actions/auth";
import { createAccurateCustomer } from "@/lib/accurate";

export async function onboardingAction(prevState: any, formData: FormData) {
    try {
        const user = await getCurrentUserWithCustomer();
        if (!user) {
            return { error: "Anda harus login untuk melengkapi profil." };
        }

        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string || user.phone; // Fallback to existing phone
        let email = formData.get("email") as string || user.email; // Fallback to existing email

        const isCompany = formData.get("isCompany") === "true";
        const companyName = formData.get("companyName") as string;
        const businessType = formData.get("businessType") as string;
        const address = formData.get("address") as string;

        if (!name || !phone) {
            return { error: "Nama Lengkap dan Nomor WhatsApp wajib diisi." };
        }

        if (isCompany && (!companyName || !businessType)) {
            return { error: "Nama Perusahaan dan Bidang Usaha wajib diisi jika Anda mendaftar sebagai perusahaan." };
        }

        // If email was dummy (starts with phone_), we can optionally let them update it. 
        // We'll update the user's email if a new one is provided.
        if (email && email !== user.email) {
            const existingEmail = await db.user.findUnique({ where: { email } });
            if (existingEmail) {
                return { error: "Email sudah digunakan oleh akun lain." };
            }
            await db.user.update({
                where: { id: user.id },
                data: { email }
            });
        }

        // 1. Sync to Accurate to get the official ID/Number
        const customerName = isCompany ? companyName : name;
        const customerType = isCompany ? "BISNIS" : "GeneralCustomer";
        const customerCompany = isCompany ? companyName : null;
        const customerBusinessCategory = isCompany ? businessType : null;

        const accurateRes = await createAccurateCustomer({
            name: customerName,
            email: email, // use the updated or existing email
            phone: phone,
            address: address || undefined,
            // Contact Person info (Login account)
            cpName: name,
            cpEmail: email,
            cpPhone: phone,
        });

        const accurateId = accurateRes.s ? accurateRes.r?.id : null;
        const accurateNo = accurateRes.s ? (accurateRes.r?.customerNo || accurateRes.r?.number || accurateRes.r?.no) : null;

        // Fallback to sequential ID if Accurate sync fails
        let finalCustomerId = accurateNo;

        if (!finalCustomerId) {
            // Generate sequential CO-XXXX ID as fallback
            const lastCoCustomer = await db.customer.findFirst({
                where: {
                    id: { startsWith: 'CO-' }
                },
                orderBy: {
                    id: 'desc'
                },
                select: { id: true }
            });

            let nextNum = 1;
            if (lastCoCustomer) {
                const parts = lastCoCustomer.id.split('-');
                if (parts.length > 1) {
                    const lastNum = parseInt(parts[1]);
                    if (!isNaN(lastNum)) {
                        nextNum = lastNum + 1;
                    }
                }
            }
            finalCustomerId = `CO-${nextNum.toString().padStart(4, '0')}`;
        }

        // Check if customer already exists by email (edge case)
        const existingCustomer = await db.customer.findUnique({
            where: { email }
        });

        if (existingCustomer) {
            finalCustomerId = existingCustomer.id;
        }

        await db.$transaction(async (tx) => {
            // 1. Create or Update Customer
            if (!existingCustomer) {
                await tx.customer.create({
                    data: {
                        id: finalCustomerId,
                        name: customerName,
                        email: email,
                        phone: phone,
                        address: address,
                        type: customerType,
                        company: customerCompany,
                        businessCategory: customerBusinessCategory,
                        accurateId: accurateId ? Number(accurateId) : undefined,
                        accurateCustomerCode: accurateNo || undefined,
                    },
                });
            } else {
                // Update existing customer info
                await tx.customer.update({
                    where: { id: existingCustomer.id },
                    data: {
                        name: customerName,
                        phone: phone,
                        address: address,
                        type: customerType,
                        company: customerCompany,
                        businessCategory: customerBusinessCategory,
                        accurateId: accurateId ? Number(accurateId) : existingCustomer.accurateId,
                        accurateCustomerCode: accurateNo || existingCustomer.accurateCustomerCode,
                    }
                });
            }

            // 2. Update User
            await tx.user.update({
                where: { id: user.id },
                data: {
                    name: name,
                    phone: phone,
                    customerId: finalCustomerId,
                }
            });
        });

        // Optionally, update the session to include the new customerId
        // This is done by redirecting or forcing a session refresh.
        // We'll redirect to a route that handles session refresh or directly to home.
        
        return { success: true, redirectUrl: "/" };

    } catch (error) {
        console.error("onboarding error:", error);
        return { error: "Terjadi kesalahan saat menyimpan profil." };
    }
}
