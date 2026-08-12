"use client";

import { useState } from "react";

import {
  CalenderIcon,
  FileIcon,
  InfoIcon,
  TaskIcon,
  UserIcon,
} from "@/icons";

import InfoRow from "@/components/reusables/InfoRow";

import type {
  BeneficiaryResponse,
  PolicyResponse,
} from "@/types/policy";
import { formatPolicyId } from "@/lib/formatters";

interface PolicyDetailsProps {
  policy: PolicyResponse;
  onChange: () => void;
  onUpdate: () => void;
}

function formatRelationship(
  relationship: string
): string {
  if (relationship === "GrandParent") {
    return "Grand Parent";
  }

  return relationship;
}

function formatDate(date?: string | null) {
  if (!date) {
    return "N/A";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-ZA", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function PolicyDetails({
  policy,
  onChange,
  onUpdate,
}: PolicyDetailsProps) {
  const [activeSection, setActiveSection] =
    useState<"policy" | "beneficiaries">(
      "policy"
    );

  const policyStatus = policy.status;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3">
              {/* Policy ID */}
              <h2 className="text-lg font-semibold text-gray-800">
                {formatPolicyId(policy.policyId)}
              </h2>

              {/* Status */}
              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium
                  ${
                    policyStatus === "Active"
                      ? "bg-green-100 text-green-700"
                      : policyStatus ===
                            "Inactive" ||
                          policyStatus ===
                            "Discontinued"
                        ? "bg-red-100 text-red-700"
                        : "bg-gray-100 text-gray-700"
                  }
                `}
              >
                {policyStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Switch Tabs */}
        <div className="border-b border-gray-200 px-6">
          <div className="flex gap-8">
            <button
              type="button"
              onClick={() =>
                setActiveSection("policy")
              }
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
              onClick={() =>
                setActiveSection(
                  "beneficiaries"
                )
              }
              className={`pb-3 text-sm font-medium transition-colors ${
                activeSection ===
                "beneficiaries"
                  ? "border-b-2 border-teal-600 text-teal-600"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Beneficiaries
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          {activeSection === "policy" && (
            <>
              {/* Policy Information */}
              <h3 className="mb-4 text-sm font-semibold text-gray-700">
                Policy Details
              </h3>

              <div className="space-y-4">
                <InfoRow
                  icon={<FileIcon />}
                  label="Policy ID"
                  value={formatPolicyId(policy.policyId)}
                />

                <InfoRow
                  icon={<TaskIcon />}
                  label="Package Type"
                  value={
                    policy.packageName ??
                    "N/A"
                  }
                />

                <InfoRow
                  icon={<TaskIcon />}
                  label="Policy Status"
                  value={policyStatus}
                />

                <InfoRow
                  icon={<CalenderIcon />}
                  label="Start Date"
                  value={formatDate(
                    policy.startDate
                  )}
                />

                <InfoRow
                  icon={<CalenderIcon />}
                  label="End Date"
                  value={formatDate(
                    policy.endDate
                  )}
                />
              </div>

              {/* Related Information */}
              <h3 className="mb-4 mt-8 text-sm font-semibold text-gray-700">
                Related Details
              </h3>

              <div className="space-y-4">
                <InfoRow
                  icon={<UserIcon />}
                  label="Related Client"
                  value={
                    policy.clientName ?? "N/A"
                  }
                />
              </div>
            </>
          )}

          {activeSection ===
            "beneficiaries" && (
            <>
              {policy.beneficiaries &&
              policy.beneficiaries.length >
                0 ? (
                <table className="mb-4 w-full text-sm font-medium text-gray-700">
                  {/* Table Heading */}
                  <thead className="pb-3 text-left font-semibold text-gray-500">
                    <tr>
                      <th className="pb-3 pr-4">
                        Name
                      </th>

                      <th className="pb-3 pr-4">
                        Relation
                      </th>

                      <th className="pb-3">
                        Status
                      </th>
                    </tr>
                  </thead>

                  {/* Table Body */}
                  <tbody>
                    {policy.beneficiaries.map(
                      (
                        beneficiary: BeneficiaryResponse,
                        index: number
                      ) => (
                        <tr
                          key={
                            beneficiary.beneficiaryId ??
                            index
                          }
                          className="border-t border-gray-100"
                        >
                          <td className="py-3 pr-4">
                            {
                              beneficiary.fullName
                            }
                          </td>

                          <td className="py-3 pr-4">
                            {formatRelationship(
                              beneficiary.relationship
                            )}
                          </td>

                          <td className="py-3">
                            {
                              beneficiary.status
                            }
                          </td>
                        </tr>
                      )
                    )}
                  </tbody>
                </table>
              ) : (
                <p className="text-sm text-gray-500">
                  No beneficiaries have
                  been added to this policy.
                </p>
              )}
            </>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-1 border-t border-gray-200 p-6">
        <button
          type="button"
          onClick={onUpdate}
          className="-ml-4 flex items-center justify-center gap-1 whitespace-nowrap rounded-md bg-teal-700 px-3 py-2.5 text-white transition hover:bg-teal-800"
        >
          <InfoIcon />
          Update Status
        </button>

        <button
          type="button"
          onClick={onChange}
          className="flex items-center justify-center gap-1 whitespace-nowrap rounded-md bg-teal-800 px-3 py-2.5 text-white transition hover:bg-teal-900"
        >
          <FileIcon />
          Change Policy
        </button>
      </div>
    </div>
  );
}