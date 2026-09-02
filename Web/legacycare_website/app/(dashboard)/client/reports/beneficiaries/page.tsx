// File:
// Web/legacycare_website/app/(dashboard)/client/reports/
// beneficiaries/page.tsx

"use client";

import { jsPDF } from "jspdf";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { getToken } from "@/lib/auth";

const BENEFICIARY_API_URL = (
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

type Policy = {
  policyId: string | number;
  policyNumber?: string | null;
  package?: {
    name?: string | null;
    packageName?: string | null;
  } | null;
};

type Beneficiary = {
  beneficiaryId: string | number;

  firstName?: string | null;
  lastName?: string | null;
  fullName?: string | null;
  name?: string | null;

  relationship?: string | number | null;
  relationshipType?: string | number | null;

  status?: string | number | null;

  dateOfBirth?: string | null;
  birthDate?: string | null;

  policyId?: string | number | null;
};

type BeneficiaryReportRow = {
  beneficiary: Beneficiary;
  policy: Policy;
};

function beneficiaryName(
  beneficiary: Beneficiary
): string {
  if (beneficiary.fullName?.trim()) {
    return beneficiary.fullName.trim();
  }

  if (beneficiary.name?.trim()) {
    return beneficiary.name.trim();
  }

  const name = `${beneficiary.firstName ?? ""} ${
    beneficiary.lastName ?? ""
  }`.trim();

  return name || "Not available";
}

function getPolicyNumber(
  policy: Policy
): string {
  return (
    policy.policyNumber ||
    String(policy.policyId)
  );
}

function getPackageName(
  policy: Policy
): string {
  return (
    policy.package?.name ||
    policy.package?.packageName ||
    "Not available"
  );
}

function getRelationship(
  beneficiary: Beneficiary
): string {
  return String(
    beneficiary.relationship ??
      beneficiary.relationshipType ??
      "Not available"
  );
}

function getStatus(
  beneficiary: Beneficiary
): string {
  return String(
    beneficiary.status ??
      "Not available"
  );
}

function formatBeneficiaryDate(
  value?: string | null
): string {
  if (!value) {
    return "Not available";
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

function getBirthDate(
  beneficiary: Beneficiary
): string {
  return formatBeneficiaryDate(
    beneficiary.dateOfBirth ??
      beneficiary.birthDate
  );
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

export default function BeneficiaryReportPage() {
  const [
    policies,
    setPolicies,
  ] = useState<Policy[]>([]);

  const [
    reportRows,
    setReportRows,
  ] = useState<BeneficiaryReportRow[]>([]);

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
  ] = useState("all");

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    downloading,
    setDownloading,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  useEffect(() => {
    document.title =
      "Beneficiary Report | LegacyCare";
  }, []);

  useEffect(() => {
    async function loadReport(): Promise<void> {
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
          policyResponse,
          clientResponse,
        ] =
          await Promise.all([
            fetch(
              `${BENEFICIARY_API_URL}/Policy/client`,
              {
                method: "GET",
                headers,
                cache: "no-store",
              }
            ),
            fetch(
              `${BENEFICIARY_API_URL}/Client/me/report-details`,
              {
                method: "GET",
                headers,
                cache: "no-store",
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
              .catch(() => null),
            clientResponse
              .json()
              .catch(() => null),
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

        const loadedPolicies: Policy[] =
          Array.isArray(policyData)
            ? policyData
            : [];

        setPolicies(
          loadedPolicies
        );

        setClientDetails(
          clientData as ClientReportDetails
        );

        const rows: BeneficiaryReportRow[] =
          [];

        for (const policy of loadedPolicies) {
          const policyId =
            String(
              policy.policyId
            );

          const beneficiaryResponse =
            await fetch(
              `${BENEFICIARY_API_URL}/Beneficiary/policy/${encodeURIComponent(
                policyId
              )}`,
              {
                method: "GET",
                headers,
                cache: "no-store",
              }
            );

          const beneficiaryData =
            await beneficiaryResponse
              .json()
              .catch(() => null);

          if (!beneficiaryResponse.ok) {
            console.warn(
              `[BENEFICIARY REPORT] Unable to load policy ${policyId}:`,
              beneficiaryData
            );

            continue;
          }

          if (
            Array.isArray(
              beneficiaryData
            )
          ) {
            for (
              const beneficiary
              of beneficiaryData
            ) {
              rows.push({
                beneficiary:
                  beneficiary as Beneficiary,
                policy,
              });
            }
          }
        }

        setReportRows(rows);
      } catch (err) {
        console.error(
          "[BENEFICIARY REPORT] ERROR:",
          err
        );

        setPolicies([]);
        setReportRows([]);
        setClientDetails(null);

        setError(
          err instanceof Error
            ? err.message
            : "Unable to load beneficiary report."
        );
      } finally {
        setLoading(false);
      }
    }

    void loadReport();
  }, []);

  const filteredRows =
    useMemo(
      () =>
        selectedPolicyId ===
        "all"
          ? reportRows
          : reportRows.filter(
              (row) =>
                String(
                  row.policy.policyId
                ) ===
                selectedPolicyId
            ),
      [
        reportRows,
        selectedPolicyId,
      ]
    );

  function downloadPdf(): void {
    if (!clientDetails) {
      setError(
        "Client details are not available."
      );

      return;
    }

    if (
      filteredRows.length ===
      0
    ) {
      setError(
        "There are no beneficiary records to download."
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
            "landscape",
          unit: "mm",
          format: "a4",
        });

      const pageWidth =
        pdf.internal.pageSize
          .getWidth();

      const pageHeight =
        pdf.internal.pageSize
          .getHeight();

      const left = 14;
      const right =
        pageWidth - 14;

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
          32,
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

        pdf.setFontSize(20);

        pdf.text(
          "LegacyCare Beneficiary Report",
          left,
          15
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8);

        pdf.text(
          `Generated: ${new Date().toLocaleString(
            "en-ZA"
          )}`,
          left,
          23
        );

        pdf.setFillColor(
          248,
          250,
          252
        );

        pdf.roundedRect(
          left,
          39,
          right - left,
          29,
          3,
          3,
          "F"
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
          15,
          118,
          110
        );

        pdf.text(
          "CLIENT DETAILS",
          19,
          47
        );

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(7);

        pdf.setTextColor(
          107,
          114,
          128
        );

        pdf.text(
          "Name",
          19,
          55
        );

        pdf.text(
          "Client ID",
          72,
          55
        );

        pdf.text(
          "Email",
          112,
          55
        );

        pdf.text(
          "Contact",
          180,
          55
        );

        pdf.text(
          "Address",
          222,
          55
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
          19,
          62
        );

        pdf.text(
          reportClient.displayClientId ||
            reportClient.clientId ||
            "Not available",
          72,
          62
        );

        pdf.text(
          (
            reportClient.email ||
            "Not available"
          ).slice(0, 30),
          112,
          62
        );

        pdf.text(
          reportClient.cellNo ||
            "Not available",
          180,
          62
        );

        pdf.text(
          (
            reportClient.address ||
            "Not available"
          ).slice(0, 34),
          222,
          62
        );

        pdf.setFillColor(
          241,
          245,
          249
        );

        pdf.rect(
          left,
          76,
          right - left,
          11,
          "F"
        );

        pdf.setTextColor(
          71,
          85,
          105
        );

        pdf.setFont(
          "helvetica",
          "bold"
        );

        pdf.setFontSize(8);

        pdf.text(
          "Policy",
          17,
          83
        );

        pdf.text(
          "Package",
          57,
          83
        );

        pdf.text(
          "Beneficiary",
          102,
          83
        );

        pdf.text(
          "Relationship",
          166,
          83
        );

        pdf.text(
          "Date of Birth",
          215,
          83
        );

        pdf.text(
          "Status",
          258,
          83
        );

        return 96;
      }

      let y =
        drawHeader();

      for (
        const row
        of filteredRows
      ) {
        if (
          y >
          pageHeight - 15
        ) {
          pdf.addPage();

          y =
            drawHeader();
        }

        pdf.setFont(
          "helvetica",
          "normal"
        );

        pdf.setFontSize(8);

        pdf.setTextColor(
          31,
          41,
          55
        );

        pdf.text(
          getPolicyNumber(
            row.policy
          ).slice(0, 20),
          17,
          y
        );

        pdf.text(
          getPackageName(
            row.policy
          ).slice(0, 22),
          57,
          y
        );

        pdf.text(
          beneficiaryName(
            row.beneficiary
          ).slice(0, 30),
          102,
          y
        );

        pdf.text(
          getRelationship(
            row.beneficiary
          ).slice(0, 20),
          166,
          y
        );

        pdf.text(
          getBirthDate(
            row.beneficiary
          ),
          215,
          y
        );

        pdf.text(
          getStatus(
            row.beneficiary
          ).slice(0, 18),
          258,
          y
        );

        pdf.setDrawColor(
          226,
          232,
          240
        );

        pdf.line(
          left,
          y + 4,
          right,
          y + 4
        );

        y += 11;
      }

      pdf.setFontSize(7);

      pdf.setTextColor(
        100,
        116,
        139
      );

      pdf.text(
        "This report reflects beneficiary information currently recorded against the selected LegacyCare policies.",
        pageWidth / 2,
        pageHeight - 6,
        {
          align: "center",
        }
      );

      pdf.save(
        `LegacyCare-Beneficiary-Report-${new Date()
          .toISOString()
          .slice(0, 10)}.pdf`
      );
    } catch (err) {
      console.error(
        "[BENEFICIARY PDF] ERROR:",
        err
      );

      setError(
        "Unable to generate the beneficiary PDF."
      );
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <Link
            href="/client/reports"
            className="text-sm font-semibold text-teal-700 hover:text-teal-800"
          >
            ← Reports
          </Link>

          <h1 className="mt-3 text-2xl font-bold text-gray-900">
            Beneficiary Report
          </h1>

          <p className="mt-1 text-sm text-gray-500">
            Beneficiaries currently recorded against your policies.
          </p>
        </div>

        <button
          type="button"
          onClick={downloadPdf}
          disabled={
            loading ||
            downloading ||
            !clientDetails ||
            filteredRows.length === 0
          }
          className="w-fit rounded-lg bg-teal-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {downloading
            ? "Creating PDF..."
            : "Download Beneficiary PDF"}
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
                {clientDetails.fullName}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Client ID
              </dt>

              <dd className="mt-1 font-semibold text-gray-900">
                {clientDetails.displayClientId ||
                  clientDetails.clientId}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Email
              </dt>

              <dd className="mt-1 break-all font-medium text-gray-900">
                {clientDetails.email}
              </dd>
            </div>

            <div>
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Contact
              </dt>

              <dd className="mt-1 font-medium text-gray-900">
                {clientDetails.cellNo}
              </dd>
            </div>

            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-gray-500">
                Address
              </dt>

              <dd className="mt-1 font-medium text-gray-900">
                {clientDetails.address}
              </dd>
            </div>
          </dl>
        </section>
      ) : null}

      {!loading &&
      !error ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <label
            htmlFor="beneficiaryPolicy"
            className="text-xs font-semibold uppercase tracking-wide text-gray-500"
          >
            Policy
          </label>

          <select
            id="beneficiaryPolicy"
            value={selectedPolicyId}
            onChange={(event) =>
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
                  key={String(
                    policy.policyId
                  )}
                  value={String(
                    policy.policyId
                  )}
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
      filteredRows.length === 0 ? (
        <section className="rounded-2xl border border-gray-200 bg-white p-10 text-center shadow-sm">
          <p className="text-sm text-gray-500">
            No beneficiaries were found for this selection.
          </p>
        </section>
      ) : null}

      {!loading &&
      !error &&
      filteredRows.length > 0 ? (
        <section className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 text-sm">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Policy
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Package
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Beneficiary
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Relationship
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Date of Birth
                  </th>

                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase text-gray-500">
                    Status
                  </th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {filteredRows.map(
                  (row) => (
                    <tr
                      key={`${row.policy.policyId}-${row.beneficiary.beneficiaryId}`}
                    >
                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-900">
                        {getPolicyNumber(
                          row.policy
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {getPackageName(
                          row.policy
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-medium text-gray-900">
                        {beneficiaryName(
                          row.beneficiary
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {getRelationship(
                          row.beneficiary
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 text-gray-700">
                        {getBirthDate(
                          row.beneficiary
                        )}
                      </td>

                      <td className="whitespace-nowrap px-4 py-3 font-semibold text-gray-700">
                        {getStatus(
                          row.beneficiary
                        )}
                      </td>
                    </tr>
                  )
                )}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}
    </div>
  );
}