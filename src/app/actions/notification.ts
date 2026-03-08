"use server";

import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { revalidatePath } from "next/cache";

export async function getUserNotifications(page: number = 1, limit: number = 20) {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "Unauthorized", notifications: [], total: 0 };
        }

        const skip = (page - 1) * limit;

        const [notifications, total] = await db.$transaction([
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

        revalidatePath("/dashboard/notifikasi");
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
            where: { userId: session.user.id, read: false },
            data: { read: true }
        });

        revalidatePath("/dashboard/notifikasi");
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

        revalidatePath("/dashboard/notifikasi");
        return { success: true };
    } catch (error) {
        console.error("deleteNotification error:", error);
        return { success: false, error: "Gagal menghapus notifikasi" };
    }
}

export async function createNotification(data: {
    userId: string;
    title: string;
    message: string;
    type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "UPGRADE" | "ORDER" | "QUOTATION" | "PROFILE";
    link?: string;
}) {
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

        revalidatePath("/dashboard/notifikasi");
        return { success: true, notification };
    } catch (error) {
        console.error("createNotification error:", error);
        return { success: false, error: "Gagal membuat notifikasi" };
    }
}

export async function notifyAdmins(data: {
    title: string;
    message: string;
    type?: "INFO" | "SUCCESS" | "WARNING" | "ERROR" | "UPGRADE" | "ORDER" | "QUOTATION" | "PROFILE";
    link?: string;
}) {
    try {
        const admins = await db.user.findMany({
            where: {
                role: { in: ["SUPER_ADMIN", "ADMIN", "MANAGER"] },
                isActive: true
            },
            select: { id: true }
        });

        if (admins.length === 0) return { success: true, count: 0 };

        await db.notification.createMany({
            data: admins.map(admin => ({
                userId: admin.id,
                title: data.title,
                message: data.message,
                type: data.type || "INFO",
                link: data.link
            }))
        });

        revalidatePath("/admin");
        return { success: true, count: admins.length };
    } catch (error) {
        console.error("notifyAdmins error:", error);
        return { success: false, error: "Gagal mengirim notifikasi ke admin" };
    }
}

export async function clearNotifications() {
    try {
        const session = await getSession();
        if (!session?.user) {
            return { success: false, error: "Unauthorized" };
        }

        await db.notification.deleteMany({
            where: { userId: session.user.id }
        });

        revalidatePath("/dashboard/notifikasi");
        return { success: true };
    } catch (error) {
        console.error("clearNotifications error:", error);
        return { success: false, error: "Gagal membersihkan notifikasi" };
    }
}
