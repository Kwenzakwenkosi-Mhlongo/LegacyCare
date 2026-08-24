"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { getAuth, getAuthHeaders } from "@/lib/auth";

type DeathNotification = {
  deathNotificationId: string;
  requestNumber?: string;
  policyId?: string;
  beneficiaryId?: string;
  dateOfDeath?: string;
  dateReported?: string;
  status?: string;
  branchId?: string;
  rejectionReason?: string | null;

  beneficiary?: {
    beneficiaryId?: string;
    fullName?: string;
    idNumber?: string;
  };

  policy?: {
    policyId?: string;
  };

  branch?: {
    branchId?: string;
    branchName?: string;
  };
};

export default function DeathNotificationsPage() {
  const [notifications, setNotifications] = useState<
    DeathNotification[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // PAGE LOAD
  // =========================================================

  useEffect(() => {
    document.title = "Death Notifications";
    loadNotifications();
  }, []);

  // =========================================================
  // LOAD DEATH NOTIFICATIONS
  // =========================================================

  const loadNotifications = async () => {
    try {
      setLoading(true);
      setError("");

      // =====================================================
      // GET AUTHENTICATION
      // =====================================================

      const auth = getAuth();

      console.log(
        "[DeathNotifications] Authenticated:",
        !!auth
      );

      console.log(
        "[DeathNotifications] Role:",
        auth?.role
      );

      console.log(
        "[DeathNotifications] User ID:",
        auth?.userId
      );

      console.log(
        "[DeathNotifications] Token exists:",
        !!auth?.token
      );

      // =====================================================
      // NOT AUTHENTICATED
      // =====================================================

      if (!auth?.token) {
        setError(
          "You are not authenticated. Please log in again."
        );

        return;
      }

      // =====================================================
      // API BASE URL
      // =====================================================

      const apiBase =
        process.env.NEXT_PUBLIC_API_URL ||
         "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api";

      const url =
        `${apiBase}/DeathNotification`;

      console.log(
        "[DeathNotifications] GET:",
        url
      );

      // =====================================================
      // API REQUEST
      // =====================================================

      const response = await fetch(url, {
        method: "GET",

        headers: {
          Accept: "application/json",

          ...getAuthHeaders(),
        },

        cache: "no-store",
      });

      console.log(
        "[DeathNotifications] Response:",
        response.status
      );

      // =====================================================
      // UNAUTHORIZED
      // =====================================================

      if (response.status === 401) {
        setError(
          "Your session has expired or you are not authenticated. Please log in again."
        );

        return;
      }

      // =====================================================
      // FORBIDDEN
      // =====================================================

      if (response.status === 403) {
        setError(
          `You do not have permission to view death notifications. Your current role is "${auth.role}".`
        );

        return;
      }

      // =====================================================
      // OTHER ERROR
      // =====================================================

      if (!response.ok) {
        const data =
          await response.json().catch(() => null);

        throw new Error(
          data?.message ||
            `Unable to load death notifications. (${response.status})`
        );
      }

      // =====================================================
      // READ RESPONSE
      // =====================================================

      const data = await response.json();

      console.log(
        "[DeathNotifications] Data:",
        data
      );

      if (Array.isArray(data)) {
        setNotifications(data);
      } else {
        setNotifications([]);
      }
    } catch (err) {
      console.error(
        "[DeathNotifications] Error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load death notifications."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    value?: string
  ): string => {
    if (!value) {
      return "—";
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return "—";
    }

    return date.toLocaleDateString(
      "en-ZA",
      {
        year: "numeric",
        month: "short",
        day: "numeric",
      }
    );
  };

  // =========================================================
  // STATUS STYLE
  // =========================================================

  const getStatusClass = (
    status?: string
  ): string => {
    switch (
      status?.toLowerCase()
    ) {
      case "approved":
        return "bg-green-100 text-green-700";

      case "rejected":
        return "bg-red-100 text-red-700";

      case "pending":
        return "bg-yellow-100 text-yellow-700";

      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <div>
        <h1 className="text-2xl font-semibold text-gray-900">
          Death Notifications
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review and manage client death notifications.
        </p>
      </div>

      {/* =====================================================
          ERROR
      ===================================================== */}

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* =====================================================
          CONTENT CARD
      ===================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        {/* ===================================================
            CARD HEADER
        =================================================== */}

        <div className="flex flex-col gap-3 border-b border-gray-200 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">

          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Death Notification Requests
            </h2>

            <p className="text-sm text-gray-500">
              {notifications.length} notification
              {notifications.length === 1
                ? ""
                : "s"}
            </p>
          </div>

          <button
            type="button"
            onClick={loadNotifications}
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Loading..."
              : "Refresh"}
          </button>

        </div>

        {/* ===================================================
            LOADING
        =================================================== */}

        {loading ? (

          <div className="px-6 py-12 text-center text-sm text-gray-500">
            Loading death notifications...
          </div>

        ) : notifications.length === 0 ? (

          /* =================================================
             EMPTY
          ================================================= */

          <div className="px-6 py-12 text-center">

            <h3 className="text-base font-semibold text-gray-900">
              No death notifications
            </h3>

            <p className="mt-1 text-sm text-gray-500">
              There are currently no death notifications to review.
            </p>

          </div>

        ) : (

          /* =================================================
             TABLE
          ================================================= */

          <div className="overflow-x-auto">

            <table className="min-w-full divide-y divide-gray-200">

              <thead className="bg-gray-50">

                <tr>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Request
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Beneficiary
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">
                    Policy
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500">
                    Date of Death
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500">
                    Date Reported
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-semibold tracking-wider text-gray-500">
                    Status
                  </th>

                  <th className="px-6 py-3 text-right text-xs font-semibold tracking-wider text-gray-500">
                    Action
                  </th>

                </tr>

              </thead>

              <tbody className="divide-y divide-gray-200 bg-white">

                {notifications.map(
                  (notification) => (

                    <tr
                      key={
                        notification.deathNotificationId
                      }
                      className="hover:bg-gray-50"
                    >

                      {/* REQUEST */}

                      <td className="whitespace-nowrap px-6 py-4">

                        <div className="text-sm font-medium text-gray-900">
                          {notification.requestNumber ||
                            "—"}
                        </div>

                        <div className="mt-1 text-xs text-gray-500">
                          {notification.deathNotificationId}
                        </div>

                      </td>

                      {/* BENEFICIARY */}

                      <td className="whitespace-nowrap px-6 py-4">

                        <div className="text-sm font-medium text-gray-900">
                          {notification.beneficiary
                            ?.fullName ||
                            notification.beneficiaryId ||
                            "—"}
                        </div>

                        {notification.beneficiary
                          ?.idNumber && (

                          <div className="mt-1 text-xs text-gray-500">
                            ID:{" "}
                            {
                              notification
                                .beneficiary
                                .idNumber
                            }
                          </div>

                        )}

                      </td>

                      {/* POLICY */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {notification.policyId ||
                          "—"}
                      </td>

                      {/* DATE OF DEATH */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatDate(
                          notification.dateOfDeath
                        )}
                      </td>

                      {/* DATE REPORTED */}

                      <td className="whitespace-nowrap px-6 py-4 text-sm text-gray-700">
                        {formatDate(
                          notification.dateReported
                        )}
                      </td>

                      {/* STATUS */}

                      <td className="whitespace-nowrap px-6 py-4">

                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusClass(
                            notification.status
                          )}`}
                        >
                          {notification.status ||
                            "Pending"}
                        </span>

                      </td>

                      {/* ACTION */}

                      <td className="whitespace-nowrap px-6 py-4 text-right">

                        <Link
                          href={`/admin/death-notifications/${notification.deathNotificationId}`}
                          className="inline-flex rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-gray-800"
                        >
                          View
                        </Link>

                      </td>

                    </tr>

                  )
                )}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
}