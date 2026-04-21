"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { getUserNotifications, getUnreadNotificationCount } from "@/app/actions/notification";

interface Notification {
    id: string;
    userId: string;
    title: string;
    message: string;
    type: string;
    read: boolean;
    link?: string | null;
    createdAt: string | Date;
}

interface UseNotificationsReturn {
    notifications: Notification[];
    unreadCount: number;
    isLoading: boolean;
    hasMore: boolean;
    page: number;
    total: number;
    loadMore: () => Promise<void>;
    refresh: () => Promise<void>;
    markAsRead: (id: string) => Promise<void>;
    markAllAsRead: () => Promise<void>;
}

export function useNotifications(userId?: string): UseNotificationsReturn {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [total, setTotal] = useState(0);
    const LIMIT = 20;
    const eventSourceRef = useRef<EventSource | null>(null);

    const fetchNotifications = useCallback(async (pageNum: number = 1, append: boolean = false) => {
        setIsLoading(true);
        try {
            const result = await getUserNotifications(pageNum, LIMIT);
            if (result.success && result.notifications) {
                if (append) {
                    setNotifications(prev => [...prev, ...result.notifications]);
                } else {
                    setNotifications(result.notifications);
                }
                setTotal(result.total || 0);
            }
        } catch (error) {
            console.error("Error fetching notifications:", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const result = await getUnreadNotificationCount();
            if (result.success) {
                setUnreadCount(result.count || 0);
            }
        } catch (error) {
            console.error("Error fetching unread count:", error);
        }
    }, []);

    const refresh = useCallback(async () => {
        setPage(1);
        await fetchNotifications(1, false);
        await fetchUnreadCount();
    }, [fetchNotifications, fetchUnreadCount]);

    const loadMore = useCallback(async () => {
        const nextPage = page + 1;
        await fetchNotifications(nextPage, true);
        setPage(nextPage);
    }, [page, fetchNotifications]);

    const markAsRead = useCallback(async (id: string) => {
        const { markNotificationAsRead } = await import("@/app/actions/notification");
        await markNotificationAsRead(id);
        setNotifications(prev =>
            prev.map(n => n.id === id ? { ...n, read: true } : n)
        );
        setUnreadCount(prev => Math.max(0, prev - 1));
    }, []);

    const markAllAsRead = useCallback(async () => {
        const { markAllNotificationsAsRead } = await import("@/app/actions/notifications");
        await markAllNotificationsAsRead();
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        setUnreadCount(0);
    }, []);

    // Setup SSE for real-time notifications
    useEffect(() => {
        if (!userId) return;

        let eventSource: EventSource | null = null;

        const setupSSE = () => {
            // Only setup if tab is visible
            if (document.visibilityState !== "visible") return;

            // Close existing connection if any
            if (eventSource) {
                eventSource.close();
            }

            console.log("Setting up SSE connection...");
            eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log("SSE connection opened");
            };

            eventSource.onerror = (error) => {
                console.error("SSE connection error:", error);
                if (eventSource) eventSource.close();
                // Try to reconnect after 10 seconds (increased from 5)
                setTimeout(() => {
                    if (document.visibilityState === "visible") setupSSE();
                }, 10000);
            };

            eventSource.addEventListener("message", (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === "new_notification" && data.notification) {
                        const newNotif = data.notification;
                        setNotifications(prev => {
                            const exists = prev.some(n => n.id === newNotif.id);
                            if (!exists) return [newNotif, ...prev];
                            return prev;
                        });
                        
                        setUnreadCount(prev => prev + 1);
                        setTotal(prev => prev + 1);
                        
                        if (Notification.permission === "granted") {
                            new Notification(newNotif.title, {
                                body: newNotif.message,
                                icon: "/logo-H.png"
                            });
                        }
                    }
                } catch (error) {
                    console.error("Error processing SSE message:", error);
                }
            });
        };

        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                setupSSE();
            } else {
                if (eventSource) {
                    console.log("Closing SSE connection due to tab hidden");
                    eventSource.close();
                    eventSource = null;
                    eventSourceRef.current = null;
                }
            }
        };

        setupSSE();
        document.addEventListener("visibilitychange", handleVisibilityChange);

        return () => {
            if (eventSource) {
                eventSource.close();
            }
            document.removeEventListener("visibilitychange", handleVisibilityChange);
        };
    }, [userId]);

    // Initial fetch
    useEffect(() => {
        refresh();
    }, [refresh]);

    // Focus event - refresh when user comes back to tab
    useEffect(() => {
        const handleVisibilityChange = () => {
            if (document.visibilityState === "visible") {
                refresh();
            }
        };

        document.addEventListener("visibilitychange", handleVisibilityChange);
        return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
    }, [refresh]);

    // Request notification permission
    useEffect(() => {
        if ("Notification" in window && Notification.permission === "default") {
            Notification.requestPermission();
        }
    }, []);

    const hasMore = notifications.length < total;

    return {
        notifications,
        unreadCount,
        isLoading,
        hasMore,
        page,
        total,
        loadMore,
        refresh,
        markAsRead,
        markAllAsRead
    };
}
