"use client";
import { createContext, useContext, useState, ReactNode, useCallback, useRef } from "react";

export interface Notification {
    id: number;
    title: string;
    message: string;
    type: "success" | "warning" | "error" | "info";
    createdAt: Date;
    read: boolean;
    visible: boolean;
}

interface NotificationContextType {
    notifications: Notification[];
    unreadCount: number;
    addNotification: (
        Notification: Omit<
            Notification,
            "id" | "createdAt" | "read" | "visible"
        >
    ) => void;
    markAsRead: (id: number) => void;
    markAllAsRead: () => void;
    clearNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | null>(null);

export function NotificationProvider({
    children,
}: {
    children: ReactNode;
}) {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const timeoutIdsRef = useRef<Record<number, NodeJS.Timeout>>({});

    const addNotification = useCallback((
        notification: Omit<Notification,
            "id" | "createdAt" | "read" | "visible"
        >
    ) => {
        const id = Date.now() + Math.random();

        const newNotification: Notification = {
            ...notification,
            id,
            createdAt: new Date(),
            read: false,
            visible: true,
        };

        setNotifications((previous) => [
            newNotification,
            ...previous,
        ]);

        // Clear existing timeout for this id (if any)
        if (timeoutIdsRef.current[id]) {
            clearTimeout(timeoutIdsRef.current[id]);
            delete timeoutIdsRef.current[id];
        }

        // Hide Toast after 4 seconds
        const timeoutId = setTimeout(() => {
            setNotifications((previous) =>
                previous.map((notification) =>
                    notification.id === id ? {
                        ...notification,
                        visible: false,
                    } : notification
                )
            );
            // Remove from timeoutIds after hiding
            if (timeoutIdsRef.current[id]) {
                delete timeoutIdsRef.current[id];
            }
        }, 4000);

        timeoutIdsRef.current[id] = timeoutId;

    }, []);

    function markAsRead(id: number) {
        setNotifications((previous) =>
            previous.map((notification) =>
                notification.id === id ?
                    {
                        ...notification,
                        read: true,
                    } : notification
            ));
    }

    function markAllAsRead() {
        setNotifications((previous) =>
            previous.map((notification) => ({
                ...notification,
                read: true,
            }))
        );
    }

    function clearNotifications() {
        // Clear all timeouts
        Object.values(timeoutIdsRef.current).forEach((timeoutId) => {
            clearTimeout(timeoutId);
        });
        timeoutIdsRef.current = {};
        setNotifications([]);
    }

    const unreadCount = notifications.filter(
        (notification) => !notification.read
    ).length;

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                unreadCount,
                addNotification,
                markAsRead,
                markAllAsRead,
                clearNotifications,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
}

export function useNotifications() {
    const context = useContext(NotificationContext);

    if (!context) {
        throw new Error("useNotifications must be used inside NotificationProvider");
    }
    return context;
}