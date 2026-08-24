"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getToken } from "@/lib/auth";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5224/api";

/*
 * LegacyCare contact number.
 *
 * Replace this with your actual Admin/LegacyCare contact number.
 */
const LEGACYCARE_CONTACT_NUMBER = "0817381235";

const requestTypes = [
  {
    title: "Report a Death",
    description:
      "Report the death of a beneficiary and submit the required information and proof of death for verification.",
    icon: "🕊️",
    href: "/client/service-requests/death",
  },
  {
    title: "Funeral",
    description:
      "Begin funeral arrangements for an approved death notification.",
    icon: "🕊️",
    href: "/client/service-requests/funeral",
  },
  {
    title: "Book an Appointment",
    description:
      "Book an appointment with a LegacyCare branch or staff member.",
    icon: "📅",
    href: "/client/service-requests/booking",
  },
  {
    title: "Request a Quote",
    description:
      "Request a quote for funeral services, packages or other services.",
    icon: "💰",
    href: "/client/service-requests/quote",
  },
  {
    title: "Add Beneficiary",
    description:
      "Submit a request to add a new beneficiary to your policy.",
    icon: "👨‍👩‍👧",
    href: "/client/service-requests/beneficiary",
  },
  {
    title: "Policy Enquiry",
    description:
      "Ask a question about your funeral policy or coverage.",
    icon: "📄",
    href: "/client/service-requests/policy",
  },
  {
    title: "Payment Enquiry",
    description:
      "Ask about payments, balances, receipts or outstanding amounts.",
    icon: "💳",
    href: "/client/service-requests/payment",
  },
  {
    title: "Request Documents",
    description:
      "Request policy documents, statements, receipts or other documents.",
    icon: "📑",
    href: "/client/service-requests/documents",
  },
  {
    title: "General Support",
    description:
      "Contact LegacyCare about something not covered by the other requests.",
    icon: "💬",
    href: "/client/service-requests/support",
  },
];

type Branch = {
  branchId: string;
  branchName: string;
};

type ServiceRequest = {
  serviceRequestId: number;
  clientId?: string | null;

  branchId?: string | null;
  branchName?: string | null;

  requestType: string;
  status: string;
  priority: string;

  description?: string | null;

  assignedStaffId?: number | null;

  createdDate: string;
  updatedDate?: string | null;
  dueDate?: string | null;

  appointmentDateTime?: string | null;

  additionalFee?: number;
};

function getRequestIcon(requestType: string) {
  const type = requestType.toLowerCase();

  if (type.includes("appointment")) return "📅";
  if (type.includes("funeral")) return "🕊️";
  if (type.includes("death")) return "🕊️";
  if (type.includes("quote")) return "💰";
  if (type.includes("beneficiary")) return "👨‍👩‍👧";
  if (type.includes("policy")) return "📄";
  if (type.includes("payment")) return "💳";
  if (type.includes("document")) return "📑";
  if (type.includes("support")) return "💬";

  return "📋";
}

function getStatusStyle(status: string) {
  switch (status.toLowerCase()) {
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

function getPriorityStyle(priority: string) {
  switch (priority.toLowerCase()) {
    case "high":
      return "bg-red-50 text-red-700 border-red-200";

    case "urgent":
      return "bg-red-100 text-red-800 border-red-300";

    case "normal":
      return "bg-gray-50 text-gray-600 border-gray-200";

    case "low":
      return "bg-blue-50 text-blue-700 border-blue-200";

    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function formatDate(date: string) {
  if (!date) return "Unknown";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "Unknown";
  }

  return parsedDate.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatTime(date: string) {
  if (!date) return "";

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return "";
  }

  return parsedDate.toLocaleTimeString("en-ZA", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isDeathRequest(requestType: string) {
  const type = (requestType || "").trim().toLowerCase();

  return (
    type.includes("death") ||
    type.includes("report death") ||
    type.includes("death notification")
  );
}

export default function ServiceRequestsPage() {
  const [requests, setRequests] =
    useState<ServiceRequest[]>([]);

  const [branches, setBranches] =
    useState<Branch[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [loadingBranches, setLoadingBranches] =
    useState(true);

  const [error, setError] =
    useState("");

  // ============================================================
  // LOAD BRANCHES
  // ============================================================

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

        const data =
          await response.json().catch(
            () => null
          );

        if (!response.ok) {
          console.error(
            "[Branch] Failed to load branches:",
            response.status,
            data
          );

          return;
        }

        console.log(
          "[Branch] API RESPONSE:",
          data
        );

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

  // ============================================================
  // GET BRANCH DETAILS
  // ============================================================

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
        (branch) =>
          String(branch.branchId)
            .trim()
            .toLowerCase() ===
          normalisedBranchId
      ) || null
    );
  };

  // ============================================================
  // LOAD REQUESTS
  // ============================================================

  const loadRequests = async (
    showRefresh = false
  ) => {
    try {
      if (showRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token = getToken();

      if (!token) {
        setError("You are not logged in.");
        return;
      }

      const response = await fetch(
        `${API_URL}/ServiceRequest/client`,
        {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data =
          await response.json().catch(
            () => null
          );

        throw new Error(
          data?.message ||
            `Failed to load requests (${response.status})`
        );
      }

      const data =
        await response.json();

      console.log(
        "[ServiceRequest] API RESPONSE:",
        data
      );

      console.log(
        "[ServiceRequest] DETAILS:",
        Array.isArray(data)
          ? data.map((r: any) => ({
              id: r.serviceRequestId,
              requestType: r.requestType,
              serviceType: r.serviceType,
              type: r.type,
              status: r.status,
              branchId: r.branchId,
              branchName: r.branchName,
              description: r.description,
            }))
          : []
      );

      setRequests(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "Service requests error:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load your service requests."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  return (
    <div className="space-y-8">

      {/* ===================================================== */}
      {/* PAGE HEADER */}
      {/* ===================================================== */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Service Requests
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Tell us what you need and LegacyCare will guide you
            through the appropriate process.
          </p>
        </div>

        <Link
          href="/client"
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Dashboard
        </Link>
      </div>

      {/* ===================================================== */}
      {/* REQUEST OPTIONS */}
      {/* ===================================================== */}

      <div>
        <div id="request-options">
          <h2 className="text-lg font-semibold text-gray-900">
            How can we help you?
          </h2>

          <p className="mt-1 text-sm text-gray-500">
            Select the service you need to get started.
          </p>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
          {requestTypes.map((request) => (
            <Link
              key={request.title}
              href={request.href}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-500 hover:shadow-md"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl transition group-hover:bg-teal-100">
                {request.icon}
              </div>

              <h3 className="mt-5 text-lg font-semibold text-gray-900">
                {request.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-gray-500">
                {request.description}
              </p>

              <div className="mt-5 text-sm font-semibold text-teal-600 group-hover:text-teal-700">
                Start request →
              </div>
            </Link>
          ))}
        </div>
      </div>

      {/* ===================================================== */}
      {/* MY REQUESTS */}
      {/* ===================================================== */}

      <div className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        {/* HEADER */}

        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center">

          <div>
            <div className="flex items-center gap-3">

              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-xl">
                📋
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  My Requests
                </h2>

                <p className="text-sm text-gray-500">
                  Track your submitted LegacyCare requests.
                </p>
              </div>

            </div>
          </div>

          <button
            type="button"
            onClick={() => loadRequests(true)}
            disabled={refreshing}
            className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

        {/* CONTENT */}

        <div className="p-6">

          {/* LOADING */}

          {loading && (
            <div className="space-y-4">

              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="animate-pulse rounded-xl border border-gray-200 p-5"
                >
                  <div className="h-5 w-40 rounded bg-gray-200" />

                  <div className="mt-3 h-4 w-64 rounded bg-gray-200" />

                  <div className="mt-3 h-3 w-32 rounded bg-gray-200" />
                </div>
              ))}

            </div>
          )}

          {/* ERROR */}

          {!loading && error && (
            <div className="rounded-xl border border-red-200 bg-red-50 p-6">

              <div className="flex items-start gap-3">

                <div className="text-xl">
                  ⚠️
                </div>

                <div>

                  <p className="font-medium text-red-800">
                    Unable to load requests
                  </p>

                  <p className="mt-1 text-sm text-red-700">
                    {error}
                  </p>

                  <button
                    type="button"
                    onClick={() =>
                      loadRequests()
                    }
                    className="mt-4 rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Try Again
                  </button>

                </div>

              </div>

            </div>
          )}

          {/* EMPTY */}

          {!loading &&
            !error &&
            requests.length === 0 && (
              <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">

                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-teal-50 text-3xl">
                  📋
                </div>

                <h3 className="mt-4 font-semibold text-gray-900">
                  No service requests yet
                </h3>

                <p className="mx-auto mt-2 max-w-md text-sm text-gray-500">
                  When you submit a request to LegacyCare,
                  it will appear here so you can track its progress.
                </p>

                <Link
                  href="#request-options"
                  className="mt-5 inline-flex rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                >
                  Start a Request
                </Link>

              </div>
            )}

          {/* REQUEST LIST */}

          {!loading &&
            !error &&
            requests.length > 0 && (
              <div className="space-y-4">

                {/* SUMMARY */}

                <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-3">

                  <div className="rounded-xl bg-gray-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
                      Total Requests
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-gray-900">
                      {requests.length}
                    </p>
                  </div>

                  <div className="rounded-xl bg-amber-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-amber-700">
                      Pending
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-amber-800">
                      {
                        requests.filter(
                          (request) =>
                            request.status
                              .toLowerCase() ===
                            "pending"
                        ).length
                      }
                    </p>
                  </div>

                  <div className="rounded-xl bg-green-50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wide text-green-700">
                      Completed
                    </p>

                    <p className="mt-1 text-2xl font-semibold text-green-800">
                      {
                        requests.filter(
                          (request) =>
                            request.status
                              .toLowerCase() ===
                            "completed"
                        ).length
                      }
                    </p>
                  </div>

                </div>

                {/* REQUEST CARDS */}

                {requests.map((request) => {

                  const branch =
                    getBranchDetails(
                      request.branchId
                    );

                  const branchName =
                    request.branchName ||
                    branch?.branchName ||
                    null;

                  const deathRequest =
                    isDeathRequest(
                      request.requestType
                    );

                  return (
                    <div
                      key={
                        request.serviceRequestId
                      }
                      className="rounded-xl border border-gray-200 p-5 transition hover:border-teal-300 hover:shadow-sm"
                    >

                      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                        {/* LEFT */}

                        <div className="flex items-start gap-4">

                          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-2xl">
                            {getRequestIcon(
                              request.requestType
                            )}
                          </div>

                          <div className="min-w-0">

                            <div className="flex flex-wrap items-center gap-2">

                              <h3 className="font-semibold text-gray-900">
                                REQ-
                                {String(
                                  request.serviceRequestId
                                ).padStart(
                                  5,
                                  "0"
                                )}
                              </h3>

                              <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                                {request.requestType}
                              </span>

                            </div>

                            {/* BRANCH */}

                            {request.branchId && (
                              <div className="mt-3">

                                <p className="text-xs font-medium text-gray-500">
                                  Branch
                                </p>

                                <p className="mt-0.5 text-sm font-medium text-gray-900">

                                  {branchName ||
                                    (loadingBranches
                                      ? "Loading branch..."
                                      : `Branch ${request.branchId}`)}

                                  <span className="ml-1 text-gray-500">
                                    ({request.branchId})
                                  </span>

                                </p>

                              </div>
                            )}

                            {/* DESCRIPTION */}

                            {request.description && (
                              <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-gray-500">
                                {request.description}
                              </p>
                            )}

                            {/* DEATH CONTACT */}

                            {deathRequest && (
                              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">

                                <div className="flex items-start gap-3">

                                  <div className="text-xl">
                                    📞
                                  </div>

                                  <div>

                                    <p className="font-semibold text-blue-900">
                                      Need to make changes?
                                    </p>

                                    <p className="mt-1 text-sm leading-6 text-blue-800">
                                      If LegacyCare needs
                                      additional information
                                      or you need to correct
                                      something in your death
                                      notification, please
                                      contact the Admin team.
                                    </p>

                                    <p className="mt-2 text-sm font-semibold text-blue-900">
                                      Admin contact:{" "}
                                      {LEGACYCARE_CONTACT_NUMBER}
                                    </p>

                                  </div>

                                </div>

                              </div>
                            )}

                            {/* DATE */}

                            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-400">

                              <span>
                                Submitted{" "}
                                {formatDate(
                                  request.createdDate
                                )}
                              </span>

                              <span>
                                {formatTime(
                                  request.createdDate
                                )}
                              </span>

                            </div>

                          </div>

                        </div>

                        {/* RIGHT */}

                        <div className="flex flex-wrap items-center gap-3 lg:justify-end">

                          {/* STATUS */}

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                              request.status
                            )}`}
                          >
                            {request.status}
                          </span>

                          {/* PRIORITY */}

                          <span
                            className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getPriorityStyle(
                              request.priority
                            )}`}
                          >
                            {request.priority} Priority
                          </span>

                          {/* VIEW */}

                          <Link
                            href={`/client/service-requests/${request.serviceRequestId}`}
                            className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-600 transition hover:bg-teal-50"
                          >
                            View Details
                          </Link>

                        </div>

                      </div>

                    </div>
                  );
                })}

              </div>
            )}

        </div>
      </div>
    </div>
  );
}