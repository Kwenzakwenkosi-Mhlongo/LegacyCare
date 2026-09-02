// File:
// Web/legacycare_website/app/(dashboard)/client/reports/policies/page.tsx

"use client";

import { jsPDF } from "jspdf";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getToken } from "@/lib/auth";

const POLICY_API_URL = (
  process.env.NEXT_PUBLIC_API_URL ||
  "https://legacycare-api-2026-dackfxd3g9e0f8hw.southafricanorth-01.azurewebsites.net/api"
)
  .trim()
  .replace(/^["']|["']$/g, "")
  .replace(/;$/, "")
  .replace(/\/+$/, "");

type ClientReportDetails = {
  clientId: string;
  displayClientId: string;
  fullName: string;
  email: string;
  cellNo: string;
  address: string;
};

type Beneficiary = {
  beneficiaryId?: string | number | null;
  fullName?: string | null;
  name?: string | null;
  relationship?: string | number | null;
  status?: string | number | null;
};

type Package = {
  packageId?: string | null;
  name?: string | null;
  packageName?: string | null;
  monthlyPremium?: number | null;
};

type Branch = {
  branchId?: string | null;
  branchName?: string | null;
  name?: string | null;
};

type Policy = {
  policyId: string;
  policyNumber?: string | null;

  status?: string | number | null;
  policyStatus?: string | number | null;

  startDate?: string | null;
  endDate?: string | null;

  monthlyPremium?: number | null;

  package?: Package | null;
  packageName?: string | null;

  branch?: Branch | null;
  branchName?: string | null;

  beneficiaries?: Beneficiary[] | null;
};

function formatPolicyDate(
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
      month: "long",
      year: "numeric",
    }
  );
}

function formatPolicyCurrency(
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

function getPolicyNumber(
  policy: Policy
): string {
  return (
    policy.policyNumber ||
    policy.policyId
  );
}

function getPackageName(
  policy: Policy
): string {
  return (
    policy.package?.name ||
    policy.package?.packageName ||
    policy.packageName ||
    "Not available"
  );
}

function getMonthlyPremium(
  policy: Policy
): number | null {
  const value =
    policy.monthlyPremium ??
    policy.package?.monthlyPremium;

  if (
    value === null ||
    value === undefined
  ) {
    return null;
  }

  return Number(value);
}

function getPolicyStatus(
  policy: Policy
): string {
  return String(
    policy.status ??
      policy.policyStatus ??
      "Not available"
  );
}

function getBranchName(
  policy: Policy
): string {
  return (
    policy.branch?.branchName ||
    policy.branch?.name ||
    policy.branchName ||
    "Not available"
  );
}

function getBeneficiaryCount(
  policy: Policy
): number {
  return Array.isArray(
    policy.beneficiaries
  )
    ? policy.beneficiaries.length
    : 0;
}

function getErrorMessage(
  data: unknown,
  fallback: string
): string {
  if (typeof data === "string") {
    return data;
  }

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

  return fallback;
}

export default function PolicySummaryReportPage() {
  const [
    policies,
    setPolicies,
  ] =
    useState<Policy[]>([]);

  const [
    clientDetails,
    setClientDetails,
  ] =
    useState<ClientReportDetails | null>(
      null
    );

  const [
    selectedPolicyId,
    setSelectedPolicyId,
  ] =
    useState("all");

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    downloading,
    setDownloading,
  ] =
    useState(false);

  const [
    error,
    setError,
  ] =
    useState("");

  useEffect(() => {
    document.title =
      "Policy Summary Report | LegacyCare";
  }, []);

  useEffect(() => {
    async function loadReportData(): Promise<void> {
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
          policyResponse,
          clientResponse,
        ] =
          await Promise.all([
            fetch(
              `${POLICY_API_URL}/Policy/client`,
              {
                method: "GET",
                headers,
                cache:
                  "no-store",
              }
            ),
            fetch(
              `${POLICY_API_URL}/Client/me/report-details`,
              {
                method: "GET",
                headers,
                cache:
                  "no-store",
              }
            ),
          ]);

        const [
          policyData,
          clientData,
        ] =
          await Promise.all([
            policyResponse
              .json()
              .catch(
                () => null
              ),
            clientResponse
              .json()
              .catch(
                () => null
              ),
          ]);

        if (!policyResponse.ok) {
          throw new Error(
            getErrorMessage(
              policyData,
              `Unable to load policies (${policyResponse.status}).`
            )
          );
        }

        if (!clientResponse.ok) {
          throw new Error(
            getErrorMessage(
              clientData,
              `Unable to load client details (${clientResponse.status}).`
            )
          );
        }

        setPolicies(
          Array.isArray(
            policyData
          )
            ? policyData
            : []
        );

        setClientDetails(
          clientData as ClientReportDetails
        );
      } catch (err) {
        console.error(
          "[POLICY REPORT] ERROR:",
          err
        );

        setPolicies([]);
        setClientDetails(
          null
        );

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load policy report."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReportData();
  }, []);

  const reportPolicies =
    useMemo(
      () =>
        selectedPolicyId ===
        "all"
          ? policies
          : policies.filter(
              (policy) =>
                policy.policyId ===
                selectedPolicyId
            ),
      [
        policies,
        selectedPolicyId,
      ]
    );

  function downloadPolicyReport(): void {
    if (!clientDetails) {
      setError(
        "Client details are not available."
      );

      return;
    }

    if (
      reportPolicies.length ===
      0
    ) {
      setError(
        "There are no policies to download."
      );

      return;
    }

    const reportClient =
      clientDetails;

    try {
      setDownloading(true);
      setError("");

      const pdf =
        new jsPDF({
          orientation:
            "portrait",
          unit: "mm",
          format: "a4",
        });

      const pageWidth =
        pdf.internal.pageSize
          .getWidth();

      const pageHeight =
        pdf.internal.pageSize
          .getHeight();

      const left = 18;
      const right =
        pageWidth - 18;

      function drawHeader(): number {
        pdf.setFillColor(
          15,
          118,
          110
        );

        pdf.rect(
          0,
          0,
          pageWidth,
          35,
          "F"
        );

        pdf.setTextColor(
          255,
          255,
          255
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          20
        );

        pdf.text(
          "LegacyCare Policy Summary",
          left,
          16
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          8.5
        );

        pdf.text(
          `Generated: ${new Date().toLocaleString(
            "en-ZA"
          )}`,
          left,
          25
        );

        pdf.setFillColor(
          248,
          250,
          252
        );

        pdf.roundedRect(
          left,
          42,
          right - left,
          42,
          3,
          3,
          "F"
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          9
        );

        pdf.setTextColor(
          15,
          118,
          110
        );

        pdf.text(
          "CLIENT DETAILS",
          left + 6,
          51
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          7.5
        );

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "Name",
          left + 6,
          60
        );

        pdf.text(
          "Client ID",
          78,
          60
        );

        pdf.text(
          "Email",
          128,
          60
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          reportClient.fullName ||
            "Not available",
          left + 6,
          67
        );

        pdf.text(
          reportClient.displayClientId ||
            reportClient.clientId ||
            "Not available",
          78,
          67
        );

        pdf.text(
          (
            reportClient.email ||
            "Not available"
          ).slice(
            0,
            34
          ),
          128,
          67
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "Contact",
          left + 6,
          76
        );

        pdf.text(
          "Address",
          78,
          76
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          reportClient.cellNo ||
            "Not available",
          left + 6,
          82
        );

        pdf.text(
          (
            reportClient.address ||
            "Not available"
          ).slice(
            0,
            55
          ),
          78,
          82
        );

        return 95;
      }

      let y =
        drawHeader();

      for (
        const policy
        of reportPolicies
      ) {
        if (
          y >
          pageHeight -
            80
        ) {
          pdf.addPage();

          y =
            drawHeader();
        }

        pdf.setFillColor(
          248,
          250,
          252
        );

        pdf.roundedRect(
          left,
          y,
          right - left,
          66,
          3,
          3,
          "F"
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(
          12
        );

        pdf.setTextColor(
          15,
          118,
          110
        );

        pdf.text(
          getPolicyNumber(
            policy
          ),
          left + 6,
          y + 10
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(
          8
        );

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "Package",
          left + 6,
          y + 20
        );

        pdf.text(
          "Status",
          82,
          y + 20
        );

        pdf.text(
          "Monthly Premium",
          138,
          y + 20
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          getPackageName(
            policy
          ),
          left + 6,
          y + 27
        );

        pdf.text(
          getPolicyStatus(
            policy
          ),
          82,
          y + 27
        );

        pdf.text(
          formatPolicyCurrency(
            getMonthlyPremium(
              policy
            )
          ),
          138,
          y + 27
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "Start Date",
          left + 6,
          y + 38
        );

        pdf.text(
          "End Date",
          82,
          y + 38
        );

        pdf.text(
          "Branch",
          138,
          y + 38
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          formatPolicyDate(
            policy.startDate
          ),
          left + 6,
          y + 45
        );

        pdf.text(
          formatPolicyDate(
            policy.endDate
          ),
          82,
          y + 45
        );

        pdf.text(
          getBranchName(
            policy
          ).slice(
            0,
            28
          ),
          138,
          y + 45
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "Beneficiaries",
          left + 6,
          y + 56
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          String(
            getBeneficiaryCount(
              policy
            )
          ),
          left + 6,
          y + 63
        );

        y += 76;
      }

      pdf.setFont(
        "helvetica",
        "normal"
      );

      pdf.setFontSize(
        7
      );

      pdf.setTextColor(
        100,
        116,
        139
      );

      pdf.text(
        "This report reflects the policy information currently available in LegacyCare.",
        pageWidth / 2,
        pageHeight - 8,
        {
          align:
            "center",
        }
      );

      pdf.save(
        `LegacyCare-Policy-Summary-${new Date()
          .toISOString()
          .slice(
            0,
            10
          )}.pdf`
      );
    } catch (err) {
      console.error(
        "[POLICY REPORT PDF] ERROR:",
        err
      );

      setError(
        "Unable to generate the policy summary PDF."
      );
    } finally {
      setDownloading(
        false
      );
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/client/reports"
            className="text-sm font-semibold text-teal-700"
          >
            ← Reports
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Policy Summary Report
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            View and download important details for your LegacyCare policies.
          </p>
        </div>

        <button
          type="button"
          onClick={
            downloadPolicyReport
          }
          disabled={
            loading ||
            downloading ||
            !clientDetails ||
            reportPolicies.length ===
              0
          }
          className="w-fit rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading
            ? "Creating PDF..."
            : "Download Policy PDF"}
        </button>
      </div>

      {error ? (
        <section className="rounded-xl border border-red-200 bg-red-50 p-4">
          <p className="text-sm text-red-700">
            {error}
          </p>
        </section>
      ) : null}

      {loading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-white shadow-sm" />
      ) : null}

      {!loading &&
      !error &&
      clientDetails ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <h2 className="text-sm font-bold uppercase tracking-wide text-teal-700">
            Client Details
          </h2>

          <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Full Name
              </dt>

              <dd className="mt-1 font-semibold text-gray-900">
                {
                  clientDetails.fullName
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Client ID
              </dt>

              <dd className="mt-1 font-semibold text-gray-900">
                {
                  clientDetails.displayClientId ||
                  clientDetails.clientId
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </dt>

              <dd className="mt-1 break-all font-medium text-gray-900">
                {
                  clientDetails.email
                }
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Contact
              </dt>

              <dd className="mt-1 font-medium text-gray-900">
                {
                  clientDetails.cellNo
                }
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Address
              </dt>

              <dd className="mt-1 font-medium text-gray-900">
                {
                  clientDetails.address
                }
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {!loading &&
      !error ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            Policy
          </label>

          <select
            value={
              selectedPolicyId
            }
            onChange={(
              event
            ) =>
              setSelectedPolicyId(
                event.target.value
              )
            }
            className="mt-2 w-full max-w-lg rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm"
          >
            <option value="all">
              All Policies
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
                  {getPolicyNumber(
                    policy
                  )}
                  {" • "}
                  {getPackageName(
                    policy
                  )}
                </option>
              )
            )}
          </select>
        </section>
      ) : null}

      {!loading &&
      !error &&
      reportPolicies.length ===
        0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No policy information is available.
          </p>
        </section>
      ) : null}

      {!loading &&
      !error &&
      reportPolicies.length >
        0 ? (
        <div className="space-y-5">
          {reportPolicies.map(
            (policy) => (
              <section
                key={
                  policy.policyId
                }
                className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <div className="flex flex-col justify-between gap-3 border-b border-gray-100 pb-5 sm:flex-row sm:items-center">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900">
                      {getPolicyNumber(
                        policy
                      )}
                    </h2>

                    <p className="mt-1 text-sm text-gray-500">
                      {getPackageName(
                        policy
                      )}
                    </p>
                  </div>

                  <span className="w-fit rounded-full bg-green-100 px-3 py-1.5 text-xs font-semibold text-green-700">
                    {getPolicyStatus(
                      policy
                    )}
                  </span>
                </div>

                <dl className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      Monthly Premium
                    </dt>

                    <dd className="mt-1 font-semibold text-gray-900">
                      {formatPolicyCurrency(
                        getMonthlyPremium(
                          policy
                        )
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      Start Date
                    </dt>

                    <dd className="mt-1 font-semibold text-gray-900">
                      {formatPolicyDate(
                        policy.startDate
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      End Date
                    </dt>

                    <dd className="mt-1 font-semibold text-gray-900">
                      {formatPolicyDate(
                        policy.endDate
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      Branch
                    </dt>

                    <dd className="mt-1 font-semibold text-gray-900">
                      {getBranchName(
                        policy
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      Beneficiaries
                    </dt>

                    <dd className="mt-1 font-semibold text-gray-900">
                      {getBeneficiaryCount(
                        policy
                      )}
                    </dd>
                  </div>

                  <div>
                    <dt className="text-xs uppercase tracking-wide text-gray-500">
                      Policy ID
                    </dt>

                    <dd
                      className="mt-1 truncate font-mono text-sm text-gray-700"
                      title={
                        policy.policyId
                      }
                    >
                      {
                        policy.policyId
                      }
                    </dd>
                  </div>
                </dl>
              </section>
            )
          )}
        </div>
      ) : null}
    </div>
  );
}