"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hash } from "bcryptjs";
import { sendFonteeOTP } from "@/lib/fontee";
import { sendEmailOTP } from "@/lib/mail";

export async function requestProfileUpdateOTP(field: 'email' | 'phone', newValue: string) {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Unauthenticated" };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return { error: "User not found" };
        }

        // Check if the new value is the same as current
        if (field === 'email' && user.email === newValue) {
            return { error: "Email baru sama dengan email saat ini" };
        }
        if (field === 'phone' && user.phone === newValue) {
            return { error: "Nomor handphone baru sama dengan saat ini" };
        }

        // Check if email/phone already exists for another user
        const existingUser = await db.user.findFirst({
            where: {
                [field]: newValue,
                id: { not: user.id }
            }
        });

        if (existingUser) {
            return { error: field === 'email' ? "Email sudah digunakan oleh akun lain" : "Nomor handphone sudah digunakan oleh akun lain" };
        }

        // Additional check for email uniqueness in Customer table
        if (field === 'email') {
            const existingCustomer = await db.customer.findFirst({
                where: {
                    email: newValue,
                    users: { none: { id: user.id } } // Not owned by current user's customer
                }
            });
            if (existingCustomer) {
                return { error: "Email sudah digunakan oleh data pelanggan lain" };
            }
        }

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

        // Store OTP in user record with field info
        await db.user.update({
            where: { id: user.id },
            data: {
                otp,
                otpExpiresAt,
                // Store the pending value in a temporary field (we'll use otp as a marker)
                // We need to store the pending update somewhere
            }
        });

        // For profile updates, we'll store pending changes in a separate place
        // Let's use a simple approach: store in user's upgrade request or create a temp storage
        // Actually, let's create a ProfileUpdateRequest
        const updateRequest = await db.profileUpdateRequest.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                field,
                newValue,
                otp,
                otpExpiresAt
            },
            update: {
                field,
                newValue,
                otp,
                otpExpiresAt,
                status: 'PENDING'
            }
        });

        // Send OTP
        const fieldLabel = field === 'email' ? 'email' : 'nomor handphone';

        try {
            await Promise.all([
                field === 'phone' ? sendFonteeOTP(newValue, otp) : Promise.resolve(),
                sendEmailOTP(field === 'email' ? newValue : user.email, otp) // Send to new email if updating email
            ]);
        } catch (sendError) {
            console.error("Failed to send OTP:", sendError);
        }

        return {
            success: true,
            message: `Kode OTP telah dikirim ke ${field === 'email' ? 'email baru Anda' : 'nomor handphone baru Anda'}`
        };

    } catch (error) {
        console.error("Request profile update OTP error:", error);
        return { error: "Terjadi kesalahan sistem" };
    }
}

export async function verifyProfileUpdateOTP(otp: string) {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Unauthenticated" };
    }

    try {
        const updateRequest = await db.profileUpdateRequest.findUnique({
            where: { userId: session.user.id },
        });

        if (!updateRequest || updateRequest.status !== 'PENDING') {
            return { error: "Tidak ada permintaan update yang aktif. Silakan minta kode OTP baru." };
        }

        if (updateRequest.otp !== otp) {
            return { error: "Kode OTP salah" };
        }

        if (!updateRequest.otpExpiresAt) {
            return { error: "Kode OTP tidak valid" };
        }

        if (new Date() > updateRequest.otpExpiresAt) {
            return { error: "Kode OTP sudah kadaluarsa" };
        }

        // Apply the update
        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return { error: "User not found" };
        }

        const updateData: any = {};

        if (updateRequest.field === 'email') {
            updateData.email = updateRequest.newValue;
            // Also update customer email if exists
            if (user.customerId) {
                await db.customer.update({
                    where: { id: user.customerId },
                    data: { email: updateRequest.newValue }
                });
            }
        } else if (updateRequest.field === 'phone') {
            updateData.phone = updateRequest.newValue;
            // Also update customer phone if exists
            if (user.customerId) {
                await db.customer.update({
                    where: { id: user.customerId },
                    data: { phone: updateRequest.newValue }
                });
            }
        }

        await db.user.update({
            where: { id: session.user.id },
            data: updateData
        });

        // Clear the update request
        await db.profileUpdateRequest.update({
            where: { userId: session.user.id },
            data: { status: 'COMPLETED' }
        });

        // Create notification
        await db.notification.create({
            data: {
                userId: session.user.id,
                title: "Profil Diperbarui",
                message: `${updateRequest.field === 'email' ? 'Email' : 'Nomor handphone'} Anda telah berhasil diperbarui.`,
                type: "PROFILE",
                link: "/dashboard/profil"
            }
        });

        return {
            success: true,
            message: `${updateRequest.field === 'email' ? 'Email' : 'Nomor handphone'} berhasil diubah`
        };

    } catch (error) {
        console.error("Verify profile update OTP error:", error);
        return { error: "Terjadi kesalahan sistem" };
    }
}

export async function updateProfileName(name: string) {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Unauthenticated" };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
        });

        if (!user) {
            return { error: "User not found" };
        }

        await db.user.update({
            where: { id: session.user.id },
            data: { name }
        });

        // Also update customer name if exists and is a Retail/Personal customer
        if (user.customerId) {
            const customer = await db.customer.findUnique({
                where: { id: user.customerId },
                select: { type: true }
            });

            // For B2B/Reseller, the Customer name is usually Company name, so don't auto-update from User's personal name
            // But for Retail, they are usually the same.
            if (customer?.type === 'RETAIL' || customer?.type === 'GENERAL') {
                await db.customer.update({
                    where: { id: user.customerId },
                    data: { name }
                });
            }
        }

        // Create notification
        await db.notification.create({
            data: {
                userId: user.id,
                title: "Profil Diperbarui",
                message: "Nama Anda telah berhasil diperbarui.",
                type: "PROFILE",
                link: "/dashboard/profil"
            }
        });

        return { success: true, message: "Nama berhasil diubah" };
    } catch (error) {
        console.error("Update profile name error:", error);
        return { error: "Terjadi kesalahan sistem" };
    }
}

export async function updateProfileAddress(data: {
    address: string;
    province: string;
    city: string;
    district: string;
    postalCode: string;
}) {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Unauthenticated" };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { customer: true }
        });

        if (!user) {
            return { error: "User not found" };
        }

        if (user.customer) {
            await db.customer.update({
                where: { id: user.customer.id },
                data: {
                    address: data.address,
                    province: data.province,
                    city: data.city,
                    district: data.district,
                    postalCode: data.postalCode
                }
            });
        } else {
            // Create customer record if doesn't exist
            const customerId = await db.customer.create({
                data: {
                    id: user.id, // Use user id as customer id
                    name: user.name || user.email,
                    email: user.email,
                    address: data.address,
                    province: data.province,
                    city: data.city,
                    district: data.district,
                    postalCode: data.postalCode,
                    type: 'GENERAL'
                }
            });

            await db.user.update({
                where: { id: user.id },
                data: { customerId: customerId.id }
            });
        }

        return { success: true, message: "Alamat berhasil diubah" };
    } catch (error) {
        console.error("Update profile address error:", error);
        return { error: "Terjadi kesalahan sistem" };
    }
}

export async function updateProfileAvatar(imageUrl: string) {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Unauthenticated" };
    }

    try {
        const user = await db.user.findUnique({
            where: { id: session.user.id },
            include: { customer: true }
        });

        if (!user) {
            return { error: "User not found" };
        }

        if (user.customer) {
            await db.customer.update({
                where: { id: user.customer.id },
                data: { image: imageUrl }
            });
        } else {
            const customerId = await db.customer.create({
                data: {
                    id: user.id, // Use user id as customer id
                    name: user.name || user.email,
                    email: user.email,
                    image: imageUrl,
                    type: 'GENERAL'
                }
            });

            await db.user.update({
                where: { id: user.id },
                data: { customerId: customerId.id }
            });
        }

        return { success: true, message: "Avatar berhasil diubah" };
    } catch (error) {
        console.error("Update profile avatar error:", error);
        return { error: "Terjadi kesalahan sistem" };
    }
}
