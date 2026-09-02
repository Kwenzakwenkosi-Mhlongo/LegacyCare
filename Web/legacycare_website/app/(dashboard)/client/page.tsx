// File:
// Web/legacycare_website/app/(dashboard)/client/page.tsx

"use client";

import Link from "next/link";
import {
  useEffect,
  useMemo,
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

const AVAILABLE_SERVICE_TYPES = 8;

type ServiceRequest = {
  serviceRequestId: number;

  clientId?: string | null;

  branchId?: string | null;
  branchName?: string | null;

  requestType?: string | null;
  status?: string | null;
  priority?: string | null;

  description?: string | null;

  createdDate?: string | null;
  updatedDate?: string | null;
  dueDate?: string | null;

  appointmentDateTime?: string | null;

  additionalFee?: number | null;
};

type Beneficiary = {
  beneficiaryId?: string | number;
  fullName?: string | null;
  relationship?: string | null;
};

type Policy = {
  policyId: string;
  userId: string;

  clientName: string;

  packageId: string;
  packageName: string;

  startDate: string;
  endDate?: string | null;

  monthlyPremium: number;

  status: string;

  beneficiaries?: Beneficiary[];
};

function normalizeStatus(
  value?: string | null
): string {
  return (value || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
}

function isOpenRequest(
  status?: string | null
): boolean {
  const normalizedStatus =
    normalizeStatus(status);

  if (!normalizedStatus) {
    return false;
  }

  const closedStatuses =
    new Set([
      "approved",
      "rejected",
      "completed",
      "cancelled",
      "canceled",
      "noshow",
      "closed",
      "delivered",
    ]);

  return !closedStatuses.has(
    normalizedStatus
  );
}

function formatCurrency(
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

export default function ClientPage() {
  const [
    serviceRequests,
    setServiceRequests,
  ] = useState<ServiceRequest[]>([]);

  const [
    policies,
    setPolicies,
  ] = useState<Policy[]>([]);

  const [
    loadingRequests,
    setLoadingRequests,
  ] = useState(true);

  const [
    loadingPolicies,
    setLoadingPolicies,
  ] = useState(true);

  const [
    requestsError,
    setRequestsError,
  ] = useState("");

  const [
    policiesError,
    setPoliciesError,
  ] = useState("");

  useEffect(() => {
    document.title =
      "Client Dashboard";
  }, []);

  useEffect(() => {
    const loadDashboard =
      async (): Promise<void> => {
        const token =
          getToken();

        if (!token) {
          setRequestsError(
            "You are not logged in."
          );

          setPoliciesError(
            "You are not logged in."
          );

          setLoadingRequests(
            false
          );

          setLoadingPolicies(
            false
          );

          return;
        }

        const headers = {
          Accept:
            "application/json",

          Authorization:
            `Bearer ${token}`,
        };

        const [
          requestsResult,
          policiesResult,
        ] =
          await Promise.allSettled([
            fetch(
              `${API_URL}/ServiceRequest/client`,
              {
                method:
                  "GET",

                headers,

                cache:
                  "no-store",
              }
            ),

            fetch(
              `${API_URL}/Policy/client`,
              {
                method:
                  "GET",

                headers,

                cache:
                  "no-store",
              }
            ),
          ]);

        try {
          if (
            requestsResult.status !==
            "fulfilled"
          ) {
            throw new Error(
              "Unable to load service requests."
            );
          }

          const response =
            requestsResult.value;

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Unable to load service requests (${response.status}).`
            );
          }

          setServiceRequests(
            Array.isArray(data)
              ? data
              : []
          );

          setRequestsError("");
        } catch (error) {
          console.error(
            "[CLIENT DASHBOARD] SERVICE REQUEST ERROR:",
            error
          );

          setServiceRequests([]);

          setRequestsError(
            error instanceof Error
              ? error.message
              : "Unable to load service requests."
          );
        } finally {
          setLoadingRequests(false);
        }

        try {
          if (
            policiesResult.status !==
            "fulfilled"
          ) {
            throw new Error(
              "Unable to load policies."
            );
          }

          const response =
            policiesResult.value;

          const data =
            await response
              .json()
              .catch(
                () => null
              );

          if (!response.ok) {
            throw new Error(
              data?.message ||
                `Unable to load policies (${response.status}).`
            );
          }

          const loadedPolicies =
            Array.isArray(data)
              ? data
              : [];

          setPolicies(
            loadedPolicies
          );

          setPoliciesError("");

          console.log(
            "[CLIENT DASHBOARD] POLICIES:",
            loadedPolicies
          );
        } catch (error) {
          console.error(
            "[CLIENT DASHBOARD] POLICY ERROR:",
            error
          );

          setPolicies([]);

          setPoliciesError(
            error instanceof Error
              ? error.message
              : "Unable to load policies."
          );
        } finally {
          setLoadingPolicies(false);
        }
      };

    void loadDashboard();
  }, []);

  const requestSummary =
    useMemo(
      () => {
        const total =
          serviceRequests.length;

        const open =
          serviceRequests.filter(
            (request) =>
              isOpenRequest(
                request.status
              )
          ).length;

        return {
          total,
          open,
        };
      },
      [serviceRequests]
    );

  const policySummary =
    useMemo(
      () => {
        const activePolicies =
          policies.filter(
            (policy) =>
              normalizeStatus(
                policy.status
              ) ===
              "active"
          );

        const packages =
          Array.from(
            new Set(
              activePolicies
                .map(
                  (policy) =>
                    policy.packageName
                      ?.trim()
                )
                .filter(Boolean)
            )
          );

        const monthlyPremium =
          activePolicies.reduce(
            (
              total,
              policy
            ) =>
              total +
              (
                Number(
                  policy.monthlyPremium
                ) ||
                0
              ),
            0
          );

        const beneficiaryCount =
          activePolicies.reduce(
            (
              total,
              policy
            ) =>
              total +
              (
                Array.isArray(
                  policy.beneficiaries
                )
                  ? policy
                      .beneficiaries
                      .length
                  : 0
              ),
            0
          );

        return {
          activeCount:
            activePolicies.length,

          packages:
            packages.length > 0
              ? packages.join(", ")
              : "Not available",

          monthlyPremium,

          beneficiaryCount,

          totalPolicies:
            policies.length,
        };
      },
      [policies]
    );

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-600 p-8 text-white shadow-sm">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
          LegacyCare Client Portal
        </p>

        <h1 className="mt-3 text-3xl font-bold">
          Client Dashboard
        </h1>

        <p className="mt-3 max-w-2xl text-sm leading-6 text-teal-50">
          Manage your LegacyCare policies, service requests,
          beneficiaries and account information from one place.
        </p>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
          <div className="max-w-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-2xl text-teal-700">
                📋
              </div>

              <div>
                <h2 className="text-xl font-semibold text-gray-900">
                  Service Requests
                </h2>

                <p className="mt-1 text-sm text-gray-600">
                  Start new services and view your complete request history.
                </p>
              </div>
            </div>

            <p className="mt-4 text-sm leading-6 text-gray-600">
              LegacyCare provides 8 service request types: Report a Death,
              Funeral, Appointment, Quote, Policy Enquiry, Payment Enquiry,
              Documents and General Support.
            </p>

            <div className="mt-4 rounded-xl border border-teal-100 bg-teal-50 p-4">
              <p className="text-sm font-medium text-teal-900">
                Your full request history is available under Service Requests.
              </p>

              <p className="mt-1 text-sm leading-6 text-teal-700">
                🕊️ Track your full request history in one place — including death reports,
                ⚰️ funeral requests, 📅 appointments, 💰 quotes, 🔄 package changes,
                👨‍👩‍👧 beneficiary changes, 📄 policy enquiries, 💳 payment enquiries,
                📑 document requests, and 💬 general support.
              </p>
            </div>
          </div>

          <Link
            href="/client/service-requests"
            className="inline-flex w-fit items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700"
          >
            View Service Requests & History →
          </Link>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-4 border-t border-gray-100 pt-6 sm:grid-cols-3">
          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Requests Sent
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {loadingRequests
                ? "..."
                : requestSummary.total}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Service requests submitted
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Open Requests
            </p>

            <p className="mt-2 text-2xl font-semibold text-teal-700">
              {loadingRequests
                ? "..."
                : requestSummary.open}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Requests still in progress
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-gray-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
              Available Services
            </p>

            <p className="mt-2 text-2xl font-semibold text-gray-900">
              {AVAILABLE_SERVICE_TYPES}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Service request types available
            </p>
          </div>
        </div>

        {requestsError ? (
          <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <p className="text-sm text-amber-700">
              {requestsError}
            </p>
          </div>
        ) : null}
      </section>

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">
              Account Overview
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              Your current LegacyCare policy information.
            </p>
          </div>

          {!loadingPolicies &&
          !policiesError &&
          policySummary.totalPolicies >
            0 ? (
            <span className="w-fit rounded-full bg-teal-50 px-3 py-1 text-xs font-medium text-teal-700">
              {
                policySummary.totalPolicies
              }{" "}
              {policySummary.totalPolicies ===
              1
                ? "policy"
                : "policies"}{" "}
              linked
            </span>
          ) : null}
        </div>

        {loadingPolicies ? (
          <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
            {[0, 1, 2].map(
              (item) => (
                <div
                  key={item}
                  className="h-24 animate-pulse rounded-xl bg-gray-100"
                />
              )
            )}
          </div>
        ) : policiesError ? (
          <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Policy information is temporarily unavailable.
            </p>

            <p className="mt-1 text-xs text-amber-700">
              {policiesError}
            </p>
          </div>
        ) : policies.length ===
          0 ? (
          <div className="mt-5 rounded-xl border border-gray-200 bg-gray-50 p-5">
            <p className="text-sm font-medium text-gray-900">
              No policies found
            </p>

            <p className="mt-1 text-sm text-gray-500">
              There are currently no policies linked to your account.
            </p>
          </div>
        ) : (
          <>
            <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Active Policies
                </p>

                <p className="mt-2 text-2xl font-semibold text-green-700">
                  {
                    policySummary.activeCount
                  }
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Currently active coverage
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Current Packages
                </p>

                <p className="mt-2 text-sm font-semibold text-gray-900">
                  {
                    policySummary.packages
                  }
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Packages on active policies
                </p>
              </div>

              <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm text-gray-500">
                  Monthly Premium
                </p>

                <p className="mt-2 text-lg font-semibold text-gray-900">
                  {formatCurrency(
                    policySummary.monthlyPremium
                  )}
                </p>

                <p className="mt-1 text-xs text-gray-500">
                  Combined active policy premium
                </p>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-gray-100 pt-5">
              <div>
                <p className="text-xs text-gray-500">
                  Beneficiaries covered across active policies
                </p>

                <p className="mt-1 text-sm font-semibold text-gray-900">
                  {
                    policySummary.beneficiaryCount
                  }
                </p>
              </div>

              <Link
                href="/client/policies"
                className="text-sm font-medium text-teal-600 transition hover:text-teal-700"
              >
                View policies →
              </Link>
            </div>
          </>
        )}
      </section>
    </div>
  );
}