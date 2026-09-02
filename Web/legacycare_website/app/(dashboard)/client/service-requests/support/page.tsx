// File:
// Web/legacycare_website/app/(dashboard)/client/service-requests/support/page.tsx

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

const SUPPORT_CATEGORIES = [
  {
    value: "Account Help",
    label: "👤 Account Help",
    description:
      "Help with your LegacyCare account, profile information or account access.",
  },
  {
    value: "Policy Help",
    label: "📄 Policy Help",
    description:
      "General help understanding your policy or information linked to it.",
  },
  {
    value: "Beneficiary Help",
    label: "👨‍👩‍👧 Beneficiary Help",
    description:
      "Help understanding beneficiary information or an existing beneficiary request.",
  },
  {
    value: "Payment Help",
    label: "💳 Payment Help",
    description:
      "General assistance with payment information or payment-related questions.",
  },
  {
    value: "Funeral Service Help",
    label: "⚰️ Funeral Service Help",
    description:
      "Help with an existing funeral arrangement or funeral service process.",
  },
  {
    value: "Appointment Help",
    label: "📅 Appointment Help",
    description:
      "Assistance with an existing appointment or appointment process.",
  },
  {
    value: "Document Help",
    label: "📑 Document Help",
    description:
      "Help with an existing document request or document-related question.",
  },
  {
    value: "Website or App Help",
    label: "📱 Website or App Help",
    description:
      "Report a problem using the LegacyCare website or mobile application.",
  },
  {
    value: "Existing Request Follow-up",
    label: "🔎 Existing Request Follow-up",
    description:
      "Ask for assistance or clarification about an existing service request.",
  },
  {
    value: "Complaint or Service Concern",
    label: "💬 Complaint or Service Concern",
    description:
      "Raise a service concern or provide feedback that requires follow-up.",
  },
  {
    value: "Other",
    label: "❓ Other Support",
    description:
      "Ask for help with something that is not covered by the options above.",
  },
];

const CONTACT_METHODS = [
  "LegacyCare portal",
  "Email",
  "Phone call",
];

type Branch = {
  branchId: string;
  branchName?: string | null;
  name?: string | null;
  isActive?: boolean;
};

type Policy = {
  policyId: string;
  policyNumber?: string | null;

  package?: {
    name?: string | null;
  } | null;

  packageName?: string | null;
};

type FormState = {
  branchId: string;
  policyId: string;
  supportCategory: string;
  existingRequestReference: string;
  preferredContactMethod: string;
  subject: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  branchId: "",
  policyId: "",
  supportCategory: "",
  existingRequestReference: "",
  preferredContactMethod: "LegacyCare portal",
  subject: "",
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

function getPackageName(
  policy: Policy
): string {
  return (
    policy.package?.name ||
    policy.packageName ||
    ""
  );
}

function getPolicyLabel(
  policy: Policy
): string {
  const policyNumber =
    policy.policyNumber ||
    policy.policyId;

  const packageName =
    getPackageName(policy);

  return packageName
    ? `${policyNumber} • ${packageName}`
    : policyNumber;
}

export default function SupportPage() {
  const router = useRouter();

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

  const [
    success,
    setSuccess,
  ] = useState("");

  const selectedCategory =
    useMemo(
      () =>
        SUPPORT_CATEGORIES.find(
          (category) =>
            category.value ===
            form.supportCategory
        ) || null,
      [form.supportCategory]
    );

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

  const followingUpExistingRequest =
    form.supportCategory ===
    "Existing Request Follow-up";

  useEffect(() => {
    document.title =
      "General Support | LegacyCare";

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
            branchesResponse,
            policiesResponse,
          ] =
            await Promise.all([
              fetch(
                `${API_URL}/Branch`,
                {
                  method: "GET",
                  headers,
                  cache: "no-store",
                }
              ),

              fetch(
                `${API_URL}/Policy/client`,
                {
                  method: "GET",
                  headers,
                  cache: "no-store",
                }
              ),
            ]);

          const branchesData =
            await branchesResponse
              .json()
              .catch(() => null);

          if (
            !branchesResponse.ok
          ) {
            throw new Error(
              extractErrorMessage(
                branchesData,
                "Unable to load LegacyCare branches."
              )
            );
          }

          const loadedBranches:
            Branch[] =
            Array.isArray(
              branchesData
            )
              ? branchesData.filter(
                  (branch) =>
                    branch.isActive !==
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

          const policiesData =
            await policiesResponse
              .json()
              .catch(() => null);

          if (
            policiesResponse.ok
          ) {
            const loadedPolicies:
              Policy[] =
              Array.isArray(
                policiesData
              )
                ? policiesData
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
            setPolicies([]);
          }
        } catch (err) {
          console.error(
            "[GeneralSupport] LOAD ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load the support form."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPage();
  }, []);

  function handleCategoryChange(
    value: string
  ): void {
    setForm(
      (current) => ({
        ...current,

        supportCategory:
          value,

        existingRequestReference:
          value ===
          "Existing Request Follow-up"
            ? current.existingRequestReference
            : "",
      })
    );

    setError("");
  }

  async function handleSubmit(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!form.supportCategory) {
        throw new Error(
          "Please select the type of support you need."
        );
      }

      if (!form.branchId) {
        throw new Error(
          "Please select a LegacyCare branch."
        );
      }

      if (!form.subject.trim()) {
        throw new Error(
          "Please enter a subject for your support request."
        );
      }

      if (
        form.subject.trim().length <
        5
      ) {
        throw new Error(
          "Please enter a more descriptive subject."
        );
      }

      if (
        followingUpExistingRequest &&
        !form.existingRequestReference.trim()
      ) {
        throw new Error(
          "Please enter the request number or reference you are following up."
        );
      }

      if (
        !form.description.trim()
      ) {
        throw new Error(
          "Please describe what you need help with."
        );
      }

      if (
        form.description.trim()
          .length < 10
      ) {
        throw new Error(
          "Please provide a little more information so the Clerk can assist you."
        );
      }

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const requestDetails:
        string[] = [
        `Support category: ${form.supportCategory}`,
        `Subject: ${form.subject.trim()}`,
        `Preferred contact method: ${form.preferredContactMethod}`,
      ];

      if (
        selectedPolicy
      ) {
        requestDetails.push(
          `Related policy: ${selectedPolicy.policyId}`
        );

        if (
          selectedPolicy.policyNumber
        ) {
          requestDetails.push(
            `Policy number: ${selectedPolicy.policyNumber}`
          );
        }

        const packageName =
          getPackageName(
            selectedPolicy
          );

        if (packageName) {
          requestDetails.push(
            `Package: ${packageName}`
          );
        }
      }

      if (
        form.existingRequestReference.trim()
      ) {
        requestDetails.push(
          `Existing request reference: ${form.existingRequestReference.trim()}`
        );
      }

      requestDetails.push(
        "",
        "Client message:",
        form.description.trim()
      );

      const response =
        await fetch(
          `${API_URL}/ServiceRequest`,
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
                requestType:
                  "GeneralSupport",

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
                  requestDetails.join(
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
            `Unable to submit support request (${response.status}).`
          )
        );
      }

      setSuccess(
        "Your support request was submitted successfully. Redirecting to My Requests..."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      window.setTimeout(
        () => {
          router.push(
            "/client/service-requests?supportCreated=true"
          );

          router.refresh();
        },
        1500
      );
    } catch (err) {
      console.error(
        "[GeneralSupport] SUBMIT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit your support request."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <Link
          href="/client/service-requests"
          className="text-sm font-medium text-teal-600 transition hover:text-teal-700"
        >
          ← Service Requests
        </Link>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-sky-100 text-2xl">
            💬
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              General Support
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Ask LegacyCare for help with your account, policy, services or an
              existing request.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-semibold text-blue-900">
          🛟 Need assistance?
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          Use this form for general assistance. For a new policy enquiry,
          payment enquiry, document request, appointment or other dedicated
          service, use its specific request option from the Service Requests
          page.
        </p>
      </div>

      {success ? (
        <div className="rounded-xl border border-green-200 bg-green-50 p-5">
          <div className="flex items-start gap-3">
            <span className="text-xl">
              ✅
            </span>

            <div>
              <p className="font-semibold text-green-900">
                Support request submitted
              </p>

              <p className="mt-1 text-sm text-green-700">
                {success}
              </p>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            1. What do you need help with?
          </h2>

          <div className="mt-6">
            <label
              htmlFor="supportCategory"
              className="block text-sm font-medium text-gray-700"
            >
              Support Category
            </label>

            <select
              id="supportCategory"
              required
              disabled={
                loading ||
                success !== ""
              }
              value={
                form.supportCategory
              }
              onChange={(event) =>
                handleCategoryChange(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              <option value="">
                Select support category
              </option>

              {SUPPORT_CATEGORIES.map(
                (category) => (
                  <option
                    key={
                      category.value
                    }
                    value={
                      category.value
                    }
                  >
                    {
                      category.label
                    }
                  </option>
                )
              )}
            </select>

            {selectedCategory ? (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm leading-6 text-gray-600">
                  {
                    selectedCategory.description
                  }
                </p>
              </div>
            ) : null}
          </div>

          {followingUpExistingRequest ? (
            <div className="mt-6">
              <label
                htmlFor="existingRequestReference"
                className="block text-sm font-medium text-gray-700"
              >
                Existing Request Number or Reference
              </label>

              <input
                id="existingRequestReference"
                type="text"
                required
                disabled={
                  success !== ""
                }
                maxLength={100}
                value={
                  form.existingRequestReference
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      existingRequestReference:
                        event.target.value,
                    })
                  )
                }
                placeholder="Example: REQ-00007"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
              />
            </div>
          ) : null}

          <div className="mt-6">
            <label
              htmlFor="policyId"
              className="block text-sm font-medium text-gray-700"
            >
              Related Policy
              <span className="ml-1 font-normal text-gray-400">
                (optional)
              </span>
            </label>

            <select
              id="policyId"
              disabled={
                loading ||
                success !== ""
              }
              value={
                form.policyId
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    policyId:
                      event.target.value,
                  })
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              <option value="">
                No specific policy
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
                    {getPolicyLabel(
                      policy
                    )}
                  </option>
                )
              )}
            </select>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            2. Support Details
          </h2>

          <div className="mt-6">
            <label
              htmlFor="subject"
              className="block text-sm font-medium text-gray-700"
            >
              Subject
            </label>

            <input
              id="subject"
              type="text"
              required
              disabled={
                success !== ""
              }
              maxLength={150}
              value={
                form.subject
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    subject:
                      event.target.value,
                  })
                )
              }
              placeholder="Example: Need help understanding my existing request"
              className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            />

            <p className="mt-1 text-right text-xs text-gray-400">
              {
                form.subject.length
              }
              /150
            </p>
          </div>

          <div className="mt-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              How can we help?
            </label>

            <textarea
              id="description"
              required
              disabled={
                success !== ""
              }
              rows={8}
              maxLength={2500}
              value={
                form.description
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    description:
                      event.target.value,
                  })
                )
              }
              placeholder="Describe what happened, what you need help with, and any useful details that will help the Clerk understand your request."
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            />

            <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-gray-400">
              <span>
                Do not include passwords, PINs or login credentials.
              </span>

              <span>
                {
                  form.description.length
                }
                /2500
              </span>
            </div>
          </div>

          <div className="mt-6">
            <label
              htmlFor="preferredContactMethod"
              className="block text-sm font-medium text-gray-700"
            >
              Preferred Contact Method
            </label>

            <select
              id="preferredContactMethod"
              required
              disabled={
                success !== ""
              }
              value={
                form.preferredContactMethod
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    preferredContactMethod:
                      event.target.value,
                  })
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              {CONTACT_METHODS.map(
                (method) => (
                  <option
                    key={method}
                    value={method}
                  >
                    {method}
                  </option>
                )
              )}
            </select>
          </div>

          <div className="mt-6">
            <label
              htmlFor="branchId"
              className="block text-sm font-medium text-gray-700"
            >
              LegacyCare Branch
            </label>

            <select
              id="branchId"
              required
              disabled={
                loading ||
                success !== ""
              }
              value={
                form.branchId
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    branchId:
                      event.target.value,
                  })
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
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
        </section>

        <section className="rounded-2xl border border-gray-200 bg-gray-50 p-5">
          <h2 className="text-sm font-semibold text-gray-900">
            💬 General Support Workflow
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">
              Submitted
            </span>

            <span className="text-gray-400">
              →
            </span>

            <span className="rounded-full bg-purple-100 px-3 py-1.5 text-purple-700">
              In Progress
            </span>

            <span className="text-gray-400">
              →
            </span>

            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
              Awaiting Client
            </span>

            <span className="text-gray-400">
              /
            </span>

            <span className="rounded-full bg-green-100 px-3 py-1.5 text-green-700">
              Resolved
            </span>

            <span className="text-gray-400">
              →
            </span>

            <span className="rounded-full bg-gray-200 px-3 py-1.5 text-gray-700">
              Closed
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-500">
            If the Clerk needs more information, the request may temporarily
            move to Awaiting Client before it is resolved.
          </p>
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Link
            href="/client/service-requests"
            className="rounded-lg border border-gray-300 px-5 py-2.5 text-center text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            Cancel
          </Link>

          <button
            type="submit"
            disabled={
              submitting ||
              loading ||
              success !== ""
            }
            className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting
              ? "Submitting..."
              : success
                ? "Submitted Successfully"
                : "Submit Support Request"}
          </button>
        </div>
      </form>
    </div>
  );
}