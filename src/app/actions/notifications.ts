"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export type NotificationType = "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "UPGRADE" | "ORDER" | "QUOTATION" | "PROFILE";

interface CreateNotificationData {
    userId: string;
    title: string;
    message: string;
    type?: NotificationType;
    link?: string;
}

export async function createNotification(data: CreateNotificationData) {
    try {
        const notification = await db.notification.create({
            data: {
                userId: data.userId,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link
            }
        });
        return { success: true, notification };
    } catch (error) {
        console.error("createNotification error:", error);
        return { success: false, error: "Gagal membuat notifikasi" };
    }
}

export async function getUserNotifications(page: number = 1, limit: number = 20) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "Unauthorized", notifications: [], total: 0 };
        }

        const skip = (page - 1) * limit;

        const [notifications, total] = await Promise.all([
            db.notification.findMany({
                where: { userId: session.user.id },
                orderBy: { createdAt: "desc" },
                skip,
                take: limit
            }),
            db.notification.count({
                where: { userId: session.user.id }
            })
        ]);

        return { success: true, notifications, total };
    } catch (error) {
        console.error("getUserNotifications error:", error);
        return { success: false, error: "Gagal mengambil notifikasi", notifications: [], total: 0 };
    }
}

export async function getUnreadNotificationCount() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "Unauthorized", count: 0 };
        }

        const count = await db.notification.count({
            where: {
                userId: session.user.id,
                read: false
            }
        });

        return { success: true, count };
    } catch (error) {
        console.error("getUnreadNotificationCount error:", error);
        return { success: false, error: "Gagal mengambil jumlah", count: 0 };
    }
}

export async function markNotificationAsRead(notificationId: string) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const notification = await db.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification || notification.userId !== session.user.id) {
            return { success: false, error: "Notifikasi tidak ditemukan" };
        }

        await db.notification.update({
            where: { id: notificationId },
            data: { read: true }
        });

        return { success: true };
    } catch (error) {
        console.error("markNotificationAsRead error:", error);
        return { success: false, error: "Gagal memperbarui notifikasi" };
    }
}

export async function markAllNotificationsAsRead() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        await db.notification.updateMany({
            where: {
                userId: session.user.id,
                read: false
            },
            data: { read: true }
        });

        return { success: true };
    } catch (error) {
        console.error("markAllNotificationsAsRead error:", error);
        return { success: false, error: "Gagal memperbarui semua notifikasi" };
    }
}

export async function deleteNotification(notificationId: string) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        const notification = await db.notification.findUnique({
            where: { id: notificationId }
        });

        if (!notification || notification.userId !== session.user.id) {
            return { success: false, error: "Notifikasi tidak ditemukan" };
        }

        await db.notification.delete({
            where: { id: notificationId }
        });

        return { success: true };
    } catch (error) {
        console.error("deleteNotification error:", error);
        return { success: false, error: "Gagal menghapus notifikasi" };
    }
}

// Helper functions for specific notification types

export async function notifyUpgradeRequest(userId: string, status: "SUBMITTED" | "APPROVED" | "REJECTED", message?: string) {
    const notifications = {
        SUBMITTED: {
            title: "Pengajuan Upgrade Dikirim",
            message: "Pengajuan upgrade ke Reseller telah dikirim. Tim kami akan meninjau pengajuan Anda.",
            type: "UPGRADE" as NotificationType
        },
        APPROVED: {
            title: "Upgrade Disetujui! 🎉",
            message: message || "Selamat! Pengajuan upgrade Anda ke Reseller telah disetujui. Nikmati fitur dan keuntungan baru Anda.",
            type: "SUCCESS" as NotificationType
        },
        REJECTED: {
            title: "Upgrade Ditolak",
            message: message || "Maaf, pengajuan upgrade Anda ditolak. Silakan hubungi admin untuk informasi lebih lanjut.",
            type: "ERROR" as NotificationType
        }
    };

    const notif = notifications[status];
    return await createNotification({
        userId,
        title: notif.title,
        message: notif.message,
        type: notif.type,
        link: "/dashboard/upgrade"
    });
}

export async function notifyQuotationSubmitted(userId: string, quotationNo: string) {
    return await createNotification({
        userId,
        title: "Penawaran Harga Dikirim",
        message: `Penawaran harga ${quotationNo} telah dikirim. Tim sales kami akan segera menghubungi Anda.`,
        type: "QUOTATION" as NotificationType,
        link: "/dashboard/transaksi"
    });
}

export async function notifyOrderStatusChange(userId: string, quotationNo: string, status: string) {
    const statusMessages: Record<string, { title: string; message: string }> = {
        CONFIRMED: {
            title: "Pesanan Dikonfirmasi ✅",
            message: `Pesanan ${quotationNo} telah dikonfirmasi dan sedang disiapkan.`
        },
        SHIPPED: {
            title: "Pesanan Dikirim 🚚",
            message: `Pesanan ${quotationNo} telah dikirim. Lacak pengiriman Anda.`
        },
        COMPLETED: {
            title: "Pesanan Selesai 🎉",
            message: `Pesanan ${quotationNo} telah selesai. Terima kasih telah berbelanja!`
        },
        CANCELLED: {
            title: "Pesanan Dibatalkan ❌",
            message: `Pesanan ${quotationNo} telah dibatalkan.`
        }
    };

    const notif = statusMessages[status] || {
        title: "Status Pesanan Berubah",
        message: `Status pesanan ${quotationNo} telah berubah menjadi ${status}.`
    };

    return await createNotification({
        userId,
        title: notif.title,
        message: notif.message,
        type: "ORDER" as NotificationType,
        link: "/dashboard/transaksi"
    });
}

export async function notifyProfileUpdate(userId: string, field: string) {
    const fieldNames: Record<string, string> = {
        email: "Email",
        phone: "Nomor Handphone",
        name: "Nama",
        address: "Alamat"
    };

    return await createNotification({
        userId,
        title: "Profil Diperbarui",
        message: `${fieldNames[field] || field} Anda telah berhasil diperbarui.`,
        type: "PROFILE" as NotificationType,
        link: "/dashboard/profil"
    });
}
