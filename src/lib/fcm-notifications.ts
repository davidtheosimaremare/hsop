/**
 * FCM Notification Service
 *
 * Fungsi-fungsi untuk mengirim push notification ke aplikasi mobile
 * via Firebase Cloud Messaging (FCM).
 *
 * Digunakan setelah database diupdate oleh webhook Accurate.
 */

import { getAdminMessaging } from "@/lib/firebase-admin";
import { MulticastMessage } from "firebase-admin/messaging";

// ─── Topic Names ─────────────────────────────────────────────────────────────
// Aplikasi mobile harus subscribe ke topic ini saat pertama kali dibuka.
export const FCM_TOPICS = {
  PRODUCT_UPDATE: "product_updates",   // Harga / stok produk berubah
  NEW_PRODUCT: "new_products",          // Produk baru ditambahkan
  ORDER_UPDATE: "order_updates",        // Status order berubah (per user, pakai token)
  ALL_USERS: "all_users",              // Broadcast ke semua pengguna
} as const;

// ─── Helper: Kirim ke Topic ───────────────────────────────────────────────────
/**
 * Kirim notifikasi ke semua device yang subscribe ke sebuah topic.
 * Topic-based: cocok untuk broadcast (product update, promo, dll).
 */
export async function sendTopicNotification({
  topic,
  title,
  body,
  data,
  silent = false,
}: {
  topic: string;
  title: string;
  body: string;
  data?: Record<string, string>;
  /** Jika true: tidak ada suara/popup, hanya trigger background refresh */
  silent?: boolean;
}) {
  try {
    const messaging = getAdminMessaging();

    const message = {
      topic,
      notification: silent ? undefined : { title, body },
      data: {
        type: topic,
        title,
        body,
        timestamp: new Date().toISOString(),
        ...data,
      },
      android: {
        priority: "high" as const,
        notification: silent ? undefined : { channelId: "product_updates", sound: "default" },
      },
      apns: {
        headers: { "apns-priority": silent ? "5" : "10" },
        payload: {
          aps: {
            "content-available": 1, // Penting: membangunkan app saat background
            sound: silent ? undefined : "default",
            badge: silent ? undefined : 1,
          },
        },
      },
    };

    const response = await messaging.send(message);
    console.log(`[FCM] Notifikasi topic '${topic}' terkirim. Message ID: ${response}`);
    return { success: true, messageId: response };
  } catch (error: any) {
    // Jika Firebase belum dikonfigurasi, log warning tapi jangan crash
    if (error.message?.includes("credentials tidak dikonfigurasi")) {
      console.warn("[FCM] ⚠️ Firebase belum dikonfigurasi, notifikasi dilewati.");
      return { success: false, error: "FCM not configured" };
    }
    console.error("[FCM] Gagal kirim notifikasi:", error);
    return { success: false, error: error.message };
  }
}

// ─── Helper: Kirim ke Token Spesifik (Per User) ───────────────────────────────
/**
 * Kirim notifikasi ke device spesifik berdasarkan FCM token.
 * Digunakan untuk notifikasi personal: "Penawaran Anda Telah Diproses", dll.
 */
export async function sendTokenNotification({
  fcmToken,
  title,
  body,
  data,
}: {
  fcmToken: string;
  title: string;
  body: string;
  data?: Record<string, string>;
}) {
  try {
    const messaging = getAdminMessaging();

    const response = await messaging.send({
      token: fcmToken,
      notification: { title, body },
      data: {
        timestamp: new Date().toISOString(),
        ...data,
      },
      android: {
        priority: "high",
        notification: { channelId: "orders", sound: "default" },
      },
      apns: {
        headers: { "apns-priority": "10" },
        payload: { aps: { sound: "default", badge: 1 } },
      },
    });

    console.log(`[FCM] Token notification terkirim. Message ID: ${response}`);
    return { success: true, messageId: response };
  } catch (error: any) {
    if (error.message?.includes("credentials tidak dikonfigurasi")) {
      console.warn("[FCM] ⚠️ Firebase belum dikonfigurasi, notifikasi dilewati.");
      return { success: false, error: "FCM not configured" };
    }
    console.error("[FCM] Gagal kirim token notification:", error);
    return { success: false, error: error.message };
  }
}

// ─── Preset Notifikasi ────────────────────────────────────────────────────────

/** Dipanggil setelah webhook Accurate mengupdate stok/harga produk */
export async function notifyProductUpdated(productName?: string) {
  return sendTopicNotification({
    topic: FCM_TOPICS.PRODUCT_UPDATE,
    title: "Update Produk",
    body: productName
      ? `${productName} telah diperbarui.`
      : "Data produk terbaru tersedia.",
    data: { action: "REFRESH_PRODUCTS" },
    silent: true, // Tidak ada popup, cukup trigger background refresh
  });
}

/** Dipanggil setelah stok produk berubah via ITEM_QUANTITY webhook */
export async function notifyStockUpdated(productName?: string) {
  return sendTopicNotification({
    topic: FCM_TOPICS.PRODUCT_UPDATE,
    title: "Update Stok",
    body: productName ? `Stok ${productName} telah diperbarui.` : "Stok produk telah diperbarui.",
    data: { action: "REFRESH_PRODUCTS" },
    silent: true,
  });
}

/** Dipanggil saat status quotation/order berubah — dikirim ke user spesifik */
export async function notifyOrderStatusChanged(
  fcmToken: string,
  quotationNo: string,
  newStatus: string
) {
  const statusLabels: Record<string, string> = {
    OFFERED: "Penawaran siap untuk dilihat",
    CONFIRMED: "Pesanan dikonfirmasi",
    PROCESSING: "Pesanan sedang diproses",
    SHIPPED: "Pesanan sedang dikirim",
    COMPLETED: "Pesanan selesai",
  };

  const statusLabel = statusLabels[newStatus] || `Status: ${newStatus}`;

  return sendTokenNotification({
    fcmToken,
    title: `Pembaruan Pesanan #${quotationNo.slice(-8).toUpperCase()}`,
    body: statusLabel,
    data: {
      action: "OPEN_ORDER",
      quotationNo,
      status: newStatus,
    },
  });
}
