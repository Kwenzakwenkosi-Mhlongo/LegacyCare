// File:
// Web/legacycare_website/app/(dashboard)/client/policies/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getToken } from "@/lib/auth";

const API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "http://localhost:5224/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type Beneficiary = {
  beneficiaryId?: string | number;
  fullName?: string | null;
  relationship?: string | number | null;
  status?: string | number | null;
};

type Policy = {
  policyId: string;
  userId: string;
  clientName: string;
  packageId: string;
  packageName: string;
  startDate: string;
  endDate: string | null;
  monthlyPremium: number;
  status: string;
  beneficiaries: Beneficiary[];
};

function normalizeStatus(value?: string | null): string {
  return (value || "").trim().toLowerCase();
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    minimumFractionDigits: 2,
  }).format(value);
}

function formatDate(value?: string | null): string {
  if (!value) {
    return "Ongoing";
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

function getStatusClasses(status: string): string {
  switch (normalizeStatus(status)) {
    case "active":
      return "bg-green-100 text-green-700";

    case "pending":
      return "bg-amber-100 text-amber-700";

    case "expired":
    case "inactive":
    case "cancelled":
    case "canceled":
      return "bg-gray-100 text-gray-600";

    default:
      return "bg-blue-100 text-blue-700";
  }
}

export default function ClientPoliciesPage() {
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    document.title = "My Policies | LegacyCare";
  }, []);

  useEffect(() => {
    const loadPolicies = async (): Promise<void> => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          throw new Error("You are not logged in.");
        }

        const response = await fetch(`${API_URL}/Policy/client`, {
          method: "GET",
          headers: {
            Accept: "application/json",
            Authorization: `Bearer ${token}`,
          },
          cache: "no-store",
        });

        const data = await response.json().catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              `Unable to load policies (${response.status}).`
          );
        }

        setPolicies(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("[CLIENT POLICIES] ERROR:", err);

        setPolicies([]);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load policies."
        );
      } finally {
        setLoading(false);
      }
    };

    void loadPolicies();
  }, []);

  const summary = useMemo(() => {
    const activePolicies = policies.filter(
      (policy) => normalizeStatus(policy.status) === "active"
    );

    const monthlyPremium = activePolicies.reduce(
      (total, policy) =>
        total + (Number(policy.monthlyPremium) || 0),
      0
    );

    const beneficiaries = activePolicies.reduce(
      (total, policy) =>
        total +
        (Array.isArray(policy.beneficiaries)
          ? policy.beneficiaries.length
          : 0),
      0
    );

    return {
      totalPolicies: policies.length,
      activePolicies: activePolicies.length,
      monthlyPremium,
      beneficiaries,
    };
  }, [policies]);

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-600 p-8 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
          LegacyCare Client Portal
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          My Policies
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-teal-50">
          View and manage your LegacyCare policies, packages,
          beneficiaries and current coverage information.
        </p>
      </section>

      {!loading && !error && policies.length > 0 ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Policies
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summary.totalPolicies}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Active Policies
            </p>

            <p className="mt-2 text-2xl font-semibold text-green-700">
              {summary.activePolicies}
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Monthly Premium
            </p>

            <p className="mt-2 text-xl font-semibold text-gray-900">
              {formatCurrency(summary.monthlyPremium)}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Combined active policy premium
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Beneficiaries
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {summary.beneficiaries}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Across active policies
            </p>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div
              key={item}
              className="h-72 animate-pulse rounded-2xl bg-white shadow-sm"
            />
          ))}
        </div>
      ) : null}

      {!loading && error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Unable to load policies
          </h2>

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>
        </section>
      ) : null}

      {!loading && !error && policies.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            No policies found
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            There are currently no policies linked to your account.
          </p>
        </section>
      ) : null}

      {!loading &&
        !error &&
        policies.map((policy) => {
          const isActive =
            normalizeStatus(policy.status) === "active";

          const beneficiaryCount =
            Array.isArray(policy.beneficiaries)
              ? policy.beneficiaries.length
              : 0;

          return (
            <section
              key={policy.policyId}
              className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Policy
                  </p>

                  <h2 className="mt-1 text-xl font-semibold text-gray-900">
                    {policy.policyId}
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    {policy.packageName} Package
                  </p>
                </div>

                <span
                  className={`w-fit rounded-full px-3 py-1 text-xs font-medium ${getStatusClasses(
                    policy.status
                  )}`}
                >
                  {policy.status}
                </span>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-5">
                <div>
                  <p className="text-xs text-gray-500">
                    Package
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {policy.packageName}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Monthly Premium
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatCurrency(
                      Number(policy.monthlyPremium) || 0
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Start Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(policy.startDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    End Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(policy.endDate)}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-gray-500">
                    Beneficiaries
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {beneficiaryCount}
                  </p>
                </div>
              </div>

              <div className="mt-6 border-t border-gray-100 pt-5">
                <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  Manage Policy
                </p>

                <div className="flex flex-wrap gap-3">
                  <Link
                    href={`/client/policies/${policy.policyId}`}
                    className="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
                  >
                    View Policy
                  </Link>

                  {isActive ? (
                    <>
                      <Link
                        href={`/client/policies/${policy.policyId}/change-package`}
                        className="inline-flex items-center justify-center rounded-lg border border-teal-200 bg-teal-50 px-4 py-2.5 text-sm font-medium text-teal-700 transition hover:bg-teal-100"
                      >
                        Change Package
                      </Link>

                      <Link
                        href={`/client/policies/${policy.policyId}/beneficiaries`}
                        className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700"
                      >
                        Manage Beneficiaries
                      </Link>
                    </>
                  ) : (
                    <span className="inline-flex items-center rounded-lg bg-gray-100 px-4 py-2.5 text-sm text-gray-500">
                      Policy changes unavailable
                    </span>
                  )}
                </div>
              </div>
            </section>
          );
        })}
    </div>
  );
}