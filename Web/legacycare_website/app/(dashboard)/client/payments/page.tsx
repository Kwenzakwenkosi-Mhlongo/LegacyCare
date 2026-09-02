

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

type Package = {
  packageId?: string | null;
  packageName?: string | null;
  name?: string | null;
  monthlyPremium?: number | null;
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
  method: string | number;
  status: string | number;
  policyId: string;
  policy?: Policy | null;
};

type PaymentFilter =
  | "all"
  | "successful"
  | "pending"
  | "overdue"
  | "failed";

type MonthlyPaymentPoint = {
  key: string;
  label: string;
  successful: number;
  pending: number;
  overdue: number;
};

function normalizeValue(
  value?: string | number | null
): string {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/_/g, "");
}

function isPending(
  payment: Payment
): boolean {
  const status =
    normalizeValue(payment.status);

  return (
    status === "pending" ||
    status === "0"
  );
}

function isSuccessful(
  payment: Payment
): boolean {
  const status =
    normalizeValue(payment.status);

  return (
    status === "successful" ||
    status === "1"
  );
}

function isFailed(
  payment: Payment
): boolean {
  const status =
    normalizeValue(payment.status);

  return (
    status === "failed" ||
    status === "2"
  );
}

function isOverdue(
  payment: Payment
): boolean {
  if (!isPending(payment)) {
    return false;
  }

  const dueDate =
    new Date(payment.dueDate);

  if (
    Number.isNaN(
      dueDate.getTime()
    )
  ) {
    return false;
  }

  const today =
    new Date();

  today.setHours(
    0,
    0,
    0,
    0
  );

  dueDate.setHours(
    0,
    0,
    0,
    0
  );

  return (
    dueDate.getTime() <
    today.getTime()
  );
}

function isCurrentPending(
  payment: Payment
): boolean {
  return (
    isPending(payment) &&
    !isOverdue(payment)
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

function formatDate(
  value?: string | null
): string {
  if (!value) {
    return "Not paid";
  }

  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
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

function getStatusLabel(
  payment: Payment
): string {
  if (
    isSuccessful(payment)
  ) {
    return "Successful";
  }

  if (
    isOverdue(payment)
  ) {
    return "Overdue";
  }

  if (
    isFailed(payment)
  ) {
    return "Failed";
  }

  if (
    isPending(payment)
  ) {
    return "Pending";
  }

  return String(
    payment.status
  );
}

function getStatusClasses(
  payment: Payment
): string {
  if (
    isSuccessful(payment)
  ) {
    return "border-green-200 bg-green-100 text-green-700";
  }

  if (
    isOverdue(payment)
  ) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  if (
    isFailed(payment)
  ) {
    return "border-rose-200 bg-rose-50 text-rose-700";
  }

  if (
    isPending(payment)
  ) {
    return "border-amber-200 bg-amber-100 text-amber-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function getMethodLabel(
  method: string | number
): string {
  const value =
    normalizeValue(method);

  switch (value) {
    case "card":
    case "0":
      return "Card";

    case "cash":
    case "1":
      return "Cash";

    case "eft":
    case "2":
      return "EFT";

    case "debitorder":
    case "3":
      return "Debit Order";

    default:
      return String(method);
  }
}

function getPackageName(
  payment: Payment
): string {
  return (
    payment.policy
      ?.package
      ?.packageName ||
    payment.policy
      ?.package
      ?.name ||
    "Policy Payment"
  );
}

function getPolicyLabel(
  payment: Payment
): string {
  const policyNumber =
    payment.policy?.policyNumber;

  const packageName =
    getPackageName(payment);

  return policyNumber
    ? `${policyNumber} • ${packageName}`
    : `${payment.policyId} • ${packageName}`;
}

function getMonthKey(
  value: string
): string | null {
  const date =
    new Date(value);

  if (
    Number.isNaN(
      date.getTime()
    )
  ) {
    return null;
  }

  return `${date.getFullYear()}-${String(
    date.getMonth() + 1
  ).padStart(2, "0")}`;
}

function getMonthLabel(
  key: string
): string {
  const [
    year,
    month,
  ] =
    key
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    1
  ).toLocaleDateString(
    "en-ZA",
    {
      month: "short",
      year: "2-digit",
    }
  );
}

function buildMonthlyPaymentData(
  payments: Payment[]
): MonthlyPaymentPoint[] {
  const grouped =
    new Map<
      string,
      MonthlyPaymentPoint
    >();

  for (
    const payment
    of payments
  ) {
    const key =
      getMonthKey(
        payment.dueDate
      );

    if (!key) {
      continue;
    }

    const current =
      grouped.get(key) ?? {
        key,
        label:
          getMonthLabel(key),
        successful: 0,
        pending: 0,
        overdue: 0,
      };

    if (
      isSuccessful(payment)
    ) {
      current.successful +=
        1;
    } else if (
      isOverdue(payment)
    ) {
      current.overdue +=
        1;
    } else if (
      isCurrentPending(payment)
    ) {
      current.pending +=
        1;
    }

    grouped.set(
      key,
      current
    );
  }

  return [
    ...grouped.values(),
  ]
    .sort(
      (
        left,
        right
      ) =>
        left.key.localeCompare(
          right.key
        )
    )
    .slice(-12);
}

function PaymentTrendChart({
  data,
}: {
  data: MonthlyPaymentPoint[];
}) {
  if (
    data.length === 0
  ) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-500">
          Payment trend data will appear once payment records are available.
        </p>
      </div>
    );
  }

  const width = 900;
  const height = 330;

  const paddingLeft = 52;
  const paddingRight = 24;
  const paddingTop = 30;
  const paddingBottom = 58;

  const chartWidth =
    width -
    paddingLeft -
    paddingRight;

  const chartHeight =
    height -
    paddingTop -
    paddingBottom;

  const maxValue =
    Math.max(
      1,
      ...data.flatMap(
        (point) => [
          point.successful,
          point.pending,
          point.overdue,
        ]
      )
    );

  const yMaximum =
    Math.max(
      2,
      Math.ceil(maxValue)
    );

  function xForIndex(
    index: number
  ): number {
    if (
      data.length === 1
    ) {
      return (
        paddingLeft +
        chartWidth / 2
      );
    }

    return (
      paddingLeft +
      (
        index /
        (data.length - 1)
      ) *
        chartWidth
    );
  }

  function yForValue(
    value: number
  ): number {
    return (
      paddingTop +
      chartHeight -
      (
        value /
        yMaximum
      ) *
        chartHeight
    );
  }

  function makePoints(
    field:
      | "successful"
      | "pending"
      | "overdue"
  ): string {
    return data
      .map(
        (
          point,
          index
        ) =>
          `${xForIndex(index)},${yForValue(
            point[field]
          )}`
      )
      .join(" ");
  }

  const yTicks =
    Array.from(
      {
        length:
          yMaximum + 1,
      },
      (
        _,
        index
      ) => index
    );

  return (
    <div className="overflow-x-auto">
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="min-w-[720px] w-full"
        role="img"
        aria-label="Successful, pending and overdue payment trend"
      >
        {yTicks.map(
          (tick) => {
            const y =
              yForValue(tick);

            return (
              <g key={tick}>
                <line
                  x1={
                    paddingLeft
                  }
                  x2={
                    width -
                    paddingRight
                  }
                  y1={y}
                  y2={y}
                  stroke="currentColor"
                  className="text-gray-200"
                  strokeWidth="1"
                />

                <text
                  x={
                    paddingLeft -
                    12
                  }
                  y={
                    y + 4
                  }
                  textAnchor="end"
                  className="fill-gray-400 text-[11px]"
                >
                  {tick}
                </text>
              </g>
            );
          }
        )}

        <polyline
          points={makePoints(
            "successful"
          )}
          fill="none"
          stroke="#16a34a"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <polyline
          points={makePoints(
            "pending"
          )}
          fill="none"
          stroke="#d97706"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        <polyline
          points={makePoints(
            "overdue"
          )}
          fill="none"
          stroke="#dc2626"
          strokeWidth="3"
          strokeLinejoin="round"
          strokeLinecap="round"
        />

        {data.map(
          (
            point,
            index
          ) => {
            const x =
              xForIndex(index);

            return (
              <g
                key={
                  point.key
                }
              >
                <circle
                  cx={x}
                  cy={yForValue(
                    point.successful
                  )}
                  r="5"
                  fill="#16a34a"
                >
                  <title>
                    {`${point.label}: ${point.successful} successful`}
                  </title>
                </circle>

                <circle
                  cx={x}
                  cy={yForValue(
                    point.pending
                  )}
                  r="5"
                  fill="#d97706"
                >
                  <title>
                    {`${point.label}: ${point.pending} pending`}
                  </title>
                </circle>

                <circle
                  cx={x}
                  cy={yForValue(
                    point.overdue
                  )}
                  r="5"
                  fill="#dc2626"
                >
                  <title>
                    {`${point.label}: ${point.overdue} overdue`}
                  </title>
                </circle>

                <text
                  x={x}
                  y={
                    height -
                    22
                  }
                  textAnchor="middle"
                  className="fill-gray-500 text-[11px]"
                >
                  {
                    point.label
                  }
                </text>
              </g>
            );
          }
        )}
      </svg>
    </div>
  );
}

export default function ClientPaymentsPage() {
  const [
    payments,
    setPayments,
  ] =
    useState<
      Payment[]
    >([]);

  const [
    selectedPolicyId,
    setSelectedPolicyId,
  ] =
    useState("all");

  const [
    paymentFilter,
    setPaymentFilter,
  ] =
    useState<PaymentFilter>(
      "all"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    document.title =
      "Payments | LegacyCare";
  }, []);

  async function loadPayments(
    refresh = false
  ): Promise<void> {
    try {
      if (refresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setError("");

      const token =
        getToken();

      if (!token) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response =
        await fetch(
          `${API_URL}/Payment`,
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
            `Unable to load payments (${response.status}).`
        );
      }

      setPayments(
        Array.isArray(data)
          ? data
          : []
      );
    } catch (err) {
      console.error(
        "[CLIENT PAYMENTS] ERROR:",
        err
      );

      setPayments([]);

      setError(
        err instanceof Error
          ? err.message
          : "Unable to load payments."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  useEffect(() => {
    void loadPayments();
  }, []);

  const policies =
    useMemo(() => {
      const policyMap =
        new Map<
          string,
          string
        >();

      for (
        const payment
        of payments
      ) {
        if (
          !payment.policyId
        ) {
          continue;
        }

        if (
          !policyMap.has(
            payment.policyId
          )
        ) {
          policyMap.set(
            payment.policyId,
            getPolicyLabel(
              payment
            )
          );
        }
      }

      return [
        ...policyMap.entries(),
      ].map(
        (
          [
            policyId,
            label,
          ]
        ) => ({
          policyId,
          label,
        })
      );
    }, [
      payments,
    ]);

  const policyPayments =
    useMemo(
      () =>
        selectedPolicyId ===
        "all"
          ? payments
          : payments.filter(
              (
                payment
              ) =>
                payment.policyId ===
                selectedPolicyId
            ),
      [
        payments,
        selectedPolicyId,
      ]
    );

  const summary =
    useMemo(() => {
      const successful =
        policyPayments.filter(
          isSuccessful
        );

      const overdue =
        policyPayments.filter(
          isOverdue
        );

      const pending =
        policyPayments.filter(
          isCurrentPending
        );

      const failed =
        policyPayments.filter(
          isFailed
        );

      return {
        totalRecords:
          policyPayments.length,

        successfulCount:
          successful.length,

        overdueCount:
          overdue.length,

        pendingCount:
          pending.length,

        failedCount:
          failed.length,

        totalPaid:
          successful.reduce(
            (
              total,
              payment
            ) =>
              total +
              (
                Number(
                  payment.amount
                ) ||
                0
              ),
            0
          ),

        overdueAmount:
          overdue.reduce(
            (
              total,
              payment
            ) =>
              total +
              (
                Number(
                  payment.amount
                ) ||
                0
              ),
            0
          ),

        pendingAmount:
          pending.reduce(
            (
              total,
              payment
            ) =>
              total +
              (
                Number(
                  payment.amount
                ) ||
                0
              ),
            0
          ),

        latestPayment:
          [
            ...successful,
          ]
            .filter(
              (
                payment
              ) =>
                payment.paymentDate
            )
            .sort(
              (
                first,
                second
              ) =>
                new Date(
                  second.paymentDate!
                ).getTime() -
                new Date(
                  first.paymentDate!
                ).getTime()
            )[0]
            ?.paymentDate ||
          null,
      };
    }, [
      policyPayments,
    ]);

  const monthlyData =
    useMemo(
      () =>
        buildMonthlyPaymentData(
          policyPayments
        ),
      [
        policyPayments,
      ]
    );

  const overduePayments =
    useMemo(
      () =>
        policyPayments
          .filter(isOverdue)
          .sort(
            (
              first,
              second
            ) =>
              new Date(
                first.dueDate
              ).getTime() -
              new Date(
                second.dueDate
              ).getTime()
          ),
      [
        policyPayments,
      ]
    );

  const filteredPayments =
    useMemo(() => {
      let result =
        [
          ...policyPayments,
        ];

      if (
        paymentFilter ===
        "successful"
      ) {
        result =
          result.filter(
            isSuccessful
          );
      }

      if (
        paymentFilter ===
        "pending"
      ) {
        result =
          result.filter(
            isCurrentPending
          );
      }

      if (
        paymentFilter ===
        "overdue"
      ) {
        result =
          result.filter(
            isOverdue
          );
      }

      if (
        paymentFilter ===
        "failed"
      ) {
        result =
          result.filter(
            isFailed
          );
      }

      return result.sort(
        (
          first,
          second
        ) =>
          new Date(
            second.dueDate
          ).getTime() -
          new Date(
            first.dueDate
          ).getTime()
      );
    }, [
      policyPayments,
      paymentFilter,
    ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-2xl font-semibold text-gray-900">
            Payments
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Track premiums, successful payments, pending premiums and overdue balances.
          </p>
        </div>

        <button
          type="button"
          disabled={
            loading ||
            refreshing
          }
          onClick={() =>
            void loadPayments(
              true
            )
          }
          className="w-fit rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 hover:bg-gray-50 disabled:opacity-50"
        >
          {refreshing
            ? "Refreshing..."
            : "↻ Refresh"}
        </button>
      </div>

      {!loading &&
      !error &&
      policies.length >
        1 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="policyFilter"
            className="block text-sm font-medium text-gray-700"
          >
            View payments for
          </label>

          <select
            id="policyFilter"
            value={
              selectedPolicyId
            }
            onChange={(event) => {
              setSelectedPolicyId(
                event.target.value
              );

              setPaymentFilter(
                "all"
              );
            }}
            className="mt-2 w-full max-w-md rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm"
          >
            <option value="all">
              All Policies
            </option>

            {policies.map(
              (
                policy
              ) => (
                <option
                  key={
                    policy.policyId
                  }
                  value={
                    policy.policyId
                  }
                >
                  {
                    policy.label
                  }
                </option>
              )
            )}
          </select>
        </section>
      ) : null}

      {!loading &&
      !error ? (
        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Total Paid
            </p>

            <p className="mt-2 text-xl font-semibold text-green-700">
              {formatCurrency(
                summary.totalPaid
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {
                summary.successfulCount
              }{" "}
              successful payments
            </p>
          </div>

          <div className="rounded-2xl border border-red-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Overdue
            </p>

            <p className="mt-2 text-xl font-semibold text-red-700">
              {formatCurrency(
                summary.overdueAmount
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {
                summary.overdueCount
              }{" "}
              overdue payments
            </p>
          </div>

          <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending
            </p>

            <p className="mt-2 text-xl font-semibold text-amber-700">
              {formatCurrency(
                summary.pendingAmount
              )}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              {
                summary.pendingCount
              }{" "}
              currently pending
            </p>
          </div>

          <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Latest Payment
            </p>

            <p className="mt-2 text-sm font-semibold text-gray-900">
              {summary.latestPayment
                ? formatDate(
                    summary.latestPayment
                  )
                : "No successful payments yet"}
            </p>

            <p className="mt-1 text-xs text-gray-500">
              Most recent successful payment
            </p>
          </div>
        </section>
      ) : null}

      {loading ? (
        <div className="space-y-4">
          {[0, 1, 2].map(
            (
              item
            ) => (
              <div
                key={
                  item
                }
                className="h-28 animate-pulse rounded-2xl bg-white shadow-sm"
              />
            )
          )}
        </div>
      ) : null}

      {!loading &&
      error ? (
        <section className="rounded-2xl border border-red-200 bg-red-50 p-6">
          <h2 className="font-semibold text-red-800">
            Unable to load payments
          </h2>

          <p className="mt-1 text-sm text-red-700">
            {error}
          </p>
        </section>
      ) : null}

      {!loading &&
      !error &&
      policyPayments.length ===
        0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
          <h2 className="text-lg font-semibold text-gray-900">
            No payment records yet
          </h2>

          <p className="mt-2 text-sm text-gray-500">
            Payment records will appear when monthly premiums are generated.
          </p>
        </section>
      ) : null}

      {!loading &&
      !error &&
      policyPayments.length >
        0 ? (
        <>
          <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
            <div className="flex flex-col justify-between gap-4 md:flex-row">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  Payment Status Trend
                </h2>

                <p className="mt-1 text-sm text-gray-500">
                  Successful vs pending vs overdue premium records by month.
                </p>
              </div>

              <div className="flex flex-wrap gap-4 text-xs font-semibold">
                <span className="text-green-700">
                  ● Successful
                </span>

                <span className="text-amber-700">
                  ● Pending
                </span>

                <span className="text-red-700">
                  ● Overdue
                </span>
              </div>
            </div>

            <div className="mt-6">
              <PaymentTrendChart
                data={
                  monthlyData
                }
              />
            </div>
          </section>

          {overduePayments.length >
          0 ? (
            <section className="overflow-hidden rounded-2xl border border-red-200 bg-white shadow-sm">
              <div className="border-b border-red-100 bg-red-50 p-6">
                <h2 className="text-lg font-semibold text-red-900">
                  ⚠️ Overdue Payments
                </h2>

                <p className="mt-1 text-sm text-red-700">
                  These pending premiums have passed their due date.
                </p>
              </div>

              <div className="divide-y divide-red-100">
                {overduePayments.map(
                  (
                    payment
                  ) => (
                    <article
                      key={
                        payment.paymentId
                      }
                      className="p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {getPackageName(
                              payment
                            )}
                          </h3>

                          <p className="mt-1 text-sm text-gray-500">
                            Policy{" "}
                            {
                              payment.policyId
                            }
                          </p>

                          <p className="mt-2 text-sm text-red-700">
                            Due{" "}
                            {formatDate(
                              payment.dueDate
                            )}
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-3">
                          <p className="text-xl font-semibold text-red-700">
                            {formatCurrency(
                              Number(
                                payment.amount
                              ) ||
                                0
                            )}
                          </p>

                          <Link
                            href="/client/service-requests/payment"
                            className="rounded-lg border border-red-300 px-4 py-2 text-sm font-semibold text-red-700 hover:bg-red-50"
                          >
                            Ask About Payment
                          </Link>
                        </div>
                      </div>
                    </article>
                  )
                )}
              </div>
            </section>
          ) : (
            <section className="rounded-2xl border border-green-200 bg-green-50 p-5">
              <p className="font-semibold text-green-900">
                ✅ No overdue payments
              </p>

              <p className="mt-1 text-sm text-green-700">
                There are currently no overdue premiums.
              </p>
            </section>
          )}

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900">
                Payment History
              </h2>

              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    "all",
                    "successful",
                    "pending",
                    "overdue",
                    "failed",
                  ] as PaymentFilter[]
                ).map(
                  (
                    filter
                  ) => (
                    <button
                      key={
                        filter
                      }
                      type="button"
                      onClick={() =>
                        setPaymentFilter(
                          filter
                        )
                      }
                      className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize ${
                        paymentFilter ===
                        filter
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-gray-300 bg-white text-gray-600"
                      }`}
                    >
                      {filter}
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredPayments.length ===
            0 ? (
              <div className="p-10 text-center text-sm text-gray-500">
                No payments match this filter.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredPayments.map(
                  (
                    payment
                  ) => (
                    <article
                      key={
                        payment.paymentId
                      }
                      className="p-6"
                    >
                      <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h3 className="font-semibold text-gray-900">
                              {getPackageName(
                                payment
                              )}
                            </h3>

                            <span
                              className={`rounded-full border px-2.5 py-1 text-xs font-medium ${getStatusClasses(
                                payment
                              )}`}
                            >
                              {getStatusLabel(
                                payment
                              )}
                            </span>
                          </div>

                          <p className="mt-1 text-sm text-gray-500">
                            Policy{" "}
                            {
                              payment.policyId
                            }
                          </p>
                        </div>

                        <p className="text-xl font-semibold text-gray-900">
                          {formatCurrency(
                            Number(
                              payment.amount
                            ) ||
                              0
                          )}
                        </p>
                      </div>

                      <div className="mt-5 grid grid-cols-1 gap-4 border-t border-gray-100 pt-5 sm:grid-cols-2 lg:grid-cols-5">
                        <div>
                          <p className="text-xs text-gray-500">
                            Due Date
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {formatDate(
                              payment.dueDate
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Payment Date
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {isSuccessful(
                              payment
                            )
                              ? formatDate(
                                  payment.paymentDate
                                )
                              : "Not paid"}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Method
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {getMethodLabel(
                              payment.method
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Status
                          </p>

                          <p className="mt-1 text-sm font-medium text-gray-900">
                            {getStatusLabel(
                              payment
                            )}
                          </p>
                        </div>

                        <div>
                          <p className="text-xs text-gray-500">
                            Payment ID
                          </p>

                          <p
                            className="mt-1 truncate text-sm font-medium text-gray-900"
                            title={
                              payment.paymentId
                            }
                          >
                            {
                              payment.paymentId
                            }
                          </p>
                        </div>
                      </div>

                      <div className="mt-5 flex justify-end border-t border-gray-100 pt-4">
                        <Link
                          href="/client/service-requests/payment"
                          className="rounded-lg border border-teal-300 px-4 py-2 text-xs font-semibold text-teal-700 hover:bg-teal-50"
                        >
                          Payment Enquiry
                        </Link>
                      </div>
                    </article>
                  )
                )}
              </div>
            )}
          </section>
        </>
      ) : null}
    </div>
  );
}

