// app/(dashboard)/client/service-requests/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { getToken } from "@/lib/auth";

// ============================================================
// API
// ============================================================

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

// ============================================================
// CONSTANTS
// ============================================================

const LEGACYCARE_CONTACT_NUMBER = "0817381235";

type ServiceKey =
  | "death"
  | "funeral"
  | "appointment"
  | "quote"
  | "beneficiary"
  | "policy"
  | "payment"
  | "documents"
  | "support";

type RequestTypeDefinition = {
  key: ServiceKey;
  title: string;
  description: string;
  icon: string;
  href: string;
};

const requestTypes: RequestTypeDefinition[] = [
  {
    key: "death",
    title: "Report a Death",
    description:
      "Report the death of a beneficiary and submit the required information and proof of death for verification.",
    icon: "🕊️",
    href: "/client/service-requests/death",
  },
  {
    key: "funeral",
    title: "Funeral",
    description:
      "Begin funeral arrangements for an approved death notification.",
    icon: "⚰️",
    href: "/client/service-requests/funeral",
  },
  {
    key: "appointment",
    title: "Book an Appointment",
    description:
      "Book an appointment with a LegacyCare branch or staff member.",
    icon: "📅",
    href: "/client/service-requests/booking",
  },
  {
    key: "quote",
    title: "Request a Quote",
    description:
      "Request a quote for funeral services, packages or other services.",
    icon: "💰",
    href: "/client/service-requests/quote",
  },
  {
    key: "beneficiary",
    title: "Add Beneficiary",
    description:
      "Submit a request to add a new beneficiary to your policy.",
    icon: "👨‍👩‍👧",
    href: "/client/service-requests/beneficiary",
  },
  {
    key: "policy",
    title: "Policy Enquiry",
    description:
      "Ask a question about your funeral policy or coverage.",
    icon: "📄",
    href: "/client/service-requests/policy",
  },
  {
    key: "payment",
    title: "Payment Enquiry",
    description:
      "Ask about payments, balances, receipts or outstanding amounts.",
    icon: "💳",
    href: "/client/service-requests/payment",
  },
  {
    key: "documents",
    title: "Request Documents",
    description:
      "Request policy documents, statements, receipts or other documents.",
    icon: "📑",
    href: "/client/service-requests/documents",
  },
  {
    key: "support",
    title: "General Support",
    description:
      "Contact LegacyCare about something not covered by the other requests.",
    icon: "💬",
    href: "/client/service-requests/support",
  },
];

// ============================================================
// TYPES
// ============================================================

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

  deathNotificationId?: string | null;
  funeralRequestId?: string | null;
};

// ============================================================
// HELPERS
// ============================================================

function normalize(value?: string | null) {
  return (value || "")
    .trim()
    .toLowerCase();
}

function getServiceKey(
  requestType: string
): ServiceKey {
  const type =
    normalize(requestType);

  if (
    type.includes("death")
  ) {
    return "death";
  }

  if (
    type.includes("funeral")
  ) {
    return "funeral";
  }

  if (
    type.includes("appointment")
  ) {
    return "appointment";
  }

  if (
    type.includes("quote")
  ) {
    return "quote";
  }

  if (
    type.includes("beneficiary")
  ) {
    return "beneficiary";
  }

  if (
    type.includes("policy")
  ) {
    return "policy";
  }

  if (
    type.includes("payment")
  ) {
    return "payment";
  }

  if (
    type.includes("document")
  ) {
    return "documents";
  }

  return "support";
}

function getRequestIcon(
  requestType: string
) {
  const key =
    getServiceKey(
      requestType
    );

  return (
    requestTypes.find(
      (item) =>
        item.key === key
    )?.icon || "📋"
  );
}

function getStatusStyle(
  status: string
) {
  switch (
    normalize(status)
  ) {
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

function getPriorityStyle(
  priority: string
) {
  switch (
    normalize(priority)
  ) {
    case "high":
      return "bg-red-50 text-red-700 border-red-200";

    case "urgent":
      return "bg-red-100 text-red-800 border-red-300";

    case "low":
      return "bg-blue-50 text-blue-700 border-blue-200";

    default:
      return "bg-gray-50 text-gray-600 border-gray-200";
  }
}

function formatDate(
  date: string
) {
  if (!date) {
    return "Unknown";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "Unknown";
  }

  return parsedDate
    .toLocaleDateString(
      "en-ZA",
      {
        day: "2-digit",
        month: "short",
        year: "numeric",
      }
    );
}

function formatTime(
  date: string
) {
  if (!date) {
    return "";
  }

  const parsedDate =
    new Date(date);

  if (
    Number.isNaN(
      parsedDate.getTime()
    )
  ) {
    return "";
  }

  return parsedDate
    .toLocaleTimeString(
      "en-ZA",
      {
        hour: "2-digit",
        minute: "2-digit",
      }
    );
}

// ============================================================
// PAGE
// ============================================================

export default function ServiceRequestsPage() {
  const [
    requests,
    setRequests,
  ] =
    useState<
      ServiceRequest[]
    >([]);

  const [
    branches,
    setBranches,
  ] =
    useState<Branch[]>([]);

  const [
    selectedService,
    setSelectedService,
  ] =
    useState<ServiceKey | null>(
      null
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    loadingBranches,
    setLoadingBranches,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  // ============================================================
  // SELECTED REQUESTS
  // ============================================================

  const selectedRequests =
    useMemo(() => {
      if (!selectedService) {
        return [];
      }

      return requests.filter(
        (request) =>
          getServiceKey(
            request.requestType
          ) === selectedService
      );
    }, [
      requests,
      selectedService,
    ]);

  // ============================================================
  // COUNTS PER SERVICE
  // ============================================================

  const serviceCounts =
    useMemo(() => {
      const counts: Record<
        ServiceKey,
        number
      > = {
        death: 0,
        funeral: 0,
        appointment: 0,
        quote: 0,
        beneficiary: 0,
        policy: 0,
        payment: 0,
        documents: 0,
        support: 0,
      };

      for (
        const request
        of requests
      ) {
        const key =
          getServiceKey(
            request.requestType
          );

        counts[key] += 1;
      }

      return counts;
    }, [requests]);

  // ============================================================
  // SELECTED STATUS COUNTS
  // ============================================================

  const selectedSummary =
    useMemo(() => {
      const summary = {
        total: 0,
        pending: 0,
        approved: 0,
        rejected: 0,
      };

      for (
        const request
        of selectedRequests
      ) {
        summary.total += 1;

        const status =
          normalize(
            request.status
          );

        if (
          status === "pending"
        ) {
          summary.pending += 1;
        }

        if (
          status === "approved"
        ) {
          summary.approved += 1;
        }

        if (
          status === "rejected"
        ) {
          summary.rejected += 1;
        }
      }

      return summary;
    }, [selectedRequests]);

  // ============================================================
  // PAGE LOAD
  // ============================================================

  useEffect(() => {
    document.title =
      "Service Requests";
  }, []);

  // ============================================================
  // LOAD BRANCHES
  // ============================================================

  useEffect(() => {
    const loadBranches =
      async () => {
        try {
          setLoadingBranches(
            true
          );

          const token =
            getToken();

          if (!token) {
            return;
          }

          const response =
            await fetch(
              `${API_URL}/Branch`,
              {
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

          if (!response.ok) {
            setBranches([]);
            return;
          }

          setBranches(
            Array.isArray(
              data
            )
              ? data
              : []
          );
        } catch (err) {
          console.error(
            "[Branch] Error:",
            err
          );

          setBranches([]);
        } finally {
          setLoadingBranches(
            false
          );
        }
      };

    void loadBranches();
  }, []);

  // ============================================================
  // BRANCH LOOKUP
  // ============================================================

  const getBranchName = (
    request:
      ServiceRequest
  ) => {
    if (
      request.branchName
    ) {
      return request.branchName;
    }

    if (
      !request.branchId
    ) {
      return "Not specified";
    }

    const id =
      request.branchId
        .trim()
        .toLowerCase();

    const branch =
      branches.find(
        (item) =>
          item.branchId
            .trim()
            .toLowerCase() ===
          id
      );

    if (branch) {
      return branch.branchName;
    }

    if (
      loadingBranches
    ) {
      return "Loading branch...";
    }

    return request.branchId;
  };

  // ============================================================
  // LOAD REQUESTS
  // ============================================================

  const loadRequests =
    async (
      showRefresh =
        false
    ) => {
      try {
        if (showRefresh) {
          setRefreshing(
            true
          );
        } else {
          setLoading(true);
        }

        setError("");

        const token =
          getToken();

        if (!token) {
          setError(
            "You are not logged in."
          );

          return;
        }

        const response =
          await fetch(
            `${API_URL}/ServiceRequest/client`,
            {
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

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Failed to load requests (${response.status})`
          );
        }

        setRequests(
          Array.isArray(data)
            ? data
            : []
        );
      } catch (err) {
        console.error(
          "[ServiceRequest] Error:",
          err
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load your service requests."
        );
      } finally {
        setLoading(false);

        setRefreshing(
          false
        );
      }
    };

  useEffect(() => {
    void loadRequests();
  }, []);

  // ============================================================
  // SELECTED SERVICE DETAILS
  // ============================================================

  const selectedDefinition =
    requestTypes.find(
      (item) =>
        item.key ===
        selectedService
    );

  // ============================================================
  // PAGE
  // ============================================================

  return (
    <div className="space-y-8">

      {/* HEADER */}

      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Service Requests
          </h1>

          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Select a LegacyCare service to submit or track a request.
          </p>
        </div>

        <Link
          href="/client"
          className="text-sm font-medium text-teal-600 hover:text-teal-700"
        >
          ← Back to Dashboard
        </Link>

      </div>

      {/* ========================================================
          START A REQUEST
      ======================================================== */}

      <section>

        <h2 className="text-lg font-semibold text-gray-900">
          Start a Request
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Choose the service you need.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">

          {requestTypes.map(
            (service) => (

              <Link
                key={
                  service.key
                }
                href={
                  service.href
                }
                className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:-translate-y-1 hover:border-teal-500 hover:shadow-md"
              >

                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl">
                  {service.icon}
                </div>

                <h3 className="mt-5 text-lg font-semibold text-gray-900">
                  {service.title}
                </h3>

                <p className="mt-2 text-sm leading-6 text-gray-500">
                  {service.description}
                </p>

                <div className="mt-5 text-sm font-semibold text-teal-600">
                  Start request →
                </div>

              </Link>

            )
          )}

        </div>

      </section>

      {/* ========================================================
          MY REQUESTS
      ======================================================== */}

      <section className="rounded-2xl border border-gray-200 bg-white shadow-sm">

        <div className="flex flex-col justify-between gap-4 border-b border-gray-200 p-6 sm:flex-row sm:items-center">

          <div className="flex items-center gap-3">

            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-xl">
              📋
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900">
                My Requests
              </h2>

              <p className="text-sm text-gray-500">
                Select a service to view its requests.
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={() =>
              void loadRequests(
                true
              )
            }
            disabled={
              refreshing
            }
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>

        </div>

        <div className="p-6">

          {/* LOADING */}

          {loading && (

            <div className="py-10 text-center text-sm text-gray-500">
              Loading your requests...
            </div>

          )}

          {/* ERROR */}

          {!loading &&
            error && (

              <div className="rounded-xl border border-red-200 bg-red-50 p-5 text-red-700">
                {error}
              </div>

            )}

          {/* SERVICE SELECTOR */}

          {!loading &&
            !error && (

              <>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">

                  {requestTypes.map(
                    (service) => {

                      const active =
                        selectedService ===
                        service.key;

                      return (

                        <button
                          key={
                            service.key
                          }
                          type="button"
                          onClick={() =>
                            setSelectedService(
                              service.key
                            )
                          }
                          className={`rounded-xl border p-4 text-left transition ${
                            active
                              ? "border-teal-500 bg-teal-50 shadow-sm"
                              : "border-gray-200 bg-white hover:border-teal-300 hover:bg-gray-50"
                          }`}
                        >

                          <div className="flex items-start justify-between gap-3">

                            <span className="text-2xl">
                              {service.icon}
                            </span>

                            <span
                              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                                active
                                  ? "bg-teal-600 text-white"
                                  : "bg-gray-100 text-gray-700"
                              }`}
                            >
                              {
                                serviceCounts[
                                  service.key
                                ]
                              }
                            </span>

                          </div>

                          <p className="mt-3 text-sm font-semibold text-gray-900">
                            {service.title}
                          </p>

                        </button>

                      );
                    }
                  )}

                </div>

                {/* NO SERVICE SELECTED */}

                {!selectedService && (

                  <div className="mt-6 rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center">

                    <div className="text-4xl">
                      👆
                    </div>

                    <h3 className="mt-4 font-semibold text-gray-900">
                      Select a service
                    </h3>

                    <p className="mt-2 text-sm text-gray-500">
                      Click one of the service cards above to view only requests for that service.
                    </p>

                  </div>

                )}

                {/* SELECTED SERVICE */}

                {selectedService &&
                  selectedDefinition && (

                    <div className="mt-8 space-y-5">

                      {/* SERVICE HEADER */}

                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">

                        <div className="flex items-center gap-3">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-2xl">
                            {
                              selectedDefinition.icon
                            }
                          </div>

                          <div>

                            <h3 className="text-lg font-semibold text-gray-900">
                              {
                                selectedDefinition.title
                              }{" "}
                              Requests
                            </h3>

                            <p className="text-sm text-gray-500">
                              Only{" "}
                              {
                                selectedDefinition.title
                              }{" "}
                              requests are shown below.
                            </p>

                          </div>

                        </div>

                        <Link
                          href={
                            selectedDefinition.href
                          }
                          className="rounded-lg bg-teal-600 px-4 py-2.5 text-center text-sm font-semibold text-white hover:bg-teal-700"
                        >
                          + New{" "}
                          {
                            selectedDefinition.title
                          }
                        </Link>

                      </div>

                      {/* SELECTED SUMMARY */}

                      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">

                        <div className="rounded-xl bg-gray-50 p-4">

                          <p className="text-xs font-medium uppercase text-gray-500">
                            Total
                          </p>

                          <p className="mt-1 text-2xl font-semibold text-gray-900">
                            {
                              selectedSummary.total
                            }
                          </p>

                        </div>

                        <div className="rounded-xl bg-amber-50 p-4">

                          <p className="text-xs font-medium uppercase text-amber-700">
                            Pending
                          </p>

                          <p className="mt-1 text-2xl font-semibold text-amber-800">
                            {
                              selectedSummary.pending
                            }
                          </p>

                        </div>

                        <div className="rounded-xl bg-green-50 p-4">

                          <p className="text-xs font-medium uppercase text-green-700">
                            Approved
                          </p>

                          <p className="mt-1 text-2xl font-semibold text-green-800">
                            {
                              selectedSummary.approved
                            }
                          </p>

                        </div>

                        <div className="rounded-xl bg-red-50 p-4">

                          <p className="text-xs font-medium uppercase text-red-700">
                            Rejected
                          </p>

                          <p className="mt-1 text-2xl font-semibold text-red-800">
                            {
                              selectedSummary.rejected
                            }
                          </p>

                        </div>

                      </div>

                      {/* NO REQUESTS */}

                      {selectedRequests.length ===
                        0 && (

                        <div className="rounded-xl border border-dashed border-gray-300 p-10 text-center">

                          <div className="text-4xl">
                            {
                              selectedDefinition.icon
                            }
                          </div>

                          <h3 className="mt-4 font-semibold text-gray-900">
                            No{" "}
                            {
                              selectedDefinition.title
                            }{" "}
                            requests yet
                          </h3>

                          <Link
                            href={
                              selectedDefinition.href
                            }
                            className="mt-5 inline-flex rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-teal-700"
                          >
                            Start Request
                          </Link>

                        </div>

                      )}

                      {/* REQUEST CARDS */}

                      {selectedRequests.map(
                        (request) => (

                          <div
                            key={
                              request.serviceRequestId
                            }
                            className="rounded-xl border border-gray-200 p-5 transition hover:border-teal-300 hover:shadow-sm"
                          >

                            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">

                              <div className="flex items-start gap-4">

                                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-teal-50 text-2xl">
                                  {
                                    getRequestIcon(
                                      request.requestType
                                    )
                                  }
                                </div>

                                <div className="min-w-0">

                                  <div className="flex flex-wrap items-center gap-2">

                                    <h4 className="font-semibold text-gray-900">
                                      REQ-
                                      {String(
                                        request.serviceRequestId
                                      ).padStart(
                                        5,
                                        "0"
                                      )}
                                    </h4>

                                    <span className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-700">
                                      {
                                        request.requestType
                                      }
                                    </span>

                                  </div>

                                  <div className="mt-3">

                                    <p className="text-xs font-medium uppercase text-gray-500">
                                      Branch
                                    </p>

                                    <p className="mt-1 text-sm font-medium text-gray-900">
                                      {
                                        getBranchName(
                                          request
                                        )
                                      }
                                    </p>

                                  </div>

                                  {request.description && (

                                    <p className="mt-3 max-w-2xl whitespace-pre-line text-sm leading-6 text-gray-500">
                                      {
                                        request.description
                                      }
                                    </p>

                                  )}

                                  {selectedService ===
                                    "death" && (

                                    <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">

                                      <p className="font-semibold text-blue-900">
                                        Need to make changes?
                                      </p>

                                      <p className="mt-1 text-sm text-blue-800">
                                        Contact LegacyCare Admin at{" "}
                                        <strong>
                                          {
                                            LEGACYCARE_CONTACT_NUMBER
                                          }
                                        </strong>
                                        .
                                      </p>

                                    </div>

                                  )}

                                  <div className="mt-3 flex flex-wrap gap-x-4 text-xs text-gray-400">

                                    <span>
                                      Submitted{" "}
                                      {
                                        formatDate(
                                          request.createdDate
                                        )
                                      }
                                    </span>

                                    <span>
                                      {
                                        formatTime(
                                          request.createdDate
                                        )
                                      }
                                    </span>

                                  </div>

                                </div>

                              </div>

                              <div className="flex flex-wrap items-center gap-3">

                                <span
                                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyle(
                                    request.status
                                  )}`}
                                >
                                  {
                                    request.status
                                  }
                                </span>

                                <span
                                  className={`rounded-full border px-3 py-1.5 text-xs font-medium ${getPriorityStyle(
                                    request.priority
                                  )}`}
                                >
                                  {
                                    request.priority
                                  }{" "}
                                  Priority
                                </span>

                                <Link
                                  href={`/client/service-requests/${request.serviceRequestId}`}
                                  className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50"
                                >
                                  View Details
                                </Link>

                              </div>

                            </div>

                          </div>

                        )
                      )}

                    </div>

                  )}

              </>

            )}

        </div>

      </section>

    </div>
  );
}