// File:
// Web/legacycare_website/app/(dashboard)/client/payments/card/page.tsx

"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

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

export default function CardPaymentPage() {
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

  useEffect(() => {
    document.title =
      "Card Payment | LegacyCare";
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
          "[CARD PAYMENT] LOAD ERROR:",
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

  async function sendCardPayment(): Promise<void> {
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
                method: 1,
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
        "Payment sent successfully. Your payment record has been updated."
      );

      window.setTimeout(() => {
        router.push(
          "/client/payments"
        );

        router.refresh();
      }, 1200);
    } catch (err) {
      console.error(
        "[CARD PAYMENT] SEND ERROR:",
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

        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="mx-auto max-w-3xl">
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h1 className="text-lg font-semibold text-red-900">
            Unable to open card payment
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
          Card Payment
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Review the premium before sending your card payment.
        </p>
      </div>

      <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-6">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
            <div>
              <p className="text-sm text-gray-500">
                Payment amount
              </p>

              <p className="mt-2 text-3xl font-semibold text-gray-900">
                {formatCurrency(
                  Number(
                    payment.amount
                  ) || 0
                )}
              </p>
            </div>

            <span className="w-fit rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
              Card
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
          Card payment
        </h2>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          This development payment flow records the payment through
          LegacyCare&apos;s payment service so you can test payment
          history, reports and status updates without processing a
          real card transaction.
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
            void sendCardPayment()
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