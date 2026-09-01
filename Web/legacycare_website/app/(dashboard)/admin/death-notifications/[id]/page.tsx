"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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
  dateReported?: string;
  status?: string;
  rejectionReason?: string | null;

  relationshipToDeceased?: string | null;
  contactPerson?: string | null;
  contactNumber?: string | null;

  bodyLocationType?: string | null;
  bodyLocationAddress?: string | null;
  mortuaryName?: string | null;
  storageId?: string | null;
  storageUnitNumber?: string | null;
  collectionDate?: string | null;
  collectionNotes?: string | null;

  documentFileName?: string | null;

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
    startDate?: string;
    endDate?: string | null;
  };

  branch?: {
    branchId?: string;
    branchName?: string;
    address?: string;
    contactNo?: string;
    email?: string;
  };

  reportedByUser?: {
    userId?: string;
    fullName?: string;
    email?: string;
  };

  verifiedByUser?: {
    userId?: string;
    fullName?: string;
    email?: string;
  };
};

type StorageUnit = {
  storageId: string;
  unitNumber: string;
  branchId: string;
  isAvailable: boolean;
  isCurrentSelection?: boolean;
};

type CustodyForm = {
  storageId: string;
  collectionDate: string;
  collectionNotes: string;
};

function InfoItem({
  label,
  value,
  strong = false,
  breakAll = false,
}: {
  label: string;
  value?: string | null;
  strong?: boolean;
  breakAll?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-gray-500">{label}</p>
      <p
        className={`mt-1 text-sm text-gray-800 ${
          strong ? "font-semibold" : ""
        } ${breakAll ? "break-all" : ""}`}
      >
        {value?.trim() || "Not provided"}
      </p>
    </div>
  );
}

function formatDate(value?: string | null) {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";

  return date.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function formatDateTime(value?: string | null) {
  if (!value) return "Not provided";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not provided";

  return date.toLocaleString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTimeLocal(value?: string | null) {
  if (!value) return "";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  const pad = (n: number) => String(n).padStart(2, "0");

  return (
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(
      date.getDate()
    )}T${pad(date.getHours())}:${pad(date.getMinutes())}`
  );
}

function formatLocationType(value?: string | null) {
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

function statusClass(status?: string | null) {
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

export default function DeathNotificationDetailsPage() {
  const params = useParams();
  const notificationId = typeof params?.id === "string" ? params.id : "";

  const [notification, setNotification] =
    useState<DeathNotification | null>(null);
  const [storageUnits, setStorageUnits] = useState<StorageUnit[]>([]);

  const [loading, setLoading] = useState(true);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [savingCustody, setSavingCustody] = useState(false);

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const [showCustodyForm, setShowCustodyForm] = useState(false);
  const [showReject, setShowReject] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");

  const [custodyForm, setCustodyForm] = useState<CustodyForm>({
    storageId: "",
    collectionDate: "",
    collectionNotes: "",
  });

  const loadNotification = async () => {
    if (!notificationId) return;

    try {
      setLoading(true);
      setError("");

      const auth = getAuth();
      if (!auth?.token) {
        throw new Error("You are not authenticated.");
      }

      const response = await fetch(
        `${API_URL}/DeathNotification/${notificationId}`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            `Unable to load death notification. (${response.status})`
        );
      }

      setNotification(data);

      setCustodyForm({
        storageId: data?.storageId || "",
        collectionDate: formatDateTimeLocal(data?.collectionDate),
        collectionNotes: data?.collectionNotes || "",
      });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load death notification."
      );
    } finally {
      setLoading(false);
    }
  };

  const loadStorageUnits = async () => {
    if (!notificationId) return;

    try {
      setLoadingStorage(true);
      setError("");

      const response = await fetch(
        `${API_URL}/DeathNotification/${notificationId}/available-storage-units`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
          cache: "no-store",
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to load available storage units. (${response.status})`
        );
      }

      setStorageUnits(Array.isArray(data) ? data : []);
    } catch (err) {
      setStorageUnits([]);
      setError(
        err instanceof Error
          ? err.message
          : "Unable to load available storage units."
      );
    } finally {
      setLoadingStorage(false);
    }
  };

  useEffect(() => {
    document.title = "Death Notification";
    void loadNotification();
  }, [notificationId]);

  const openCustodyForm = async () => {
    if (!notification) return;

    setMessage("");
    setError("");

    setCustodyForm({
      storageId: notification.storageId || "",
      collectionDate: formatDateTimeLocal(notification.collectionDate),
      collectionNotes: notification.collectionNotes || "",
    });

    setShowCustodyForm(true);
    await loadStorageUnits();
  };

  const saveIntoLegacyCare = async () => {
    if (!notification) return;

    const alreadyAtLegacyCare =
      notification.bodyLocationType === "LegacyCareMortuary";

    if (!custodyForm.storageId) {
      setError("Please select an available storage unit.");
      return;
    }

    if (!alreadyAtLegacyCare && !custodyForm.collectionDate) {
      setError(
        "Collection date and time are required when collecting the body into LegacyCare custody."
      );
      return;
    }

    try {
      setSavingCustody(true);
      setError("");
      setMessage("");

      const payload = {
        bodyLocationType: "LegacyCareMortuary",
        bodyLocationAddress: notification.branch?.address || null,
        mortuaryName:
          notification.branch?.branchName || "LegacyCare Mortuary",
        storageId: custodyForm.storageId,
        collectionDate: custodyForm.collectionDate
          ? new Date(custodyForm.collectionDate).toISOString()
          : null,
        collectionNotes: custodyForm.collectionNotes.trim() || null,
      };

      const response = await fetch(
        `${API_URL}/DeathNotification/${notification.deathNotificationId}/body-location`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            `Unable to update body location. (${response.status})`
        );
      }

      setMessage(
        alreadyAtLegacyCare
          ? "Storage unit assigned successfully."
          : "Body collected into LegacyCare custody and storage unit assigned successfully."
      );

      setShowCustodyForm(false);
      await loadNotification();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to update body location."
      );
    } finally {
      setSavingCustody(false);
    }
  };

  const handleApprove = async () => {
    if (!notification) return;

    if (
      notification.bodyLocationType !== "LegacyCareMortuary" ||
      !notification.storageId
    ) {
      setError(
        "The body must be received into LegacyCare custody and assigned to a storage unit before approval."
      );
      return;
    }

    if (
      !window.confirm(
        "Approve this death notification? The beneficiary will be marked as Deceased."
      )
    ) {
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/DeathNotification/${notification.deathNotificationId}/approve`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            ...getAuthHeaders(),
          },
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            `Unable to approve death notification. (${response.status})`
        );
      }

      setMessage(data?.message || "Death notification approved.");
      await loadNotification();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to approve death notification."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!notification) return;

    if (!rejectionReason.trim()) {
      setError("A rejection reason is required.");
      return;
    }

    try {
      setProcessing(true);
      setError("");
      setMessage("");

      const response = await fetch(
        `${API_URL}/DeathNotification/${notification.deathNotificationId}/reject`,
        {
          method: "PUT",
          headers: {
            Accept: "application/json",
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify({
            reason: rejectionReason.trim(),
          }),
        }
      );

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            data?.title ||
            `Unable to reject death notification. (${response.status})`
        );
      }

      setMessage(data?.message || "Death notification rejected.");
      setShowReject(false);
      setRejectionReason("");
      await loadNotification();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to reject death notification."
      );
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDocument = async () => {
    if (!notification) return;

    const popup = window.open("", "_blank");

    try {
      if (!popup) {
        throw new Error("Please allow pop-ups to view the document.");
      }

      const response = await fetch(
        `${API_URL}/DeathNotification/${notification.deathNotificationId}/document`,
        {
          headers: {
            ...getAuthHeaders(),
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Unable to open document. (${response.status})`);
      }

      const blob = await response.blob();
      const url = URL.createObjectURL(blob);

      popup.location.href = url;

      window.setTimeout(() => URL.revokeObjectURL(url), 60_000);
    } catch (err) {
      popup?.close();
      setError(
        err instanceof Error ? err.message : "Unable to open document."
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/death-notifications"
          className="text-sm font-medium text-gray-600"
        >
          ← Back to Death Notifications
        </Link>

        <div className="rounded-xl border bg-white p-10 text-center text-sm text-gray-500">
          Loading death notification...
        </div>
      </div>
    );
  }

  if (error && !notification) {
    return (
      <div className="space-y-6">
        <Link
          href="/admin/death-notifications"
          className="text-sm font-medium text-gray-600"
        >
          ← Back to Death Notifications
        </Link>

        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
          {error}
        </div>
      </div>
    );
  }

  if (!notification) return null;

  const pending = notification.status?.toLowerCase() === "pending";
  const alreadyAtLegacyCare =
    notification.bodyLocationType === "LegacyCareMortuary";

  return (
    <div className="space-y-6">
      <Link
        href="/admin/death-notifications"
        className="inline-flex text-sm font-medium text-gray-600 hover:text-gray-900"
      >
        ← Back to Death Notifications
      </Link>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Death Notification
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Review the report, receive the body into LegacyCare custody and
            approve or reject the notification.
          </p>
        </div>

        <span
          className={`inline-flex w-fit rounded-full px-4 py-2 text-sm font-semibold ${statusClass(
            notification.status
          )}`}
        >
          {notification.status || "Pending"}
        </span>
      </div>

      {message && (
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
          {message}
        </div>
      )}

      {error && notification && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Death Notification Information</h2>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem label="Request Number" value={notification.requestNumber} strong />
          <InfoItem label="Notification ID" value={notification.deathNotificationId} breakAll />
          <InfoItem label="Policy ID" value={notification.policyId} />
          <InfoItem label="Date of Death" value={formatDate(notification.dateOfDeath)} strong />
          <InfoItem label="Date Reported" value={formatDate(notification.dateReported)} />
          <InfoItem label="Branch" value={notification.branch?.branchName || notification.branch?.branchId} />
          <InfoItem label="Branch Address" value={notification.branch?.address} />
          <InfoItem label="Branch Contact" value={notification.branch?.contactNo} />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Death Notification Contact</h2>
          <p className="mt-1 text-sm text-gray-500">
            Contact information supplied when the death was reported.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Relationship to Deceased"
            value={notification.relationshipToDeceased}
            strong
          />
          <InfoItem
            label="Contact Person"
            value={notification.contactPerson}
            strong
          />
          <InfoItem
            label="Contact Number"
            value={notification.contactNumber}
            strong
          />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Beneficiary Information</h2>
          <p className="mt-1 text-sm text-gray-500">
            The beneficiary remains Alive while this notification is Pending.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Beneficiary ID"
            value={notification.beneficiary?.beneficiaryId || notification.beneficiaryId}
          />
          <InfoItem label="Full Name" value={notification.beneficiary?.fullName} strong />
          <InfoItem label="ID Number" value={notification.beneficiary?.idNumber} />
          <InfoItem
            label="Date of Birth"
            value={formatDate(notification.beneficiary?.dateOfBirth)}
          />
          <InfoItem label="Gender" value={notification.beneficiary?.gender} />
          <InfoItem label="Relationship" value={notification.beneficiary?.relationship} />
          <InfoItem label="Beneficiary Status" value={notification.beneficiary?.status} strong />
        </div>
      </section>

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Client Reported Body Location</h2>
          <p className="mt-1 text-sm text-gray-500">
            This is the location reported by the client until LegacyCare collects
            and receives the body.
          </p>
        </div>

        <div className="grid gap-6 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <InfoItem
            label="Current Location Type"
            value={formatLocationType(notification.bodyLocationType)}
            strong
          />
          <InfoItem
            label="Address / Location"
            value={notification.bodyLocationAddress}
          />
          <InfoItem label="Mortuary Name" value={notification.mortuaryName} />
          <InfoItem
            label="Storage Unit"
            value={
              notification.storageUnitNumber
                ? `Unit ${notification.storageUnitNumber}`
                : "Not assigned"
            }
          />
          <InfoItem
            label="Collection Date"
            value={formatDateTime(notification.collectionDate)}
          />
          <InfoItem
            label="Collection Notes"
            value={notification.collectionNotes || "No collection notes"}
          />
        </div>

        {pending && (
          <div className="border-t border-gray-200 p-6">
            <button
              type="button"
              onClick={() => void openCustodyForm()}
              className="rounded-lg bg-gray-900 px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              {alreadyAtLegacyCare
                ? notification.storageId
                  ? "Change Storage Unit"
                  : "Assign Storage Unit"
                : "Collect Body Into LegacyCare"}
            </button>
          </div>
        )}
      </section>

      {showCustodyForm && pending && (
        <section className="rounded-xl border border-teal-200 bg-white shadow-sm">
          <div className="border-b border-teal-100 px-6 py-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {alreadyAtLegacyCare
                ? "Assign LegacyCare Storage"
                : "Collect Body Into LegacyCare"}
            </h2>

            {!alreadyAtLegacyCare && (
              <p className="mt-1 text-sm text-gray-500">
                The reported location is{" "}
                <strong>{formatLocationType(notification.bodyLocationType)}</strong>
                {notification.bodyLocationAddress
                  ? ` — ${notification.bodyLocationAddress}`
                  : ""}.
              </p>
            )}
          </div>

          <div className="space-y-5 p-6">
            {!alreadyAtLegacyCare && (
              <div>
                <label
                  htmlFor="collectionDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Collection Date & Time
                </label>

                <input
                  id="collectionDate"
                  type="datetime-local"
                  value={custodyForm.collectionDate}
                  onChange={(event) =>
                    setCustodyForm((current) => ({
                      ...current,
                      collectionDate: event.target.value,
                    }))
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                  required
                />

                <p className="mt-1 text-xs text-gray-500">
                  Required when the body is collected from outside LegacyCare.
                </p>
              </div>
            )}

            <div>
              <label
                htmlFor="storageId"
                className="block text-sm font-medium text-gray-700"
              >
                Storage Unit
              </label>

              <select
                id="storageId"
                value={custodyForm.storageId}
                onChange={(event) =>
                  setCustodyForm((current) => ({
                    ...current,
                    storageId: event.target.value,
                  }))
                }
                disabled={loadingStorage}
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm disabled:bg-gray-100"
              >
                <option value="">
                  {loadingStorage
                    ? "Loading storage units..."
                    : "Select an available storage unit"}
                </option>

                {storageUnits.map((unit) => (
                  <option key={unit.storageId} value={unit.storageId}>
                    Unit {unit.unitNumber}
                    {unit.isCurrentSelection ? " — Current selection" : ""}
                  </option>
                ))}
              </select>

              {!loadingStorage && storageUnits.length === 0 && (
                <p className="mt-2 text-xs text-amber-700">
                  No available storage units were found for this branch.
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="collectionNotes"
                className="block text-sm font-medium text-gray-700"
              >
                Collection Notes
              </label>

              <textarea
                id="collectionNotes"
                rows={4}
                value={custodyForm.collectionNotes}
                onChange={(event) =>
                  setCustodyForm((current) => ({
                    ...current,
                    collectionNotes: event.target.value,
                  }))
                }
                placeholder="Collection, transfer or receiving notes"
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              />
            </div>

            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
              After saving, the current body location becomes{" "}
              <strong>LegacyCare Mortuary</strong> and the selected storage unit
              is reserved.
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => void saveIntoLegacyCare()}
                disabled={savingCustody || loadingStorage}
                className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-700 disabled:opacity-50"
              >
                {savingCustody
                  ? "Saving..."
                  : alreadyAtLegacyCare
                    ? "Save Storage Unit"
                    : "Confirm Collection & Storage"}
              </button>

              <button
                type="button"
                onClick={() => setShowCustodyForm(false)}
                disabled={savingCustody}
                className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </section>
      )}

      <section className="rounded-xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b px-6 py-4">
          <h2 className="text-lg font-semibold">Proof of Death</h2>
        </div>

        <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900">
              {notification.documentFileName || "Submitted document"}
            </p>
            <p className="mt-1 text-xs text-gray-500">
              Open the submitted proof before approving the notification.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void handleViewDocument()}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            View Document
          </button>
        </div>
      </section>

      {notification.rejectionReason && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-semibold text-red-800">Rejection Reason</p>
          <p className="mt-2 text-sm text-red-700">
            {notification.rejectionReason}
          </p>
        </div>
      )}

      {pending && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">Review Decision</h2>

          <p className="mt-1 text-sm text-gray-500">
            Approval requires the body to be in LegacyCare custody with an
            assigned storage unit.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => void handleApprove()}
              disabled={processing}
              className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-green-700 disabled:opacity-50"
            >
              {processing ? "Processing..." : "Approve"}
            </button>

            <button
              type="button"
              onClick={() => {
                setError("");
                setShowReject((value) => !value);
              }}
              disabled={processing}
              className="rounded-lg bg-red-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
            >
              Reject
            </button>
          </div>

          {showReject && (
            <div className="mt-5 max-w-2xl">
              <label
                htmlFor="rejectionReason"
                className="block text-sm font-medium text-gray-700"
              >
                Rejection Reason
              </label>

              <textarea
                id="rejectionReason"
                rows={4}
                value={rejectionReason}
                onChange={(event) => setRejectionReason(event.target.value)}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                placeholder="Explain why the notification is being rejected"
              />

              <div className="mt-3 flex gap-3">
                <button
                  type="button"
                  onClick={() => void handleReject()}
                  disabled={processing}
                  className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-50"
                >
                  Confirm Rejection
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setShowReject(false);
                    setRejectionReason("");
                  }}
                  disabled={processing}
                  className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
