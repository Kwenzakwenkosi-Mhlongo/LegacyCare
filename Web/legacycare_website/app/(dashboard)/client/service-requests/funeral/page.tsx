// ============================================================================
// File:
// Web/legacycare_website/app/(dashboard)/client/service-requests/funeral/page.tsx
// ============================================================================

"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import { getToken } from "@/lib/auth";

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
  requestNumber?: string | null;
  policyId?: string | null;
  beneficiaryId?: string | null;
  beneficiaryName?: string | null;
  dateOfDeath?: string | null;
  dateReported?: string | null;
  status?: string | number | null;
  branchId?: string | null;
  rejectionReason?: string | null;

  beneficiary?: {
    beneficiaryId?: string | null;
    fullName?: string | null;
  } | null;
};

type FuneralRequest = {
  funeralRequestId: string;
  deathNotificationId: string;
  status?: string | number | null;
};

function normalizeStatus(
  value?: string | number | null
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function isDeathApproved(
  status?: string | number | null
): boolean {
  const value =
    normalizeStatus(status);

  return (
    value === "approved" ||
    value === "1"
  );
}

function isDeathPending(
  status?: string | number | null
): boolean {
  const value =
    normalizeStatus(status);

  return (
    value === "pending" ||
    value === "0"
  );
}

function isDeathRejected(
  status?: string | number | null
): boolean {
  const value =
    normalizeStatus(status);

  return (
    value === "rejected" ||
    value === "2"
  );
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function getBeneficiaryName(
  notification: DeathNotification
): string {
  return (
    notification.beneficiaryName ||
    notification.beneficiary?.fullName ||
    notification.beneficiaryId ||
    notification.beneficiary?.beneficiaryId ||
    "Beneficiary"
  );
}

function extractErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (
    data &&
    typeof data === "object" &&
    "message" in data
  ) {
    const message =
      (
        data as {
          message?: unknown;
        }
      ).message;

    if (
      typeof message ===
      "string"
    ) {
      return message;
    }
  }

  if (
    typeof data ===
    "string"
  ) {
    return data;
  }

  return fallback;
}

export default function FuneralPage() {
  const [
    notifications,
    setNotifications,
  ] =
    useState<
      DeathNotification[]
    >([]);

  const [
    funeralRequests,
    setFuneralRequests,
  ] =
    useState<
      FuneralRequest[]
    >([]);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const loadFuneralData =
    useCallback(
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError("");

          const token =
            getToken();

          if (!token) {
            throw new Error(
              "You are not logged in."
            );
          }

          const headers = {
            Accept:
              "application/json",

            Authorization:
              `Bearer ${token}`,
          };

          const [
            deathResponse,
            funeralResponse,
          ] =
            await Promise.all([
              fetch(
                `${API_URL}/DeathNotification/client`,
                {
                  method: "GET",
                  headers,
                  cache: "no-store",
                }
              ),

              fetch(
                `${API_URL}/FuneralRequest/client`,
                {
                  method: "GET",
                  headers,
                  cache: "no-store",
                }
              ),
            ]);

          const deathData =
            await deathResponse
              .json()
              .catch(() => null);

          if (
            !deathResponse.ok
          ) {
            throw new Error(
              extractErrorMessage(
                deathData,
                `Unable to load death notifications (${deathResponse.status}).`
              )
            );
          }

          const funeralData =
            await funeralResponse
              .json()
              .catch(() => null);

          if (
            !funeralResponse.ok
          ) {
            throw new Error(
              extractErrorMessage(
                funeralData,
                `Unable to check existing funeral requests (${funeralResponse.status}).`
              )
            );
          }

          setNotifications(
            Array.isArray(
              deathData
            )
              ? deathData
              : []
          );

          setFuneralRequests(
            Array.isArray(
              funeralData
            )
              ? funeralData
              : []
          );
        } catch (err) {
          console.error(
            "[Funeral] LOAD ERROR:",
            err
          );

          setNotifications([]);
          setFuneralRequests([]);

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load funeral information."
          );
        } finally {
          setLoading(false);
        }
      },
      []
    );

  useEffect(() => {
    document.title =
      "Funeral Arrangements | LegacyCare";

    void loadFuneralData();
  }, [loadFuneralData]);

  const funeralByDeathId =
    useMemo(() => {
      const map =
        new Map<
          string,
          FuneralRequest
        >();

      for (
        const funeral of
        funeralRequests
      ) {
        map.set(
          String(
            funeral.deathNotificationId
          ).toLowerCase(),
          funeral
        );
      }

      return map;
    }, [funeralRequests]);

  const eligibleNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            isDeathApproved(
              notification.status
            ) &&
            !funeralByDeathId.has(
              String(
                notification.deathNotificationId
              ).toLowerCase()
            )
        ),
      [
        notifications,
        funeralByDeathId,
      ]
    );

  const pendingNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            isDeathPending(
              notification.status
            )
        ),
      [notifications]
    );

  const rejectedNotifications =
    useMemo(
      () =>
        notifications.filter(
          (notification) =>
            isDeathRejected(
              notification.status
            )
        ),
      [notifications]
    );

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Funeral Arrangements
          </h1>

          <p className="mt-1 max-w-2xl text-sm leading-6 text-gray-500">
            Start a funeral arrangement after a death notification has been approved.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() =>
              void loadFuneralData()
            }
            disabled={loading}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            ↻ Refresh
          </button>

          <Link
            href="/client/service-requests"
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            ← Service Requests
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-semibold text-blue-900">
          ⚰️ Funeral request process
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          A funeral arrangement can only be started after the related death
          notification has been approved. After submission, LegacyCare reviews
          the request, assigns the required operational staff and then approves
          or rejects the funeral arrangement.
        </p>
      </div>

      <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <p className="font-semibold text-teal-900">
              📋 Looking for an existing funeral request?
            </p>

            <p className="mt-1 text-sm leading-6 text-teal-700">
              Your current and previous funeral requests are already available
              under My Requests together with their latest status and history.
            </p>
          </div>

          <Link
            href="/client/service-requests"
            className="inline-flex w-fit shrink-0 rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
          >
            View My Requests →
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-56 rounded bg-gray-200" />
            <div className="h-4 w-full max-w-lg rounded bg-gray-200" />
            <div className="h-32 rounded-xl bg-gray-100" />
          </div>
        </div>
      ) : null}

      {!loading &&
      error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-900">
            ⚠️ Unable to load funeral information
          </h2>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              void loadFuneralData()
            }
            className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
          >
            Try Again
          </button>
        </div>
      ) : null}

      {!loading &&
      !error ? (
        <>
          <section className="rounded-2xl border border-green-200 bg-white shadow-sm">
            <div className="border-b border-green-100 bg-green-50 p-6">
              <h2 className="text-lg font-semibold text-green-900">
                ✅ Ready for Funeral Arrangement
              </h2>

              <p className="mt-1 text-sm text-green-700">
                Approved death notifications that do not yet have a funeral request.
              </p>
            </div>

            {eligibleNotifications.length ===
            0 ? (
              <div className="p-6">
                <p className="text-sm font-medium text-gray-700">
                  No funeral arrangements are ready to start.
                </p>

                <p className="mt-1 text-sm text-gray-500">
                  This may mean there are no approved death notifications waiting,
                  or a funeral request has already been created for them.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {eligibleNotifications.map(
                  (notification) => (
                    <article
                      key={
                        notification.deathNotificationId
                      }
                      className="p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {getBeneficiaryName(
                              notification
                            )}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Death notification:{" "}
                            {notification.requestNumber ||
                              notification.deathNotificationId}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Date of death:{" "}
                            {formatDate(
                              notification.dateOfDeath
                            )}
                          </p>

                          {notification.policyId ? (
                            <p className="mt-1 text-sm text-gray-500">
                              Policy:{" "}
                              {
                                notification.policyId
                              }
                            </p>
                          ) : null}
                        </div>

                        <Link
                          href={`/client/service-requests/funeral/${encodeURIComponent(
                            notification.deathNotificationId
                          )}`}
                          className="inline-flex w-fit rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                        >
                          Start Funeral Arrangement →
                        </Link>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>

          {pendingNotifications.length >
          0 ? (
            <section className="rounded-2xl border border-amber-200 bg-white shadow-sm">
              <div className="border-b border-amber-100 bg-amber-50 p-6">
                <h2 className="font-semibold text-amber-900">
                  ⏳ Awaiting Death Notification Approval
                </h2>

                <p className="mt-1 text-sm text-amber-700">
                  These reports must be approved before a funeral arrangement
                  can be started.
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {pendingNotifications.map(
                  (notification) => (
                    <article
                      key={
                        notification.deathNotificationId
                      }
                      className="p-6"
                    >
                      <div className="flex flex-wrap items-center justify-between gap-4">
                        <div>
                          <p className="font-medium text-gray-900">
                            {getBeneficiaryName(
                              notification
                            )}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            {notification.requestNumber ||
                              notification.deathNotificationId}
                          </p>

                          <p className="mt-1 text-sm text-gray-500">
                            Date of death:{" "}
                            {formatDate(
                              notification.dateOfDeath
                            )}
                          </p>
                        </div>

                        <span className="rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                          Pending Approval
                        </span>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          ) : null}

          {rejectedNotifications.length >
          0 ? (
            <section className="rounded-2xl border border-red-200 bg-white shadow-sm">
              <div className="border-b border-red-100 bg-red-50 p-6">
                <h2 className="font-semibold text-red-900">
                  ❌ Rejected Death Notifications
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  Funeral arrangements cannot be started from rejected death notifications.
                </p>
              </div>

              <div className="divide-y divide-gray-100">
                {rejectedNotifications.map(
                  (notification) => (
                    <article
                      key={
                        notification.deathNotificationId
                      }
                      className="p-6"
                    >
                      <p className="font-medium text-gray-900">
                        {getBeneficiaryName(
                          notification
                        )}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        {notification.requestNumber ||
                          notification.deathNotificationId}
                      </p>

                      <p className="mt-1 text-sm text-gray-500">
                        Date of death:{" "}
                        {formatDate(
                          notification.dateOfDeath
                        )}
                      </p>

                      {notification.rejectionReason ? (
                        <div className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
                          <span className="font-medium">
                            Reason:
                          </span>{" "}
                          {
                            notification.rejectionReason
                          }
                        </div>
                      ) : null}
                    </article>
                  )
                )}
              </div>
            </section>
          ) : null}

          {notifications.length ===
            0 ? (
            <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
              <div className="text-4xl">
                🕊️
              </div>

              <h2 className="mt-4 text-lg font-semibold text-gray-900">
                Death notification required
              </h2>

              <p className="mx-auto mt-2 max-w-lg text-sm leading-6 text-gray-500">
                Report a death first. After LegacyCare approves the death
                notification, you can return here and start the funeral arrangement.
              </p>

              <Link
                href="/client/service-requests/death"
                className="mt-5 inline-flex rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
              >
                🕊️ Report a Death
              </Link>
            </section>
          ) : null}
        </>
      ) : null}
    </div>
  );
}