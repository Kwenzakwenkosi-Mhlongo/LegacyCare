
// ============================================================================
// FILE 3
// Web/legacycare_website/app/(dashboard)/client/service-requests/funeral/view/page.tsx
//
// IMPORTANT:
// This replaces the old generic ServiceRequest edit page.
// Funeral requests now use the dedicated FuneralRequest workflow.
// ============================================================================

"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type FuneralRequest = {
  funeralRequestId: string;
  deathNotificationId?: string | null;

  branchId?: string | null;
  branchName?: string | null;

  funeralDate?: string | null;
  funeralTime?: string | null;

  venue?: string | null;
  funeralType?: string | null;
  notes?: string | null;

  status?: string | number | null;

  rejectionReason?: string | null;

  staffRequired?: number | null;
  staffAssigned?: number | null;
  staffRemaining?: number | null;
  staffingStatus?: string | null;

  createdDate?: string | null;
  updatedDate?: string | null;
  approvedDate?: string | null;
};

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

function formatTime(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const match =
    value.match(
      /^(\d{1,2}):(\d{2})/
    );

  if (!match) {
    return value;
  }

  const hours =
    Number(match[1]);

  const suffix =
    hours >= 12
      ? "PM"
      : "AM";

  return `${
    hours % 12 || 12
  }:${match[2]} ${suffix}`;
}

function statusClass(
  status?: string | number | null
): string {
  const value =
    String(status ?? "")
      .trim()
      .toLowerCase();

  if (
    value === "approved"
  ) {
    return "bg-green-100 text-green-700";
  }

  if (
    value === "rejected"
  ) {
    return "bg-red-100 text-red-700";
  }

  return "bg-amber-100 text-amber-700";
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
    typeof data === "string"
  ) {
    return data;
  }

  return fallback;
}

export default function FuneralRequestViewPage() {
  const router =
    useRouter();

  const searchParams =
    useSearchParams();

  const requestId =
    searchParams.get(
      "id"
    );

  const [
    request,
    setRequest,
  ] =
    useState<
      FuneralRequest | null
    >(null);

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

  useEffect(() => {
    document.title =
      "Funeral Request | LegacyCare";

    const loadRequest =
      async (): Promise<void> => {
        if (!requestId) {
          setError(
            "Funeral request ID is missing."
          );

          setLoading(false);

          return;
        }

        try {
          setLoading(true);
          setError("");

          const token =
            getToken();

          if (!token) {
            router.replace(
              "/login"
            );

            return;
          }

          const response =
            await fetch(
              `${API_URL}/FuneralRequest/${encodeURIComponent(
                requestId
              )}`,
              {
                method:
                  "GET",

                headers: {
                  Accept:
                    "application/json",

                  Authorization:
                    `Bearer ${token}`,
                },

                cache:
                  "no-store",
              }
            );

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (
            !response.ok
          ) {
            throw new Error(
              extractErrorMessage(
                data,
                `Unable to load funeral request (${response.status}).`
              )
            );
          }

          setRequest(
            data
          );
        } catch (err) {
          console.error(
            "[Funeral View] LOAD ERROR:",
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

    void loadRequest();
  }, [
    requestId,
    router,
  ]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl">
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-5">
            <div className="h-7 w-64 rounded bg-gray-200" />
            <div className="h-4 w-80 rounded bg-gray-200" />
            <div className="h-40 rounded-xl bg-gray-100" />
          </div>
        </div>
      </div>
    );
  }

  if (
    error ||
    !request
  ) {
    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/client/service-requests/funeral"
            )
          }
          className="text-sm font-medium text-teal-600"
        >
          ← Funeral Arrangements
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="font-semibold text-red-900">
            Unable to load funeral request
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error ||
              "Funeral request was not found."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <button
          type="button"
          onClick={() =>
            router.push(
              "/client/service-requests/funeral"
            )
          }
          className="mb-4 text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Funeral Arrangements
        </button>

        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-semibold text-gray-900">
            Funeral Request
          </h1>

          <span
            className={`rounded-full px-3 py-1 text-xs font-semibold ${statusClass(
              request.status
            )}`}
          >
            {String(
              request.status ||
                "Pending"
            )}
          </span>
        </div>

        <p className="mt-1 text-sm text-gray-500">
          Request{" "}
          {
            request.funeralRequestId
          }
        </p>
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-semibold text-blue-900">
          📋 Funeral request status
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          Funeral requests are managed by LegacyCare after submission.
          Staff assignments and approval are handled internally. You can
          continue tracking the latest status here.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Arrangement Details
        </h2>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Funeral Type
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {request.funeralType ||
                "Standard"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Status
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {String(
                request.status ||
                  "Pending"
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Funeral Date
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {formatDate(
                request.funeralDate
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Funeral Time
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {formatTime(
                request.funeralTime
              )}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Venue
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {request.venue ||
                "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Branch
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {request.branchName ||
                request.branchId ||
                "Not available"}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Staff Assigned
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {request.staffAssigned ??
                0}
              {" / "}
              {request.staffRequired ??
                4}
            </p>
          </div>

          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Staffing
            </p>

            <p className="mt-1 font-semibold text-gray-900">
              {request.staffingStatus ||
                "Awaiting assignment"}
            </p>
          </div>
        </div>

        {request.notes ? (
          <div className="mt-6 border-t border-gray-100 pt-5">
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Additional Notes
            </p>

            <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-gray-700">
              {
                request.notes
              }
            </p>
          </div>
        ) : null}

        {request.rejectionReason ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4">
            <p className="text-sm font-semibold text-red-900">
              Request Rejected
            </p>

            <p className="mt-1 text-sm text-red-700">
              {
                request.rejectionReason
              }
            </p>
          </div>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() =>
            router.push(
              "/client/service-requests/funeral"
            )
          }
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white"
        >
          Back to Funeral Requests
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(
              "/client/service-requests"
            )
          }
          className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700"
        >
          My Requests
        </button>
      </div>
    </div>
  );
}