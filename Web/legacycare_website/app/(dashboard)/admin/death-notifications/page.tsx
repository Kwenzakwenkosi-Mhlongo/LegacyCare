"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getAuth, getAuthHeaders } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type DeathNotification = {
  deathNotificationId: string;
  requestNumber?: string;
  policyId?: string;
  beneficiaryId?: string;
  dateOfDeath?: string;
  bodyLocationType?: string;
  bodyLocationAddress?: string;
  status?: string;

  beneficiary?: {
    fullName?: string;
    idNumber?: string;
  };
};

function formatDate(value?: string) {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatLocation(value?: string) {
  switch (value?.trim().toLowerCase()) {
    case "legacycaremortuary":
    case "mortuary":
      return "LegacyCare Mortuary";
    case "governmentmortuary":
    case "government":
      return "Government Mortuary";
    case "homescene":
    case "home":
    case "scene":
      return "Home / Scene";
    case "hospital":
      return "Hospital";
    case "other":
      return "Other";
    default:
      return value || "Not provided";
  }
}

function statusClass(status?: string) {
  switch (status?.toLowerCase()) {
    case "approved":
      return "bg-green-100 text-green-700";
    case "rejected":
      return "bg-red-100 text-red-700";
    case "pending":
      return "bg-yellow-100 text-yellow-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function DeathNotificationsPage() {
  const [notifications, setNotifications] = useState<DeathNotification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = getAuth();

      if (!auth?.token) {
        throw new Error("You are not authenticated. Please log in again.");
      }

      const response = await fetch(`${API_URL}/DeathNotification`, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...getAuthHeaders(),
        },
        cache: "no-store",
      });

      const data = await response.json().catch(() => null);

      if (response.status === 401) {
        throw new Error("Your session has expired. Please log in again.");
      }

      if (response.status === 403) {
        throw new Error(
          `You do not have permission to view death notifications. Current role: ${auth.role}.`
        );
      }

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to load death notifications. (${response.status})`
        );
      }

      setNotifications(Array.isArray(data) ? data : []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load death notifications."
      );
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Death Notifications";
    void loadNotifications();
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Death Notifications
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review client death reports, body location and approval status.
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Death Notification Requests
            </h2>
            <p className="text-sm text-gray-500">
              {notifications.length} notification
              {notifications.length === 1 ? "" : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadNotifications()}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {loading ? "Loading..." : "Refresh"}
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-sm text-gray-500">
            Loading death notifications...
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-12 text-center">
            <h3 className="font-semibold text-gray-900">
              No death notifications
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              There are no death notifications to review.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Request
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Beneficiary
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Policy
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Body Location
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Date of Death
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase text-gray-500">
                    Action
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-200">
                {notifications.map((notification) => (
                  <tr
                    key={notification.deathNotificationId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.requestNumber || "—"}
                      </p>
                      <p className="mt-1 max-w-48 truncate text-xs text-gray-500">
                        {notification.deathNotificationId}
                      </p>
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {notification.beneficiary?.fullName ||
                          notification.beneficiaryId ||
                          "—"}
                      </p>

                      {notification.beneficiary?.idNumber && (
                        <p className="mt-1 text-xs text-gray-500">
                          ID: {notification.beneficiary.idNumber}
                        </p>
                      )}
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {notification.policyId || "—"}
                    </td>

                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-gray-900">
                        {formatLocation(notification.bodyLocationType)}
                      </p>
                      <p className="mt-1 max-w-xs text-xs text-gray-500">
                        {notification.bodyLocationAddress || "—"}
                      </p>
                    </td>

                    <td className="px-6 py-4 text-sm text-gray-700">
                      {formatDate(notification.dateOfDeath)}
                    </td>

                    <td className="px-6 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
                          notification.status
                        )}`}
                      >
                        {notification.status || "Pending"}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <Link
                        href={`/admin/death-notifications/${notification.deathNotificationId}`}
                        className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                      >
                        View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
