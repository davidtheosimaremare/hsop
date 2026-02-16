"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";
import { sendUpgradeRequestNotification } from "@/lib/mail";

export type UpgradeRequestData = {
    requestType: "RESELLER" | "EXCLUSIVE";
    ktpName: string;
    ktp: string; // URL
    npwp?: string; // URL
};

export async function submitUpgradeRequest(data: UpgradeRequestData) {
    const session = await getSession();
    if (!session || !session.user) {
        return { error: "Anda harus login terlebih dahulu." };
    }

    const userId = session.user.id;

    try {
        // Fetch User and Customer data for defaults
        const user = await db.user.findUnique({
            where: { id: userId },
            include: { customer: true }
        });

        if (!user) return { error: "User tidak ditemukan." };

        // Check for existing pending request
        const existingRequest = await db.upgradeRequest.findFirst({
            where: {
                userId: userId,
                status: "PENDING"
            }
        });

        if (existingRequest) {
            return { error: "Anda sudah memiliki permintaan upgrade yang sedang diproses." };
        }

        const phone = user.phone || user.customer?.phone || "-";

        await db.upgradeRequest.create({
            data: {
                userId,
                requestType: data.requestType,
                ktpName: data.ktpName,
                address: user.customer?.address || "-", // Use existing address or dash
                phone: phone, // Use existing phone
                ktp: data.ktp,
                npwp: data.npwp,
                status: "PENDING"
            }
        });

        // Send Email Notification to Admin
        await sendUpgradeRequestNotification({
            userName: user.name || "User",
            userEmail: user.email,
            phone: phone,
            ktpName: data.ktpName,
            ktpUrl: data.ktp,
            npwpUrl: data.npwp
        });

        revalidatePath("/dashboard/upgrade");
        revalidatePath("/dashboard/settings"); // Update settings page status
        return { success: true };

    } catch (error) {
        console.error("Error submitting upgrade request:", error);
        return { error: `Gagal: ${(error as Error).message}` };
    }
}

export async function getUpgradeRequestStatus() {
    const session = await getSession();
    if (!session || !session.user) return null;

    try {
        const request = await db.upgradeRequest.findFirst({
            where: { userId: session.user.id },
            orderBy: { createdAt: "desc" }
        });
        return request;
    } catch (error) {
        console.error("Error fetching upgrade status:", error);
        return null;
    }
}

// Admin Actions

export async function getAdminUpgradeRequests(status: string = "PENDING") {
    // Ideally check for admin role here from session
    const session = await getSession();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        return { error: "Unauthorized" };
    }

    try {
        const requests = await db.upgradeRequest.findMany({
            where: { status },
            include: { user: true },
            orderBy: { createdAt: "desc" }
        });
        return { success: true, requests };
    } catch (error) {
        console.error("Error fetching admin requests:", error);
        return { success: false, error: "Failed to fetch requests" };
    }
}

export async function processUpgradeRequest(requestId: string, action: "APPROVE" | "REJECT", notes?: string) {
    const session = await getSession();
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "SUPER_ADMIN")) {
        return { error: "Unauthorized" };
    }

    try {
        const request = await db.upgradeRequest.findUnique({
            where: { id: requestId },
            include: { user: true }
        });

        if (!request) {
            return { error: "Permintaan tidak ditemukan." };
        }

        if (request.status !== "PENDING") {
            return { error: "Permintaan sudah diproses sebelumnya." };
        }

        if (action === "REJECT") {
            await db.upgradeRequest.update({
                where: { id: requestId },
                data: {
                    status: "REJECTED",
                    adminNotes: notes
                }
            });
        } else if (action === "APPROVE") {
            const customerId = request.user.customerId;
            if (!customerId) {
                return { error: "User tidak terhubung dengan Customer profile." };
            }

            await db.$transaction([
                // Update request status
                db.upgradeRequest.update({
                    where: { id: requestId },
                    data: {
                        status: "APPROVED",
                        adminNotes: notes
                    }
                }),
                // Update Customer Type
                db.customer.update({
                    where: { id: customerId },
                    data: {
                        type: request.requestType, // RESELLER or EXCLUSIVE
                        company: request.companyName || undefined, // Update company name if provided
                        address: request.address, // Update address
                        phone: request.phone, // Update phone
                        // You might want to update discount fields here too if there are defaults for these types
                    }
                })
            ]);
        }

        revalidatePath("/admin/upgrades");
        return { success: true };

    } catch (error) {
        console.error("Error processing upgrade Request:", error);
        return { error: "Gagal memproses permintaan." };
    }
}
