"use client";
import { useNotifications } from "./NotificationContext";
import Toast from "./Toast";

export default function ToastContainer() {
    const { notifications } = useNotifications();

    const visibleNotifications = notifications.filter(
        (notification) => notification.visible
    );

    if (visibleNotifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-3">
            {visibleNotifications.map((notification) => (
                <Toast
                    key={notification.id}
                    title={notification.title}
                    type={notification.type}
                    message={notification.message}
                />
            ))}
        </div>
    );
}