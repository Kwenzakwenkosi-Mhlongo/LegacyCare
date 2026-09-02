// File:
// Web/legacycare_website/app/(dashboard)/client/service-requests/payment/page.tsx

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

const PAYMENT_ISSUES = [
  "Payment not reflected",
  "Incorrect payment amount",
  "Failed payment",
  "Duplicate payment",
  "Receipt needed",
  "Outstanding balance question",
  "Payment date question",
  "Payment method issue",
  "Refund question",
  "Other",
];

type Branch = {
  branchId: string;
  branchName?: string | null;
  name?: string | null;
  isActive?: boolean;
};

type Policy = {
  policyId: string;
  packageId?: string | null;
  packageName?: string | null;
  status?: string | number | null;
};

type Payment = {
  paymentId: string;
  policyId?: string | null;
  amount?: number | string | null;
  paymentDate?: string | null;
  dueDate?: string | null;
  status?: string | number | null;
  method?: string | number | null;
  description?: string | null;

  policy?: {
    policyId?: string | null;

    package?: {
      packageId?: string | null;
      name?: string | null;
    } | null;
  } | null;
};

type FormState = {
  branchId: string;
  policyId: string;
  paymentId: string;
  issueType: string;
  description: string;
};

const EMPTY_FORM: FormState = {
  branchId: "",
  policyId: "",
  paymentId: "",
  issueType: "",
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
  value?: number | string | null
): string {
  const amount = Number(value);

  if (!Number.isFinite(amount)) {
    return "Not available";
  }

  return new Intl.NumberFormat(
    "en-ZA",
    {
      style: "currency",
      currency: "ZAR",
      minimumFractionDigits: 2,
    }
  ).format(amount);
}

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
  }

  const date = new Date(value);

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

function formatEnumValue(
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

function normalizePolicyId(
  payment: Payment
): string {
  return (
    payment.policyId ||
    payment.policy?.policyId ||
    ""
  );
}

function getPaymentLabel(
  payment: Payment
): string {
  const date =
    formatDate(
      payment.paymentDate ||
        payment.dueDate
    );

  const amount =
    formatCurrency(
      payment.amount
    );

  const status =
    formatEnumValue(
      payment.status
    );

  const policyId =
    normalizePolicyId(
      payment
    );

  return `${date} • ${amount} • ${status}${
    policyId
      ? ` • ${policyId}`
      : ""
  }`;
}

export default function PaymentEnquiryPage() {
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
    payments,
    setPayments,
  ] = useState<Payment[]>([]);

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
    paymentsError,
    setPaymentsError,
  ] = useState("");

  const selectedPayment =
    useMemo(
      () =>
        payments.find(
          (payment) =>
            payment.paymentId ===
            form.paymentId
        ) || null,
      [
        payments,
        form.paymentId,
      ]
    );

  const filteredPayments =
    useMemo(() => {
      if (!form.policyId) {
        return payments;
      }

      return payments.filter(
        (payment) =>
          normalizePolicyId(
            payment
          ) === form.policyId
      );
    }, [
      payments,
      form.policyId,
    ]);

  useEffect(() => {
    document.title =
      "Payment Enquiry | LegacyCare";

    const loadPage =
      async (): Promise<void> => {
        try {
          setLoading(true);
          setError("");
          setPaymentsError("");

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
            paymentsResult,
          ] =
            await Promise.allSettled([
              fetch(
                `${API_URL}/Branch`,
                {
                  method: "GET",
                  headers,
                  cache:
                    "no-store",
                }
              ),

              fetch(
                `${API_URL}/Policy/client`,
                {
                  method: "GET",
                  headers,
                  cache:
                    "no-store",
                }
              ),

              fetch(
                `${API_URL}/Payment`,
                {
                  method: "GET",
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
            }
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
              setPolicies(
                Array.isArray(data)
                  ? data
                  : []
              );
            }
          }

          if (
            paymentsResult.status ===
            "fulfilled"
          ) {
            const response =
              paymentsResult.value;

            const data =
              await response
                .json()
                .catch(() => null);

            if (response.ok) {
              setPayments(
                Array.isArray(data)
                  ? data
                  : []
              );
            } else {
              setPayments([]);

              setPaymentsError(
                extractErrorMessage(
                  data,
                  "Unable to load your payments. You can still submit a general payment enquiry."
                )
              );
            }
          } else {
            setPayments([]);

            setPaymentsError(
              "Unable to load your payments. You can still submit a general payment enquiry."
            );
          }
        } catch (err) {
          setError(
            err instanceof Error
              ? err.message
              : "Unable to load payment enquiry."
          );
        } finally {
          setLoading(false);
        }
      };

    void loadPage();
  }, []);

  function handlePolicyChange(
    policyId: string
  ): void {
    setForm(
      (current) => ({
        ...current,
        policyId,
        paymentId: "",
      })
    );
  }

  function handlePaymentChange(
    paymentId: string
  ): void {
    const payment =
      payments.find(
        (item) =>
          item.paymentId ===
          paymentId
      );

    setForm(
      (current) => ({
        ...current,

        paymentId,

        policyId:
          payment
            ? normalizePolicyId(
                payment
              ) ||
              current.policyId
            : current.policyId,
      })
    );
  }

  async function submitEnquiry(
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

      if (!form.issueType) {
        throw new Error(
          "Please select what you need help with."
        );
      }

      if (
        !form.description.trim()
      ) {
        throw new Error(
          "Please tell us more about your payment enquiry."
        );
      }

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const enquiryDetails: string[] =
        [
          `Payment enquiry type: ${form.issueType}`,
        ];

      if (form.policyId) {
        enquiryDetails.push(
          `Policy: ${form.policyId}`
        );
      }

      if (selectedPayment) {
        enquiryDetails.push(
          `Payment reference: ${selectedPayment.paymentId}`
        );

        enquiryDetails.push(
          `Payment amount: ${formatCurrency(
            selectedPayment.amount
          )}`
        );

        enquiryDetails.push(
          `Payment date: ${formatDate(
            selectedPayment.paymentDate
          )}`
        );

        enquiryDetails.push(
          `Due date: ${formatDate(
            selectedPayment.dueDate
          )}`
        );

        enquiryDetails.push(
          `Payment status: ${formatEnumValue(
            selectedPayment.status
          )}`
        );

        enquiryDetails.push(
          `Payment method: ${formatEnumValue(
            selectedPayment.method
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
            method: "POST",

            headers: {
              Accept:
                "application/json",

              "Content-Type":
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              requestType:
                "PaymentEnquiry",

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
            "Unable to submit payment enquiry."
          )
        );
      }

      router.push(
        "/client/service-requests?paymentCreated=true"
      );

      router.refresh();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to submit payment enquiry."
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
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-teal-100 text-2xl">
            💳
          </div>

          <div>
            <h1 className="text-2xl font-semibold text-gray-900">
              Payment Enquiry
            </h1>

            <p className="mt-1 text-sm text-gray-500">
              Get help with a payment, receipt, balance or payment issue.
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
        <p className="text-sm font-semibold text-blue-900">
          💡 Need help with a payment?
        </p>

        <p className="mt-1 text-sm leading-6 text-blue-700">
          Select a payment from your payment records if your enquiry is about
          a specific transaction. If your question is general, you can leave
          the payment selection empty and explain the issue below.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {paymentsError ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          {paymentsError}
        </div>
      ) : null}

      <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900">
          Payment Enquiry Details
        </h2>

        <p className="mt-1 text-sm text-gray-500">
          Choose the issue and any related payment, then tell us what happened.
        </p>

        <form
          onSubmit={(event) =>
            void submitEnquiry(
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
              htmlFor="issueType"
              className="text-sm font-medium text-gray-700"
            >
              What do you need help with?
            </label>

            <select
              id="issueType"
              required
              value={
                form.issueType
              }
              onChange={(event) =>
                setForm({
                  ...form,

                  issueType:
                    event.target.value,
                })
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            >
              <option value="">
                Select an issue
              </option>

              {PAYMENT_ISSUES.map(
                (issue) => (
                  <option
                    key={issue}
                    value={issue}
                  >
                    {issue}
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
              Policy
              <span className="ml-1 font-normal text-gray-400">
                (optional)
              </span>
            </label>

            <select
              id="policyId"
              value={
                form.policyId
              }
              onChange={(event) =>
                handlePolicyChange(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
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
                    {policy.policyId}
                    {policy.packageName
                      ? ` • ${policy.packageName}`
                      : ""}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label
              htmlFor="paymentId"
              className="text-sm font-medium text-gray-700"
            >
              Payment
              <span className="ml-1 font-normal text-gray-400">
                (optional)
              </span>
            </label>

            <select
              id="paymentId"
              disabled={
                loading ||
                payments.length ===
                  0
              }
              value={
                form.paymentId
              }
              onChange={(event) =>
                handlePaymentChange(
                  event.target.value
                )
              }
              className="mt-2 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100 disabled:bg-gray-100"
            >
              <option value="">
                {loading
                  ? "Loading your payments..."
                  : payments.length === 0
                    ? "No payment records available"
                    : "No specific payment"}
              </option>

              {filteredPayments.map(
                (payment) => (
                  <option
                    key={
                      payment.paymentId
                    }
                    value={
                      payment.paymentId
                    }
                  >
                    {getPaymentLabel(
                      payment
                    )}
                  </option>
                )
              )}
            </select>

            <p className="mt-1 text-xs text-gray-500">
              Choose the payment that your enquiry relates to, if applicable.
            </p>
          </div>

          {selectedPayment ? (
            <div className="rounded-xl border border-teal-200 bg-teal-50 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-teal-900">
                  💳 Selected Payment
                </h3>

                <span className="rounded-full bg-white px-3 py-1 text-xs font-medium text-teal-700">
                  {formatEnumValue(
                    selectedPayment.status
                  )}
                </span>
              </div>

              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <div>
                  <p className="text-xs text-teal-700">
                    Payment Reference
                  </p>

                  <p className="mt-1 break-all text-sm font-medium text-gray-900">
                    {
                      selectedPayment.paymentId
                    }
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Policy
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {normalizePolicyId(
                      selectedPayment
                    ) ||
                      "Not available"}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Amount
                  </p>

                  <p className="mt-1 text-sm font-semibold text-gray-900">
                    {formatCurrency(
                      selectedPayment.amount
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Payment Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(
                      selectedPayment.paymentDate
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Due Date
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatDate(
                      selectedPayment.dueDate
                    )}
                  </p>
                </div>

                <div>
                  <p className="text-xs text-teal-700">
                    Payment Method
                  </p>

                  <p className="mt-1 text-sm font-medium text-gray-900">
                    {formatEnumValue(
                      selectedPayment.method
                    )}
                  </p>
                </div>
              </div>
            </div>
          ) : null}

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
              placeholder="Explain what happened, what you expected, and what you need LegacyCare to help you with..."
              onChange={(event) =>
                setForm({
                  ...form,

                  description:
                    event.target.value,
                })
              }
              className="mt-2 w-full resize-y rounded-lg border border-gray-300 px-3 py-3 text-sm text-gray-900 outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-100"
            />

            <div className="mt-1 flex flex-wrap justify-between gap-2 text-xs text-gray-400">
              <span>
                You can freely explain anything that is not covered by the options above.
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
              🔒 Keep your banking details safe
            </p>

            <p className="mt-1 text-xs leading-5 text-gray-500">
              Never enter a bank password, card PIN, online banking password
              or one-time PIN in a payment enquiry.
            </p>
          </div>

          <div className="flex flex-wrap gap-3 border-t border-gray-100 pt-5">
            <button
              type="submit"
              disabled={
                submitting ||
                loading
              }
              className="rounded-lg bg-teal-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitting
                ? "Submitting..."
                : "Submit Payment Enquiry"}
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
          📋 Payment Enquiry Workflow
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

          <span className="rounded-full bg-orange-100 px-3 py-1.5 text-orange-700">
            Awaiting Client
          </span>

          <span className="text-gray-400">
            →
          </span>

          <span className="rounded-full bg-emerald-100 px-3 py-1.5 text-emerald-700">
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
          If LegacyCare needs more information from you, the request can move
          to Awaiting Client before being resolved.
        </p>
      </section>
    </div>
  );
}