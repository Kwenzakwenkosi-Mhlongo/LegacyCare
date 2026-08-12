"use client";

import { useState } from "react";

import {
  CalenderIcon,
  FileIcon,
  TaskIcon,
  UserIcon,
} from "@/icons";

import InfoRow from "@/components/reusables/InfoRow";

import type {
  BeneficiaryResponse,
  PolicyResponse,
} from "@/types/policy";

interface PolicyDetailsProps {
  policy: PolicyResponse;
}

const policyStatusLabels: Record<string, string> = {
  "Active": "Active",
  "Inactive": "Inactive",
  "Discontinued": "Discontinued",
  "Pending": "Pending",
  "Lapsed": "Lapsed",
  "Cancelled": "Cancelled",
  "Expired": "Expired",
};

const beneficiaryStatusLabels: Record<string, string> = {
  "Active": "Alive",
  "Alive": "Alive",
  "Deceased": "Deceased",
  "Removed": "Removed",
};

function formatDate(date?: string | null) {
  if (!date) {
    return "N/A";
  }
  return new Date(date).toLocaleDateString("en-ZA");
}

function getStatusColor(status: string) {
  switch (status) {
    case "Active":
      return "bg-green-100 text-green-700";
    case "Inactive":
    case "Discontinued":
    case "Cancelled":
    case "Expired":
      return "bg-red-100 text-red-700";
    case "Pending":
      return "bg-yellow-100 text-yellow-700";
    case "Lapsed":
      return "bg-gray-100 text-gray-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

function getBeneficiaryStatusColor(status: string) {
  switch (status) {
    case "Active":
    case "Alive":
      return "bg-green-100 text-green-700";
    case "Deceased":
      return "bg-gray-100 text-gray-700";
    case "Removed":
      return "bg-red-100 text-red-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export default function PolicyDetails({
  policy,
}: PolicyDetailsProps) {
  const [activeSection, setActiveSection] = useState<"policy" | "beneficiaries">("policy");

  const policyStatus = policyStatusLabels[policy.status] ?? policy.status ?? "Unknown";

  return (
    <div className="w-full rounded-xl bg-white shadow-xl border border-gray-200 overflow-hidden">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {policy.policyId}
              </h2>

              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(policy.status)}`}>
                {policyStatus}
              </span>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setActiveSection("policy")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeSection === "policy"
                  ? "border-b-2 border-teal-600 text-teal-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Policy
            </button>

            <button
              type="button"
              onClick={() => setActiveSection("beneficiaries")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeSection === "beneficiaries"
                  ? "border-b-2 border-teal-600 text-teal-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Beneficiaries
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeSection === "policy" && (
            <>
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                Policy Details
              </h3>

              <div className="space-y-1">
                <InfoRow icon={<FileIcon />} label="Policy ID" value={policy.policyId} />
                <InfoRow icon={<TaskIcon />} label="Package Type" value={policy.packageName ?? "N/A"} />
                <InfoRow icon={<TaskIcon />} label="Policy Status" value={policyStatus} />
                <InfoRow icon={<CalenderIcon />} label="Start Date" value={formatDate(policy.startDate)} />
                <InfoRow icon={<CalenderIcon />} label="End Date" value={formatDate(policy.endDate)} />
              </div>

              <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
                Related Details
              </h3>

              <div className="space-y-4">
                <InfoRow icon={<UserIcon />} label="Related Client" value={policy.clientName ?? "N/A"} />
              </div>
            </>
          )}

          {activeSection === "beneficiaries" && (
            <>
              {policy.beneficiaries?.length > 0 ? (
                <table className="mb-4 w-full text-sm font-medium text-gray-700">
                  <thead className="text-left font-semibold text-gray-500">
                    <tr className="border-b border-gray-200">
                      <th className="pb-3">Name</th>
                      <th className="pb-3">Status</th>
                    </tr>
                  </thead>

                  <tbody>
                    {policy.beneficiaries.map((beneficiary: BeneficiaryResponse) => {
                      const beneficiaryStatus = beneficiaryStatusLabels[beneficiary.status] ?? beneficiary.status ?? "Unknown";
                      return (
                        <tr key={beneficiary.beneficiaryId} className="border-b border-gray-100">
                          <td className="py-3">{beneficiary.fullName}</td>
                          <td className="py-3">
                            <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getBeneficiaryStatusColor(beneficiary.status)}`}>
                              {beneficiaryStatus}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">No beneficiaries found for this policy.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}