import { NextRequest } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(request: NextRequest) {
    const userId = request.nextUrl.searchParams.get("userId");

    if (!userId) {
        return new Response("Missing userId", { status: 400 });
    }

    const encoder = new TextEncoder();
    const sentNotificationIds = new Set<string>(); // Track sent notifications

    const stream = new ReadableStream({
        async start(controller) {
            // Send initial connection message
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: "connected" })}\n\n`));

            // Function to check for new notifications
            const checkNotifications = async () => {
                try {
                    const { db } = await import("@/lib/db");

                    const notifications = await db.notification.findMany({
                        where: {
                            userId: userId,
                            read: false
                        },
                        orderBy: { createdAt: "desc" },
                        take: 5, // Get latest 5 unread
                        select: {
                            id: true,
                            title: true,
                            message: true,
                            type: true,
                            createdAt: true,
                            read: true
                        }
                    });

                    // Send only new notifications that haven't been sent yet
                    for (const notif of notifications) {
                        if (!sentNotificationIds.has(notif.id)) {
                            sentNotificationIds.add(notif.id);
                            controller.enqueue(
                                encoder.encode(`data: ${JSON.stringify({
                                    type: "new_notification",
                                    notification: notif
                                })}\n\n`)
                            );
                        }
                    }
                } catch (error) {
                    console.error("SSE notification check error:", error);
                }
            };

            // Check every 5 seconds for new notifications
            const interval = setInterval(checkNotifications, 5000);

            // Also check immediately after 1 second
            setTimeout(checkNotifications, 1000);

            // Handle client disconnect
            request.signal.addEventListener("abort", () => {
                clearInterval(interval);
                controller.close();
            });
        }
    });

    return new Response(stream, {
        headers: {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no", // Disable nginx buffering
        },
    });
}
