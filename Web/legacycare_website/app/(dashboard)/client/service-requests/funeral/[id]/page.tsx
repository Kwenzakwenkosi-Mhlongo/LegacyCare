"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5224/api";

type DeathNotification = {
  deathNotificationId: string;
  requestNumber: string;
  dateOfDeath: string;
  status: string;
  beneficiary?: {
    beneficiaryId: string;
    fullName: string;
  } | null;
};

const funeralTypes = [
  {
    value: "Standard",
    label: "Standard Funeral",
    description:
      "Our standard funeral service, suitable for most arrangements.",
  },
  {
    value: "Large",
    label: "Large Funeral",
    description:
      "For larger gatherings requiring additional staff and coordination.",
  },
];

export default function FuneralArrangementPage() {
  const router = useRouter();
  const params = useParams();

  // This is the Death Notification ID (from the button's URL).
  const deathNotificationId = String(params?.id ?? "");

  const [notification, setNotification] =
    useState<DeathNotification | null>(null);

  const [loadingNotification, setLoadingNotification] =
    useState(true);

  const [funeralDate, setFuneralDate] = useState("");
  const [funeralTime, setFuneralTime] = useState("");
  const [venue, setVenue] = useState("");
  const [funeralType, setFuneralType] = useState("Standard");
  const [notes, setNotes] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  function getAuthToken() {
    return getToken();
  }

  // =========================================================
  // LOAD DEATH NOTIFICATION (for display + status confirmation)
  // =========================================================

  useEffect(() => {
    if (!deathNotificationId) return;

    const loadNotification = async () => {
      try {
        setLoadingNotification(true);
        setError("");

        const token = getAuthToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/DeathNotification/${deathNotificationId}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load death notification (${response.status}).`
          );
        }

        setNotification(data);

        if (data.status !== "Approved") {
          setError(
            "This death notification has not been approved yet. Funeral arrangements can only be made after approval."
          );
        }
      } catch (err) {
        console.error("Load death notification error:", err);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load death notification."
        );
      } finally {
        setLoadingNotification(false);
      }
    };

    loadNotification();
  }, [deathNotificationId, router]);

  // =========================================================
  // SUBMIT
  // =========================================================

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    setError("");

    if (!funeralDate) {
      setError("Please select a funeral date.");
      return;
    }

    if (!funeralTime) {
      setError("Please select a funeral time.");
      return;
    }

    if (!venue.trim()) {
      setError("Please provide a venue.");
      return;
    }

    const funeralDateTime = new Date(
      `${funeralDate}T${funeralTime}:00`
    );

    if (Number.isNaN(funeralDateTime.getTime())) {
      setError("Invalid date or time.");
      return;
    }

    if (funeralDateTime.getTime() <= Date.now()) {
      setError("The funeral date and time must be in the future.");
      return;
    }

    setSubmitting(true);

    try {
      const token = getAuthToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      // ========================================================
      // IMPORTANT:
      // Backend FuneralTime is a TimeSpan. ASP.NET Core's default
      // JSON binder expects the "c" format: "HH:mm:ss".
      // ========================================================

      const timeWithSeconds = `${funeralTime}:00`;

      const response = await fetch(`${API_URL}/FuneralRequest`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          deathNotificationId,
          funeralDate: `${funeralDate}T00:00:00`,
          funeralTime: timeWithSeconds,
          venue: venue.trim(),
          funeralType,
          notes: notes.trim() || null,
        }),
      });

      const data = await response.json().catch(() => null);

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to submit funeral request (${response.status}).`
        );
      }

      setSuccess(
        "Your funeral arrangement request has been submitted. LegacyCare will review it shortly."
      );

      setTimeout(() => {
        router.push("/client/service-requests");
      }, 1500);
    } catch (err) {
      console.error("Funeral request error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit funeral request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  // =========================================================
  // LOADING
  // =========================================================

  if (loadingNotification) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-5">
            <div className="h-7 w-64 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-200" />
            <div className="h-32 rounded-xl bg-gray-200" />
          </div>
        </div>
      </div>
    );
  }

  const notApproved =
    notification != null && notification.status !== "Approved";

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* HEADER */}

      <div>
        <button
          type="button"
          onClick={() =>
            router.push("/client/service-requests")
          }
          className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Service Requests
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">
          Funeral Arrangement
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          {notification?.beneficiary
            ? `Provide the details for ${notification.beneficiary.fullName}'s funeral.`
            : "Provide the details for the funeral arrangement."}
        </p>
      </div>

      {/* DEATH NOTIFICATION SUMMARY */}

      {notification && (
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Beneficiary
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {notification.beneficiary?.fullName ||
                  notification.beneficiary?.beneficiaryId ||
                  "Not available"}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Death Notification
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {notification.requestNumber}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Death Date
              </p>
              <p className="mt-1 font-medium text-gray-900">
                {new Date(notification.dateOfDeath).toLocaleDateString(
                  "en-ZA",
                  { day: "2-digit", month: "short", year: "numeric" }
                )}
              </p>
            </div>

            <div>
              <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                Status
              </p>
              <p className="mt-1 font-medium text-green-700">
                {notification.status}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* NOT APPROVED — BLOCK THE FORM */}

      {notApproved && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-5">
          <p className="text-sm font-medium text-amber-800">
            This death notification has not been approved yet.
            Funeral arrangements can only be made after approval.
          </p>
        </div>
      )}

      {/* ERROR */}

      {error && !notApproved && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">
          <p className="text-sm font-medium text-red-700">{error}</p>
        </div>
      )}

      {/* SUCCESS */}

      {success && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <p className="text-sm font-medium text-green-700">
            {success}
          </p>
        </div>
      )}

      {/* FORM */}

      {!notApproved && !success && (
        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
        >
          {/* FUNERAL TYPE */}

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Funeral Type
            </label>

            <div className="mt-3 space-y-3">
              {funeralTypes.map((type) => (
                <label
                  key={type.value}
                  className={`block cursor-pointer rounded-xl border p-4 transition ${
                    funeralType === type.value
                      ? "border-teal-500 bg-teal-50"
                      : "border-gray-200 hover:border-teal-300"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="radio"
                      name="funeralType"
                      value={type.value}
                      checked={funeralType === type.value}
                      onChange={(e) =>
                        setFuneralType(e.target.value)
                      }
                      className="mt-1"
                    />

                    <div>
                      <p className="font-medium text-gray-900">
                        {type.label}
                      </p>
                      <p className="mt-1 text-sm text-gray-500">
                        {type.description}
                      </p>
                    </div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* DATE */}

          <div className="mt-6">
            <label
              htmlFor="funeralDate"
              className="block text-sm font-medium text-gray-700"
            >
              Funeral Date
            </label>

            <input
              id="funeralDate"
              type="date"
              value={funeralDate}
              min={new Date().toISOString().split("T")[0]}
              onChange={(e) => setFuneralDate(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* TIME */}

          <div className="mt-6">
            <label
              htmlFor="funeralTime"
              className="block text-sm font-medium text-gray-700"
            >
              Funeral Time
            </label>

            <input
              id="funeralTime"
              type="time"
              value={funeralTime}
              onChange={(e) => setFuneralTime(e.target.value)}
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* VENUE */}

          <div className="mt-6">
            <label
              htmlFor="venue"
              className="block text-sm font-medium text-gray-700"
            >
              Venue
            </label>

            <input
              id="venue"
              type="text"
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="e.g. St. Mary's Church, 12 Main Road, Johannesburg"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* NOTES */}

          <div className="mt-6">
            <label
              htmlFor="notes"
              className="block text-sm font-medium text-gray-700"
            >
              Additional Notes
            </label>

            <textarea
              id="notes"
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any special requests or information LegacyCare should know..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />
          </div>

          {/* ERROR (inside form, for submit-time errors) */}

          {error && (
            <div className="mt-6 rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm font-medium text-red-700">
                {error}
              </p>
            </div>
          )}

          {/* BUTTONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={() =>
                router.push("/client/service-requests")
              }
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting ? "Submitting..." : "Submit Funeral Request"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}