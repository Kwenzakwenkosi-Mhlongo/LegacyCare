// File:
// Web/legacycare_website/app/(dashboard)/client/service-requests/quote/page.tsx

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

const QUOTE_TYPES = [
  {
    value: "Full Funeral Service",
    label: "⚰️ Full Funeral Service",
    description:
      "Get an estimated price for a complete funeral arrangement based on your requirements.",
  },
  {
    value: "Funeral Transport",
    label: "🚐 Funeral Transport",
    description:
      "Request pricing for hearses, family vehicles or other funeral transport.",
  },
  {
    value: "Venue and Seating",
    label: "⛺ Venue, Tent and Seating",
    description:
      "Request pricing for venue-related funeral setup, tenting, chairs or related arrangements.",
  },
  {
    value: "Catering",
    label: "🍽️ Funeral Catering",
    description:
      "Request an estimate for refreshments or catering based on the expected number of attendees.",
  },
  {
    value: "Coffin or Casket",
    label: "⚱️ Coffin or Casket",
    description:
      "Request pricing information for an appropriate coffin or casket option.",
  },
  {
    value: "Additional Funeral Services",
    label: "➕ Additional Funeral Services",
    description:
      "Request pricing for additional funeral-related services that are not part of your current arrangement.",
  },
  {
    value: "Other",
    label: "💬 Other Quote",
    description:
      "Request a quote for another LegacyCare service.",
  },
];

const COFFIN_PREFERENCES = [
  "No preference",
  "Standard",
  "Premium",
  "Please advise me",
];

const VENUE_REQUIREMENTS = [
  "Not required",
  "Family/private venue",
  "Church or community hall",
  "Outdoor tent setup",
  "Please advise me",
];

const CATERING_OPTIONS = [
  "Not required",
  "Light refreshments",
  "Full meal",
  "Please advise me",
];

const TRANSPORT_OPTIONS = [
  "Not required",
  "Hearse only",
  "Hearse and family vehicle",
  "Multiple vehicles",
  "Please advise me",
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
  quoteType: string;
  funeralDate: string;
  serviceLocation: string;
  estimatedGuests: string;
  coffinPreference: string;
  transportRequirement: string;
  venueRequirement: string;
  cateringRequirement: string;
  budget: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  branchId: "",
  policyId: "",
  quoteType: "",
  funeralDate: "",
  serviceLocation: "",
  estimatedGuests: "",
  coffinPreference: "No preference",
  transportRequirement: "Not required",
  venueRequirement: "Not required",
  cateringRequirement: "Not required",
  budget: "",
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

export default function QuoteRequestPage() {
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

  const selectedQuoteType =
    useMemo(
      () =>
        QUOTE_TYPES.find(
          (item) =>
            item.value ===
            form.quoteType
        ) || null,
      [form.quoteType]
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

  const funeralRelated =
    form.quoteType !== "" &&
    form.quoteType !== "Other";

  useEffect(() => {
    document.title =
      "Request Quote | LegacyCare";

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
            branchResponse,
            policyResponse,
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

          const branchData =
            await branchResponse
              .json()
              .catch(() => null);

          if (!branchResponse.ok) {
            throw new Error(
              extractErrorMessage(
                branchData,
                "Unable to load branches."
              )
            );
          }

          const loadedBranches:
            Branch[] =
            Array.isArray(branchData)
              ? branchData.filter(
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

          const policyData =
            await policyResponse
              .json()
              .catch(() => null);

          if (policyResponse.ok) {
            const loadedPolicies:
              Policy[] =
              Array.isArray(policyData)
                ? policyData
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
            "[QuoteRequest] LOAD ERROR:",
            err
          );

          setError(
            err instanceof Error
              ? err.message
              : "Unable to load quote request."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPage();
  }, []);

  async function submitQuote(
    event: FormEvent<HTMLFormElement>
  ): Promise<void> {
    event.preventDefault();

    try {
      setSubmitting(true);
      setError("");
      setSuccess("");

      if (!form.quoteType) {
        throw new Error(
          "Please select what you need a quote for."
        );
      }

      if (!form.branchId) {
        throw new Error(
          "Please select a LegacyCare branch."
        );
      }

      if (
        funeralRelated &&
        !form.serviceLocation.trim()
      ) {
        throw new Error(
          "Please enter the area or location where the service will take place."
        );
      }

      if (
        funeralRelated &&
        form.estimatedGuests &&
        Number(form.estimatedGuests) < 1
      ) {
        throw new Error(
          "Estimated attendance must be at least 1 person."
        );
      }

      if (
        form.quoteType ===
          "Other" &&
        !form.description.trim()
      ) {
        throw new Error(
          "Please describe what you need quoted."
        );
      }

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const details:
        string[] = [
        `Quote type: ${form.quoteType}`,
      ];

      if (selectedPolicy) {
        details.push(
          `Related policy: ${selectedPolicy.policyId}`
        );

        if (
          selectedPolicy.policyNumber
        ) {
          details.push(
            `Policy number: ${selectedPolicy.policyNumber}`
          );
        }

        const packageName =
          getPackageName(
            selectedPolicy
          );

        if (packageName) {
          details.push(
            `Current package: ${packageName}`
          );
        }
      }

      if (
        form.funeralDate
      ) {
        details.push(
          `Expected funeral/service date: ${form.funeralDate}`
        );
      }

      if (
        form.serviceLocation.trim()
      ) {
        details.push(
          `Service location: ${form.serviceLocation.trim()}`
        );
      }

      if (
        form.estimatedGuests
      ) {
        details.push(
          `Estimated attendees: ${form.estimatedGuests}`
        );
      }

      if (funeralRelated) {
        details.push(
          `Coffin preference: ${form.coffinPreference}`,
          `Transport requirement: ${form.transportRequirement}`,
          `Venue requirement: ${form.venueRequirement}`,
          `Catering requirement: ${form.cateringRequirement}`
        );
      }

      if (
        form.budget.trim()
      ) {
        details.push(
          `Approximate budget: R${form.budget.trim()}`
        );
      }

      if (
        form.description.trim()
      ) {
        details.push(
          "",
          "Additional requirements:",
          form.description.trim()
        );
      }

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
                  "Quote",

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
                  details.join(
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
            `Unable to submit quote request (${response.status}).`
          )
        );
      }

      setSuccess(
        "Your quote request was submitted successfully. A Clerk will review the information and prepare the quotation. Redirecting to My Requests..."
      );

      window.scrollTo({
        top: 0,
        behavior: "smooth",
      });

      window.setTimeout(
        () => {
          router.push(
            "/client/service-requests?quoteCreated=true"
          );

          router.refresh();
        },
        1500
      );
    } catch (err) {
      console.error(
        "[QuoteRequest] SUBMIT ERROR:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit quote request."
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
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-100 text-2xl">
            💰
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Request a Quote
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Tell LegacyCare what funeral service or additional service you
              need priced.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="font-semibold text-blue-900">
          💡 How quotations work
        </p>

        <p className="mt-2 text-sm leading-6 text-blue-800">
          Give us the details of the service you need. A Clerk will review your
          requirements, confirm anything that is unclear, prepare the quotation
          and update the request when the price is ready.
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
                Quote request submitted successfully
              </p>

              <p className="mt-1 text-sm leading-6 text-green-700">
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
        onSubmit={submitQuote}
        className="space-y-6"
      >
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            1. What do you need priced?
          </h2>

          <div className="mt-6">
            <label
              htmlFor="quoteType"
              className="block text-sm font-medium text-gray-700"
            >
              Quote Type
            </label>

            <select
              id="quoteType"
              required
              disabled={
                loading ||
                success !== ""
              }
              value={
                form.quoteType
              }
              onChange={(event) =>
                setForm(
                  (current) => ({
                    ...current,

                    quoteType:
                      event.target.value,
                  })
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              <option value="">
                Select what you need quoted
              </option>

              {QUOTE_TYPES.map(
                (type) => (
                  <option
                    key={
                      type.value
                    }
                    value={
                      type.value
                    }
                  >
                    {
                      type.label
                    }
                  </option>
                )
              )}
            </select>

            {selectedQuoteType ? (
              <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-4">
                <p className="text-sm leading-6 text-gray-600">
                  {
                    selectedQuoteType.description
                  }
                </p>
              </div>
            ) : null}
          </div>

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

        {funeralRelated ? (
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900">
              2. Funeral or Service Details
            </h2>

            <p className="mt-1 text-sm text-gray-500">
              These details help LegacyCare prepare a more useful estimate.
            </p>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="funeralDate"
                  className="block text-sm font-medium text-gray-700"
                >
                  Expected Service Date
                  <span className="ml-1 font-normal text-gray-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="funeralDate"
                  type="date"
                  disabled={
                    success !== ""
                  }
                  value={
                    form.funeralDate
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        funeralDate:
                          event.target.value,
                      })
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                />
              </div>

              <div>
                <label
                  htmlFor="estimatedGuests"
                  className="block text-sm font-medium text-gray-700"
                >
                  Estimated Number of Attendees
                  <span className="ml-1 font-normal text-gray-400">
                    (optional)
                  </span>
                </label>

                <input
                  id="estimatedGuests"
                  type="number"
                  min="1"
                  max="10000"
                  disabled={
                    success !== ""
                  }
                  value={
                    form.estimatedGuests
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        estimatedGuests:
                          event.target.value,
                      })
                    )
                  }
                  placeholder="Example: 150"
                  className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                />
              </div>
            </div>

            <div className="mt-5">
              <label
                htmlFor="serviceLocation"
                className="block text-sm font-medium text-gray-700"
              >
                Funeral / Service Area
              </label>

              <input
                id="serviceLocation"
                type="text"
                required
                maxLength={200}
                disabled={
                  success !== ""
                }
                value={
                  form.serviceLocation
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      serviceLocation:
                        event.target.value,
                    })
                  )
                }
                placeholder="Example: Umlazi, Durban"
                className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
              />
            </div>

            <div className="mt-6 grid gap-5 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="coffinPreference"
                  className="block text-sm font-medium text-gray-700"
                >
                  Coffin / Casket Preference
                </label>

                <select
                  id="coffinPreference"
                  disabled={
                    success !== ""
                  }
                  value={
                    form.coffinPreference
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        coffinPreference:
                          event.target.value,
                      })
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                >
                  {COFFIN_PREFERENCES.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="transportRequirement"
                  className="block text-sm font-medium text-gray-700"
                >
                  Transport
                </label>

                <select
                  id="transportRequirement"
                  disabled={
                    success !== ""
                  }
                  value={
                    form.transportRequirement
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        transportRequirement:
                          event.target.value,
                      })
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                >
                  {TRANSPORT_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="venueRequirement"
                  className="block text-sm font-medium text-gray-700"
                >
                  Venue / Tent / Seating
                </label>

                <select
                  id="venueRequirement"
                  disabled={
                    success !== ""
                  }
                  value={
                    form.venueRequirement
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        venueRequirement:
                          event.target.value,
                      })
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                >
                  {VENUE_REQUIREMENTS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>

              <div>
                <label
                  htmlFor="cateringRequirement"
                  className="block text-sm font-medium text-gray-700"
                >
                  Catering
                </label>

                <select
                  id="cateringRequirement"
                  disabled={
                    success !== ""
                  }
                  value={
                    form.cateringRequirement
                  }
                  onChange={(event) =>
                    setForm(
                      (current) => ({
                        ...current,

                        cateringRequirement:
                          event.target.value,
                      })
                    )
                  }
                  className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
                >
                  {CATERING_OPTIONS.map(
                    (option) => (
                      <option
                        key={option}
                        value={option}
                      >
                        {option}
                      </option>
                    )
                  )}
                </select>
              </div>
            </div>
          </section>
        ) : null}

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {funeralRelated
              ? "3. Budget and Additional Requirements"
              : "2. Quote Details"}
          </h2>

          <div className="mt-6">
            <label
              htmlFor="budget"
              className="block text-sm font-medium text-gray-700"
            >
              Approximate Budget
              <span className="ml-1 font-normal text-gray-400">
                (optional)
              </span>
            </label>

            <div className="mt-2 flex rounded-lg border border-gray-300 bg-white focus-within:border-teal-500 focus-within:ring-2 focus-within:ring-teal-100">
              <span className="flex items-center border-r border-gray-200 px-4 text-sm text-gray-500">
                R
              </span>

              <input
                id="budget"
                type="number"
                min="0"
                step="100"
                disabled={
                  success !== ""
                }
                value={
                  form.budget
                }
                onChange={(event) =>
                  setForm(
                    (current) => ({
                      ...current,

                      budget:
                        event.target.value,
                    })
                  )
                }
                placeholder="Example: 25000"
                className="w-full rounded-r-lg px-4 py-3 text-sm outline-none disabled:bg-gray-100"
              />
            </div>

            <p className="mt-2 text-xs text-gray-500">
              This helps the Clerk recommend suitable options. It does not
              guarantee the final quotation amount.
            </p>
          </div>

          <div className="mt-6">
            <label
              htmlFor="description"
              className="block text-sm font-medium text-gray-700"
            >
              Additional Requirements
              {form.quoteType ===
              "Other" ? null : (
                <span className="ml-1 font-normal text-gray-400">
                  (optional)
                </span>
              )}
            </label>

            <textarea
              id="description"
              required={
                form.quoteType ===
                "Other"
              }
              rows={7}
              maxLength={2000}
              disabled={
                success !== ""
              }
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
              placeholder={
                form.quoteType ===
                "Other"
                  ? "Describe exactly what service you need priced."
                  : "Example: We may need extra chairs, transport for elderly family members, and would like the Clerk to recommend suitable options."
              }
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-4 py-3 text-sm text-gray-900 outline-none transition focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            />

            <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-gray-400">
              <span>
                Add any details that may affect the quotation.
              </span>

              <span>
                {
                  form.description.length
                }
                /2000
              </span>
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            {funeralRelated
              ? "4. LegacyCare Branch"
              : "3. LegacyCare Branch"}
          </h2>

          <div className="mt-6">
            <label
              htmlFor="branchId"
              className="block text-sm font-medium text-gray-700"
            >
              Branch handling this quote
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
            📋 Quote Request Workflow
          </h2>

          <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-medium">
            <span className="rounded-full bg-amber-100 px-3 py-1.5 text-amber-700">
              Requested
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
              Quoted
            </span>

            <span className="text-gray-400">
              →
            </span>

            <span className="rounded-full bg-blue-100 px-3 py-1.5 text-blue-700">
              Completed
            </span>
          </div>

          <p className="mt-3 text-xs leading-5 text-gray-500">
            A Clerk reviews the details before preparing the quotation. The
            request may also be rejected or cancelled where appropriate.
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
                ? "Quote Request Submitted"
                : "Submit Quote Request"}
          </button>
        </div>
      </form>
    </div>
  );
}