"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5224/api";

type Branch = {
  branchId: string;
  branchName: string;
};

type ServiceRequest = {
  serviceRequestId: number;
  clientId: string | number;
  requestType: string;
  status: string;
  priority: string;
  description?: string | null;

  branchId?: string | null;

  assignedStaffId?: number | null;

  createdDate: string;
  updatedDate?: string | null;
  dueDate?: string | null;

  appointmentDateTime?: string | null;

  additionalFee?: number | null;
};

function getRequestIcon(requestType: string) {
  const type = (requestType || "").toLowerCase();

  if (type.includes("appointment")) return "📅";
  if (type.includes("funeral")) return "🕊️";
  if (type.includes("quote")) return "💰";
  if (type.includes("beneficiary")) return "👨‍👩‍👧";
  if (type.includes("policy")) return "📄";
  if (type.includes("payment")) return "💳";
  if (type.includes("document")) return "📑";
  if (type.includes("support")) return "💬";

  return "📋";
}

function getStatusStyle(status: string) {
  switch ((status || "").toLowerCase()) {
    case "pending":
      return "bg-amber-100 text-amber-700 border-amber-200";

    case "approved":
      return "bg-green-100 text-green-700 border-green-200";

    case "completed":
      return "bg-blue-100 text-blue-700 border-blue-200";

    case "rejected":
      return "bg-red-100 text-red-700 border-red-200";

    case "cancelled":
      return "bg-gray-100 text-gray-600 border-gray-200";

    case "in progress":
      return "bg-purple-100 text-purple-700 border-purple-200";

    default:
      return "bg-gray-100 text-gray-700 border-gray-200";
  }
}

function formatDate(date?: string | null) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatTime(date?: string | null) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatDateTime(date?: string | null) {
  if (!date) return "Not available";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Not available";
  }

  return parsedDate.toLocaleString("en-ZA", {
    day: "2-digit",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isAppointmentRequest(requestType: string) {
  const type = (requestType || "").trim().toLowerCase();

  return (
    type === "appointment" ||
    type === "appointment request"
  );
}

function isFuneralRequest(requestType: string) {
  const type = (requestType || "").trim().toLowerCase();

  return (
    type === "funeral" ||
    type === "funeral service" ||
    type === "funeral request" ||
    type === "funeralservice"
  );
}

function canEditAppointment(request: ServiceRequest) {
  if (!isAppointmentRequest(request.requestType)) {
    return false;
  }

  if (!request.appointmentDateTime) {
    return false;
  }

  const status = (request.status || "").toLowerCase();

  if (
    status === "completed" ||
    status === "rejected" ||
    status === "cancelled"
  ) {
    return false;
  }

  const appointmentTime = new Date(
    request.appointmentDateTime
  ).getTime();

  if (Number.isNaN(appointmentTime)) {
    return false;
  }

  const hoursRemaining =
    (appointmentTime - Date.now()) /
    (1000 * 60 * 60);

  return hoursRemaining >= 24;
}

function canEditFuneral(request: ServiceRequest) {
  if (!isFuneralRequest(request.requestType)) {
    return false;
  }

  if (!request.appointmentDateTime) {
    return false;
  }

  const status = (request.status || "").toLowerCase();

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

export default function ServiceRequestDetailsPage() {
  const router = useRouter();
  const params = useParams();

  const id = params?.id;

  const [request, setRequest] =
    useState<ServiceRequest | null>(null);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [error, setError] =
    useState("");

  /* =========================================================
     LOAD BRANCHES
     ========================================================= */

  useEffect(() => {
    const loadBranches = async () => {
      try {
        setLoadingBranches(true);

        const token = getToken();

        if (!token) {
          return;
        }

        const response = await fetch(
          `${API_URL}/Branch`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load branches (${response.status}).`
          );
        }

        if (Array.isArray(data)) {
          setBranches(data);
        } else {
          setBranches([]);
        }
      } catch (err) {
        console.error(
          "Load branches error:",
          err
        );

        setBranches([]);
      } finally {
        setLoadingBranches(false);
      }
    };

    loadBranches();
  }, []);

  /* =========================================================
     BRANCH DETAILS
     ========================================================= */

  const getBranchDetails = (
    branchId?: string | null
  ) => {
    if (!branchId) {
      return null;
    }

    const normalisedBranchId =
      String(branchId)
        .trim()
        .toLowerCase();

    return (
      branches.find(
        (item) =>
          String(item.branchId)
            .trim()
            .toLowerCase() ===
          normalisedBranchId
      ) || null
    );
  };

  /* =========================================================
     LOAD REQUEST
     ========================================================= */

  useEffect(() => {
    const loadRequest = async () => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          setError("You are not logged in.");
          return;
        }

        if (!id) {
          setError(
            "Service request ID is missing."
          );
          return;
        }

        const response = await fetch(
          `${API_URL}/ServiceRequest/${id}`,
          {
            method: "GET",
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        const data = await response
          .json()
          .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load service request (${response.status}).`
          );
        }

        console.log(
          "[ServiceRequest] API RESPONSE:",
          data
        );

        setRequest(data);
      } catch (err) {
        console.error(
          "Service request details error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load service request."
        );
      } finally {
        setLoading(false);
      }
    };

    loadRequest();
  }, [id]);

  /* =========================================================
     PAGE
     ========================================================= */

  return (
    <div className="mx-auto max-w-4xl space-y-6">

      {/* BACK */}

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

      {/* LOADING */}

      {loading && (
        <div className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
          <div className="animate-pulse space-y-5">
            <div className="h-7 w-64 rounded bg-gray-200" />
            <div className="h-4 w-40 rounded bg-gray-200" />
            <div className="h-32 rounded-xl bg-gray-200" />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="h-20 rounded-xl bg-gray-200" />
              <div className="h-20 rounded-xl bg-gray-200" />
            </div>
          </div>
        </div>
      )}

      {/* ERROR */}

      {!loading && error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <div className="flex items-start gap-3">
            <div className="text-xl">⚠️</div>

            <div>
              <h2 className="font-semibold text-red-800">
                Unable to load request
              </h2>

              <p className="mt-1 text-sm text-red-700">
                {error}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/client/service-requests"
                  )
                }
                className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
              >
                Back to My Requests
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REQUEST */}

      {!loading && !error && request && (
        <>
          {/* HEADER */}

          <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

              <div className="flex items-center gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-teal-50 text-3xl">
                  {getRequestIcon(
                    request.requestType
                  )}
                </div>

                <div>
                  <p className="text-sm text-gray-500">
                    Service Request
                  </p>

                  <h1 className="text-2xl font-semibold text-gray-900">
                    REQ-
                    {String(
                      request.serviceRequestId
                    ).padStart(5, "0")}
                  </h1>
                </div>
              </div>

              <span
                className={`inline-flex w-fit rounded-full border px-4 py-2 text-sm font-semibold ${getStatusStyle(
                  request.status
                )}`}
              >
                {request.status}
              </span>
            </div>
          </div>

          {/* =================================================
              FUNERAL EDIT INFORMATION ONLY
              
              Appointment edit information is intentionally
              NOT displayed here.
          ================================================= */}

          {isFuneralRequest(
            request.requestType
          ) &&
            request.appointmentDateTime && (
              <div
                className={`rounded-2xl border p-5 ${
                  canEditFuneral(request)
                    ? "border-teal-200 bg-teal-50"
                    : "border-gray-200 bg-gray-50"
                }`}
              >
                <div className="flex items-start gap-3">

                  <div className="text-2xl">
                    {canEditFuneral(request)
                      ? "✏️"
                      : "🔒"}
                  </div>

                  <div>
                    <h2
                      className={`font-semibold ${
                        canEditFuneral(request)
                          ? "text-teal-900"
                          : "text-gray-800"
                      }`}
                    >
                      {canEditFuneral(request)
                        ? "Funeral can be edited"
                        : "Funeral editing unavailable"}
                    </h2>

                    <p className="mt-1 text-sm leading-6 text-gray-600">
                      {canEditFuneral(request)
                        ? "You can change the funeral arrangement while the funeral is at least 24 hours away."
                        : "This funeral can no longer be edited because it is less than 24 hours away or its status does not allow changes."}
                    </p>
                  </div>
                </div>
              </div>
            )}

          {/* REQUEST INFORMATION */}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Request Information
              </h2>

              <p className="mt-1 text-sm text-gray-500">
                Details about your submitted request.
              </p>
            </div>

            <div className="grid grid-cols-1 gap-6 p-6 sm:grid-cols-2">

              {/* REQUEST TYPE */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Request Type
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {request.requestType}
                </p>
              </div>

              {/* STATUS */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Status
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {request.status}
                </p>
              </div>

              {/* PRIORITY */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Priority
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {request.priority}
                </p>

                {request.additionalFee &&
                  request.additionalFee > 0 && (
                    <p className="mt-1 text-sm font-medium text-amber-700">
                      Additional service fee: R
                      {request.additionalFee.toFixed(
                        2
                      )}
                    </p>
                  )}
              </div>

              {/* DATE */}

              {(isAppointmentRequest(
                request.requestType
              ) ||
                isFuneralRequest(
                  request.requestType
                )) &&
                request.appointmentDateTime && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {isFuneralRequest(
                        request.requestType
                      )
                        ? "Funeral Date"
                        : "Appointment Date"}
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatDate(
                        request.appointmentDateTime
                      )}
                    </p>
                  </div>
                )}

              {/* TIME */}

              {(isAppointmentRequest(
                request.requestType
              ) ||
                isFuneralRequest(
                  request.requestType
                )) &&
                request.appointmentDateTime && (
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      {isFuneralRequest(
                        request.requestType
                      )
                        ? "Funeral Time"
                        : "Appointment Time"}
                    </p>

                    <p className="mt-1 font-medium text-gray-900">
                      {formatTime(
                        request.appointmentDateTime
                      )}
                    </p>
                  </div>
                )}

              {/* BRANCH */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Branch
                </p>

                {request.branchId ? (
                  (() => {
                    const branch =
                      getBranchDetails(
                        request.branchId
                      );

                    if (branch) {
                      return (
                        <div className="mt-2">
                          <p className="font-semibold text-gray-900">
                            {branch.branchName}
                          </p>

                          <p className="mt-1 text-sm font-medium text-teal-700">
                            {branch.branchId}
                          </p>
                        </div>
                      );
                    }

                    if (loadingBranches) {
                      return (
                        <p className="mt-1 text-sm text-gray-500">
                          Loading branch...
                        </p>
                      );
                    }

                    return (
                      <div className="mt-2">
                        <p className="font-medium text-gray-900">
                          Branch
                        </p>

                        <p className="mt-1 text-sm font-medium text-teal-700">
                          {request.branchId}
                        </p>
                      </div>
                    );
                  })()
                ) : (
                  <p className="mt-1 font-medium text-gray-900">
                    Not specified
                  </p>
                )}
              </div>

              {/* ASSIGNED STAFF */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Assigned Staff
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {request.assignedStaffId
                    ? `Staff ${request.assignedStaffId}`
                    : "Not assigned yet"}
                </p>
              </div>

              {/* CREATED */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Submitted
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {formatDateTime(
                    request.createdDate
                  )}
                </p>
              </div>

              {/* UPDATED */}

              <div>
                <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                  Last Updated
                </p>

                <p className="mt-1 font-medium text-gray-900">
                  {formatDateTime(
                    request.updatedDate
                  )}
                </p>
              </div>

              {/* DUE DATE */}

              {request.dueDate && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                    Due Date
                  </p>

                  <p className="mt-1 font-medium text-gray-900">
                    {formatDateTime(
                      request.dueDate
                    )}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* DESCRIPTION */}

          <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Request Details
              </h2>
            </div>

            <div className="p-6">
              {request.description ? (
                <div className="whitespace-pre-line rounded-xl bg-gray-50 p-5 text-sm leading-7 text-gray-700">
                  {request.description}
                </div>
              ) : (
                <p className="text-sm text-gray-500">
                  No additional information was
                  provided.
                </p>
              )}
            </div>
          </div>

          {/* STATUS INFORMATION */}

          <div className="rounded-2xl border border-blue-200 bg-blue-50 p-6">

            <h2 className="font-semibold text-blue-900">
              What happens next?
            </h2>

            {request.status.toLowerCase() ===
              "pending" && (
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Your request has been received and
                  is waiting for a LegacyCare staff
                  member to review it.
                </p>
              )}

            {request.status.toLowerCase() ===
              "approved" && (
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Your request has been approved by
                  LegacyCare. Please check for any
                  further instructions from staff.
                </p>
              )}

            {request.status.toLowerCase() ===
              "in progress" && (
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  A LegacyCare staff member is
                  currently working on your request.
                </p>
              )}

            {request.status.toLowerCase() ===
              "completed" && (
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Your request has been completed.
                </p>
              )}

            {request.status.toLowerCase() ===
              "rejected" && (
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  Your request was not approved.
                  Please contact LegacyCare if you
                  need more information.
                </p>
              )}

            {request.status.toLowerCase() ===
              "cancelled" && (
                <p className="mt-2 text-sm leading-6 text-blue-800">
                  This request has been cancelled.
                </p>
              )}
          </div>

          {/* =================================================
              ACTIONS
              
              IMPORTANT:
              There is NO "New Appointment" button here.
              
              New Appointment exists ONLY on:
              /client/service-requests
          ================================================= */}

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/client/service-requests"
                )
              }
              className="rounded-lg border border-gray-300 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
            >
              Back to My Requests
            </button>

            {/* EDIT APPOINTMENT */}

            {canEditAppointment(request) && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/client/service-requests/booking?edit=${request.serviceRequestId}`
                  )
                }
                className="rounded-lg border border-teal-600 px-5 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50"
              >
                ✏️ Edit Appointment
              </button>
            )}

            {/* EDIT FUNERAL */}

            {canEditFuneral(request) && (
              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/client/service-requests/funeral/edit?id=${request.serviceRequestId}`
                  )
                }
                className="rounded-lg border border-teal-600 px-5 py-2.5 text-sm font-semibold text-teal-600 hover:bg-teal-50"
              >
                ✏️ Edit Funeral
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
}