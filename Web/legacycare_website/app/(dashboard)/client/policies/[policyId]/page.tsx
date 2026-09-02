
// ============================================================================
// FRONTEND PAGE 1
// File: app/(dashboard)/client/policies/[policyId]/page.tsx
// ============================================================================

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
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

type Beneficiary = {
  beneficiaryId: string;
  fullName: string;
  idNumber: string;
  dateOfBirth: string;
  gender: string;
  relationship: string | number;
  status: string | number;
};

type Policy = {
  policyId: string;
  userId: string;
  clientName: string;
  packageId: string;
  packageName: string;
  monthlyPremium: number;
  startDate: string;
  endDate: string | null;
  status: string;
  beneficiaries: Beneficiary[];
};

type Package = {
  packageId: string;
  name: string;
  monthlyPremium: number;
  description: string;
  maxBeneficiaries: number;
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

export default function ClientPolicyDetailsPage() {
  const params = useParams();

  const policyId =
    String(params.policyId || "");

  const [policy, setPolicy] =
    useState<Policy | null>(null);

  const [packageDetails, setPackageDetails] =
    useState<Package | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    const load = async (): Promise<void> => {
      try {
        setLoading(true);
        setError("");

        const token = getToken();

        if (!token) {
          throw new Error(
            "You are not logged in."
          );
        }

        const headers = {
          Accept: "application/json",
          Authorization: `Bearer ${token}`,
        };

        const policyResponse =
          await fetch(
            `${API_URL}/Policy/client`,
            {
              headers,
              cache: "no-store",
            }
          );

        const policies =
          await policyResponse
            .json()
            .catch(() => null);

        if (!policyResponse.ok) {
          throw new Error(
            policies?.message ||
              "Unable to load policies."
          );
        }

        const selectedPolicy =
          Array.isArray(policies)
            ? policies.find(
                (item) =>
                  item.policyId ===
                  policyId
              )
            : null;

        if (!selectedPolicy) {
          throw new Error(
            "Policy not found."
          );
        }

        setPolicy(selectedPolicy);

        const packageResponse =
          await fetch(
            `${API_URL}/Package/${selectedPolicy.packageId}`,
            {
              headers,
              cache: "no-store",
            }
          );

        if (packageResponse.ok) {
          const packageData =
            await packageResponse.json();

          setPackageDetails(
            packageData
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load policy."
        );
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [policyId]);

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-white shadow-sm" />
    );
  }

  if (error || !policy) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-700">
        {error || "Policy not found."}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/client/policies"
          className="text-sm font-medium text-teal-600"
        >
          ← My Policies
        </Link>

        <h1 className="mt-3 text-2xl font-semibold text-gray-900">
          {policy.policyId}
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Full policy information and management options.
        </p>
      </div>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-sm text-gray-500">
              Current Package
            </p>

            <h2 className="mt-1 text-xl font-semibold text-gray-900">
              {policy.packageName}
            </h2>
          </div>

          <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-medium text-green-700">
            {policy.status}
          </span>
        </div>

        <div className="mt-6 grid gap-5 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <p className="text-xs text-gray-500">
              Monthly Premium
            </p>
            <p className="mt-1 font-medium">
              {formatCurrency(
                policy.monthlyPremium
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Start Date
            </p>
            <p className="mt-1 font-medium">
              {formatDate(
                policy.startDate
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              End Date
            </p>
            <p className="mt-1 font-medium">
              {formatDate(
                policy.endDate
              )}
            </p>
          </div>

          <div>
            <p className="text-xs text-gray-500">
              Beneficiaries
            </p>
            <p className="mt-1 font-medium">
              {policy.beneficiaries?.length ||
                0}
            </p>
          </div>
        </div>

        {packageDetails ? (
          <div className="mt-6 rounded-xl bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              Package Details
            </p>

            <p className="mt-2 text-sm text-gray-600">
              {packageDetails.description}
            </p>

            <p className="mt-2 text-xs text-gray-500">
              Maximum beneficiaries:{" "}
              {packageDetails.maxBeneficiaries}
            </p>
          </div>
        ) : null}
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <Link
          href={`/client/policies/${policyId}/change-package`}
          className="rounded-2xl border border-teal-200 bg-teal-50 p-6 transition hover:bg-teal-100"
        >
          <h2 className="font-semibold text-teal-800">
            Change Package
          </h2>

          <p className="mt-2 text-sm text-teal-700">
            Request a different LegacyCare package.
          </p>
        </Link>

        <Link
          href={`/client/policies/${policyId}/beneficiaries`}
          className="rounded-2xl border border-teal-200 bg-teal-50 p-6 transition hover:bg-teal-100"
        >
          <h2 className="font-semibold text-teal-800">
            Manage Beneficiaries
          </h2>

          <p className="mt-2 text-sm text-teal-700">
            Add, update, or remove beneficiaries through approval requests.
          </p>
        </Link>
      </section>
    </div>
  );
}
