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
