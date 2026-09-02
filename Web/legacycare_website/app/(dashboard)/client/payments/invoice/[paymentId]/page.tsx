// ============================================================================
// FILE 2
// Web/legacycare_website/app/(dashboard)/client/payments/
// invoice/[paymentId]/page.tsx
// ============================================================================

"use client";

import { jsPDF } from "jspdf";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

import { getToken } from "@/lib/auth";

const INVOICE_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type PaymentInvoice = {
  paymentId: string;
  invoiceReference: string;
  amount: number;
  dueDate: string;
  paymentDate?: string | null;
  method?: string | number | null;
  status: string | number;

  policyId: string;
  policyNumber: string;
  packageName: string;
  policyStatus: string;

  clientId: string;
  displayClientId: string;

  fullName: string;
  email: string;
  cellNo: string;
  address: string;
};

function normalizeInvoiceValue(
  value?: string | number | null
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase();
}

function formatInvoiceCurrency(
  value: number
): string {
  return new Intl.NumberFormat(
    "en-ZA",
    {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }
  ).format(value);
}

function formatPdfCurrency(
  value: number
): string {
  return `R ${Number(
    value || 0
  ).toFixed(2)}`;
}

function formatInvoiceDate(
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
      month: "long",
      year: "numeric",
    }
  );
}

function getInvoiceMethodLabel(
  method?: string | number | null
): string {
  const value =
    normalizeInvoiceValue(
      method
    );

  if (
    value === "1" ||
    value === "card"
  ) {
    return "Card";
  }

  if (
    value === "2" ||
    value === "eft"
  ) {
    return "EFT";
  }

  if (
    value === "0" ||
    value === "cash"
  ) {
    return "Cash";
  }

  return "Not available";
}

function getInvoiceStatusLabel(
  status: string | number
): string {
  const value =
    normalizeInvoiceValue(
      status
    );

  if (
    value === "1" ||
    value === "successful"
  ) {
    return "Successful";
  }

  return String(status);
}

function getInvoiceErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (
    typeof data === "string"
  ) {
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

    if (
      typeof message === "string"
    ) {
      return message;
    }
  }

  return fallback;
}

export default function PaymentInvoicePage() {
  const params =
    useParams();

  const rawPaymentId =
    params.paymentId;

  const paymentId =
    Array.isArray(
      rawPaymentId
    )
      ? rawPaymentId[0] ?? ""
      : String(
          rawPaymentId ?? ""
        );

  const [
    invoice,
    setInvoice,
  ] =
    useState<PaymentInvoice | null>(
      null
    );

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
      "Payment Receipt | LegacyCare";
  }, []);

  useEffect(() => {
    async function loadInvoice(): Promise<void> {
      try {
        setLoading(true);
        setError("");

        if (!paymentId) {
          throw new Error(
            "Payment ID is missing."
          );
        }

        const token =
          getToken();

        if (!token) {
          throw new Error(
            "You are not logged in."
          );
        }

        const response =
          await fetch(
            `${INVOICE_API_URL}/Payment/${encodeURIComponent(
              paymentId
            )}/invoice`,
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

        if (!response.ok) {
          throw new Error(
            getInvoiceErrorMessage(
              data,
              `Unable to load invoice (${response.status}).`
            )
          );
        }

        setInvoice(
          data as PaymentInvoice
        );
      } catch (err) {
        console.error(
          "[INVOICE] LOAD ERROR:",
          err
        );

        setInvoice(
          null
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load invoice."
        );
      } finally {
        setLoading(
          false
        );
      }
    }

    void loadInvoice();
  }, [paymentId]);

  function downloadPdf(): void {
    if (!invoice) {
      return;
    }

    try {
      setDownloading(true);
      setError("");

      const pdf =
        new jsPDF({
          orientation:
            "portrait",
          unit:
            "mm",
          format:
            "a4",
        });

      const pageWidth =
        pdf.internal.pageSize.getWidth();

      const pageHeight =
        pdf.internal.pageSize.getHeight();

      const left = 18;
      const right =
        pageWidth - 18;

      const contentWidth =
        right - left;

      // ----------------------------------------------------------------------
      // HEADER
      // ----------------------------------------------------------------------

      pdf.setFillColor(
        15,
        118,
        110
      );

      pdf.rect(
        0,
        0,
        pageWidth,
        48,
        "F"
      );

      pdf.setFillColor(
        255,
        255,
        255
      );

      pdf.circle(
        29,
        24,
        10,
        "F"
      );

      pdf.setTextColor(
        15,
        118,
        110
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        12
      );

      pdf.text(
        "LC",
        29,
        27,
        {
          align:
            "center",
        }
      );

      pdf.setTextColor(
        255,
        255,
        255
      );

      pdf.setFontSize(
        21
      );

      pdf.text(
        "LegacyCare",
        44,
        21
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        9
      );

      pdf.text(
        "Payment Receipt & Invoice",
        44,
        29
      );

      pdf.setFillColor(
        220,
        252,
        231
      );

      pdf.roundedRect(
        150,
        14,
        42,
        11,
        3,
        3,
        "F"
      );

      pdf.setTextColor(
        21,
        128,
        61
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        8
      );

      pdf.text(
        "PAID",
        171,
        21,
        {
          align:
            "center",
        }
      );

      // ----------------------------------------------------------------------
      // REFERENCE STRIP
      // ----------------------------------------------------------------------

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.setFillColor(
        248,
        250,
        252
      );

      pdf.roundedRect(
        left,
        56,
        contentWidth,
        22,
        3,
        3,
        "F"
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        8
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "INVOICE REFERENCE",
        left + 6,
        64
      );

      pdf.text(
        "CLIENT",
        112,
        64
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        10
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.text(
        invoice.invoiceReference,
        left + 6,
        71
      );

      pdf.text(
        invoice.displayClientId ||
          invoice.clientId ||
          "N/A",
        112,
        71
      );

      // ----------------------------------------------------------------------
      // POLICY HOLDER
      // ----------------------------------------------------------------------

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        11
      );

      pdf.setTextColor(
        15,
        118,
        110
      );

      pdf.text(
        "Policy Holder",
        left,
        91
      );

      pdf.setDrawColor(
        226,
        232,
        240
      );

      pdf.roundedRect(
        left,
        97,
        83,
        64,
        3,
        3
      );

      pdf.setFontSize(
        8
      );

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
        "Name",
        left + 5,
        107
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        10
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.text(
        invoice.fullName ||
          "Not available",
        left + 5,
        114
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        8
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "Email",
        left + 5,
        124
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.text(
        invoice.email ||
          "Not available",
        left + 5,
        131
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "Contact",
        left + 5,
        141
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.text(
        invoice.cellNo ||
          "Not available",
        left + 5,
        148
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "Address",
        left + 5,
        157
      );

      const addressLines =
        pdf.splitTextToSize(
          invoice.address ||
            "Not available",
          70
        );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.text(
        addressLines,
        left + 5,
        164
      );

      // ----------------------------------------------------------------------
      // POLICY DETAILS
      // ----------------------------------------------------------------------

      const policyX =
        left + 91;

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        11
      );

      pdf.setTextColor(
        15,
        118,
        110
      );

      pdf.text(
        "Policy Details",
        policyX,
        91
      );

      pdf.setDrawColor(
        226,
        232,
        240
      );

      pdf.roundedRect(
        policyX,
        97,
        83,
        64,
        3,
        3
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        8
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "Policy Number",
        policyX + 5,
        107
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        10
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.text(
        invoice.policyNumber ||
          invoice.policyId,
        policyX + 5,
        114
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        8
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "Package",
        policyX + 5,
        126
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.text(
        invoice.packageName ||
          "Policy Premium",
        policyX + 5,
        133
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "Policy Status",
        policyX + 5,
        145
      );

      pdf.setTextColor(
        21,
        128,
        61
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        invoice.policyStatus ||
          "Active",
        policyX + 5,
        152
      );

      // ----------------------------------------------------------------------
      // PAYMENT DETAILS
      // ----------------------------------------------------------------------

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        11
      );

      pdf.setTextColor(
        15,
        118,
        110
      );

      pdf.text(
        "Payment Details",
        left,
        179
      );

      pdf.setFillColor(
        248,
        250,
        252
      );

      pdf.roundedRect(
        left,
        185,
        contentWidth,
        48,
        3,
        3,
        "F"
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        10
      );

      pdf.text(
        "Premium Payment",
        left + 6,
        196
      );

      pdf.setFontSize(
        15
      );

      pdf.setTextColor(
        21,
        128,
        61
      );

      pdf.text(
        formatPdfCurrency(
          invoice.amount
        ),
        right - 6,
        196,
        {
          align:
            "right",
        }
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        8
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "Due Date",
        left + 6,
        208
      );

      pdf.text(
        "Payment Date",
        67,
        208
      );

      pdf.text(
        "Method",
        119,
        208
      );

      pdf.text(
        "Status",
        157,
        208
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.text(
        formatInvoiceDate(
          invoice.dueDate
        ),
        left + 6,
        215
      );

      pdf.text(
        formatInvoiceDate(
          invoice.paymentDate
        ),
        67,
        215
      );

      pdf.text(
        getInvoiceMethodLabel(
          invoice.method
        ),
        119,
        215
      );

      pdf.setTextColor(
        21,
        128,
        61
      );

      pdf.text(
        getInvoiceStatusLabel(
          invoice.status
        ),
        157,
        215
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        8
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        `Payment reference: ${invoice.invoiceReference}`,
        left + 6,
        226
      );

      // ----------------------------------------------------------------------
      // TOTAL
      // ----------------------------------------------------------------------

      pdf.setFillColor(
        236,
        253,
        245
      );

      pdf.roundedRect(
        left,
        241,
        contentWidth,
        25,
        3,
        3,
        "F"
      );

      pdf.setFont(
        "helvetica",
        "bold"
      );

      pdf.setFontSize(
        12
      );

      pdf.setTextColor(
        31,
        41,
        55
      );

      pdf.text(
        "Total Paid",
        left + 6,
        256
      );

      pdf.setFontSize(
        17
      );

      pdf.setTextColor(
        21,
        128,
        61
      );

      pdf.text(
        formatPdfCurrency(
          invoice.amount
        ),
        right - 6,
        256,
        {
          align:
            "right",
        }
      );

      // ----------------------------------------------------------------------
      // FOOTER
      // ----------------------------------------------------------------------

      pdf.setDrawColor(
        226,
        232,
        240
      );

      pdf.line(
        left,
        276,
        right,
        276
      );

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        7.5
      );

      pdf.setTextColor(
        107,
        114,
        128
      );

      pdf.text(
        "This document confirms the successful premium payment recorded by LegacyCare.",
        pageWidth / 2,
        283,
        {
          align:
            "center",
        }
      );

      pdf.text(
        `Generated ${new Date().toLocaleString(
          "en-ZA"
        )}`,
        pageWidth / 2,
        288,
        {
          align:
            "center",
        }
      );

      pdf.text(
        `Page 1 of 1`,
        pageWidth / 2,
        pageHeight - 4,
        {
          align:
            "center",
        }
      );

      pdf.save(
        `LegacyCare-Receipt-${invoice.invoiceReference}.pdf`
      );
    } catch (err) {
      console.error(
        "[INVOICE] PDF ERROR:",
        err
      );

      setError(
        "Unable to generate the PDF invoice."
      );
    } finally {
      setDownloading(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-4xl space-y-5">
        <div className="h-10 w-40 animate-pulse rounded-lg bg-gray-200" />

        <div className="h-[550px] animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  if (
    error &&
    !invoice
  ) {
    return (
      <div className="mx-auto max-w-4xl">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Invoice unavailable
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error}
          </p>

          <Link
            href="/client/payments"
            className="mt-5 inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Back to Payments
          </Link>
        </section>
      </div>
    );
  }

  if (!invoice) {
    return null;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <Link
          href="/client/payments"
          className="text-sm font-semibold text-teal-700 hover:text-teal-800"
        >
          ← Back to Payments
        </Link>

        <button
          type="button"
          disabled={
            downloading
          }
          onClick={
            downloadPdf
          }
          className="w-fit rounded-lg bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {downloading
            ? "Creating PDF..."
            : "Download PDF Receipt"}
        </button>
      </div>

      {error ? (
        <section className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </section>
      ) : null}

      <article className="overflow-hidden rounded-3xl border border-gray-200 bg-white shadow-sm">
        <header className="bg-gradient-to-r from-teal-700 to-emerald-600 p-8 text-white">
          <div className="flex flex-col justify-between gap-6 sm:flex-row sm:items-start">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-lg font-bold text-teal-700 shadow-sm">
                LC
              </div>

              <div>
                <h1 className="text-3xl font-bold">
                  LegacyCare
                </h1>

                <p className="mt-1 text-sm text-teal-50">
                  Payment Receipt & Invoice
                </p>
              </div>
            </div>

            <div className="flex flex-col items-start gap-3 sm:items-end">
              <span className="rounded-full bg-green-100 px-4 py-1.5 text-xs font-bold tracking-wide text-green-700">
                PAID
              </span>

              <div className="sm:text-right">
                <p className="text-xs uppercase tracking-wide text-teal-100">
                  Receipt Reference
                </p>

                <p className="mt-1 font-mono text-lg font-bold">
                  {
                    invoice.invoiceReference
                  }
                </p>
              </div>
            </div>
          </div>
        </header>

        <section className="border-b border-gray-200 bg-gray-50 px-8 py-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Client
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {
                  invoice.displayClientId ||
                  invoice.clientId
                }
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Policy
              </p>

              <p className="mt-1 font-semibold text-gray-900">
                {
                  invoice.policyNumber
                }
              </p>
            </div>

            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                Amount Paid
              </p>

              <p className="mt-1 text-lg font-bold text-green-700">
                {formatInvoiceCurrency(
                  Number(
                    invoice.amount
                  ) || 0
                )}
              </p>
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-6 border-b border-gray-200 p-8 md:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-teal-700">
              Policy Holder
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500">
                  Name
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {
                    invoice.fullName
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Email
                </p>

                <p className="mt-1 break-all text-sm font-medium text-gray-900">
                  {
                    invoice.email
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Contact
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {
                    invoice.cellNo
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Address
                </p>

                <p className="mt-1 text-sm font-medium leading-6 text-gray-900">
                  {
                    invoice.address
                  }
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-200 p-6">
            <h2 className="text-sm font-bold uppercase tracking-wide text-teal-700">
              Policy Details
            </h2>

            <div className="mt-5 space-y-4">
              <div>
                <p className="text-xs text-gray-500">
                  Policy Number
                </p>

                <p className="mt-1 font-semibold text-gray-900">
                  {
                    invoice.policyNumber
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Package
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {
                    invoice.packageName
                  }
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Policy Status
                </p>

                <span className="mt-2 inline-flex rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700">
                  {
                    invoice.policyStatus
                  }
                </span>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Client ID
                </p>

                <p className="mt-1 text-sm font-medium text-gray-900">
                  {
                    invoice.displayClientId
                  }
                </p>
              </div>
            </div>
          </div>
        </section>

        <section className="p-8">
          <h2 className="text-sm font-bold uppercase tracking-wide text-teal-700">
            Payment Details
          </h2>

          <div className="mt-5 overflow-hidden rounded-2xl border border-gray-200">
            <div className="flex flex-col justify-between gap-3 bg-gray-50 p-5 sm:flex-row sm:items-center">
              <div>
                <p className="font-semibold text-gray-900">
                  Premium Payment
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  {
                    invoice.packageName
                  }
                </p>
              </div>

              <p className="text-2xl font-bold text-green-700">
                {formatInvoiceCurrency(
                  Number(
                    invoice.amount
                  ) || 0
                )}
              </p>
            </div>

            <div className="grid grid-cols-1 gap-5 p-5 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <p className="text-xs text-gray-500">
                  Due Date
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatInvoiceDate(
                    invoice.dueDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Payment Date
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {formatInvoiceDate(
                    invoice.paymentDate
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Payment Method
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {getInvoiceMethodLabel(
                    invoice.method
                  )}
                </p>
              </div>

              <div>
                <p className="text-xs text-gray-500">
                  Status
                </p>

                <p className="mt-1 text-sm font-semibold text-green-700">
                  {getInvoiceStatusLabel(
                    invoice.status
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="mt-6 rounded-2xl bg-emerald-50 p-6">
            <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
              <div>
                <p className="text-sm font-semibold text-gray-900">
                  Total Paid
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Payment reference{" "}
                  <span className="font-mono font-semibold">
                    {
                      invoice.invoiceReference
                    }
                  </span>
                </p>
              </div>

              <p className="text-3xl font-bold text-green-700">
                {formatInvoiceCurrency(
                  Number(
                    invoice.amount
                  ) || 0
                )}
              </p>
            </div>
          </div>

          <div className="mt-8 border-t border-gray-200 pt-6 text-center">
            <p className="text-xs leading-5 text-gray-500">
              This receipt confirms the successful premium payment recorded by LegacyCare.
            </p>

            <p className="mt-2 text-xs text-gray-400">
              Generated{" "}
              {new Date().toLocaleString(
                "en-ZA"
              )}
            </p>
          </div>
        </section>
      </article>
    </div>
  );
}