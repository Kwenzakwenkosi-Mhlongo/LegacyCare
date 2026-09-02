"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type Payment = {
  paymentId: string;
  amount: number;
  dueDate: string;
  status: string | number;
  policyId: string;
};

export default function ChoosePaymentMethodPage() {
  const params =
    useParams<{
      paymentId: string;
    }>();

  const router =
    useRouter();

  const [
    payment,
    setPayment,
  ] =
    useState<Payment | null>(
      null
    );

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
    const loadPayment =
      async () => {
        try {
          const token =
            getToken();

          if (!token) {
            throw new Error(
              "You are not logged in."
            );
          }

          const response =
            await fetch(
              `${API_URL}/Payment/${params.paymentId}`,
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
                "Unable to load payment."
            );
          }

          setPayment(
            data
          );
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPayment();
  }, [
    params.paymentId,
  ]);

  function formatCurrency(
    value: number
  ) {
    return new Intl.NumberFormat(
      "en-ZA",
      {
        style: "currency",
        currency: "ZAR",
      }
    ).format(value);
  }

  if (loading) {
    return (
      <div className="p-8 text-sm text-gray-500">
        Loading payment...
      </div>
    );
  }

  if (
    error ||
    !payment
  ) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error ||
          "Payment was not found."}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/client/payments"
          className="text-sm font-semibold text-teal-600"
        >
          ← Payments
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-gray-900">
          Pay Premium
        </h1>

        <p className="mt-1 text-gray-500">
          Select how you want to pay this premium.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <p className="text-sm text-gray-500">
          Policy
        </p>

        <p className="font-semibold">
          {
            payment.policyId
          }
        </p>

        <p className="mt-4 text-sm text-gray-500">
          Amount
        </p>

        <p className="text-2xl font-semibold">
          {formatCurrency(
            payment.amount
          )}
        </p>
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() =>
            router.push(
              `/client/payments/card?paymentId=${encodeURIComponent(
                payment.paymentId
              )}`
            )
          }
          className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-teal-500"
        >
          <span className="text-3xl">
            💳
          </span>

          <h2 className="mt-4 font-semibold text-gray-900">
            Pay by Card
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Continue to secure card payment.
          </p>
        </button>

        <button
          type="button"
          onClick={() =>
            router.push(
              `/client/payments/eft?paymentId=${encodeURIComponent(
                payment.paymentId
              )}`
            )
          }
          className="rounded-2xl border border-gray-200 bg-white p-6 text-left shadow-sm transition hover:border-teal-500"
        >
          <span className="text-3xl">
            🏦
          </span>

          <h2 className="mt-4 font-semibold text-gray-900">
            Pay by EFT
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Continue with an EFT payment.
          </p>
        </button>
      </section>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-700">
        Cash payments are not available through LegacyCare online payments.
      </div>
    </div>
  );
}
