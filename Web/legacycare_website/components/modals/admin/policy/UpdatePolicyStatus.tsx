"use client";

import { useEffect, useState } from "react";

import Select from "@/components/form/Select";
import EditableRow from "@/components/reusables/EditableRow";

import {
  PencilIcon,
  CheckLineIcon,
  CloseLineIcon,
} from "@/icons";

import type {
  PolicyResponse,
  PolicyStatus,
} from "@/types/policy";

import { formatPolicyId } from "@/lib/formatters";

interface UpdatePolicyStatusProps {
  policy: PolicyResponse;

  onCancel: () => void;

  onSave: (data: {
    policyId: string;
    status: PolicyStatus;
  }) => void | Promise<void>;
}

export default function UpdatePolicyStatus({
  policy,
  onSave,
  onCancel,
}: UpdatePolicyStatusProps) {
  const [status, setStatus] =
    useState<PolicyStatus>(policy.status);

  const [isUpdating, setIsUpdating] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  /*
   * Reset the selected status whenever a different
   * policy is opened in this component.
   */
  useEffect(() => {
    setStatus(policy.status);
    setError(null);
  }, [policy.policyId, policy.status]);

  const hasStatusChanged =
    status !== policy.status;

  const handleUpdate = async () => {
    if (!hasStatusChanged || isUpdating) {
      return;
    }

    try {
      setIsUpdating(true);
      setError(null);

      await onSave({
        // Send the real ID, not the formatted display ID.
        policyId: policy.policyId,
        status,
      });
    } catch (error) {
      console.error(
        "Failed to update policy status:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Failed to update policy status."
      );
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      {/* Header */}
      <div className="p-6 pb-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-gray-800">
              Update Policy Status
            </h2>

            <div className="mt-1 flex items-center gap-3">
              <span className="text-sm text-gray-500">
                {formatPolicyId(
                  policy.policyId
                )}
              </span>

              <span
                className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
                  policy.packageName === "Basic"
                    ? "bg-blue-100 text-blue-700"
                    : policy.packageName ===
                        "Standard"
                      ? "bg-sky-100 text-sky-700"
                      : policy.packageName ===
                          "Premium"
                        ? "bg-cyan-100 text-cyan-700"
                        : "bg-purple-100 text-purple-700"
                }`}
              >
                {policy.packageName}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="space-y-5">
          <h3 className="text-sm font-semibold text-gray-700">
            Policy Status
          </h3>

          <EditableRow
            icon={<CheckLineIcon />}
            label="Status"
          >
            <Select
              defaultValue={status}
              onChange={(value: string) => {
                setStatus(
                  value as PolicyStatus
                );

                setError(null);
              }}
              options={[
                {
                  value: "Active",
                  label: "Active",
                },
                {
                  value: "Inactive",
                  label: "Inactive",
                },
                {
                  value: "Discontinued",
                  label: "Discontinued",
                },
              ]}
            />
          </EditableRow>

          <p className="text-xs text-gray-500">
            Current status:{" "}
            {policy.status}
          </p>

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 p-3 text-sm text-red-700">
              {error}
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
      <div className="flex gap-3 border-t border-gray-200 p-6">
        <button
          type="button"
          onClick={onCancel}
          disabled={isUpdating}
          className="flex flex-1 items-center justify-center gap-2 rounded-md border border-gray-300 py-2.5 text-gray-700 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <CloseLineIcon />
          Cancel
        </button>

        <button
          type="button"
          onClick={handleUpdate}
          disabled={
            !hasStatusChanged ||
            isUpdating
          }
          className="flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <PencilIcon />

          {isUpdating
            ? "Updating..."
            : "Update"}
        </button>
      </div>
    </div>
  );
}