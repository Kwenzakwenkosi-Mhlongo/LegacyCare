"use client";

import { useEffect, useState } from "react";
import {
  useSearchParams,
  useRouter,
} from "next/navigation";
import { getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api";
type ServiceRequest = {
  serviceRequestId: number;
  clientId: string | number;
  requestType: string;
  status: string;
  priority: string;
  description?: string | null;
  branchId?: string | null;

  appointmentDateTime?: string | null;

  createdDate: string;
  updatedDate?: string | null;

  funeralType?: string | null;
  venue?: string | null;
};

type Branch = {
  branchId: string;
  branchName: string;
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

function isFuneralRequest(
  requestType: string
) {
  const type = (requestType || "")
    .trim()
    .toLowerCase();

  return (
    type === "funeral" ||
    type === "funeral service" ||
    type === "funeral request" ||
    type === "funeralservice"
  );
}

function canEditFuneral(
  request: ServiceRequest
) {
  if (
    !isFuneralRequest(
      request.requestType
    )
  ) {
    return false;
  }

  if (!request.appointmentDateTime) {
    return false;
  }

  const status = (
    request.status || ""
  )
    .trim()
    .toLowerCase();

  if (
    status === "completed" ||
    status === "rejected" ||
    status === "cancelled"
  ) {
    return false;
  }

  const funeralTime = new Date(
    request.appointmentDateTime
  ).getTime();

  if (Number.isNaN(funeralTime)) {
    return false;
  }

  const hoursRemaining =
    (funeralTime - Date.now()) /
    (1000 * 60 * 60);

  return hoursRemaining >= 24;
}

function formatDateForInput(
  dateTime?: string | null
) {
  if (!dateTime) {
    return "";
  }

  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function formatTimeForInput(
  dateTime?: string | null
) {
  if (!dateTime) {
    return "";
  }

  const date = new Date(dateTime);

  if (Number.isNaN(date.getTime())) {
    return "";
  }

  const hours = String(
    date.getHours()
  ).padStart(2, "0");

  const minutes = String(
    date.getMinutes()
  ).padStart(2, "0");

  return `${hours}:${minutes}`;
}

export default function EditFuneralPage() {
  const router = useRouter();
  const searchParams =
    useSearchParams();

  const requestId =
    searchParams.get("id");

  const [request, setRequest] =
    useState<ServiceRequest | null>(
      null
    );

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [funeralDate, setFuneralDate] =
    useState("");

  const [funeralTime, setFuneralTime] =
    useState("");

  const [venue, setVenue] =
    useState("");

  const [funeralType, setFuneralType] =
    useState("Standard");

  const [notes, setNotes] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  /* ============================================================
     LOAD REQUEST
     ============================================================ */

  useEffect(() => {
    const loadRequest = async () => {
      if (!requestId) {
        setError(
          "Funeral service request ID is missing."
        );
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          router.replace("/login");
          return;
        }

        const response = await fetch(
          `${API_URL}/ServiceRequest/${requestId}`,
          {
            method: "GET",
            headers: {
              Accept:
                "application/json",
              Authorization:
                `Bearer ${token}`,
            },
          }
        );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load funeral request (${response.status}).`
          );
        }

        console.log(
          "[Funeral Edit] REQUEST:",
          data
        );

        if (
          !isFuneralRequest(
            data.requestType
          )
        ) {
          throw new Error(
            "This service request is not a funeral request."
          );
        }

        if (
          !canEditFuneral(data)
        ) {
          throw new Error(
            "This funeral request can no longer be edited because 24 hours or less remain, or its status does not allow changes."
          );
        }

        setRequest(data);

        setFuneralDate(
          formatDateForInput(
            data.appointmentDateTime
          )
        );

        setFuneralTime(
          formatTimeForInput(
            data.appointmentDateTime
          )
        );

        setNotes(
          data.description || ""
        );

        setVenue(
          data.venue || ""
        );

        setFuneralType(
          data.funeralType ||
            "Standard"
        );
      } catch (err) {
        console.error(
          "Load funeral edit error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load funeral request."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [requestId, router]);

  /* ============================================================
     LOAD BRANCHES
     ============================================================ */

  useEffect(() => {
    const loadBranches = async () => {
      try {
        const token = getToken();

        if (!token) {
          return;
        }

        const response =
          await fetch(
            `${API_URL}/Branch`,
            {
              method: "GET",
              headers: {
                Accept:
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (
          response.ok &&
          Array.isArray(data)
        ) {
          setBranches(data);
        }
      } catch (err) {
        console.error(
          "Load branches error:",
          err
        );
      }
    };

    loadBranches();
  }, []);

  /* ============================================================
     SUBMIT
     ============================================================ */

  async function handleSubmit(
    e: React.FormEvent
  ) {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (!request) {
      setError(
        "Funeral request could not be loaded."
      );
      return;
    }

    if (!funeralDate) {
      setError(
        "Please select a funeral date."
      );
      return;
    }

    if (!funeralTime) {
      setError(
        "Please select a funeral time."
      );
      return;
    }

    /* ----------------------------------------------------------
       BUILD DATETIME
       ---------------------------------------------------------- */

    const appointmentDateTime =
      `${funeralDate}T${funeralTime}:00`;

    const newDateTime = new Date(
      appointmentDateTime
    );

    if (
      Number.isNaN(
        newDateTime.getTime()
      )
    ) {
      setError(
        "Invalid funeral date or time."
      );
      return;
    }

    if (
      newDateTime.getTime() <=
      Date.now()
    ) {
      setError(
        "The funeral date and time must be in the future."
      );
      return;
    }

    /* ----------------------------------------------------------
       EXISTING FUNERAL MUST STILL BE EDITABLE
       ---------------------------------------------------------- */

    if (
      !canEditFuneral(request)
    ) {
      setError(
        "This funeral can no longer be edited because 24 hours or less remain before the funeral."
      );
      return;
    }

    setSubmitting(true);

    try {
      const token = getToken();

      if (!token) {
        router.replace("/login");
        return;
      }

      /* --------------------------------------------------------
         UPDATE DTO

         This matches UpdateServiceRequestDto.
         -------------------------------------------------------- */

      const updatePayload = {
        branchId:
          request.branchId || null,

        description:
          notes.trim() || null,

        appointmentDateTime:
          appointmentDateTime,
      };

      console.log(
        "[Funeral Edit] UPDATE PAYLOAD:",
        updatePayload
      );

      const response =
        await fetch(
          `${API_URL}/ServiceRequest/${request.serviceRequestId}`,
          {
            method: "PUT",
            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify(
              updatePayload
            ),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      console.log(
        "[Funeral Edit] UPDATE RESPONSE:",
        data
      );

      if (!response.ok) {
        throw new Error(
          data?.message ||
            `Unable to update funeral request (${response.status}).`
        );
      }

      /* --------------------------------------------------------
         SUCCESS

         Do NOT immediately redirect.
         Show confirmation first.
         -------------------------------------------------------- */

      setSuccess(
        "Your funeral arrangement has been updated successfully."
      );

      /*
       * Update the local request so the page has
       * the new date/time if the user remains here.
       */

      setRequest(
        (previous) =>
          previous
            ? {
                ...previous,
                appointmentDateTime:
                  appointmentDateTime,
                description:
                  notes.trim() ||
                  null,
                updatedDate:
                  new Date().toISOString(),
              }
            : previous
      );

      /*
       * Give the user enough time to see the
       * confirmation message.
       */

      setTimeout(() => {
        router.push(
          `/client/service-requests/${request.serviceRequestId}`
        );
      }, 2500);
    } catch (err) {
      console.error(
        "Update funeral request error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to update funeral request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  /* ============================================================
     LOADING
     ============================================================ */

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">

          <div className="animate-pulse space-y-5">
            <div className="h-7 w-64 rounded bg-gray-200" />

            <div className="h-4 w-80 rounded bg-gray-200" />

            <div className="h-32 rounded-xl bg-gray-200" />

            <div className="h-12 rounded-xl bg-gray-200" />

            <div className="h-12 rounded-xl bg-gray-200" />
          </div>

        </div>
      </div>
    );
  }

  /* ============================================================
     ERROR BEFORE FORM
     ============================================================ */

  if (error && !request) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/client/service-requests"
            )
          }
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Service Requests
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">

          <h1 className="font-semibold text-red-800">
            Unable to edit funeral
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

        </div>
      </div>
    );
  }

  if (!request) {
    return null;
  }

  /* ============================================================
     PAGE
     ============================================================ */

  return (
    <div className="mx-auto max-w-3xl space-y-6">

      {/* HEADER */}

      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              `/client/service-requests/${request.serviceRequestId}`
            )
          }
          className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Funeral Request
        </button>

        <h1 className="text-2xl font-semibold text-gray-900">
          Edit Funeral Arrangement
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Update the details of your existing
          funeral arrangement.
        </p>
      </div>

      {/* SUCCESS */}

      {success && (
        <div className="rounded-2xl border border-green-200 bg-green-50 p-6">

          <div className="flex items-start gap-3">

            <div className="text-2xl">
              ✅
            </div>

            <div>
              <h2 className="font-semibold text-green-900">
                Funeral arrangement updated
              </h2>

              <p className="mt-1 text-sm leading-6 text-green-800">
                Your funeral arrangement has been
                updated successfully.
              </p>

              <p className="mt-2 text-xs text-green-700">
                Returning to your service request...
              </p>
            </div>

          </div>
        </div>
      )}

      {/* CURRENT REQUEST */}

      {!success && (
        <div className="rounded-2xl border border-teal-200 bg-teal-50 p-5">

          <div className="flex items-start gap-3">

            <div className="text-2xl">
              ✏️
            </div>

            <div>
              <h2 className="font-semibold text-teal-900">
                Funeral can be edited
              </h2>

              <p className="mt-1 text-sm leading-6 text-teal-800">
                Changes are allowed while the
                existing funeral remains at least
                24 hours away.
              </p>
            </div>

          </div>
        </div>
      )}

      {/* ERROR */}

      {error && request && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-5">

          <p className="text-sm font-medium text-red-700">
            {error}
          </p>

        </div>
      )}

      {/* FORM */}

      {!success && (
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

              {funeralTypes.map(
                (type) => (
                  <label
                    key={type.value}
                    className={`block rounded-xl border p-4 ${
                      funeralType ===
                      type.value
                        ? "border-teal-500 bg-teal-50"
                        : "border-gray-200"
                    }`}
                  >
                    <div className="flex items-start gap-3">

                      <input
                        type="radio"
                        name="funeralType"
                        value={
                          type.value
                        }
                        checked={
                          funeralType ===
                          type.value
                        }
                        onChange={(e) =>
                          setFuneralType(
                            e.target.value
                          )
                        }
                        className="mt-1"
                      />

                      <div>
                        <p className="font-medium text-gray-900">
                          {type.label}
                        </p>

                        <p className="mt-1 text-sm text-gray-500">
                          {
                            type.description
                          }
                        </p>
                      </div>

                    </div>
                  </label>
                )
              )}

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
              min={
                new Date()
                  .toISOString()
                  .split("T")[0]
              }
              onChange={(e) =>
                setFuneralDate(
                  e.target.value
                )
              }
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
              onChange={(e) =>
                setFuneralTime(
                  e.target.value
                )
              }
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
              onChange={(e) =>
                setVenue(
                  e.target.value
                )
              }
              placeholder="Funeral venue"
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
              onChange={(e) =>
                setNotes(
                  e.target.value
                )
              }
              placeholder="Any special requests or information LegacyCare should know..."
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />

          </div>

          {/* BUTTONS */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/client/service-requests/${request.serviceRequestId}`
                )
              }
              disabled={submitting}
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={submitting}
              className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Saving..."
                : "Save Funeral Changes"}
            </button>

          </div>
        </form>
      )}
    </div>
  );
}