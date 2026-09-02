// File:
// Web/legacycare_website/app/(dashboard)/client/service-requests/policy/page.tsx

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  FormEvent,
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

const POLICY_ENQUIRY_TYPES = [
  "What does my policy cover?",
  "Package benefits question",
  "Monthly premium question",
  "Policy status question",
  "Waiting period question",
  "Beneficiary cover question",
  "Policy exclusions question",
  "Policy start or end date question",
  "Policy cancellation question",
  "Policy reinstatement question",
  "Personal details on policy",
  "Other",
];

type Branch = {
  branchId: string;
  branchName?: string | null;
  name?: string | null;
  isActive?: boolean;
};

type PolicyPackage = {
  packageId?: string | null;
  name?: string | null;
  monthlyPremium?: number | null;
  maxBeneficiaries?: number | null;
};

type Policy = {
  policyId: string;
  packageId?: string | null;
  packageName?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  monthlyPremium?: number | null;
  status?: string | number | null;
  package?: PolicyPackage | null;
};

type FormState = {
  branchId: string;
  policyId: string;
  enquiryType: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  branchId: "",
  policyId: "",
  enquiryType: "",
  description: "",
};

function extractErrorMessage(
  data: unknown,
  fallback: string
): string {
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

  if (typeof data === "string") {
    return data;
  }

  return fallback;
}

function formatCurrency(
  value?: number | null
): string {
  if (
    value === null ||
    value === undefined
  ) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-ZA",
    {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }
  ).format(value);
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date =
    new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "Not available";
  }

  return date.toLocaleDateString(
    "en-ZA",
    {
      day: "2-digit",
      month: "short",
      year: "numeric",
    }
  );
}

function formatStatus(
  value?: string | number | null
): string {
  if (
    value === null ||
    value === undefined ||
    value === ""
  ) {
    return "Not available";
  }

  return String(value)
    .replace(/_/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(
      /\b\w/g,
      (letter) =>
        letter.toUpperCase()
    );
}

function getPackageName(
  policy: Policy
): string {
  return (
    policy.package?.name ||
    policy.packageName ||
    "Package not available"
  );
}

function getMonthlyPremium(
  policy: Policy
): number | null {
  if (
    typeof policy.package
      ?.monthlyPremium ===
    "number"
  ) {
    return policy.package
      .monthlyPremium;
  }

  if (
    typeof policy.monthlyPremium ===
    "number"
  ) {
    return policy.monthlyPremium;
  }

  return null;
}

export default function PolicyEnquiryPage() {
  const router =
    useRouter();

  const [
    branches,
    setBranches,
  ] = useState<Branch[]>([]);

  const [
    policies,
    setPolicies,
  ] = useState<Policy[]>([]);

  const [
    form,
    setForm,
  ] = useState<FormState>(
    EMPTY_FORM
  );

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    submitting,
    setSubmitting,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  const selectedPolicy =
    useMemo(
      () =>
        policies.find(
          (policy) =>
            policy.policyId ===
            form.policyId
        ) || null,
      [
        policies,
        form.policyId,
      ]
    );

  useEffect(() => {
    document.title =
      "Policy Enquiry | LegacyCare";

    const loadPage =
      async (): Promise<void> => {
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
            branchesResult,
            policiesResult,
          ] =
            await Promise.allSettled([
              fetch(
                `${API_URL}/Branch`,
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

          if (
            branchesResult.status ===
            "fulfilled"
          ) {
            const response =
              branchesResult.value;

            const data =
              await response
                .json()
                .catch(() => []);

            if (response.ok) {
              const loadedBranches:
                Branch[] =
                Array.isArray(data)
                  ? data.filter(
                      (branch) =>
                        branch
                          .isActive !==
                        false
                    )
                  : [];

              setBranches(
                loadedBranches
              );

              if (
                loadedBranches.length ===
                1
              ) {
                setForm(
                  (current) => ({
                    ...current,

                    branchId:
                      loadedBranches[0]
                        .branchId,
                  })
                );
              }
            } else {
              throw new Error(
                extractErrorMessage(
                  data,
                  "Unable to load branches."
                )
              );
            }
          } else {
            throw new Error(
              "Unable to load branches."
            );
          }

          if (
            policiesResult.status ===
            "fulfilled"
          ) {
            const response =
              policiesResult.value;

            const data =
              await response
                .json()
                .catch(() => []);

            if (response.ok) {
              const loadedPolicies:
                Policy[] =
                Array.isArray(data)
                  ? data
                  : [];

              setPolicies(
                loadedPolicies
              );

              if (
                loadedPolicies.length ===
                1
              ) {
                setForm(
                  (current) => ({
                    ...current,

                    policyId:
                      loadedPolicies[0]
                        .policyId,
                  })
                );
              }
            } else {
              throw new Error(
                extractErrorMessage(
                  data,
                  "Unable to load your policies."
                )
              );
            }
          } else {
            throw new Error(
              "Unable to load your policies."
            );
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load policy enquiry."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPage();
  }, []);

  async function submitPolicyEnquiry(
    event: FormEvent
  ): Promise<void> {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");

      if (!form.branchId) {
        throw new Error(
          "Please select a LegacyCare branch."
        );
      }

      if (!form.policyId) {
        throw new Error(
          "Please select the policy your enquiry is about."
        );
      }

      if (!form.enquiryType) {
        throw new Error(
          "Please select what you need help with."
        );
      }

      if (
        !form.description.trim()
      ) {
        throw new Error(
          "Please tell us more about your policy enquiry."
        );
      }

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const enquiryDetails = [
        `Policy enquiry type: ${form.enquiryType}`,
        `Policy: ${form.policyId}`,
      ];

      if (selectedPolicy) {
        enquiryDetails.push(
          `Package: ${getPackageName(
            selectedPolicy
          )}`
        );

        enquiryDetails.push(
          `Policy status: ${formatStatus(
            selectedPolicy.status
          )}`
        );

        enquiryDetails.push(
          `Monthly premium: ${formatCurrency(
            getMonthlyPremium(
              selectedPolicy
            )
          )}`
        );
      }

      enquiryDetails.push(
        "",
        "Client message:",
        form.description.trim()
      );

      const response =
        await fetch(
          `${API_URL}/ServiceRequest`,
          {
            method:
              "POST",

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
                requestType:
                  "PolicyEnquiry",

                priority:
                  "Normal",

                acceptPriorityFee:
                  false,

                additionalFee:
                  0,

                branchId:
                  form.branchId,

                appointmentDateTime:
                  null,

                description:
                  enquiryDetails.join(
                    "\n"
                  ),
              }),
          }
        );

      const data =
        await response
          .json()
          .catch(() => null);

      if (!response.ok) {
        throw new Error(
          extractErrorMessage(
            data,
            "Unable to submit policy enquiry."
          )
        );
      }

      router.push(
        "/client/service-requests?policyCreated=true"
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit policy enquiry."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <Link
          href="/client/service-requests"
          className="text-sm font-medium text-teal-600 transition hover:text-teal-700"
        >
          ← Service Requests
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 text-2xl">
            📄
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Policy Enquiry
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Ask about your policy, cover, package, premium or policy details.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          💡 Need help understanding your policy?
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-700">
          Select the policy you need help with and choose the closest enquiry
          type. You can still explain everything freely in your own words below.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Policy Enquiry Details
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Choose the policy and issue first, then tell LegacyCare what you need.
        </p>

        <form
          onSubmit={(event) =>
            void submitPolicyEnquiry(
              event
            )
          }
          className="mt-6 space-y-6"
        >
          <div>
            <label
              htmlFor="branchId"
              className="text-sm font-medium text-gray-700"
            >
              LegacyCare Branch
            </label>

            <select
              id="branchId"
              required
              disabled={loading}
              value={
                form.branchId
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  branchId:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              <option value="">
                {loading
                  ? "Loading branches..."
                  : "Select a branch"}
              </option>

              {branches.map(
                (branch) => (
                  <option
                    key={
                      branch.branchId
                    }
                    value={
                      branch.branchId
                    }
                  >
                    {branch.branchName ||
                      branch.name ||
                      branch.branchId}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="policyId"
              className="text-sm font-medium text-gray-700"
            >
              Which policy is this about?
            </label>

            <select
              id="policyId"
              required
              disabled={
                loading ||
                policies.length === 0
              }
              value={
                form.policyId
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  policyId:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              <option value="">
                {loading
                  ? "Loading your policies..."
                  : policies.length === 0
                    ? "No policies available"
                    : "Select a policy"}
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
                    {policy.policyId}
                    {" • "}
                    {getPackageName(
                      policy
                    )}
                  </option>
                )
              )}
            </select>
          </div>

          {selectedPolicy ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-teal-900">
                  📄 Selected Policy
                </h3>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-700">
                  {formatStatus(
                    selectedPolicy.status
                  )}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-teal-700">
                    Policy Number
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {
                      selectedPolicy.policyId
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Package
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {getPackageName(
                      selectedPolicy
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Monthly Premium
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      getMonthlyPremium(
                        selectedPolicy
                      )
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Policy Status
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatStatus(
                      selectedPolicy.status
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Start Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(
                      selectedPolicy.startDate
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    End Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {selectedPolicy.endDate
                      ? formatDate(
                          selectedPolicy.endDate
                        )
                      : "No end date"}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

          <div>
            <label
              htmlFor="enquiryType"
              className="text-sm font-medium text-gray-700"
            >
              What do you need help with?
            </label>

            <select
              id="enquiryType"
              required
              value={
                form.enquiryType
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  enquiryType:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">
                Select an enquiry type
              </option>

              {POLICY_ENQUIRY_TYPES.map(
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

          <div>
            <label
              htmlFor="description"
              className="text-sm font-medium text-gray-700"
            >
              Tell us more
            </label>

            <textarea
              id="description"
              required
              rows={8}
              maxLength={2000}
              value={
                form.description
              }
              placeholder="Example: I would like to understand whether my current policy covers funeral transport outside my province and whether there are any waiting periods or extra costs."
              onChange={(event) =>
                setForm({
                  ...form,

                  description:
                    event.target.value,
                })
              }
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />

            <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-gray-400">
              <span>
                You can freely explain anything not covered by the options above.
              </span>

              <span>
                {
                  form.description.length
                }
                /2000
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <p className="text-sm font-medium text-gray-900">
              🔒 Keep your account information safe
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Do not include passwords, PINs, banking login details or one-time
              passwords in your enquiry.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={
                submitting ||
                loading ||
                policies.length === 0
              }
              className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Policy Enquiry"}
            </button>

            <Link
              href="/client/service-requests"
              className="rounded-lg border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              Cancel
            </Link>
          </div>
        </form>
      </section>

      <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
        <h2 className="text-sm font-semibold text-gray-900">
          📋 Policy Enquiry Workflow
        </h2>

        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
          <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">
            Submitted
          </span>

          <span className="text-gray-400">
            →
          </span>

          <span className="rounded-full bg-purple-100 px-3 py-1.5 text-purple-700">
            In Review
          </span>

          <span className="text-gray-400">
            →
          </span>

          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">
            Responded
          </span>

          <span className="text-gray-400">
            →
          </span>

          <span className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
            Resolved
          </span>

          <span className="text-gray-400">
            →
          </span>

          <span className="rounded-full bg-gray-200 px-3 py-1.5 text-gray-700">
            Closed
          </span>
        </div>

        <p className="mt-3 text-xs text-gray-500">
          The Clerk will review your question, respond with the relevant policy
          information and update the request as it is resolved.
        </p>
      </section>
    </div>
  );
}