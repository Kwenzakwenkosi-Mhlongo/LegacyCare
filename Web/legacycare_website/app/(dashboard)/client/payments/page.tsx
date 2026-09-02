// File:
// Web/legacycare_website/app/(dashboard)/client/payments/page.tsx

"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

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
  method?: string | number | null;
  status: string | number;
  policyId: string;
  policy?: Policy | null;
};

type PaymentFilter =
  | "all"
  | "successful"
  | "pending"
  | "overdue";

type ChartPeriod = "monthly" | "yearly";

type ChartRange = "6m" | "12m" | "all";

type ChartSeries =
  | "successful"
  | "pending"
  | "overdue";

type PaymentTrendPoint = {
  key: string;
  label: string;
  successful: number;
  pending: number;
  overdue: number;
};

type ActiveChartPoint = {
  index: number;
  series: ChartSeries;
};

type YAxisScale = {
  maximum: number;
  step: number;
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

function isPending(payment: Payment): boolean {
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

function isFailed(payment: Payment): boolean {
  const status =
    normalizeValue(payment.status);

  return (
    status === "failed" ||
    status === "2"
  );
}

function isOverdue(payment: Payment): boolean {
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

function canPay(payment: Payment): boolean {
  return (
    isCurrentPending(payment) ||
    isOverdue(payment)
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

function formatChartCurrency(
  value: number
): string {
  if (
    value >=
    1_000_000
  ) {
    return `R${(
      value /
      1_000_000
    ).toFixed(1)}m`;
  }

  if (
    value >=
    1_000
  ) {
    return `R${(
      value /
      1_000
    ).toFixed(
      value % 1_000 === 0
        ? 0
        : 1
    )}k`;
  }

  return `R${Math.round(
    value
  )}`;
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
    isSuccessful(
      payment
    )
  ) {
    return "Successful";
  }

  if (
    isOverdue(
      payment
    )
  ) {
    return "Overdue";
  }

  if (
    isPending(
      payment
    )
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
    isSuccessful(
      payment
    )
  ) {
    return "border-green-200 bg-green-100 text-green-700";
  }

  if (
    isOverdue(
      payment
    )
  ) {
    return "border-red-200 bg-red-100 text-red-700";
  }

  if (
    isPending(
      payment
    )
  ) {
    return "border-blue-200 bg-blue-100 text-blue-700";
  }

  return "border-gray-200 bg-gray-100 text-gray-700";
}

function getMethodLabel(
  method?: string | number | null
): string {
  if (
    method === null ||
    method === undefined ||
    String(method).trim() === ""
  ) {
    return "Not selected";
  }

  const value =
    normalizeValue(method);

  switch (value) {
    case "cash":
    case "0":
      return "Cash";

    case "card":
    case "1":
      return "Card";

    case "eft":
    case "2":
      return "EFT";

    default:
      return String(
        method
      );
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

function getPolicyDisplay(
  payment: Payment
): string {
  return (
    payment.policy
      ?.policyNumber ||
    payment.policyId ||
    "Not available"
  );
}

function getPolicyLabel(
  payment: Payment
): string {
  return `${getPolicyDisplay(
    payment
  )} • ${getPackageName(
    payment
  )}`;
}

function getPaymentReference(
  paymentId: string
): string {
  return paymentId
    .replace(
      /-/g,
      ""
    )
    .slice(
      0,
      10
    )
    .toUpperCase();
}

function getMonthStart(
  date: Date
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    1
  );
}

function addMonths(
  date: Date,
  months: number
): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth() +
      months,
    1
  );
}

function getMonthKeyFromDate(
  date: Date
): string {
  return `${date.getFullYear()}-${String(
    date.getMonth() +
      1
  ).padStart(
    2,
    "0"
  )}`;
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

  return getMonthKeyFromDate(
    date
  );
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
      year: "numeric",
    }
  );
}

function getMonthDateFromKey(
  key: string
): Date {
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
  );
}

function getLatestPaymentMonth(
  payments: Payment[]
): Date | null {
  const validDates =
    payments
      .map(
        (payment) =>
          new Date(
            payment.dueDate
          )
      )
      .filter(
        (date) =>
          !Number.isNaN(
            date.getTime()
          )
      );

  if (
    validDates.length ===
    0
  ) {
    return null;
  }

  const latest =
    validDates.reduce(
      (
        currentLatest,
        date
      ) =>
        date.getTime() >
        currentLatest.getTime()
          ? date
          : currentLatest
    );

  return getMonthStart(
    latest
  );
}

function getEarliestPaymentMonth(
  payments: Payment[]
): Date | null {
  const validDates =
    payments
      .map(
        (payment) =>
          new Date(
            payment.dueDate
          )
      )
      .filter(
        (date) =>
          !Number.isNaN(
            date.getTime()
          )
      );

  if (
    validDates.length ===
    0
  ) {
    return null;
  }

  const earliest =
    validDates.reduce(
      (
        currentEarliest,
        date
      ) =>
        date.getTime() <
        currentEarliest.getTime()
          ? date
          : currentEarliest
    );

  return getMonthStart(
    earliest
  );
}

function getRangeStartDate(
  latestMonth: Date,
  range: ChartRange
): Date | null {
  if (
    range === "6m"
  ) {
    return addMonths(
      latestMonth,
      -5
    );
  }

  if (
    range === "12m"
  ) {
    return addMonths(
      latestMonth,
      -11
    );
  }

  return null;
}

function filterPaymentsByChartRange(
  payments: Payment[],
  range: ChartRange
): Payment[] {
  if (
    payments.length ===
      0 ||
    range === "all"
  ) {
    return payments;
  }

  const latestMonth =
    getLatestPaymentMonth(
      payments
    );

  if (
    !latestMonth
  ) {
    return payments;
  }

  const startDate =
    getRangeStartDate(
      latestMonth,
      range
    );

  if (
    !startDate
  ) {
    return payments;
  }

  const endDate =
    addMonths(
      latestMonth,
      1
    );

  return payments.filter(
    (payment) => {
      const dueDate =
        new Date(
          payment.dueDate
        );

      if (
        Number.isNaN(
          dueDate.getTime()
        )
      ) {
        return false;
      }

      return (
        dueDate.getTime() >=
          startDate.getTime() &&
        dueDate.getTime() <
          endDate.getTime()
      );
    }
  );
}

function createEmptyMonthlyPoints(
  payments: Payment[],
  range: ChartRange
): PaymentTrendPoint[] {
  const latestMonth =
    getLatestPaymentMonth(
      payments
    );

  const earliestMonth =
    getEarliestPaymentMonth(
      payments
    );

  if (
    !latestMonth ||
    !earliestMonth
  ) {
    return [];
  }

  const rangeStart =
    getRangeStartDate(
      latestMonth,
      range
    );

  const startDate =
    rangeStart ??
    earliestMonth;

  const points:
    PaymentTrendPoint[] =
    [];

  let current =
    getMonthStart(
      startDate
    );

  const end =
    getMonthStart(
      latestMonth
    );

  while (
    current.getTime() <=
    end.getTime()
  ) {
    const key =
      getMonthKeyFromDate(
        current
      );

    points.push({
      key,
      label:
        getMonthLabel(
          key
        ),
      successful: 0,
      pending: 0,
      overdue: 0,
    });

    current =
      addMonths(
        current,
        1
      );
  }

  return points;
}

function buildMonthlyPaymentData(
  payments: Payment[],
  range: ChartRange
): PaymentTrendPoint[] {
  if (
    payments.length ===
    0
  ) {
    return [];
  }

  const filtered =
    filterPaymentsByChartRange(
      payments,
      range
    );

  const emptyPoints =
    createEmptyMonthlyPoints(
      payments,
      range
    );

  const grouped =
    new Map<
      string,
      PaymentTrendPoint
    >(
      emptyPoints.map(
        (point) => [
          point.key,
          {
            ...point,
          },
        ]
      )
    );

  for (
    const payment
    of filtered
  ) {
    const key =
      getMonthKey(
        payment.dueDate
      );

    if (!key) {
      continue;
    }

    const amount =
      Number(
        payment.amount
      ) || 0;

    const current =
      grouped.get(
        key
      ) ?? {
        key,
        label:
          getMonthLabel(
            key
          ),
        successful: 0,
        pending: 0,
        overdue: 0,
      };

    if (
      isSuccessful(
        payment
      )
    ) {
      current.successful +=
        amount;
    } else if (
      isOverdue(
        payment
      )
    ) {
      current.overdue +=
        amount;
    } else if (
      isCurrentPending(
        payment
      )
    ) {
      current.pending +=
        amount;
    }

    grouped.set(
      key,
      current
    );
  }

  return [
    ...grouped.values(),
  ].sort(
    (
      left,
      right
    ) =>
      left.key.localeCompare(
        right.key
      )
  );
}

function buildYearlyPaymentData(
  payments: Payment[],
  range: ChartRange
): PaymentTrendPoint[] {
  const monthlyData =
    buildMonthlyPaymentData(
      payments,
      range
    );

  const yearly =
    new Map<
      string,
      PaymentTrendPoint
    >();

  for (
    const month
    of monthlyData
  ) {
    const year =
      String(
        getMonthDateFromKey(
          month.key
        ).getFullYear()
      );

    const current =
      yearly.get(
        year
      ) ?? {
        key: year,
        label: year,
        successful: 0,
        pending: 0,
        overdue: 0,
      };

    current.successful +=
      month.successful;

    current.pending +=
      month.pending;

    current.overdue +=
      month.overdue;

    yearly.set(
      year,
      current
    );
  }

  return [
    ...yearly.values(),
  ].sort(
    (
      left,
      right
    ) =>
      left.key.localeCompare(
        right.key
      )
  );
}

function buildPaymentTrendData(
  payments: Payment[],
  period: ChartPeriod,
  range: ChartRange
): PaymentTrendPoint[] {
  return period ===
    "yearly"
    ? buildYearlyPaymentData(
        payments,
        range
      )
    : buildMonthlyPaymentData(
        payments,
        range
      );
}

function getYAxisScale(
  maxValue: number
): YAxisScale {
  if (
    maxValue <=
    0
  ) {
    return {
      maximum: 100,
      step: 20,
    };
  }

  const desiredTickCount =
    5;

  const roughStep =
    maxValue /
    desiredTickCount;

  const magnitude =
    10 **
    Math.floor(
      Math.log10(
        roughStep
      )
    );

  const normalizedStep =
    roughStep /
    magnitude;

  let niceFactor:
    number;

  if (
    normalizedStep <=
    1
  ) {
    niceFactor = 1;
  } else if (
    normalizedStep <=
    2
  ) {
    niceFactor = 2;
  } else if (
    normalizedStep <=
    5
  ) {
    niceFactor = 5;
  } else {
    niceFactor = 10;
  }

  const step =
    niceFactor *
    magnitude;

  const maximum =
    Math.ceil(
      maxValue /
      step
    ) *
    step;

  return {
    maximum:
      Math.max(
        maximum,
        step
      ),
    step,
  };
}

function getSeriesLabel(
  series: ChartSeries
): string {
  switch (series) {
    case "successful":
      return "Successful";

    case "pending":
      return "Pending";

    case "overdue":
      return "Overdue";
  }
}

function getSeriesColor(
  series: ChartSeries
): string {
  switch (series) {
    case "successful":
      return "#16a34a";

    case "pending":
      return "#2563eb";

    case "overdue":
      return "#dc2626";
  }
}

function PaymentTrendChart({
  data,
  period,
}: {
  data:
    PaymentTrendPoint[];
  period:
    ChartPeriod;
}) {
  const [
    hoveredPoint,
    setHoveredPoint,
  ] =
    useState<ActiveChartPoint | null>(
      null
    );

  const [
    selectedPoint,
    setSelectedPoint,
  ] =
    useState<ActiveChartPoint | null>(
      null
    );

  useEffect(() => {
    setHoveredPoint(
      null
    );

    setSelectedPoint(
      null
    );
  }, [
    data,
    period,
  ]);

  if (
    data.length ===
    0
  ) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-gray-50">
        <p className="text-sm text-gray-500">
          Payment trend data will appear once payment records are available.
        </p>
      </div>
    );
  }

  const minimumWidth =
    900;

  const pointSpacing =
    period ===
    "monthly"
      ? 100
      : 150;

  const width =
    Math.max(
      minimumWidth,
      150 +
        data.length *
          pointSpacing
    );

  const height =
    420;

  const paddingLeft =
    85;

  const paddingRight =
    35;

  const paddingTop =
    80;

  const paddingBottom =
    75;

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
      0,
      ...data.flatMap(
        (point) => [
          point.successful,
          point.pending,
          point.overdue,
        ]
      )
    );

  const {
    maximum:
      yMaximum,
    step:
      yStep,
  } =
    getYAxisScale(
      maxValue
    );

  const activePoint =
    selectedPoint ??
    hoveredPoint;

  function xForIndex(
    index: number
  ): number {
    if (
      data.length ===
      1
    ) {
      return (
        paddingLeft +
        chartWidth /
          2
      );
    }

    return (
      paddingLeft +
      (index /
        (
          data.length -
          1
        )) *
        chartWidth
    );
  }

  function yForValue(
    value: number
  ): number {
    return (
      paddingTop +
      chartHeight -
      (value /
        yMaximum) *
        chartHeight
    );
  }

  function makePoints(
    field:
      ChartSeries
  ): string {
    return data
      .map(
        (
          point,
          index
        ) =>
          `${xForIndex(
            index
          )},${yForValue(
            point[
              field
            ]
          )}`
      )
      .join(
        " "
      );
  }

  function handlePointClick(
    index: number,
    series:
      ChartSeries
  ): void {
    setSelectedPoint(
      (
        current
      ) => {
        if (
          current?.index ===
            index &&
          current.series ===
            series
        ) {
          return null;
        }

        return {
          index,
          series,
        };
      }
    );
  }

  function renderPoint(
    point:
      PaymentTrendPoint,
    index:
      number,
    series:
      ChartSeries
  ) {
    const value =
      point[
        series
      ];

    const isActive =
      activePoint?.index ===
        index &&
      activePoint.series ===
        series;

    return (
      <circle
        key={`${point.key}-${series}`}
        cx={xForIndex(
          index
        )}
        cy={yForValue(
          value
        )}
        r={
          isActive
            ? 8
            : 5
        }
        fill={getSeriesColor(
          series
        )}
        stroke={
          isActive
            ? "#ffffff"
            : "none"
        }
        strokeWidth={
          isActive
            ? 3
            : 0
        }
        className="cursor-pointer"
        tabIndex={0}
        role="button"
        aria-label={`${point.label}, ${getSeriesLabel(
          series
        )}, ${formatCurrency(
          value
        )}`}
        onMouseEnter={() =>
          setHoveredPoint(
            {
              index,
              series,
            }
          )
        }
        onMouseLeave={() =>
          setHoveredPoint(
            null
          )
        }
        onFocus={() =>
          setHoveredPoint(
            {
              index,
              series,
            }
          )
        }
        onBlur={() =>
          setHoveredPoint(
            null
          )
        }
        onClick={() =>
          handlePointClick(
            index,
            series
          )
        }
      >
        <title>
          {`${point.label}: ${formatCurrency(
            value
          )} ${getSeriesLabel(
            series
          )}`}
        </title>
      </circle>
    );
  }

  const yTicks:
    number[] = [];

  for (
    let value =
      0;
    value <=
    yMaximum;
    value +=
    yStep
  ) {
    yTicks.push(
      value
    );
  }

  let tooltip:
    | {
        x: number;
        y: number;
        label:
          string;
        seriesLabel:
          string;
        amount:
          string;
        color:
          string;
      }
    | null =
    null;

  if (
    activePoint
  ) {
    const point =
      data[
        activePoint.index
      ];

    if (
      point
    ) {
      const value =
        point[
          activePoint.series
        ];

      const pointX =
        xForIndex(
          activePoint.index
        );

      const pointY =
        yForValue(
          value
        );

      const tooltipWidth =
        200;

      const tooltipHeight =
        78;

      let tooltipX =
        pointX -
        tooltipWidth /
          2;

      let tooltipY =
        pointY -
        tooltipHeight -
        18;

      if (
        tooltipX <
        paddingLeft
      ) {
        tooltipX =
          paddingLeft;
      }

      if (
        tooltipX +
          tooltipWidth >
        width -
          paddingRight
      ) {
        tooltipX =
          width -
          paddingRight -
          tooltipWidth;
      }

      if (
        tooltipY <
        8
      ) {
        tooltipY =
          pointY +
          18;
      }

      tooltip = {
        x:
          tooltipX,
        y:
          tooltipY,
        label:
          point.label,
        seriesLabel:
          getSeriesLabel(
            activePoint.series
          ),
        amount:
          formatCurrency(
            value
          ),
        color:
          getSeriesColor(
            activePoint.series
          ),
      };
    }
  }

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 text-xs text-gray-500">
        <span>
          Hover or tap a point to see the exact amount.
        </span>

        {selectedPoint ? (
          <button
            type="button"
            onClick={() =>
              setSelectedPoint(
                null
              )
            }
            className="font-semibold text-teal-700 hover:text-teal-800"
          >
            Clear selected value
          </button>
        ) : null}
      </div>

      <div className="overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          style={{
            minWidth:
              `${Math.min(
                width,
                1600
              )}px`,
          }}
          className="w-full"
          role="img"
        >
          <text
            x="18"
            y={
              height /
              2
            }
            transform={`rotate(-90 18 ${
              height /
              2
            })`}
            textAnchor="middle"
            className="fill-gray-500 text-[12px] font-medium"
          >
            Amount (ZAR)
          </text>

          {yTicks.map(
            (
              tick
            ) => {
              const y =
                yForValue(
                  tick
                );

              return (
                <g
                  key={
                    tick
                  }
                >
                  <line
                    x1={
                      paddingLeft
                    }
                    x2={
                      width -
                      paddingRight
                    }
                    y1={
                      y
                    }
                    y2={
                      y
                    }
                    stroke="currentColor"
                    className="text-gray-200"
                  />

                  <text
                    x={
                      paddingLeft -
                      12
                    }
                    y={
                      y +
                      4
                    }
                    textAnchor="end"
                    className="fill-gray-500 text-[11px]"
                  >
                    {formatChartCurrency(
                      tick
                    )}
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
          />

          <polyline
            points={makePoints(
              "pending"
            )}
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
          />

          <polyline
            points={makePoints(
              "overdue"
            )}
            fill="none"
            stroke="#dc2626"
            strokeWidth="3"
          />

          {data.map(
            (
              point,
              index
            ) => (
              <g
                key={
                  point.key
                }
              >
                {renderPoint(
                  point,
                  index,
                  "successful"
                )}

                {renderPoint(
                  point,
                  index,
                  "pending"
                )}

                {renderPoint(
                  point,
                  index,
                  "overdue"
                )}

                <text
                  x={xForIndex(
                    index
                  )}
                  y={
                    height -
                    32
                  }
                  textAnchor="middle"
                  className="fill-gray-500 text-[11px]"
                >
                  {
                    point.label
                  }
                </text>
              </g>
            )
          )}

          {tooltip ? (
            <g pointerEvents="none">
              <rect
                x={
                  tooltip.x
                }
                y={
                  tooltip.y
                }
                width="200"
                height="78"
                rx="10"
                fill="#ffffff"
                stroke="#e5e7eb"
              />

              <rect
                x={
                  tooltip.x
                }
                y={
                  tooltip.y
                }
                width="5"
                height="78"
                rx="3"
                fill={
                  tooltip.color
                }
              />

              <text
                x={
                  tooltip.x +
                  16
                }
                y={
                  tooltip.y +
                  22
                }
                className="fill-gray-500 text-[11px]"
              >
                {
                  tooltip.label
                }
              </text>

              <text
                x={
                  tooltip.x +
                  16
                }
                y={
                  tooltip.y +
                  43
                }
                className="fill-gray-700 text-[11px]"
              >
                {
                  tooltip.seriesLabel
                }
              </text>

              <text
                x={
                  tooltip.x +
                  16
                }
                y={
                  tooltip.y +
                  65
                }
                className="fill-gray-900 text-[14px] font-bold"
              >
                {
                  tooltip.amount
                }
              </text>
            </g>
          ) : null}
        </svg>
      </div>
    </div>
  );
}

export default function ClientPaymentsPage() {
  const [
    payments,
    setPayments,
  ] =
    useState<Payment[]>(
      []
    );

  const [
    selectedPolicyId,
    setSelectedPolicyId,
  ] =
    useState(
      "all"
    );

  const [
    paymentFilter,
    setPaymentFilter,
  ] =
    useState<PaymentFilter>(
      "all"
    );

  const [
    chartPeriod,
    setChartPeriod,
  ] =
    useState<ChartPeriod>(
      "monthly"
    );

  const [
    chartRange,
    setChartRange,
  ] =
    useState<ChartRange>(
      "12m"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(
      true
    );

  const [
    refreshing,
    setRefreshing,
  ] =
    useState(
      false
    );

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
    refresh =
      false
  ): Promise<void> {
    try {
      if (
        refresh
      ) {
        setRefreshing(
          true
        );
      } else {
        setLoading(
          true
        );
      }

      setError("");

      const token =
        getToken();

      if (
        !token
      ) {
        throw new Error(
          "You are not logged in."
        );
      }

      const response =
        await fetch(
          `${API_URL}/Payment`,
          {
            method:
              "GET",

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
            () =>
              null
          );

      if (
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            data ||
            `Unable to load payments (${response.status}).`
        );
      }

      setPayments(
        Array.isArray(
          data
        )
          ? data
          : []
      );
    } catch (
      err
    ) {
      console.error(
        "[CLIENT PAYMENTS] ERROR:",
        err
      );

      setPayments(
        []
      );

      setError(
        err instanceof
          Error
          ? err.message
          : "Unable to load payments."
      );
    } finally {
      setLoading(
        false
      );

      setRefreshing(
        false
      );
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

      return {
        successfulCount:
          successful.length,

        overdueCount:
          overdue.length,

        pendingCount:
          pending.length,

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

  const chartData =
    useMemo(
      () =>
        buildPaymentTrendData(
          policyPayments,
          chartPeriod,
          chartRange
        ),
      [
        policyPayments,
        chartPeriod,
        chartRange,
      ]
    );

  const filteredPayments =
    useMemo(() => {
      let result =
        policyPayments.filter(
          (
            payment
          ) =>
            !isFailed(
              payment
            )
        );

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

  const chartRangeLabel =
    chartRange ===
    "6m"
      ? "Last 6 Months"
      : chartRange ===
          "12m"
        ? "Last 12 Months"
        : "All";

  const chartTitle =
    chartPeriod ===
    "monthly"
      ? "Monthly Payment Overview"
      : "Yearly Payment Overview";

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-teal-700 to-emerald-600 p-8 text-white shadow-sm">
        <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-100">
              LegacyCare Client Portal
            </p>

            <h1 className="mt-3 text-3xl font-bold">
              Payments
            </h1>

            <p className="mt-3 max-w-2xl text-sm leading-6 text-teal-50">
              Track your premiums, successful payments and outstanding balances.
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
            className="w-fit rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white shadow-sm backdrop-blur-sm transition hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {refreshing
              ? "Refreshing..."
              : "↻ Refresh"}
          </button>
        </div>
      </section>

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
            onChange={(
              event
            ) => {
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
          <div className="rounded-2xl border border-green-200 bg-white p-5 shadow-sm">
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

          <div className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-gray-500">
              Pending
            </p>

            <p className="mt-2 text-xl font-semibold text-blue-700">
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
          {[
            0,
            1,
            2,
          ].map(
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
            {
              error
            }
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
            <div className="flex flex-col gap-5">
              <div className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    {
                      chartTitle
                    }
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    See how successful, pending and overdue payment amounts change over time.
                  </p>
                </div>

                <div className="flex flex-wrap gap-4 text-xs font-semibold">
                  <span className="text-green-600">
                    ● Successful
                  </span>

                  <span className="text-blue-600">
                    ● Pending
                  </span>

                  <span className="text-red-700">
                    ● Overdue
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-4 border-t border-gray-100 pt-4 lg:flex-row lg:items-end lg:justify-between">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Group by
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        "monthly",
                        "yearly",
                      ] as ChartPeriod[]
                    ).map(
                      (
                        period
                      ) => (
                        <button
                          key={
                            period
                          }
                          type="button"
                          onClick={() =>
                            setChartPeriod(
                              period
                            )
                          }
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold capitalize transition ${
                            chartPeriod ===
                            period
                              ? "border-teal-600 bg-teal-600 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-teal-400"
                          }`}
                        >
                          {
                            period
                          }
                        </button>
                      )
                    )}
                  </div>
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                    Time range
                  </p>

                  <div className="flex flex-wrap gap-2">
                    {(
                      [
                        {
                          value:
                            "6m",
                          label:
                            "Last 6 Months",
                        },
                        {
                          value:
                            "12m",
                          label:
                            "Last 12 Months",
                        },
                        {
                          value:
                            "all",
                          label:
                            "All",
                        },
                      ] as {
                        value:
                          ChartRange;
                        label:
                          string;
                      }[]
                    ).map(
                      (
                        option
                      ) => (
                        <button
                          key={
                            option.value
                          }
                          type="button"
                          onClick={() =>
                            setChartRange(
                              option.value
                            )
                          }
                          className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                            chartRange ===
                            option.value
                              ? "border-gray-900 bg-gray-900 text-white"
                              : "border-gray-300 bg-white text-gray-700 hover:border-gray-500"
                          }`}
                        >
                          {
                            option.label
                          }
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 px-4 py-3 text-xs text-gray-600">
                <span>
                  Viewing{" "}
                  <strong className="text-gray-900">
                    {chartPeriod ===
                    "monthly"
                      ? "monthly"
                      : "yearly"}
                  </strong>{" "}
                  payment amounts
                </span>

                <span>
                  Range:{" "}
                  <strong className="text-gray-900">
                    {
                      chartRangeLabel
                    }
                  </strong>
                </span>
              </div>
            </div>

            <div className="mt-6">
              <PaymentTrendChart
                data={
                  chartData
                }
                period={
                  chartPeriod
                }
              />
            </div>
          </section>

          <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
            <div className="border-b border-gray-200 p-6">
              <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-center">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">
                    Payment History
                  </h2>

                  <p className="mt-1 text-sm text-gray-500">
                    Review successful, pending and overdue premium records.
                  </p>
                </div>

                <span className="text-sm text-gray-500">
                  {
                    filteredPayments.length
                  }{" "}
                  {filteredPayments.length ===
                  1
                    ? "record"
                    : "records"}
                </span>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    "all",
                    "successful",
                    "pending",
                    "overdue",
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
                      className={`rounded-full border px-4 py-2 text-xs font-semibold capitalize transition ${
                        paymentFilter ===
                        filter
                          ? "border-teal-600 bg-teal-600 text-white"
                          : "border-gray-300 bg-white text-gray-600 hover:border-teal-400"
                      }`}
                    >
                      {
                        filter
                      }
                    </button>
                  )
                )}
              </div>
            </div>

            {filteredPayments.length ===
            0 ? (
              <div className="p-10 text-center">
                <h3 className="font-semibold text-gray-900">
                  No matching payments
                </h3>

                <p className="mt-2 text-sm text-gray-500">
                  There are no payment records matching this filter.
                </p>
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
                            {getPolicyDisplay(
                              payment
                            )}
                          </p>
                        </div>

                        <p
                          className={`text-xl font-semibold ${
                            isSuccessful(
                              payment
                            )
                              ? "text-green-700"
                              : isOverdue(
                                    payment
                                  )
                                ? "text-red-700"
                                : "text-blue-700"
                          }`}
                        >
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
                            Payment Reference
                          </p>

                          <p
                            className="mt-1 text-sm font-medium text-gray-900"
                            title={
                              payment.paymentId
                            }
                          >
                            {getPaymentReference(
                              payment.paymentId
                            )}
                          </p>
                        </div>
                      </div>

                      {isOverdue(
                        payment
                      ) ? (
                        <div className="mt-4 rounded-lg border border-red-100 bg-red-50 px-4 py-3">
                          <p className="text-xs font-medium text-red-700">
                            This premium is overdue. You can pay it now or submit a payment enquiry if you need assistance.
                          </p>
                        </div>
                      ) : null}

                      <div className="mt-5 flex flex-wrap justify-end gap-3 border-t border-gray-100 pt-4">
                        {canPay(
                          payment
                        ) ? (
                          <Link
                            href={`/client/payments/pay/${encodeURIComponent(
                              payment.paymentId
                            )}`}
                            className="rounded-lg bg-teal-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
                          >
                            Pay Now
                          </Link>
                        ) : null}

                        {isSuccessful(
                          payment
                        ) ? (
                          <Link
                            href={`/client/payments/invoice/${encodeURIComponent(
                              payment.paymentId
                            )}`}
                            className="rounded-lg border border-green-300 bg-green-50 px-4 py-2 text-xs font-semibold text-green-700 transition hover:bg-green-100"
                          >
                            Download Invoice
                          </Link>
                        ) : null}

                        <Link
                          href="/client/service-requests/payment"
                          className="rounded-lg border border-teal-300 px-4 py-2 text-xs font-semibold text-teal-700 transition hover:bg-teal-50"
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