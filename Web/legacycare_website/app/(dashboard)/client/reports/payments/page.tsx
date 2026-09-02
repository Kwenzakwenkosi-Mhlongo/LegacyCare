// File:
// Web/legacycare_website/app/(dashboard)/client/reports/payments/page.tsx

"use client";

import { jsPDF } from "jspdf";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type Package = {
  packageId?: string | null;
  packageName?: string | null;
  name?: string | null;
};

type Policy = {
  policyId?: string | null;
  policyNumber?: string | null;
  package?: Package | null;
};

type Payment = {
  paymentId: string;
  amount: number;
  paymentDate?: string | null;
  dueDate: string;
  method?: string | number | null;
  status: string | number;
  policyId: string;
  policy?: Policy | null;
};

type ClientReportDetails = {
  clientId: string;
  displayClientId: string;
  fullName: string;
  email: string;
  cellNo: string;
  address: string;
};

type DateRange = "6m" | "12m" | "all";

function normalizeValue(
  value?: string | number | null
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function isPending(payment: Payment): boolean {
  const status = normalizeValue(payment.status);

  return status === "pending" || status === "0";
}

function isSuccessful(payment: Payment): boolean {
  const status = normalizeValue(payment.status);

  return status === "successful" || status === "1";
}

function isFailed(payment: Payment): boolean {
  const status = normalizeValue(payment.status);

  return status === "failed" || status === "2";
}

function isOverdue(payment: Payment): boolean {
  if (!isPending(payment)) {
    return false;
  }

  const dueDate = new Date(payment.dueDate);

  if (Number.isNaN(dueDate.getTime())) {
    return false;
  }

  const today = new Date();

  today.setHours(0, 0, 0, 0);
  dueDate.setHours(0, 0, 0, 0);

  return dueDate.getTime() < today.getTime();
}

function isCurrentPending(payment: Payment): boolean {
  return isPending(payment) && !isOverdue(payment);
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatPdfCurrency(value: number): string {
  return `R ${Number(value || 0).toFixed(2)}`;
}

function formatDate(value?: string | null): string {
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

function getStatusLabel(payment: Payment): string {
  if (isSuccessful(payment)) {
    return "Successful";
  }

  if (isOverdue(payment)) {
    return "Overdue";
  }

  if (isCurrentPending(payment)) {
    return "Pending";
  }

  return String(payment.status);
}

function getMethodLabel(
  method?: string | number | null
): string {
  const value = normalizeValue(method);

  if (value === "1" || value === "card") {
    return "Card";
  }

  if (value === "2" || value === "eft") {
    return "EFT";
  }

  if (value === "0" || value === "cash") {
    return "Cash";
  }

  return "Not selected";
}

function getPolicyDisplay(payment: Payment): string {
  return (
    payment.policy?.policyNumber ||
    payment.policyId ||
    "Not available"
  );
}

function getPackageName(payment: Payment): string {
  return (
    payment.policy?.package?.packageName ||
    payment.policy?.package?.name ||
    "Policy Premium"
  );
}

function getPaymentReference(paymentId: string): string {
  return paymentId
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase();
}

function filterByDateRange(
  payments: Payment[],
  range: DateRange
): Payment[] {
  if (range === "all") {
    return payments;
  }

  const months =
    range === "6m"
      ? 6
      : 12;

  const today = new Date();

  const startDate = new Date(
    today.getFullYear(),
    today.getMonth() - (months - 1),
    1
  );

  return payments.filter((payment) => {
    const dueDate =
      new Date(payment.dueDate);

    return (
      !Number.isNaN(
        dueDate.getTime()
      ) &&
      dueDate.getTime() >=
        startDate.getTime()
    );
  });
}

function rangeLabel(range: DateRange): string {
  if (range === "6m") {
    return "Last 6 Months";
  }

  if (range === "12m") {
    return "Last 12 Months";
  }

  return "All Payment Records";
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
    const message =
      (
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

export default function PaymentStatementPage() {
  const [
    payments,
    setPayments,
  ] =
    useState<Payment[]>([]);

  const [
    clientDetails,
    setClientDetails,
  ] =
    useState<ClientReportDetails | null>(null);

  const [
    selectedPolicyId,
    setSelectedPolicyId,
  ] =
    useState("all");

  const [
    dateRange,
    setDateRange,
  ] =
    useState<DateRange>("all");

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
      "Payment Statement | LegacyCare";
  }, []);

  useEffect(() => {
    async function loadStatementData(): Promise<void> {
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
          paymentResponse,
          clientResponse,
        ] =
          await Promise.all([
            fetch(
              `${API_URL}/Payment`,
              {
                method: "GET",
                headers,
                cache:
                  "no-store",
              }
            ),
            fetch(
              `${API_URL}/Client/me/report-details`,
              {
                method: "GET",
                headers,
                cache:
                  "no-store",
              }
            ),
          ]);

        const [
          paymentData,
          clientData,
        ] =
          await Promise.all([
            paymentResponse
              .json()
              .catch(() => null),
            clientResponse
              .json()
              .catch(() => null),
          ]);

        if (!paymentResponse.ok) {
          throw new Error(
            getErrorMessage(
              paymentData,
              `Unable to load payments (${paymentResponse.status}).`
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

        setPayments(
          Array.isArray(paymentData)
            ? paymentData
            : []
        );

        setClientDetails(
          clientData as ClientReportDetails
        );
      } catch (err) {
        console.error(
          "[PAYMENT STATEMENT] ERROR:",
          err
        );

        setPayments([]);
        setClientDetails(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load payment statement."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadStatementData();
  }, []);

  const policies =
    useMemo(() => {
      const map =
        new Map<string, string>();

      for (const payment of payments) {
        if (
          payment.policyId &&
          !map.has(payment.policyId)
        ) {
          map.set(
            payment.policyId,
            getPolicyDisplay(payment)
          );
        }
      }

      return [
        ...map.entries(),
      ].map(
        ([policyId, label]) => ({
          policyId,
          label,
        })
      );
    }, [payments]);

  const filteredPayments =
    useMemo(() => {
      const policyFiltered =
        selectedPolicyId === "all"
          ? payments
          : payments.filter(
              (payment) =>
                payment.policyId ===
                selectedPolicyId
            );

      return filterByDateRange(
        policyFiltered.filter(
          (payment) =>
            !isFailed(payment)
        ),
        dateRange
      ).sort(
        (
          first,
          second
        ) =>
          new Date(
            first.dueDate
          ).getTime() -
          new Date(
            second.dueDate
          ).getTime()
      );
    }, [
      payments,
      selectedPolicyId,
      dateRange,
    ]);

  const totals =
    useMemo(() => {
      let paid = 0;
      let overdue = 0;
      let pending = 0;

      for (const payment of filteredPayments) {
        const amount =
          Number(
            payment.amount
          ) || 0;

        if (isSuccessful(payment)) {
          paid += amount;
        } else if (isOverdue(payment)) {
          overdue += amount;
        } else if (isCurrentPending(payment)) {
          pending += amount;
        }
      }

      return {
        paid,
        overdue,
        pending,
        outstanding:
          overdue + pending,
      };
    }, [filteredPayments]);

  function downloadStatement(): void {
    if (!clientDetails) {
      setError(
        "Client details are not available."
      );

      return;
    }

    if (
      filteredPayments.length === 0
    ) {
      setError(
        "There are no payment records to download."
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

      const left = 12;
      const right =
        pageWidth - 12;

      const columns = [
        {
          label: "Due Date",
          x: 14,
        },
        {
          label: "Policy",
          x: 46,
        },
        {
          label: "Package",
          x: 78,
        },
        {
          label: "Amount",
          x: 116,
        },
        {
          label: "Status",
          x: 146,
        },
        {
          label: "Paid Date",
          x: 178,
        },
        {
          label: "Method",
          x: 214,
        },
        {
          label: "Reference",
          x: 246,
        },
      ];

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
          30,
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

        pdf.setFontSize(20);

        pdf.text(
          "LegacyCare Payment Statement",
          left,
          14
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8.5);

        pdf.text(
          `Period: ${rangeLabel(
            dateRange
          )}`,
          left,
          22
        );

        pdf.text(
          `Generated: ${new Date().toLocaleString(
            "en-ZA"
          )}`,
          right,
          22,
          {
            align: "right",
          }
        );

        pdf.setFillColor(
          248,
          250,
          252
        );

        pdf.roundedRect(
          left,
          36,
          right - left,
          29,
          2,
          2,
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
          18,
          43
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(7.5);

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "Name",
          18,
          50
        );

        pdf.text(
          "Client ID",
          73,
          50
        );

        pdf.text(
          "Email",
          115,
          50
        );

        pdf.text(
          "Contact",
          180,
          50
        );

        pdf.text(
          "Address",
          225,
          50
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
          18,
          57
        );

        pdf.text(
          reportClient.displayClientId ||
            reportClient.clientId ||
            "Not available",
          73,
          57
        );

        pdf.text(
          (
            reportClient.email ||
            "Not available"
          ).slice(
            0,
            30
          ),
          115,
          57
        );

        pdf.text(
          reportClient.cellNo ||
            "Not available",
          180,
          57
        );

        pdf.text(
          (
            reportClient.address ||
            "Not available"
          ).slice(
            0,
            34
          ),
          225,
          57
        );

        pdf.setFillColor(
          248,
          250,
          252
        );

        pdf.roundedRect(
          left,
          71,
          right - left,
          21,
          2,
          2,
          "F"
        );

        pdf.setFontSize(8);

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "TOTAL PAID",
          18,
          79
        );

        pdf.text(
          "OVERDUE",
          84,
          79
        );

        pdf.text(
          "PENDING",
          149,
          79
        );

        pdf.text(
          "TOTAL OUTSTANDING",
          214,
          79
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(11);

        pdf.setTextColor(
          21,
          128,
          61
        );

        pdf.text(
          formatPdfCurrency(
            totals.paid
          ),
          18,
          87
        );

        pdf.setTextColor(
          185,
          28,
          28
        );

        pdf.text(
          formatPdfCurrency(
            totals.overdue
          ),
          84,
          87
        );

        pdf.setTextColor(
          37,
          99,
          235
        );

        pdf.text(
          formatPdfCurrency(
            totals.pending
          ),
          149,
          87
        );

        pdf.setTextColor(
          194,
          65,
          12
        );

        pdf.text(
          formatPdfCurrency(
            totals.outstanding
          ),
          214,
          87
        );

        pdf.setFillColor(
          241,
          245,
          249
        );

        pdf.rect(
          left,
          99,
          right - left,
          10,
          "F"
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(7.5);

        pdf.setTextColor(
          71,
          85,
          105
        );

        for (const column of columns) {
          pdf.text(
            column.label,
            column.x,
            105
          );
        }

        return 118;
      }

      let y =
        drawHeader();

      for (const payment of filteredPayments) {
        if (
          y >
          pageHeight - 16
        ) {
          pdf.addPage();

          y =
            drawHeader();
        }

        const status =
          getStatusLabel(
            payment
          );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(7);

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          formatDate(
            payment.dueDate
          ),
          14,
          y
        );

        pdf.text(
          getPolicyDisplay(
            payment
          ).slice(
            0,
            18
          ),
          46,
          y
        );

        pdf.text(
          getPackageName(
            payment
          ).slice(
            0,
            18
          ),
          78,
          y
        );

        pdf.text(
          formatPdfCurrency(
            payment.amount
          ),
          116,
          y
        );

        if (
          status ===
          "Successful"
        ) {
          pdf.setTextColor(
            21,
            128,
            61
          );
        } else if (
          status ===
          "Overdue"
        ) {
          pdf.setTextColor(
            185,
            28,
            28
          );
        } else {
          pdf.setTextColor(
            37,
            99,
            235
          );
        }

        pdf.text(
          status,
          146,
          y
        );

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          isSuccessful(payment)
            ? formatDate(
                payment.paymentDate
              )
            : "-",
          178,
          y
        );

        pdf.text(
          getMethodLabel(
            payment.method
          ),
          214,
          y
        );

        pdf.text(
          getPaymentReference(
            payment.paymentId
          ),
          246,
          y
        );

        pdf.setDrawColor(
          226,
          232,
          240
        );

        pdf.line(
          left,
          y + 3,
          right,
          y + 3
        );

        y += 9;
      }

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(7);

      pdf.setTextColor(
        100,
        116,
        139
      );

      pdf.text(
        "This statement reflects successful, pending and overdue premium records held by LegacyCare.",
        pageWidth / 2,
        pageHeight - 6,
        {
          align: "center",
        }
      );

      pdf.save(
        `LegacyCare-Payment-Statement-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.pdf`
      );
    } catch (err) {
      console.error(
        "[PAYMENT STATEMENT PDF] ERROR:",
        err
      );

      setError(
        "Unable to generate the payment statement PDF."
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
            className="text-sm font-semibold text-teal-700"
          >
            ← Reports
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Payment Statement
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Successful, pending and overdue premium records in one downloadable statement.
          </p>
        </div>

        <button
          type="button"
          onClick={
            downloadStatement
          }
          disabled={
            loading ||
            downloading ||
            !clientDetails ||
            filteredPayments.length ===
              0
          }
          className="w-fit rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading
            ? "Creating PDF..."
            : "Download Statement PDF"}
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
                {
                  clientDetails.fullName
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Client ID
              </dt>

              <dd className="mt-1 font-semibold text-gray-900">
                {
                  clientDetails.displayClientId ||
                  clientDetails.clientId
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </dt>

              <dd className="mt-1 break-all font-medium text-gray-900">
                {
                  clientDetails.email
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Contact
              </dt>

              <dd className="mt-1 font-medium text-gray-900">
                {
                  clientDetails.cellNo
                }
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Address
              </dt>

              <dd className="mt-1 font-medium text-gray-900">
                {
                  clientDetails.address
                }
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
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Policy
              </label>

              <select
                value={
                  selectedPolicyId
                }
                onChange={(
                  event
                ) =>
                  setSelectedPolicyId(
                    event.target.value
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="all">
                  All Policies
                </option>

                {policies.map(
                  (policy) => (
                    <option
                      key={
                        policy.policyId
                      }
                      value={
                        policy.policyId
                      }
                    >
                      {
                        policy.label
                      }
                    </option>
                  )
                )}
              </select>
            </div>

            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Statement Period
              </label>

              <select
                value={
                  dateRange
                }
                onChange={(
                  event
                ) =>
                  setDateRange(
                    event.target
                      .value as DateRange
                  )
                }
                className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
              >
                <option value="6m">
                  Last 6 Months
                </option>

                <option value="12m">
                  Last 12 Months
                </option>

                <option value="all">
                  All Records
                </option>
              </select>
            </div>
          </div>
        </section>
      ) : null}

      {!loading &&
      !error ? (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="border-b border-gray-200 p-5">
            <div className="flex flex-wrap gap-x-8 gap-y-3 text-sm">
              <span>
                Paid:{" "}
                <strong className="text-green-700">
                  {formatCurrency(
                    totals.paid
                  )}
                </strong>
              </span>

              <span>
                Overdue:{" "}
                <strong className="text-red-700">
                  {formatCurrency(
                    totals.overdue
                  )}
                </strong>
              </span>

              <span>
                Pending:{" "}
                <strong className="text-blue-700">
                  {formatCurrency(
                    totals.pending
                  )}
                </strong>
              </span>

              <span>
                Outstanding:{" "}
                <strong className="text-orange-700">
                  {formatCurrency(
                    totals.outstanding
                  )}
                </strong>
              </span>
            </div>
          </div>

          {filteredPayments.length ===
          0 ? (
            <div className="p-10 text-center text-sm text-gray-500">
              No payment records found for this selection.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 text-sm">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Due
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Policy
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Package
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Amount
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Status
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Payment Date
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Method
                    </th>

                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                      Reference
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-gray-100">
                  {filteredPayments.map(
                    (payment) => (
                      <tr
                        key={
                          payment.paymentId
                        }
                      >
                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {formatDate(
                            payment.dueDate
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                          {getPolicyDisplay(
                            payment
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {getPackageName(
                            payment
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                          {formatCurrency(
                            payment.amount
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3">
                          <span
                            className={
                              isSuccessful(
                                payment
                              )
                                ? "font-semibold text-green-700"
                                : isOverdue(
                                      payment
                                    )
                                  ? "font-semibold text-red-700"
                                  : "font-semibold text-blue-700"
                            }
                          >
                            {getStatusLabel(
                              payment
                            )}
                          </span>
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {isSuccessful(
                            payment
                          )
                            ? formatDate(
                                payment.paymentDate
                              )
                            : "-"}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                          {getMethodLabel(
                            payment.method
                          )}
                        </td>

                        <td className="whitespace-nowrap px-4 py-3 font-mono text-xs text-gray-600">
                          {getPaymentReference(
                            payment.paymentId
                          )}
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      ) : null}
    </div>
  );
}