// File:
// Web/legacycare_website/app/(dashboard)/client/payments/eft/page.tsx

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
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

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(value);
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
    month: "long",
    year: "numeric",
  });
}

function getPackageName(payment: Payment): string {
  return (
    payment.policy?.package?.packageName ||
    payment.policy?.package?.name ||
    "Policy Premium"
  );
}

function getPolicyReference(payment: Payment): string {
  return (
    payment.policy?.policyNumber ||
    payment.policyId ||
    "Not available"
  );
}

function createEftReference(paymentId: string): string {
  const compactId = paymentId
    .replace(/-/g, "")
    .slice(0, 10)
    .toUpperCase();

  return `LC-${compactId}`;
}

export default function EftPaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const paymentId =
    searchParams.get("paymentId")?.trim() ?? "";

  const [payment, setPayment] =
    useState<Payment | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [sending, setSending] =
    useState(false);

  const [error, setError] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const [copied, setCopied] =
    useState(false);

  useEffect(() => {
    document.title =
      "EFT Payment | LegacyCare";
  }, []);

  useEffect(() => {
    async function loadPayment(): Promise<void> {
      try {
        setLoading(true);
        setError("");
        setSuccessMessage("");

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
            `${API_URL}/Payment/${encodeURIComponent(
              paymentId
            )}`,
            {
              method: "GET",
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
              data ||
              `Unable to load payment (${response.status}).`
          );
        }

        setPayment(data);
      } catch (err) {
        console.error(
          "[EFT PAYMENT] LOAD ERROR:",
          err
        );

        setPayment(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load payment."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadPayment();
  }, [paymentId]);

  const eftReference =
    useMemo(() => {
      if (!payment) {
        return "";
      }

      return createEftReference(
        payment.paymentId
      );
    }, [payment]);

  async function copyReference(): Promise<void> {
    if (!eftReference) {
      return;
    }

    try {
      await navigator.clipboard.writeText(
        eftReference
      );

      setCopied(true);

      window.setTimeout(() => {
        setCopied(false);
      }, 2000);
    } catch (err) {
      console.error(
        "[EFT PAYMENT] COPY ERROR:",
        err
      );
    }
  }

  async function sendEftPayment(): Promise<void> {
    if (!payment) {
      return;
    }

    try {
      setSending(true);
      setError("");
      setSuccessMessage("");

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response =
        await fetch(
          `${API_URL}/Payment/${encodeURIComponent(
            payment.paymentId
          )}/confirm`,
          {
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                method: 2,
              }),
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
            data ||
            `Unable to send payment (${response.status}).`
        );
      }

      setSuccessMessage(
        "Payment sent successfully. Your EFT payment record has been updated."
      );

      window.setTimeout(() => {
        router.push(
          "/client/payments"
        );

        router.refresh();
      }, 1200);
    } catch (err) {
      console.error(
        "[EFT PAYMENT] SEND ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to send payment."
      );
    } finally {
      setSending(false);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="h-10 w-52 animate-pulse rounded-lg bg-gray-200" />

        <div className="h-80 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to open EFT payment
          </h1>

          <p className="mt-2 text-sm text-red-700">
            {error ||
              "Payment could not be found."}
          </p>

          <div className="mt-6">
            <Link
              href="/client/payments"
              className="inline-flex rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700"
            >
              Back to Payments
            </Link>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href={`/client/payments/pay/${encodeURIComponent(
            payment.paymentId
          )}`}
          className="text-sm font-semibold text-teal-700 transition hover:text-teal-800"
        >
          ← Back to payment methods
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          EFT Payment
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review your premium and payment reference before sending
          your EFT payment.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm text-gray-500">
                Amount to pay
              </p>

              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {formatCurrency(
                  Number(
                    payment.amount
                  ) || 0
                )}
              </p>
            </div>

            <span className="w-fit rounded-full border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700">
              EFT
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-5 p-6 sm:grid-cols-2">
          <div>
            <p className="text-xs text-gray-500">
              Package
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {getPackageName(
                payment
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Policy
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {getPolicyReference(
                payment
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Due date
            </p>

            <p className="mt-1 text-sm font-semibold text-gray-900">
              {formatDate(
                payment.dueDate
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Payment ID
            </p>

            <p
              className="mt-1 truncate text-sm font-semibold text-gray-900"
              title={
                payment.paymentId
              }
            >
              {payment.paymentId}
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-blue-200 bg-blue-50 p-6">
        <h2 className="font-semibold text-blue-900">
          EFT reference
        </h2>

        <p className="mt-2 text-sm text-blue-800">
          Use this reference so the transfer can be linked to this
          payment record.
        </p>

        <div className="mt-4 flex flex-col gap-3 rounded-xl border border-blue-200 bg-white p-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
              Payment Reference
            </p>

            <p className="mt-1 font-mono text-lg font-semibold text-gray-900">
              {eftReference}
            </p>
          </div>

          <button
            type="button"
            disabled={sending}
            onClick={() =>
              void copyReference()
            }
            className="rounded-lg border border-blue-300 bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 transition hover:bg-blue-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {copied
              ? "Copied"
              : "Copy Reference"}
          </button>
        </div>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-gray-900">
          EFT instructions
        </h2>

        <ol className="mt-4 space-y-3 text-sm leading-6 text-gray-600">
          <li>
            <span className="font-semibold text-gray-900">
              1.
            </span>{" "}
            Review the payment amount and EFT reference.
          </li>

          <li>
            <span className="font-semibold text-gray-900">
              2.
            </span>{" "}
            Use the verified LegacyCare banking details when real EFT
            processing is configured.
          </li>

          <li>
            <span className="font-semibold text-gray-900">
              3.
            </span>{" "}
            The amount for this payment is{" "}
            <span className="font-semibold text-gray-900">
              {formatCurrency(
                Number(
                  payment.amount
                ) || 0
              )}
            </span>
            .
          </li>

          <li>
            <span className="font-semibold text-gray-900">
              4.
            </span>{" "}
            Use{" "}
            <span className="font-mono font-semibold text-gray-900">
              {eftReference}
            </span>{" "}
            as the EFT reference.
          </li>

          <li>
            <span className="font-semibold text-gray-900">
              5.
            </span>{" "}
            Select Send Payment to complete this development payment
            flow.
          </li>
        </ol>
      </section>

      <section className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
        <h2 className="font-semibold text-amber-900">
          Development payment flow
        </h2>

        <p className="mt-2 text-sm leading-6 text-amber-800">
          Send Payment currently records a successful EFT payment
          through LegacyCare&apos;s backend so payment history, reports,
          status totals and graphs can be tested without transferring
          real money.
        </p>
      </section>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm font-medium text-red-700">
            {error}
          </p>
        </section>
      ) : null}

      {successMessage ? (
        <section className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
          <p className="text-sm font-medium text-green-700">
            {successMessage}
          </p>
        </section>
      ) : null}

      <div className="flex flex-wrap justify-end gap-3">
        <Link
          href={`/client/payments/pay/${encodeURIComponent(
            payment.paymentId
          )}`}
          aria-disabled={sending}
          className={`rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 ${
            sending
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          Change Method
        </Link>

        <Link
          href="/client/payments"
          aria-disabled={sending}
          className={`rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 ${
            sending
              ? "pointer-events-none opacity-50"
              : ""
          }`}
        >
          Cancel
        </Link>

        <button
          type="button"
          disabled={
            sending ||
            Boolean(
              successMessage
            )
          }
          onClick={() =>
            void sendEftPayment()
          }
          className="rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {sending
            ? "Sending Payment..."
            : successMessage
              ? "Payment Sent"
              : "Send Payment"}
        </button>
      </div>
    </div>
  );
}