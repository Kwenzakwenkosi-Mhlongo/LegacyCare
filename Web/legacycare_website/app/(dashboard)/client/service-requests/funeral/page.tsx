"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
   "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api";

type DeathNotification = {
  deathNotificationId: string;
  requestNumber?: string | null;
  policyId?: string | null;
  beneficiaryId?: string | null;
  beneficiaryName?: string | null;
  dateOfDeath?: string | null;
  dateReported?: string | null;
  status: string;
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
  funeralDate?: string | null;
  funeralTime?: string | null;
  venue?: string | null;
  funeralType?: string | null;
  notes?: string | null;
  status?: string | null;
  rejectionReason?: string | null;
  createdDate?: string | null;
};

function formatDate(date?: string | null) {
  if (!date) return "Unknown";

  return new Date(date).toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function FuneralPage() {
  const [notifications, setNotifications] = useState<
    DeathNotification[]
  >([]);

  const [funeralRequests, setFuneralRequests] = useState<
    FuneralRequest[]
  >([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // =========================================================
  // LOAD DEATH NOTIFICATIONS + FUNERAL REQUESTS
  // =========================================================

  const loadFuneralData = async () => {
    try {
      setLoading(true);
      setError("");

      const token = getToken();

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const headers = {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Load both at the same time
      const [deathResponse, funeralResponse] =
        await Promise.all([
          fetch(`${API_URL}/DeathNotification/client`, {
            method: "GET",
            headers,
          }),

          fetch(`${API_URL}/FuneralRequest/client`, {
            method: "GET",
            headers,
          }),
        ]);

      // =====================================================
      // DEATH NOTIFICATIONS
      // =====================================================

      const deathData = await deathResponse
        .json()
        .catch(() => null);

      if (!deathResponse.ok) {
        throw new Error(
          deathData?.message ||
            `Unable to check death notification status (${deathResponse.status}).`
        );
      }

      // =====================================================
      // FUNERAL REQUESTS
      // =====================================================

      const funeralData = await funeralResponse
        .json()
        .catch(() => null);

      if (!funeralResponse.ok) {
        throw new Error(
          funeralData?.message ||
            `Unable to check existing funeral arrangements (${funeralResponse.status}).`
        );
      }

      console.log(
        "[Funeral] Death Notifications:",
        deathData
      );

      console.log(
        "[Funeral] Existing Funeral Requests:",
        funeralData
      );

      setNotifications(
        Array.isArray(deathData)
          ? deathData
          : []
      );

      setFuneralRequests(
        Array.isArray(funeralData)
          ? funeralData
          : []
      );
    } catch (err) {
      console.error(
        "[Funeral] Error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load funeral information."
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFuneralData();
  }, []);

  // =========================================================
  // FIND APPROVED NOTIFICATION
  // =========================================================

  const approvedNotification =
    notifications.find(
      (notification) =>
        notification.status
          ?.toLowerCase()
          .trim() === "approved"
    );

  // =========================================================
  // FIND PENDING NOTIFICATION
  // =========================================================

  const pendingNotification =
    notifications.find(
      (notification) =>
        notification.status
          ?.toLowerCase()
          .trim() === "pending"
    );

  // =========================================================
  // FIND REJECTED NOTIFICATION
  // =========================================================

  const rejectedNotification =
    notifications.find(
      (notification) =>
        notification.status
          ?.toLowerCase()
          .trim() === "rejected"
    );

  // =========================================================
  // CHECK WHETHER FUNERAL ALREADY EXISTS
  //
  // IMPORTANT:
  // Match the FuneralRequest to the approved
  // DeathNotification using DeathNotificationId.
  // =========================================================

  const existingFuneral =
    approvedNotification
      ? funeralRequests.find(
          (funeral) =>
            String(
              funeral.deathNotificationId
            ).toLowerCase() ===
            String(
              approvedNotification.deathNotificationId
            ).toLowerCase()
        )
      : undefined;

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <div className="space-y-8">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Funeral Arrangements
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Begin the funeral arrangement process after your
            Death Notification has been approved.
          </p>
        </div>

        <Link
          href="/client/service-requests"
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Service Requests
        </Link>
      </div>

      {/* =====================================================
          LOADING
      ===================================================== */}

      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-4">
            <div className="h-6 w-56 rounded bg-gray-200" />

            <div className="h-4 w-96 max-w-full rounded bg-gray-200" />

            <div className="h-12 w-32 rounded bg-gray-200" />
          </div>
        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-4">

            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-100 text-xl">
              ⚠️
            </div>

            <div>
              <h2 className="font-semibold text-red-900">
                Unable to load funeral information
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={loadFuneralData}
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700"
              >
                Try Again
              </button>
            </div>

          </div>
        </div>
      )}

      {/* =====================================================
          CONTENT
      ===================================================== */}

      {!loading && !error && (
        <>

          {/* =================================================
              APPROVED
          ================================================= */}

          {approvedNotification && (
            <div className="rounded-2xl border border-green-200 bg-white shadow-sm">

              <div className="border-b border-green-100 bg-green-50 p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-green-100 text-2xl">
                    ✓
                  </div>

                  <div>
                    <h2 className="text-lg font-semibold text-green-900">
                      Death Notification Approved
                    </h2>

                    <p className="mt-1 text-sm text-green-700">
                      Your Death Notification has been approved.
                      You can now proceed with the funeral
                      arrangement process.
                    </p>
                  </div>

                </div>
              </div>

              <div className="p-6">

                {/* =================================================
                    DETAILS
                ================================================= */}

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Beneficiary
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {approvedNotification.beneficiaryName ||
                        approvedNotification.beneficiary?.fullName ||
                        approvedNotification.beneficiaryId ||
                        approvedNotification.beneficiary?.beneficiaryId ||
                        "Unknown"}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Death Date
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {formatDate(
                        approvedNotification.dateOfDeath
                      )}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Death Notification
                    </p>

                    <p className="mt-1 font-semibold text-gray-900">
                      {approvedNotification.requestNumber ||
                        approvedNotification.deathNotificationId}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Status
                    </p>

                    <span className="mt-1 inline-flex rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                      Approved
                    </span>
                  </div>

                </div>

                {/* =================================================
                    FUNERAL STATUS
                ================================================= */}

                <div className="mt-8 border-t border-gray-200 pt-6">

                  <h3 className="font-semibold text-gray-900">
                    Funeral Arrangement
                  </h3>

                  {/* =================================================
                      FUNERAL ALREADY EXISTS
                  ================================================= */}

                  {existingFuneral ? (
                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-5">

                      <div className="flex items-start gap-3">

                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-100 text-lg">
                          ✓
                        </div>

                        <div>
                          <p className="font-semibold text-blue-900">
                            Funeral data already exists
                          </p>

                          <p className="mt-1 text-sm text-blue-700">
                            A funeral arrangement has already
                            been created for this Death Notification.
                          </p>
                        </div>

                      </div>

                      {/* OPTIONAL DETAILS */}

                      <div className="mt-4 grid grid-cols-1 gap-3 border-t border-blue-200 pt-4 sm:grid-cols-2">

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                            Funeral Status
                          </p>

                          <p className="mt-1 text-sm font-semibold text-blue-900">
                            {existingFuneral.status ||
                              "Pending"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                            Funeral Type
                          </p>

                          <p className="mt-1 text-sm font-semibold text-blue-900">
                            {existingFuneral.funeralType ||
                              "Not specified"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                            Funeral Date
                          </p>

                          <p className="mt-1 text-sm font-semibold text-blue-900">
                            {formatDate(
                              existingFuneral.funeralDate
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs font-medium uppercase tracking-wide text-blue-600">
                            Venue
                          </p>

                          <p className="mt-1 text-sm font-semibold text-blue-900">
                            {existingFuneral.venue ||
                              "Not specified"}
                          </p>
                        </div>

                      </div>

                    </div>
                  ) : (
                    /* =================================================
                       NO FUNERAL EXISTS
                    ================================================= */

                    <>
                      <p className="mt-1 text-sm text-gray-500">
                        Your Death Notification has been approved.
                        You may now provide the information required
                        for the funeral arrangement.
                      </p>

                      <Link
                        href={`/client/service-requests/funeral/${approvedNotification.deathNotificationId}`}
                        className="mt-5 inline-flex items-center rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                      >
                        Start Funeral Arrangement →
                      </Link>
                    </>
                  )}

                </div>

              </div>
            </div>
          )}

          {/* =================================================
              PENDING
          ================================================= */}

          {!approvedNotification &&
            pendingNotification && (
              <div className="rounded-2xl border border-amber-200 bg-white shadow-sm">

                <div className="p-8 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 text-3xl">
                    ⏳
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-gray-900">
                    Funeral arrangements are not available yet
                  </h2>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
                    You can only begin the funeral arrangement
                    process once your Death Notification has been
                    approved by an Admin or Clerk.
                  </p>

                  <div className="mx-auto mt-6 max-w-md rounded-xl border border-amber-200 bg-amber-50 p-5 text-left">

                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                      Death Notification Status
                    </p>

                    <div className="mt-2 flex items-center justify-between gap-3">

                      <span className="text-sm font-semibold text-gray-900">
                        {pendingNotification.requestNumber ||
                          pendingNotification.deathNotificationId}
                      </span>

                      <span className="shrink-0 rounded-full border border-amber-200 bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-700">
                        Pending Approval
                      </span>

                    </div>

                    <p className="mt-3 text-sm text-gray-600">
  Beneficiary:{" "}
  <span className="font-medium text-gray-900">
    {pendingNotification.beneficiaryName ||
      pendingNotification.beneficiary?.fullName ||
      pendingNotification.beneficiaryId ||
      pendingNotification.beneficiary?.beneficiaryId ||
      "Unknown"}
  </span>
</p>

                  </div>

                  <p className="mt-6 text-xs text-gray-500">
                    An Admin or Clerk must review and approve the
                    Death Notification before funeral arrangements
                    can begin.
                  </p>

                  <Link
                    href="/client/service-requests"
                    className="mt-6 inline-flex rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    ← Back to Service Requests
                  </Link>

                </div>
              </div>
            )}

          {/* =================================================
              REJECTED
          ================================================= */}

          {!approvedNotification &&
            !pendingNotification &&
            rejectedNotification && (
              <div className="rounded-2xl border border-red-200 bg-white shadow-sm">

                <div className="p-8 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-3xl">
                    !
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-gray-900">
                    Funeral arrangements cannot begin
                  </h2>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
                    Your Death Notification was not approved.
                    Please contact LegacyCare or submit a new
                    Death Notification if appropriate.
                  </p>

                  <div className="mx-auto mt-6 max-w-md rounded-xl border border-red-200 bg-red-50 p-5 text-left">

                    <p className="text-xs font-medium uppercase tracking-wide text-red-700">
                      Death Notification Status
                    </p>

                    <div className="mt-2 flex items-center justify-between">

                      <span className="text-sm font-semibold text-gray-900">
                        {rejectedNotification.requestNumber ||
                          rejectedNotification.deathNotificationId}
                      </span>

                      <span className="rounded-full border border-red-200 bg-red-100 px-3 py-1 text-xs font-semibold text-red-700">
                        Rejected
                      </span>

                    </div>

                    {rejectedNotification.rejectionReason && (
                      <p className="mt-3 text-sm text-red-700">
                        Reason:{" "}
                        <span className="font-medium">
                          {rejectedNotification.rejectionReason}
                        </span>
                      </p>
                    )}

                  </div>

                  <Link
                    href="/client/service-requests"
                    className="mt-6 inline-flex rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                  >
                    ← Back to Service Requests
                  </Link>

                </div>
              </div>
            )}

          {/* =================================================
              NO DEATH NOTIFICATION
          ================================================= */}

          {!approvedNotification &&
            !pendingNotification &&
            !rejectedNotification && (
              <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

                <div className="p-8 text-center">

                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 text-3xl">
                    🕊️
                  </div>

                  <h2 className="mt-5 text-xl font-semibold text-gray-900">
                    Death Notification required
                  </h2>

                  <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-gray-600">
                    You can only begin the funeral arrangement
                    process once a Death Notification has been
                    submitted and approved by an Admin or Clerk.
                  </p>

                  <Link
                    href="/client/service-requests/death"
                    className="mt-6 inline-flex rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                  >
                    Report a Death
                  </Link>

                  <div>
                    <Link
                      href="/client/service-requests"
                      className="mt-3 inline-flex rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
                    >
                      ← Back to Service Requests
                    </Link>
                  </div>

                </div>
              </div>
            )}

        </>
      )}
    </div>
  );
}