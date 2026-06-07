import { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { requireAuth, mobileResponse, createMobileToken } from "@/lib/mobile-api-auth";
import { createAccurateCustomer } from "@/lib/accurate";

export async function OPTIONS(request: NextRequest) {
    // Just handling OPTIONS for preflight is usually caught by validateApiKey inside requireAuth, but good practice
    // We import validateApiKey directly or just dummy respond for OPTIONS
    const { CORS_HEADERS } = await import("@/lib/mobile-api-auth");
    return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function POST(request: NextRequest) {
    const authRes = await requireAuth(request);
    if ("status" in authRes) return authRes; // Return Error Response
    
    const { user: authUser } = authRes;

    try {
        const body = await request.json();
        const { isCompany, name, companyName, businessType, address, email, phone } = body;

        // Fetch current user from DB to get existing phone/email
        const dbUser = await db.user.findUnique({ where: { id: authUser.userId } });
        if (!dbUser) {
            return mobileResponse({ success: false, error: "User tidak ditemukan." }, 404);
        }

        const finalPhone = phone || dbUser.phone;
        const finalEmail = email || dbUser.email;
        const isCompanyBool = String(isCompany) === "true";

        if (!name || !finalPhone) {
            return mobileResponse({ success: false, error: "Nama Lengkap dan Nomor WhatsApp wajib diisi." }, 400);
        }

        if (isCompanyBool && (!companyName || !businessType)) {
            return mobileResponse({ success: false, error: "Nama Perusahaan dan Bidang Usaha wajib diisi jika mendaftar sebagai perusahaan." }, 400);
        }

        // Handle Email Update if a new email is provided (usually if dummy email is present)
        if (finalEmail && finalEmail !== dbUser.email) {
            const existingEmail = await db.user.findUnique({ where: { email: finalEmail } });
            if (existingEmail) {
                return mobileResponse({ success: false, error: "Email sudah digunakan oleh akun lain." }, 400);
            }
        }

        // Sync to Accurate
        const customerName = isCompanyBool ? companyName : name;
        const customerType = isCompanyBool ? "BISNIS" : "GeneralCustomer";
        const customerCompany = isCompanyBool ? companyName : null;
        const customerBusinessCategory = isCompanyBool ? businessType : null;

        const accurateRes = await createAccurateCustomer({
            name: customerName,
            email: finalEmail,
            phone: finalPhone,
            address: address || undefined,
            cpName: name,
            cpEmail: finalEmail,
            cpPhone: finalPhone,
        });

        const accurateId = accurateRes.s ? accurateRes.r?.id : null;
        const accurateNo = accurateRes.s ? (accurateRes.r?.customerNo || accurateRes.r?.number || accurateRes.r?.no) : null;

        let finalCustomerId = accurateNo;

        if (!finalCustomerId) {
            // Fallback CO-XXXX
            const lastCoCustomer = await db.customer.findFirst({
                where: { id: { startsWith: 'CO-' } },
                orderBy: { id: 'desc' },
                select: { id: true }
            });

            let nextNum = 1;
            if (lastCoCustomer) {
                const parts = lastCoCustomer.id.split('-');
                if (parts.length > 1) {
                    const lastNum = parseInt(parts[1]);
                    if (!isNaN(lastNum)) nextNum = lastNum + 1;
                }
            }
            finalCustomerId = `CO-${nextNum.toString().padStart(4, '0')}`;
        }

        const existingCustomer = await db.customer.findUnique({
            where: { email: finalEmail }
        });

        if (existingCustomer) {
            finalCustomerId = existingCustomer.id;
        }

        let updatedCustomer;

        await db.$transaction(async (tx) => {
            // Create or Update Customer
            if (!existingCustomer) {
                updatedCustomer = await tx.customer.create({
                    data: {
                        id: finalCustomerId,
                        name: customerName,
                        email: finalEmail,
                        phone: finalPhone,
                        address: address,
                        type: customerType,
                        company: customerCompany,
                        businessCategory: customerBusinessCategory,
                        accurateId: accurateId ? Number(accurateId) : undefined,
                        accurateCustomerCode: accurateNo || undefined,
                    },
                });
            } else {
                updatedCustomer = await tx.customer.update({
                    where: { id: existingCustomer.id },
                    data: {
                        name: customerName,
                        phone: finalPhone,
                        address: address,
                        type: customerType,
                        company: customerCompany,
                        businessCategory: customerBusinessCategory,
                        accurateId: accurateId ? Number(accurateId) : existingCustomer.accurateId,
                        accurateCustomerCode: accurateNo || existingCustomer.accurateCustomerCode,
                    }
                });
            }

            // Update User
            await tx.user.update({
                where: { id: authUser.userId },
                data: {
                    name: name,
                    phone: finalPhone,
                    email: finalEmail,
                    customerId: finalCustomerId,
                }
            });
        });

        // Generate new token since customerId and email might have changed
        const newToken = await createMobileToken({
            userId: authUser.userId,
            email: finalEmail,
            role: authUser.role,
            customerId: finalCustomerId,
        });

        return mobileResponse({
            success: true,
            token: newToken,
            user: {
                id: authUser.userId,
                name: name,
                email: finalEmail,
                phone: finalPhone,
                role: authUser.role,
                customerId: finalCustomerId,
                customer: updatedCustomer,
            }
        });

    } catch (error) {
        console.error("[MOBILE] Onboarding error:", error);
        return mobileResponse({ success: false, error: "Terjadi kesalahan saat menyimpan profil." }, 500);
    }
}
