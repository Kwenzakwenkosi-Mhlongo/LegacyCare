// File:
// Web/legacycare_website/app/(dashboard)/client/reports/
// service-requests/page.tsx

"use client";

import { jsPDF } from "jspdf";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getToken } from "@/lib/auth";

const REQUEST_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type ClientReportDetails = {
  clientId: string;
  displayClientId: string;
  fullName: string;
  email: string;
  cellNo: string;
  address: string;
};

type ServiceRequest = {
  serviceRequestId?: number | string;
  requestId?: number | string;

  requestNumber?: string | null;

  requestType?: string | number | null;
  type?: string | number | null;

  subject?: string | null;
  title?: string | null;

  description?: string | null;
  details?: string | null;

  status?: string | number | null;

  dateCreated?: string | null;
  createdAt?: string | null;
  requestDate?: string | null;

  dateUpdated?: string | null;
  updatedAt?: string | null;

  policyId?: string | null;
};

type StatusFilter =
  | "all"
  | "pending"
  | "inprogress"
  | "completed"
  | "cancelled";

function normalizeRequestValue(
  value?: string | number | null
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "")
    .replace(/-/g, "");
}

function getRequestId(
  request: ServiceRequest
): string {
  return String(
    request.requestNumber ??
      request.serviceRequestId ??
      request.requestId ??
      "Not available"
  );
}

function getRequestType(
  request: ServiceRequest
): string {
  return String(
    request.requestType ??
      request.type ??
      "Service Request"
  );
}

function getRequestTitle(
  request: ServiceRequest
): string {
  return (
    request.subject ||
    request.title ||
    getRequestType(request)
  );
}

function getRequestDescription(
  request: ServiceRequest
): string {
  return (
    request.description ||
    request.details ||
    "No description"
  );
}

function getRequestStatus(
  request: ServiceRequest
): string {
  return String(
    request.status ??
      "Not available"
  );
}

function getRequestDate(
  request: ServiceRequest
): string | null {
  return (
    request.dateCreated ??
    request.createdAt ??
    request.requestDate ??
    null
  );
}

function formatRequestDate(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (typeof data === "string") {
    return data;
  }

  if (
    data &&
    typeof data === "object" &&
    "message" in data
  ) {
    const message = (
      data as {
        message?: unknown;
      }
    ).message;

    if (typeof message === "string") {
      return message;
    }
  }

  return fallback;
}

function statusMatches(
  request: ServiceRequest,
  filter: StatusFilter
): boolean {
  if (filter === "all") {
    return true;
  }

  const status =
    normalizeRequestValue(
      request.status
    );

  if (filter === "pending") {
    return (
      status === "pending" ||
      status === "0"
    );
  }

  if (
    filter ===
    "inprogress"
  ) {
    return (
      status === "inprogress" ||
      status === "processing" ||
      status === "1"
    );
  }

  if (
    filter ===
    "completed"
  ) {
    return (
      status === "completed" ||
      status === "resolved" ||
      status === "approved" ||
      status === "2"
    );
  }

  return (
    status === "cancelled" ||
    status === "rejected" ||
    status === "3"
  );
}

export default function ServiceRequestReportPage() {
  const [
    requests,
    setRequests,
  ] =
    useState<ServiceRequest[]>([]);

  const [
    clientDetails,
    setClientDetails,
  ] =
    useState<ClientReportDetails | null>(
      null
    );

  const [
    statusFilter,
    setStatusFilter,
  ] =
    useState<StatusFilter>("all");

  const [
    typeFilter,
    setTypeFilter,
  ] =
    useState("all");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    downloading,
    setDownloading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    document.title =
      "Service Request Report | LegacyCare";
  }, []);

  useEffect(() => {
    async function loadReportData(): Promise<void> {
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
          requestResponse,
          clientResponse,
        ] =
          await Promise.all([
            fetch(
              `${REQUEST_API_URL}/ServiceRequest/client`,
              {
                method: "GET",
                headers,
                cache:
                  "no-store",
              }
            ),
            fetch(
              `${REQUEST_API_URL}/Client/me/report-details`,
              {
                method: "GET",
                headers,
                cache:
                  "no-store",
              }
            ),
          ]);

        const [
          requestData,
          clientData,
        ] =
          await Promise.all([
            requestResponse
              .json()
              .catch(() => null),
            clientResponse
              .json()
              .catch(() => null),
          ]);

        if (!requestResponse.ok) {
          throw new Error(
            getErrorMessage(
              requestData,
              `Unable to load service requests (${requestResponse.status}).`
            )
          );
        }

        if (!clientResponse.ok) {
          throw new Error(
            getErrorMessage(
              clientData,
              `Unable to load client details (${clientResponse.status}).`
            )
          );
        }

        setRequests(
          Array.isArray(
            requestData
          )
            ? requestData
            : []
        );

        setClientDetails(
          clientData as ClientReportDetails
        );
      } catch (err) {
        console.error(
          "[SERVICE REQUEST REPORT] ERROR:",
          err
        );

        setRequests([]);
        setClientDetails(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load service request history."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReportData();
  }, []);

  const requestTypes =
    useMemo(() => {
      const types =
        new Set<string>();

      for (
        const request
        of requests
      ) {
        types.add(
          getRequestType(
            request
          )
        );
      }

      return [
        ...types,
      ].sort();
    }, [requests]);

  const filteredRequests =
    useMemo(
      () =>
        requests
          .filter((request) =>
            statusMatches(
              request,
              statusFilter
            )
          )
          .filter(
            (request) =>
              typeFilter ===
                "all" ||
              getRequestType(
                request
              ) ===
                typeFilter
          )
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                getRequestDate(
                  second
                ) ?? 0
              ).getTime() -
              new Date(
                getRequestDate(
                  first
                ) ?? 0
              ).getTime()
          ),
      [
        requests,
        statusFilter,
        typeFilter,
      ]
    );

  function downloadPdf(): void {
    if (!clientDetails) {
      setError(
        "Client details are not available."
      );

      return;
    }

    if (
      filteredRequests.length ===
      0
    ) {
      setError(
        "There are no service requests to download."
      );

      return;
    }

    const reportClient =
      clientDetails;

    try {
      setDownloading(true);
      setError("");

      const pdf =
        new jsPDF({
          orientation:
            "landscape",
          unit: "mm",
          format: "a4",
        });

      const pageWidth =
        pdf.internal.pageSize
          .getWidth();

      const pageHeight =
        pdf.internal.pageSize
          .getHeight();

      const left = 14;
      const right =
        pageWidth - 14;

      function drawHeader(): number {
        pdf.setFillColor(
          15,
          118,
          110
        );

        pdf.rect(
          0,
          0,
          pageWidth,
          32,
          "F"
        );

        pdf.setTextColor(
          255,
          255,
          255
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(19);

        pdf.text(
          "LegacyCare Service Request History",
          left,
          15
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8);

        pdf.text(
          `Generated: ${new Date().toLocaleString(
            "en-ZA"
          )}`,
          left,
          23
        );

        pdf.setFillColor(
          248,
          250,
          252
        );

        pdf.roundedRect(
          left,
          39,
          right - left,
          29,
          3,
          3,
          "F"
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
          15,
          118,
          110
        );

        pdf.text(
          "CLIENT DETAILS",
          19,
          47
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(7);

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "Name",
          19,
          55
        );

        pdf.text(
          "Client ID",
          72,
          55
        );

        pdf.text(
          "Email",
          112,
          55
        );

        pdf.text(
          "Contact",
          180,
          55
        );

        pdf.text(
          "Address",
          222,
          55
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          reportClient.fullName ||
            "Not available",
          19,
          62
        );

        pdf.text(
          reportClient.displayClientId ||
            reportClient.clientId ||
            "Not available",
          72,
          62
        );

        pdf.text(
          (
            reportClient.email ||
            "Not available"
          ).slice(
            0,
            30
          ),
          112,
          62
        );

        pdf.text(
          reportClient.cellNo ||
            "Not available",
          180,
          62
        );

        pdf.text(
          (
            reportClient.address ||
            "Not available"
          ).slice(
            0,
            34
          ),
          222,
          62
        );

        pdf.setFillColor(
          241,
          245,
          249
        );

        pdf.rect(
          left,
          76,
          right - left,
          11,
          "F"
        );

        pdf.setTextColor(
          71,
          85,
          105
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(8);

        pdf.text(
          "Reference",
          17,
          83
        );

        pdf.text(
          "Date",
          53,
          83
        );

        pdf.text(
          "Type",
          88,
          83
        );

        pdf.text(
          "Subject",
          139,
          83
        );

        pdf.text(
          "Status",
          218,
          83
        );

        pdf.text(
          "Policy",
          258,
          83
        );

        return 96;
      }

      let y =
        drawHeader();

      for (
        const request
        of filteredRequests
      ) {
        if (
          y >
          pageHeight - 16
        ) {
          pdf.addPage();

          y =
            drawHeader();
        }

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(7.5);

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          getRequestId(
            request
          ).slice(
            0,
            18
          ),
          17,
          y
        );

        pdf.text(
          formatRequestDate(
            getRequestDate(
              request
            )
          ),
          53,
          y
        );

        pdf.text(
          getRequestType(
            request
          ).slice(
            0,
            23
          ),
          88,
          y
        );

        pdf.text(
          getRequestTitle(
            request
          ).slice(
            0,
            35
          ),
          139,
          y
        );

        pdf.text(
          getRequestStatus(
            request
          ).slice(
            0,
            18
          ),
          218,
          y
        );

        pdf.text(
          String(
            request.policyId ??
              "-"
          ).slice(
            0,
            19
          ),
          258,
          y
        );

        pdf.setDrawColor(
          226,
          232,
          240
        );

        pdf.line(
          left,
          y + 4,
          right,
          y + 4
        );

        y += 11;
      }

      pdf.setFontSize(7);

      pdf.setTextColor(
        100,
        116,
        139
      );

      pdf.text(
        "This report reflects service requests currently recorded for the logged-in LegacyCare client.",
        pageWidth / 2,
        pageHeight - 6,
        {
          align: "center",
        }
      );

      pdf.save(
        `LegacyCare-Service-Request-History-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.pdf`
      );
    } catch (err) {
      console.error(
        "[SERVICE REQUEST PDF] ERROR:",
        err
      );

      setError(
        "Unable to generate the service request PDF."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/client/reports"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            ← Reports
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Service Request History
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Your submitted appointments, enquiries,
            document requests and support requests.
          </p>
        </div>

        <button
          type="button"
          onClick={downloadPdf}
          disabled={
            loading ||
            downloading ||
            !clientDetails ||
            filteredRequests.length ===
              0
          }
          className="w-fit rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading
            ? "Creating PDF..."
            : "Download Request PDF"}
        </button>
      </div>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </section>
      ) : null}

      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
      ) : null}

      {!loading &&
      !error &&
      clientDetails ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-teal-700">
            Client Details
          </h2>

          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Full Name
              </dt>

              <dd className="mt-1 font-semibold text-gray-900">
                {clientDetails.fullName}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Client ID
              </dt>

              <dd className="mt-1 font-semibold text-gray-900">
                {clientDetails.displayClientId ||
                  clientDetails.clientId}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </dt>

              <dd className="mt-1 break-all font-medium text-gray-900">
                {clientDetails.email}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Contact
              </dt>

              <dd className="mt-1 font-medium text-gray-900">
                {clientDetails.cellNo}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Address
              </dt>

              <dd className="mt-1 font-medium text-gray-900">
                {clientDetails.address}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {!loading &&
      !error ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label
                htmlFor="requestStatus"
                className="text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Status
              </label>

              <select
                id="requestStatus"
                value={statusFilter}
                onChange={(event) =>
                  setStatusFilter(
                    event.target
                      .value as StatusFilter
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">
                  All Statuses
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="inprogress">
                  In Progress
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled / Rejected
                </option>
              </select>
            </div>

            <div>
              <label
                htmlFor="requestType"
                className="text-xs font-semibold uppercase tracking-wide text-gray-500"
              >
                Request Type
              </label>

              <select
                id="requestType"
                value={typeFilter}
                onChange={(event) =>
                  setTypeFilter(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">
                  All Request Types
                </option>

                {requestTypes.map(
                  (type) => (
                    <option
                      key={type}
                      value={type}
                    >
                      {type}
                    </option>
                  )
                )}
              </select>
            </div>
          </div>
        </section>
      ) : null}

      {!loading &&
      !error &&
      filteredRequests.length ===
        0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No service requests were found for this selection.
          </p>
        </section>
      ) : null}

      {!loading &&
      !error &&
      filteredRequests.length >
        0 ? (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Reference
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Date
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Type
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Subject
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Description
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRequests.map(
                  (
                    request,
                    index
                  ) => (
                    <tr
                      key={`${getRequestId(
                        request
                      )}-${index}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-mono text-xs font-semibold text-gray-800">
                        {getRequestId(
                          request
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {formatRequestDate(
                          getRequestDate(
                            request
                          )
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                        {getRequestType(
                          request
                        )}
                      </td>

                      <td className="px-4 py-3 text-gray-900">
                        {getRequestTitle(
                          request
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                        {getRequestStatus(
                          request
                        )}
                      </td>

                      <td className="max-w-md px-4 py-3 text-gray-600">
                        {getRequestDescription(
                          request
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}