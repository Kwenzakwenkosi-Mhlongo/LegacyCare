"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { getAuth, getAuthHeaders } from "../../../../../lib/auth";

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

  proofOfDeathDocument?: string;
  documentFileName?: string;

  beneficiary?: {
    beneficiaryId?: string;
    fullName?: string;
    idNumber?: string;
    dateOfBirth?: string;
    gender?: string;
    relationship?: string;
    status?: string;
  };

  policy?: {
    policyId?: string;
    status?: string;
  };

  branch?: {
    branchId?: string;
    branchName?: string;
  };

  reportedByUser?: {
    userId?: string;
    fullName?: string;
    email?: string;
  };

  verifiedBy?: {
    userId?: string;
    fullName?: string;
    email?: string;
  };
};

export default function DeathNotificationDetailsPage() {
  const params = useParams();

  const notificationId =
    typeof params?.id === "string"
      ? params.id
      : "";

  const [notification, setNotification] =
    useState<DeathNotification | null>(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [processing, setProcessing] =
    useState(false);

  const [showReject, setShowReject] =
    useState(false);

  const [rejectionReason, setRejectionReason] =
    useState("");

  const [actionMessage, setActionMessage] =
    useState("");

  const [actionError, setActionError] =
    useState("");

  // =========================================================
  // PAGE LOAD
  // =========================================================

  useEffect(() => {
    document.title = "Death Notification";

    if (notificationId) {
      loadNotification();
    }
  }, [notificationId]);

  // =========================================================
  // API BASE URL
  // =========================================================

  const getApiBase = () => {
    return (
      process.env.NEXT_PUBLIC_API_URL ||
      "http://localhost:5224/api"
    );
  };

  // =========================================================
  // LOAD NOTIFICATION
  // =========================================================

  const loadNotification = async () => {
    try {
      setLoading(true);
      setError("");

      const auth = getAuth();

      console.log(
        "[DeathNotificationDetails] Auth:",
        auth
          ? {
              userId: auth.userId,
              role: auth.role,
              hasToken: !!auth.token,
            }
          : null
      );

      if (!auth?.token) {
        setError("You are not authenticated.");
        setLoading(false);
        return;
      }

      const apiBase = getApiBase();

      const url =
        `${apiBase}/DeathNotification/${notificationId}`;

      console.log(
        "[DeathNotificationDetails] GET:",
        url
      );

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Accept: "application/json",
          ...getAuthHeaders(),
        },
      });

      console.log(
        "[DeathNotificationDetails] Response:",
        response.status
      );

      const data =
        await response.json().catch(() => null);

      console.log(
        "[DeathNotificationDetails] Data:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to load death notification. (${response.status})`
        );
      }

      setNotification(data);
    } catch (err) {
      console.error(
        "[DeathNotificationDetails] Error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load death notification."
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================================
  // VIEW PROOF OF DEATH DOCUMENT
  // =========================================================

  const handleViewDocument = async () => {
    if (!notification) {
      return;
    }

    let documentWindow: Window | null = null;

    try {
      setActionError("");
      setActionMessage("");

      const auth = getAuth();

      if (!auth?.token) {
        setActionError(
          "You are not authenticated."
        );
        return;
      }

      /*
       * IMPORTANT:
       *
       * Open the window BEFORE awaiting fetch().
       *
       * This prevents browsers from treating the new tab
       * as a popup and blocking it.
       */
      documentWindow = window.open(
        "",
        "_blank"
      );

      if (!documentWindow) {
        setActionError(
          "The browser blocked the document window. Please allow pop-ups for this site and try again."
        );

        return;
      }

      /*
       * Show temporary loading content while the
       * authenticated document is being downloaded.
       */
      documentWindow.document.write(`
        <!DOCTYPE html>
        <html>
          <head>
            <title>Loading Document...</title>
            <style>
              body {
                margin: 0;
                padding: 40px;
                font-family: Arial, sans-serif;
                background: #f9fafb;
                color: #111827;
                text-align: center;
              }

              .container {
                max-width: 600px;
                margin: 80px auto;
                background: white;
                border: 1px solid #e5e7eb;
                border-radius: 12px;
                padding: 40px;
                box-shadow: 0 2px 8px rgba(0,0,0,0.05);
              }
            </style>
          </head>

          <body>
            <div class="container">
              <h2>Loading Proof of Death</h2>
              <p>
                Please wait while the submitted document is loaded.
              </p>
            </div>
          </body>
        </html>
      `);

      documentWindow.document.close();

      const apiBase = getApiBase();

      const documentUrl =
        `${apiBase}/DeathNotification/${notification.deathNotificationId}/document`;

      console.log(
        "[DeathNotificationDetails] Document URL:",
        documentUrl
      );

      const response = await fetch(
        documentUrl,
        {
          method: "GET",
          headers: {
            Accept:
              "application/pdf,image/jpeg,image/png",
            ...getAuthHeaders(),
          },
        }
      );

      console.log(
        "[DeathNotificationDetails] Document response:",
        response.status
      );

      if (!response.ok) {
        const data =
          await response.json().catch(() => null);

        throw new Error(
          data?.message ||
            `Unable to open document. (${response.status})`
        );
      }

      /*
       * Convert the response into a browser Blob.
       */
      const blob =
        await response.blob();

      console.log(
        "[DeathNotificationDetails] Document blob:",
        {
          type: blob.type,
          size: blob.size,
        }
      );

      if (!blob || blob.size === 0) {
        throw new Error(
          "The document returned by the server is empty."
        );
      }

      /*
       * Create a temporary URL for the document.
       */
      const blobUrl =
        window.URL.createObjectURL(blob);

      /*
       * Navigate the already-opened tab to the document.
       */
      documentWindow.location.href =
        blobUrl;

      /*
       * Keep the object URL alive long enough for
       * the browser to load the document.
       */
      setTimeout(() => {
        window.URL.revokeObjectURL(
          blobUrl
        );
      }, 60000);

      setActionMessage(
        "Proof of death document opened successfully."
      );
    } catch (err) {
      console.error(
        "[DeathNotificationDetails] Document error:",
        err
      );

      if (documentWindow && !documentWindow.closed) {
        documentWindow.close();
      }

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to open proof of death document."
      );
    }
  };

  // =========================================================
  // APPROVE
  // =========================================================

  const handleApprove = async () => {
    if (!notification) {
      return;
    }

    /*
     * IMPORTANT:
     *
     * The backend validates the beneficiary.
     * The frontend does not change the beneficiary status.
     */

    const confirmed = window.confirm(
      "Are you sure you want to approve this death notification?\n\n" +
        "Approving this notification will mark the beneficiary as Deceased."
    );

    if (!confirmed) {
      return;
    }

    try {
      setProcessing(true);
      setActionError("");
      setActionMessage("");

      const auth = getAuth();

      if (!auth?.token) {
        setActionError(
          "You are not authenticated."
        );
        return;
      }

      const apiBase = getApiBase();

      const url =
        `${apiBase}/DeathNotification/${notification.deathNotificationId}/approve`;

      console.log(
        "[DeathNotificationDetails] Approve URL:",
        url
      );

      const response = await fetch(
        url,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      const data =
        await response.json().catch(() => null);

      console.log(
        "[DeathNotificationDetails] Approve:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to approve death notification. (${response.status})`
        );
      }

      setActionMessage(
        data?.message ||
          "Death notification approved successfully."
      );

      await loadNotification();
    } catch (err) {
      console.error(
        "[DeathNotificationDetails] Approve error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to approve death notification."
      );
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // REJECT
  // =========================================================

  const handleReject = async () => {
    if (!notification) {
      return;
    }

    if (!rejectionReason.trim()) {
      setActionError(
        "A rejection reason is required."
      );
      return;
    }

    try {
      setProcessing(true);
      setActionError("");
      setActionMessage("");

      const auth = getAuth();

      if (!auth?.token) {
        setActionError(
          "You are not authenticated."
        );
        return;
      }

      const apiBase = getApiBase();

      const url =
        `${apiBase}/DeathNotification/${notification.deathNotificationId}/reject`;

      console.log(
        "[DeathNotificationDetails] Reject URL:",
        url
      );

      const response = await fetch(
        url,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type":
              "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            reason:
              rejectionReason.trim(),
          }),
        }
      );

      const data =
        await response.json().catch(() => null);

      console.log(
        "[DeathNotificationDetails] Reject:",
        response.status,
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to reject death notification. (${response.status})`
        );
      }

      setActionMessage(
        data?.message ||
          "Death notification rejected successfully."
      );

      setShowReject(false);
      setRejectionReason("");

      await loadNotification();
    } catch (err) {
      console.error(
        "[DeathNotificationDetails] Reject error:",
        err
      );

      setActionError(
        err instanceof Error
          ? err.message
          : "Unable to reject death notification."
      );
    } finally {
      setProcessing(false);
    }
  };

  // =========================================================
  // FORMAT DATE
  // =========================================================

  const formatDate = (
    value?: string
  ) => {
    if (!value) {
      return "—";
    }

    /*
     * Handle SQL Server's default DateTime value.
     *
     * 0001-01-01 means no meaningful DOB was supplied.
     */
    if (
      value.startsWith(
        "0001-01-01"
      )
    ) {
      return "Not provided";
    }

    const date = new Date(value);

    if (
      Number.isNaN(
        date.getTime()
      )
    ) {
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
  // STATUS CLASS
  // =========================================================

  const getStatusClass = (
    status?: string
  ) => {
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
  // LOADING
  // =========================================================

  if (loading) {
    return (
      <div className="space-y-6">

        <Link
          href="/admin/death-notifications"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Death Notifications
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

          <p className="text-sm text-gray-500">
            Loading death notification...
          </p>

        </div>
      </div>
    );
  }

  // =========================================================
  // ERROR / NOT FOUND
  // =========================================================

  if (
    error ||
    !notification
  ) {
    return (
      <div className="space-y-6">

        <Link
          href="/admin/death-notifications"
          className="text-sm font-medium text-gray-600 hover:text-gray-900"
        >
          ← Back to Death Notifications
        </Link>

        <div className="rounded-xl border border-gray-200 bg-white px-6 py-12 text-center shadow-sm">

          <h1 className="text-xl font-semibold text-gray-900">
            {error ===
            "You are not authenticated."
              ? "You are not authenticated"
              : "Death notification not found"}
          </h1>

          <p className="mt-2 text-sm text-gray-500">
            {error ||
              "The requested death notification could not be found."}
          </p>

          <div className="mt-6 flex justify-center gap-3">

            <button
              type="button"
              onClick={
                loadNotification
              }
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Try Again
            </button>

            <Link
              href="/admin/death-notifications"
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
            >
              Back to Notifications
            </Link>

          </div>
        </div>
      </div>
    );
  }

  const isPending =
    notification.status?.toLowerCase() ===
    "pending";

  // =========================================================
  // PAGE
  // =========================================================

  return (
    <div className="space-y-6">

      {/* =====================================================
          BACK
      ===================================================== */}

      <Link
        href="/admin/death-notifications"
        className="inline-flex text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Back to Death Notifications
      </Link>

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

        <div>

          <h1 className="text-2xl font-semibold text-gray-900">
            Death Notification
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Review the submitted death notification.
          </p>

        </div>

        <span
          className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${getStatusClass(
            notification.status
          )}`}
        >
          {notification.status ||
            "Pending"}
        </span>

      </div>

      {/* =====================================================
          SUCCESS MESSAGE
      ===================================================== */}

      {actionMessage && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {actionMessage}
        </div>
      )}

      {/* =====================================================
          ERROR MESSAGE
      ===================================================== */}

      {actionError && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {actionError}
        </div>
      )}

      {/* =====================================================
          REQUEST INFORMATION
      ===================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 px-6 py-4">

          <h2 className="text-lg font-semibold text-gray-900">
            Request Information
          </h2>

        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">

          {/* REQUEST NUMBER */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Request Number
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {notification.requestNumber ||
                "—"}
            </p>

          </div>

          {/* NOTIFICATION ID */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Notification ID
            </p>

            <p className="mt-1 break-all text-sm text-gray-700">
              {notification.deathNotificationId}
            </p>

          </div>

          {/* POLICY ID */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Policy ID
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {notification.policyId ||
                "—"}
            </p>

          </div>

          {/* DATE OF DEATH */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Date of Death
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDate(
                notification.dateOfDeath
              )}
            </p>

          </div>

          {/* DATE REPORTED */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Date Reported
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {formatDate(
                notification.dateReported
              )}
            </p>

          </div>

          {/* BRANCH */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Branch
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {notification.branch?.branchName ||
                notification.branchId ||
                "—"}
            </p>

          </div>

        </div>
      </div>

      {/* =====================================================
          BENEFICIARY INFORMATION
      ===================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 px-6 py-4">

          <h2 className="text-lg font-semibold text-gray-900">
            Beneficiary Information
          </h2>

        </div>

        <div className="grid gap-6 px-6 py-6 sm:grid-cols-2 lg:grid-cols-3">

          {/* BENEFICIARY ID */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Beneficiary ID
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {notification.beneficiary?.beneficiaryId ||
                notification.beneficiaryId ||
                "—"}
            </p>

          </div>

          {/* FULL NAME */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Full Name
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {notification.beneficiary?.fullName ||
                "—"}
            </p>

          </div>

          {/* ID NUMBER */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              ID Number
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {notification.beneficiary?.idNumber ||
                "—"}
            </p>

          </div>

          {/* DATE OF BIRTH */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Date of Birth
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDate(
                notification.beneficiary?.dateOfBirth
              )}
            </p>

          </div>

          {/* GENDER */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Gender
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {notification.beneficiary?.gender ||
                "—"}
            </p>

          </div>

          {/* RELATIONSHIP */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Relationship
            </p>

            <p className="mt-1 text-sm text-gray-700">
              {notification.beneficiary?.relationship ||
                "—"}
            </p>

          </div>

          {/* BENEFICIARY STATUS */}

          <div>

            <p className="text-xs font-medium uppercase text-gray-500">
              Beneficiary Status
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-700">
              {notification.beneficiary?.status ||
                "—"}
            </p>

          </div>

        </div>
      </div>

      {/* =====================================================
          PROOF OF DEATH DOCUMENT
      ===================================================== */}

      <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

        <div className="border-b border-gray-200 px-6 py-4">

          <h2 className="text-lg font-semibold text-gray-900">
            Proof of Death
          </h2>

        </div>

        <div className="px-6 py-6">

          {notification.documentFileName ||
          notification.proofOfDeathDocument ? (

            <div className="space-y-5">

              {/* FILE NAME */}

              <div>

                <p className="text-xs font-medium uppercase text-gray-500">
                  Submitted Document
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {notification.documentFileName ||
                    notification.proofOfDeathDocument}
                </p>

              </div>

              {/* STORED FILE */}

              {notification.proofOfDeathDocument && (
                <div>

                  <p className="text-xs font-medium uppercase text-gray-500">
                    Stored File
                  </p>

                  <p className="mt-1 break-all text-xs text-gray-500">
                    {notification.proofOfDeathDocument}
                  </p>

                </div>
              )}

              {/* VIEW DOCUMENT */}

              <div className="pt-2">

                <button
                  type="button"
                  onClick={
                    handleViewDocument
                  }
                  className="inline-flex items-center gap-2 rounded-lg bg-gray-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-gray-800"
                >
                  <span>
                    📄
                  </span>

                  View Proof of Death
                </button>

              </div>

            </div>

          ) : (

            <div className="rounded-lg border border-yellow-200 bg-yellow-50 px-4 py-4">

              <p className="text-sm font-medium text-yellow-800">
                No proof of death document was submitted.
              </p>

            </div>

          )}

        </div>
      </div>

      {/* =====================================================
          REJECTION REASON
      ===================================================== */}

      {notification.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 shadow-sm">

          <div className="border-b border-red-200 px-6 py-4">

            <h2 className="text-lg font-semibold text-red-900">
              Rejection Reason
            </h2>

          </div>

          <div className="px-6 py-5 text-sm text-red-800">
            {notification.rejectionReason}
          </div>

        </div>
      )}

      {/* =====================================================
          REVIEW ACTIONS
      ===================================================== */}

      {isPending && (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">

          <div className="border-b border-gray-200 px-6 py-4">

            <h2 className="text-lg font-semibold text-gray-900">
              Review Decision
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Approving will mark the beneficiary as
              deceased. Rejecting will leave the
              beneficiary unchanged.
            </p>

          </div>

          <div className="px-6 py-6">

            {/* APPROVE / REJECT BUTTONS */}

            {!showReject ? (

              <div className="flex flex-col gap-3 sm:flex-row">

                <button
                  type="button"
                  disabled={processing}
                  onClick={
                    handleApprove
                  }
                  className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {processing
                    ? "Processing..."
                    : "Approve Death Notification"}
                </button>

                <button
                  type="button"
                  disabled={processing}
                  onClick={() => {
                    setActionError("");
                    setActionMessage("");
                    setShowReject(true);
                  }}
                  className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Reject Death Notification
                </button>

              </div>

            ) : (

              /* REJECTION FORM */

              <div className="space-y-4">

                <div>

                  <label
                    htmlFor="rejectionReason"
                    className="block text-sm font-medium text-gray-700"
                  >
                    Rejection Reason
                  </label>

                  <textarea
                    id="rejectionReason"
                    value={
                      rejectionReason
                    }
                    onChange={(e) =>
                      setRejectionReason(
                        e.target.value
                      )
                    }
                    rows={4}
                    placeholder="Enter the reason for rejecting this death notification..."
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm outline-none focus:border-gray-500 focus:ring-1 focus:ring-gray-500"
                  />

                </div>

                <div className="flex flex-col gap-3 sm:flex-row">

                  <button
                    type="button"
                    disabled={
                      processing ||
                      !rejectionReason.trim()
                    }
                    onClick={
                      handleReject
                    }
                    className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {processing
                      ? "Processing..."
                      : "Confirm Rejection"}
                  </button>

                  <button
                    type="button"
                    disabled={
                      processing
                    }
                    onClick={() => {
                      setShowReject(false);
                      setRejectionReason("");
                      setActionError("");
                    }}
                    className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Cancel
                  </button>

                </div>

              </div>
            )}

          </div>
        </div>
      )}

      {/* =====================================================
          COMPLETED
      ===================================================== */}

      {!isPending && (
        <div className="rounded-xl border border-gray-200 bg-white px-6 py-5 shadow-sm">

          <p className="text-sm text-gray-600">

            This death notification has already been{" "}

            <span className="font-semibold">
              {notification.status?.toLowerCase()}
            </span>

            . No further action is available.

          </p>

        </div>
      )}

    </div>
  );
}