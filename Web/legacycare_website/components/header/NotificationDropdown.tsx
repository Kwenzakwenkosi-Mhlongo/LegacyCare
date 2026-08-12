"use client";

import { useState } from "react";
import { Dropdown } from "../ui/dropdown/Dropdown";
import { DropdownItem } from "../ui/dropdown/DropdownItem";
import { useNotifications } from "../notifications/NotificationContext";

export default function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const {
    notifications,
    markAsRead,
    markAllAsRead,
    clearNotifications,
  } = useNotifications();

  const unreadCount = notifications.filter(
    (notification) => !notification.read).length;

 
  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        className="relative dropdown-toggle flex items-center justify-center text-gray-500 transition-colors bg-white border border-gray-200 rounded-full hover:text-gray-700 h-11 w-11 hover:bg-gray-100 dark:border-gray-800 dark:bg-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔔
        {unreadCount > 0 && (
          <span
          className="absolute right-1 -top-1 flex h-5 w-5 items-center justify-center  rounded-full bg-red-500 text-xs text-white">
          {unreadCount > 99 ? "99+": unreadCount}
          </span>
        )}
      </button>

      <Dropdown
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      className="w-96"
      >

        {/* Header */}
        <div className="flex items-center justify-between border-b p-4">
          <h3 className="font-semibold">Notifications</h3>

          <div className="flex gap-3 text-sm">
            <button
            onClick={markAllAsRead}
            className="text-teal-600 hover:underline"
            >
              Mark All As Read
              </button>

              <button
              onClick={clearNotifications}
              className="text-red-500 hover:underline"
              >
                Clear
              </button>
          </div>
        </div>

        {/* Body */}
        <div className="max-h-96 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              No Notifications
            </div>
            ) : (
              notifications.map((notification) => (
                <DropdownItem
                key={notification.id}
                onClick={() => markAsRead(notification.id)}
                className={`border-b ${notification.read
                  ? ""
                  : "bg-blue-50 dark:bg-blue-900/20"
                }`}
                >
                  <div className="flex justify-between">
                    <span className="font-medium">
                      {notification.title}
                    </span>

                    {!notification.read && (
                      <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                    )}
                  </div>

                  <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    {notification.message}
                  </p>

                  <p className="mt-2 text-xs text-gray-400">
                    {notification.createdAt.toLocaleTimeString()}
                  </p>
                </DropdownItem>
              ))
            )}
        </div>
      </Dropdown>
    </div>
  );
}
