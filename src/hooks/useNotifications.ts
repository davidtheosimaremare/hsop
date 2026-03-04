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

        const setupSSE = () => {
            // Close existing connection if any
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }

            const eventSource = new EventSource(`/api/notifications/stream?userId=${userId}`);
            eventSourceRef.current = eventSource;

            eventSource.onopen = () => {
                console.log("SSE connection opened");
            };

            eventSource.onerror = (error) => {
                console.error("SSE connection error:", error);
                eventSource.close();
                // Try to reconnect after 5 seconds
                setTimeout(setupSSE, 5000);
            };

            eventSource.addEventListener("message", (event) => {
                try {
                    const data = JSON.parse(event.data);
                    
                    if (data.type === "new_notification" && data.notification) {
                        // Add new notification to the list
                        const newNotif = data.notification;
                        setNotifications(prev => {
                            // Check if notification already exists
                            const exists = prev.some(n => n.id === newNotif.id);
                            if (!exists) {
                                return [newNotif, ...prev];
                            }
                            return prev;
                        });
                        
                        // Only increment if this is a truly new notification
                        setUnreadCount(prev => {
                            // Check if already counted
                            const alreadyCounted = notifications.some(n => n.id === newNotif.id);
                            if (!alreadyCounted) {
                                return prev + 1;
                            }
                            return prev;
                        });
                        setTotal(prev => {
                            const alreadyExists = notifications.some(n => n.id === newNotif.id);
                            if (!alreadyExists) {
                                return prev + 1;
                            }
                            return prev;
                        });
                        
                        // Optional: Show browser notification
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

        setupSSE();

        return () => {
            if (eventSourceRef.current) {
                eventSourceRef.current.close();
            }
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
