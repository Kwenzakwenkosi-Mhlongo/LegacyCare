// ============================================================================
// FRONTEND PAGE 2
// File: app/(dashboard)/client/policies/[policyId]/change-package/page.tsx
// ============================================================================

"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import {
  useEffect,
  useState,
} from "react";

import { getToken } from "@/lib/auth";

const CHANGE_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type Package = {
  packageId: string;
  name: string;
  monthlyPremium: number;
  description: string;
  maxBeneficiaries: number;
};

type Policy = {
  policyId: string;
  packageId: string;
  packageName: string;
  monthlyPremium: number;
  status: string;
};

type ChangeRequest = {
  requestId: string;
  policyId: string;
  newPackageId: string;
  requestDate: string;
  status: string | number;
  newPackage?: Package | null;
};

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
  }).format(value);
}

function requestStatus(
  status: string | number
): string {
  const value =
    String(status).toLowerCase();

  if (value === "0") {
    return "Pending";
  }

  if (value === "1") {
    return "Approved";
  }

  if (value === "2") {
    return "Rejected";
  }

  return String(status);
}

export default function ChangePackagePage() {
  const params = useParams();

  const policyId =
    String(params.policyId || "");

  const [policy, setPolicy] =
    useState<Policy | null>(null);

  const [packages, setPackages] =
    useState<Package[]>([]);

  const [requests, setRequests] =
    useState<ChangeRequest[]>([]);

  const [selectedPackage, setSelectedPackage] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [submitting, setSubmitting] =
    useState(false);

  const [error, setError] =
    useState("");

  const [success, setSuccess] =
    useState("");

  const loadData =
    async (): Promise<void> => {
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

        const [
          policiesResponse,
          packagesResponse,
          requestsResponse,
        ] = await Promise.all([
          fetch(
            `${CHANGE_API_URL}/Policy/client`,
            {
              headers,
              cache: "no-store",
            }
          ),

          fetch(
            `${CHANGE_API_URL}/Package`,
            {
              headers,
              cache: "no-store",
            }
          ),

          fetch(
            `${CHANGE_API_URL}/PackageChangeRequest/client/policy/${policyId}`,
            {
              headers,
              cache: "no-store",
            }
          ),
        ]);

        const policiesData =
          await policiesResponse.json();

        if (!policiesResponse.ok) {
          throw new Error(
            "Unable to load policy."
          );
        }

        const selected =
          policiesData.find(
            (item: Policy) =>
              item.policyId === policyId
          );

        if (!selected) {
          throw new Error(
            "Policy not found."
          );
        }

        setPolicy(selected);

        const packagesData =
          await packagesResponse.json();

        setPackages(
          Array.isArray(packagesData)
            ? packagesData
            : []
        );

        if (requestsResponse.ok) {
          const requestsData =
            await requestsResponse.json();

          setRequests(
            Array.isArray(requestsData)
              ? requestsData
              : []
          );
        }
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load package information."
        );
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    void loadData();
  }, [policyId]);

  const submitRequest =
    async (): Promise<void> => {
      try {
        if (!selectedPackage) {
          setError(
            "Select a package."
          );
          return;
        }

        setSubmitting(true);
        setError("");
        setSuccess("");

        const token = getToken();

        if (!token) {
          throw new Error(
            "You are not logged in."
          );
        }

        const response =
          await fetch(
            `${CHANGE_API_URL}/PackageChangeRequest`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",
                Authorization:
                  `Bearer ${token}`,
              },

              body: JSON.stringify({
                policyId,
                newPackageId:
                  selectedPackage,
              }),
            }
          );

        const data =
          await response
            .json()
            .catch(() => null);

        if (!response.ok) {
          throw new Error(
            data?.message ||
              data ||
              "Unable to submit package change request."
          );
        }

        setSelectedPackage("");

        setSuccess(
          "Package change request submitted successfully."
        );

        await loadData();
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to submit request."
        );
      } finally {
        setSubmitting(false);
      }
    };

  if (loading) {
    return (
      <div className="h-64 animate-pulse rounded-2xl bg-white" />
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href={`/client/policies/${policyId}`}
          className="text-sm font-medium text-teal-600"
        >
          ← Policy
        </Link>

        <h1 className="mt-3 text-2xl font-semibold">
          Change Package
        </h1>

        <p className="mt-1 text-sm text-gray-500">
          Current package:{" "}
          <strong>
            {policy?.packageName}
          </strong>
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm text-green-700">
          {success}
        </div>
      ) : null}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {packages
          .filter(
            (item) =>
              item.packageId !==
              policy?.packageId
          )
          .map((item) => {
            const selected =
              selectedPackage ===
              item.packageId;

            return (
              <button
                type="button"
                key={item.packageId}
                onClick={() =>
                  setSelectedPackage(
                    item.packageId
                  )
                }
                className={`rounded-2xl border p-5 text-left transition ${
                  selected
                    ? "border-teal-500 bg-teal-50"
                    : "border-gray-200 bg-white hover:border-teal-300"
                }`}
              >
                <h2 className="font-semibold text-gray-900">
                  {item.name}
                </h2>

                <p className="mt-2 text-xl font-semibold text-teal-700">
                  {formatCurrency(
                    item.monthlyPremium
                  )}
                  <span className="text-xs font-normal text-gray-500">
                    {" "}
                    / 30 days
                  </span>
                </p>

                <p className="mt-3 text-sm text-gray-600">
                  {item.description}
                </p>

                <p className="mt-3 text-xs text-gray-500">
                  Up to{" "}
                  {item.maxBeneficiaries}{" "}
                  beneficiaries
                </p>
              </button>
            );
          })}
      </section>

      <button
        type="button"
        disabled={
          !selectedPackage ||
          submitting
        }
        onClick={() =>
          void submitRequest()
        }
        className="rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting
          ? "Submitting..."
          : "Submit Package Change Request"}
      </button>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold">
          Request History
        </h2>

        {requests.length === 0 ? (
          <p className="mt-3 text-sm text-gray-500">
            No package change requests yet.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {requests.map((request) => (
              <div
                key={request.requestId}
                className="flex flex-wrap justify-between gap-3 rounded-xl bg-gray-50 p-4"
              >
                <div>
                  <p className="font-medium">
                    {request.newPackage
                      ?.name ||
                      request.newPackageId}
                  </p>

                  <p className="mt-1 text-xs text-gray-500">
                    {new Date(
                      request.requestDate
                    ).toLocaleDateString(
                      "en-ZA"
                    )}
                  </p>
                </div>

                <span className="text-sm font-medium">
                  {requestStatus(
                    request.status
                  )}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
