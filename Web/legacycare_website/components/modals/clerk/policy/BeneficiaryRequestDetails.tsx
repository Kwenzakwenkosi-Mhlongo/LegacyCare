"use client";

import { useState } from "react";

import {
  CalenderIcon,
  CheckCircleIcon,
  CloseLineIcon,
  FileIcon,
  TaskIcon,
  UserCircleIcon,
  UserIcon,
} from "@/icons";

import InfoRow from "@/components/reusables/InfoRow";

import type {
  BeneficiaryResponse,
  PolicyResponse,
} from "@/types/policy";

interface RequestedBeneficiary {
  beneficiaryId?: string;
  fullName?: string;
  name?: string;
  status: number | string;
}

interface BeneficiaryRequestResponse {
  requestId: string;
  policyId: string;
  type: number | string;
  status: number | string;
  date?: string;
  requestDate?: string;
  requestBeneficiaries?: RequestedBeneficiary[];
  requestbeneficiaries?: RequestedBeneficiary[];
}

interface BeneficiaryRequestDetailsProps {
  request: BeneficiaryRequestResponse;
  policy: PolicyResponse | null;
  onApprove: () => void;
  onReject: () => void;
}

const policyStatusLabels: Record<number, string> = {
  0: "Active",
  1: "Inactive",
  2: "Discontinued",
};

const beneficiaryStatusLabels: Record<number, string> = {
  0: "Alive",
  1: "Deceased",
};

const requestStatusLabels: Record<number, string> = {
  0: "Pending",
  1: "Approved",
  2: "Rejected",
};

const requestTypeLabels: Record<number, string> = {
  0: "Add",
  1: "Update",
  2: "Remove",
};

function getEnumLabel(
  value: number | string,
  labels: Record<number, string>
) {
  if (typeof value === "number") {
    return labels[value] ?? "Unknown";
  }
  return value;
}

function formatDate(date?: string | null) {
  if (!date) {
    return "N/A";
  }
  const parsedDate = new Date(date);
  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }
  return parsedDate.toLocaleDateString("en-ZA");
}

function getBeneficiaryName(
  beneficiary: RequestedBeneficiary | BeneficiaryResponse
) {
  if ("fullName" in beneficiary && beneficiary.fullName) {
    return beneficiary.fullName;
  }
  if ("name" in beneficiary && beneficiary.name) {
    return beneficiary.name;
  }
  return "N/A";
}

export default function BeneficiaryRequestDetails({
  request,
  policy,
  onApprove,
  onReject,
}: BeneficiaryRequestDetailsProps) {
  const [activeSection, setActiveSection] = useState<"request" | "policy">("request");

  const requestBeneficiaries = request.requestBeneficiaries ?? [];

  const requestType = getEnumLabel(request.type, requestTypeLabels);
  const requestStatus = getEnumLabel(request.status, requestStatusLabels);

  const policyStatus = policy
    ? getEnumLabel(policy.status, policyStatusLabels)
    : "N/A";

  const requestDate = request.requestDate ?? request.date;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              <h2 className="text-lg font-semibold text-gray-800">
                {request.requestId}
              </h2>
            </div>
          </div>
        </div>

        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() => setActiveSection("request")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeSection === "request"
                  ? "border-b-2 border-teal-600 text-teal-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Request
            </button>
            <button
              type="button"
              onClick={() => setActiveSection("policy")}
              className={`pb-3 text-sm font-medium transition-colors ${
                activeSection === "policy"
                  ? "border-b-2 border-teal-600 text-teal-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Related Policy
            </button>
          </div>
        </div>

        <div className="p-6">
          {activeSection === "request" && (
            <>
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                Request Details
              </h3>

              <div className="space-y-1 gap-8">
                <InfoRow icon={<FileIcon />} label="Request ID" value={request.requestId} />
                <InfoRow icon={<TaskIcon />} label="Request Type" value={requestType} />

                <div className="flex items-center gap-3">
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center opacity-60">
                    <UserCircleIcon />
                  </div>
                  <div className="text-sm text-gray-500">
                    Requested Beneficiaries
                  </div>
                </div>

                {requestBeneficiaries.length > 0 ? (
                  <table className="mb-4 w-full text-sm font-medium text-gray-700">
                    <thead className="text-left font-semibold text-gray-500">
                      <tr className="border-b border-gray-200">
                        <th className="pb-3">Name</th>
                        <th className="pb-3">Alive/Deceased</th>
                      </tr>
                    </thead>
                    <tbody className="text-sm text-gray-800">
                      {requestBeneficiaries.map((beneficiary, index) => {
                        const beneficiaryStatus = getEnumLabel(
                          beneficiary.status,
                          beneficiaryStatusLabels
                        );
                        return (
                          <tr key={beneficiary.beneficiaryId ?? index} className="border-b border-gray-100">
                            <td className="py-3">{getBeneficiaryName(beneficiary)}</td>
                            <td className="py-3">{beneficiaryStatus}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                ) : (
                  <p className="py-4 text-sm text-gray-500">No requested beneficiaries found.</p>
                )}

                <InfoRow icon={<CalenderIcon />} label="Request Date" value={formatDate(requestDate)} />
                <InfoRow icon={<CalenderIcon />} label="Request Status" value={requestStatus} />
              </div>

              <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
                Related Details
              </h3>

              <div className="space-y-4">
                <InfoRow icon={<UserIcon />} label="Related Client" value={policy?.clientName ?? "N/A"} />
                <InfoRow icon={<TaskIcon />} label="Related Policy" value={request.policyId} />
              </div>
            </>
          )}

          {activeSection === "policy" && (
            <>
              {policy ? (
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

                  <h3 className="mt-8 mb-4 text-sm font-semibold text-gray-700">
                    Existing Beneficiaries
                  </h3>

                  {policy.beneficiaries?.length > 0 ? (
                    <table className="mb-4 w-full text-sm font-medium text-gray-700">
                      <thead className="text-left font-semibold text-gray-500">
                        <tr className="border-b border-gray-200">
                          <th className="pb-3">Name</th>
                          <th className="pb-3">Alive/Deceased</th>
                        </tr>
                      </thead>
                      <tbody>
                        {policy.beneficiaries.map((beneficiary: BeneficiaryResponse, index) => {
                          const beneficiaryStatus = getEnumLabel(
                            beneficiary.status,
                            beneficiaryStatusLabels
                          );
                          return (
                            <tr key={beneficiary.beneficiaryId ?? index} className="border-b border-gray-100">
                              <td className="py-3">{getBeneficiaryName(beneficiary)}</td>
                              <td className="py-3">{beneficiaryStatus}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <p className="py-4 text-sm text-gray-500">No existing beneficiaries found.</p>
                  )}
                </>
              ) : (
                <div className="py-8 text-center">
                  <p className="text-sm text-gray-500">Related policy details could not be found.</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-5 border-t border-gray-200 p-6">
        <button
          type="button"
          onClick={onApprove}
          disabled={requestStatus !== "Pending"}
          className="flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-md bg-teal-700 px-1 py-2.5 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CheckCircleIcon />
          Approve
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={requestStatus !== "Pending"}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-red-300 py-2.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CloseLineIcon />
          Reject
        </button>
      </div>
    </div>
  );
}