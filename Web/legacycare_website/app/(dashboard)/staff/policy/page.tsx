"use client";

import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import Link from "next/link";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import Pagination from "@/components/tables/Pagination";

import PolicyDetails from "@/components/modals/admin/policy/PolicyDetails";
import ChangePolicy from "@/components/modals/admin/policy/ChangePolicy";
import UpdatePolicyStatus from "@/components/modals/admin/policy/UpdatePolicyStatus";

import PolicyMetricCard from "@/components/dashboard/metriccard/admin/PolicyMetricCard";

import { useNotifications } from "@/components/notifications/NotificationContext";

import {
  changePolicyPackage,
  getPolicies,
  updatePolicyStatus,
} from "@/lib/policyService";

import type {
  PolicyResponse,
  PolicyStatus,
  UpdatePolicyStatusRequest,
} from "@/types/policy";

import { formatPolicyId } from "@/lib/formatters";

export default function PolicyPage() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    document.title = "Manage Policies";
  }, []);

  /* ---------------- STATES ---------------- */

  const [policies, setPolicies] = useState<
    PolicyResponse[]
  >([]);

  const [selectedPolicy, setSelectedPolicy] =
    useState<PolicyResponse | null>(null);

  const [updateStatus, setUpdateStatus] =
    useState(false);

  const [changePolicy, setChangePolicy] =
    useState(false);

  const [isLoading, setIsLoading] =
    useState(true);

  const [searchTerm, setSearchTerm] =
    useState("");

  const [statusFilter, setStatusFilter] =
    useState<"All" | PolicyStatus>("All");

  const [currentPage, setCurrentPage] =
    useState(1);

  const rowsPerPage = 5;

  /*
   * Return to page 1 whenever the search text
   * or status filter changes.
   */
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter]);

  /* ---------------- LOAD POLICIES ---------------- */

  const loadPolicies = useCallback(async () => {
    try {
      setIsLoading(true);

      const data: PolicyResponse[] =
        await getPolicies();

      setPolicies(data);

      /*
       * Refresh the selected policy after fetching
       * the latest policies from the backend.
       */
      setSelectedPolicy((currentPolicy) => {
        if (!currentPolicy) {
          return null;
        }

        return (
          data.find(
            (policy) =>
              policy.policyId ===
              currentPolicy.policyId
          ) ?? null
        );
      });
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to load policies.";

      addNotification({
        title: "Policies Load Failed",
        message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    void loadPolicies();
  }, [loadPolicies]);

  /* ---------------- TABLE HEADINGS ---------------- */

  const columns = useMemo(
    () => [
      {
        key: "policyId",
        label: "Policy ID",
        render: (row: PolicyResponse) => (
          <span>
            {formatPolicyId(row.policyId)}
          </span>
        ),
      },
      {
        key: "clientName",
        label: "Client Name",
      },
      {
        key: "packageName",
        label: "Package",
        render: (row: PolicyResponse) => (
          <span
            className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${row.packageName === "Basic"
                ? "bg-blue-100 text-blue-700"
                : row.packageName ===
                  "Standard"
                  ? "bg-sky-100 text-sky-700"
                  : row.packageName ===
                    "Premium"
                    ? "bg-cyan-100 text-cyan-700"
                    : "bg-purple-100 text-purple-700"
              }`}
          >
            {row.packageName}
          </span>
        ),
      },
      {
        key: "status",
        label: "Status",
        render: (row: PolicyResponse) => {
          const statusLabel = row.status;

          return (
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${statusLabel === "Active"
                  ? "bg-green-100 text-green-700"
                  : statusLabel ===
                    "Inactive" 
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-700"
                }`}
            >
              {statusLabel}
            </span>
          );
        },
      },
    ],
    []
  );

  /* ---------------- SEARCH AND FILTER ---------------- */

  const filteredPolicies = useMemo(() => {
    const normalizedSearch =
      searchTerm.trim().toLowerCase();

    return policies.filter((policy) => {
      const searchableText = [
        policy.policyId,
        formatPolicyId(policy.policyId),
        policy.clientName,
        policy.packageName,
        policy.status,
      ]
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        searchableText.includes(
          normalizedSearch
        );

      const matchesStatus =
        statusFilter === "All" ||
        policy.status === statusFilter;

      return matchesSearch && matchesStatus;
    });
  }, [policies, searchTerm, statusFilter]);

  /* ---------------- PAGINATION ---------------- */

  const totalPages = Math.ceil(
    filteredPolicies.length / rowsPerPage
  );

  const currentPolicies =
    filteredPolicies.slice(
      (currentPage - 1) * rowsPerPage,
      currentPage * rowsPerPage
    );

  /*
   * Prevent the current page from remaining
   * outside the valid range after filtering.
   */
  useEffect(() => {
    if (
      totalPages > 0 &&
      currentPage > totalPages
    ) {
      setCurrentPage(totalPages);
    }

    if (
      totalPages === 0 &&
      currentPage !== 1
    ) {
      setCurrentPage(1);
    }
  }, [currentPage, totalPages]);

  /* ---------------- VIEW POLICY ---------------- */

  const handleViewPolicy = (
    policy: PolicyResponse
  ) => {
    setSelectedPolicy(policy);
    setUpdateStatus(false);
    setChangePolicy(false);
  };

  /* ---------------- OPEN FORMS ---------------- */

  const handleOpenUpdateStatus = () => {
    if (!selectedPolicy) {
      return;
    }

    setChangePolicy(false);
    setUpdateStatus(true);
  };

  const handleOpenChangePolicy = () => {
    if (!selectedPolicy) {
      return;
    }

    setUpdateStatus(false);
    setChangePolicy(true);
  };

  /* ---------------- SAVE STATUS ---------------- */

  const handleSaveStatus = async (data: {
    policyId: string;
    status: PolicyStatus;
  }) => {
    try {
      const request: UpdatePolicyStatusRequest = {
        status: data.status,
      };

      await updatePolicyStatus(
        data.policyId,
        request
      );

      /*
       * Update the policy in the table immediately.
       */
      setPolicies((currentPolicies) =>
        currentPolicies.map((policy) =>
          policy.policyId === data.policyId
            ? {
              ...policy,
              status: data.status,
            }
            : policy
        )
      );

      /*
       * Update the policy shown in the details panel.
       */
      setSelectedPolicy((currentPolicy) => {
        if (
          !currentPolicy ||
          currentPolicy.policyId !==
          data.policyId
        ) {
          return currentPolicy;
        }

        return {
          ...currentPolicy,
          status: data.status,
        };
      });

      setUpdateStatus(false);

      addNotification({
        title: "Policy Status Updated",
        message:
          "The policy status was updated successfully.",
        type: "success",
      });

      /*
       * Fetch again to ensure the frontend matches
       * the final database value.
       */
      await loadPolicies();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to update the policy status.";

      addNotification({
        title: "Status Update Failed",
        message,
        type: "error",
      });

      /*
       * Rethrow so UpdatePolicyStatus.tsx can
       * display its own error message.
       */
      throw error;
    }
  };

  /* ---------------- SAVE PACKAGE ---------------- */

  const handleSavePackage = async (data: {
    policyId: string;
    newPackageId: string;
  }) => {
    try {
      const result =
        await changePolicyPackage(
          data.policyId,
          data.newPackageId
        );

      setChangePolicy(false);

      addNotification({
        title: "Policy Changed",
        message:
          `The old policy was discontinued and ` +
          `new policy ${formatPolicyId(
            result.newPolicyId
          )} was created. ` +
          `${result.beneficiariesCopied} ` +
          `beneficiaries were copied.`,
        type: "success",
      });

      /*
       * Clear the old selected policy because it has
       * now been discontinued.
       */
      setSelectedPolicy(null);

      /*
       * Reload both the old discontinued policy and
       * the newly created active policy.
       */
      await loadPolicies();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to change the policy.";

      addNotification({
        title: "Policy Change Failed",
        message,
        type: "error",
      });

      throw error;
    }
  };

  /* ---------------- METRIC CALCULATIONS ---------------- */

  const totalPolicies = policies.length;

  const activePolicies = policies.filter(
    (policy) =>
      policy.status === "Active"
  ).length;

  const inactivePolicies = policies.filter(
    (policy) =>
      policy.status === "Inactive" ||
      policy.status === "Discontinued"
  ).length;

  return (
    <div className="space-y-6">
      {/* PAGE HEADER */}
      <PageBreadcrumb pageTitle="Manage Policies" />

      {/* METRIC CARDS */}
      <PolicyMetricCard
        totPolicy={totalPolicies}
        activePolicy={activePolicies}
        inactivePolicy={inactivePolicies}
      />

      {/* TABLE + DETAILS PANEL */}
      <div className="grid grid-cols-12 gap-6">
        {/* TABLE */}
        <div className="col-span-8">
          <ComponentCard title="Policies">
            <div className="mb-4 flex w-full items-center justify-between">
              <div className="flex gap-3">
                {/* SEARCH */}
                <input
                  type="text"
                  placeholder="Search Policies..."
                  value={searchTerm}
                  onChange={(event) =>
                    setSearchTerm(
                      event.target.value
                    )
                  }
                  className="w-80 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />

                {/* STATUS FILTER */}
                <select
                  value={statusFilter}
                  onChange={(event) =>
                    setStatusFilter(
                      event.target.value as
                      | "All"
                      | PolicyStatus
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="All">
                    All Policies
                  </option>

                  <option value="Active">
                    Active Policies
                  </option>

                  <option value="Inactive">
                    Inactive Policies
                  </option>

                  <option value="Discontinued">
                    Discontinued Policies
                  </option>
                </select>
              </div>

              <Link
                href="/admin/policy/create"
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                + Add A Policy
              </Link>
            </div>

            <p className="mb-2 text-sm text-gray-500">
              Showing{" "}
              {filteredPolicies.length} of{" "}
              {policies.length} policies
            </p>

            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  Loading policies...
                </p>
              </div>
            ) : filteredPolicies.length ===
              0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  No policies found.
                </p>
              </div>
            ) : (
              <>
                <ReusableTable
                  columns={columns}
                  data={currentPolicies}
                  onRowClick={handleViewPolicy}
                />

                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </>
            )}
          </ComponentCard>
        </div>

        {/* DETAILS PANEL */}
        <div className="col-span-4">
          <ComponentCard
            title={
              changePolicy
                ? "Change Policy"
                : updateStatus
                  ? "Update Policy Status"
                  : "Policy Details"
            }
          >
            {selectedPolicy ? (
              changePolicy ? (
                <ChangePolicy
                  policy={selectedPolicy}
                  onCancel={() =>
                    setChangePolicy(false)
                  }
                  onSave={handleSavePackage}
                />
              ) : updateStatus ? (
                <UpdatePolicyStatus
                  key={`${selectedPolicy.policyId}-${selectedPolicy.status}`}
                  policy={selectedPolicy}
                  onCancel={() =>
                    setUpdateStatus(false)
                  }
                  onSave={handleSaveStatus}
                />
              ) : (
                <PolicyDetails
                  policy={selectedPolicy}
                  onChange={
                    handleOpenChangePolicy
                  }
                  onUpdate={
                    handleOpenUpdateStatus
                  }
                />
              )
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  Select a policy to view details
                </p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}