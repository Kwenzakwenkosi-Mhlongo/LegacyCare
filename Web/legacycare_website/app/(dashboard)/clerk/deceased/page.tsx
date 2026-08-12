"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import DeceasedMetricCard from "@/components/dashboard/metriccard/clerk/DeceasedMetricCard";
import DeceasedDetails from "@/components/modals/clerk/deceased/DeceasedDetails";
import EditDeceasedDetails from "@/components/modals/clerk/deceased/EditDeceasedDetails";

import { getDeceasedRecords, updateDeceased, releaseDeceased } from "@/lib/services/deceasedServices";
import { getStorageAssignments } from "@/lib/services/mortuaryService";

import type { DeceasedResponse, DeceasedDetailsView, UpdateDeceasedRequest } from "@/types/deceased";
import type { DeceasedStorageResponse } from "@/types/mortuary";

import { useNotifications } from "@/components/notifications/NotificationContext";

function formatDate(date?: string | null): string {
  if (!date) {
    return "Not Available";
  }

  const parsedDate = new Date(date);

  if (Number.isNaN(parsedDate.getTime())) {
    return date;
  }

  return parsedDate.toLocaleDateString("en-ZA");
}

function getStatusLabel(isReleased: boolean): string {
  return isReleased ? "Released" : "In Mortuary";
}

function getStatusColor(isReleased: boolean): string {
  return isReleased
    ? "bg-gray-100 text-gray-700"
    : "bg-yellow-100 text-yellow-700";
}

export default function DeceasedPage() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    document.title = "Manage Deceased";
  }, []);

  const [deceasedRecords, setDeceasedRecords] = useState<DeceasedDetailsView[]>([]);
  const [selectedDeceased, setSelectedDeceased] = useState<DeceasedDetailsView | null>(null);
  const [selectedDeceasedId, setSelectedDeceasedId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  const loadDeceased = useCallback(async () => {
    try {
      setIsLoading(true);

      const [deceasedData, assignments] = await Promise.all([
        getDeceasedRecords(),
        getStorageAssignments().catch(() => []),
      ]);

      const deceasedWithAssignments: DeceasedDetailsView[] = deceasedData.map((deceased: DeceasedResponse) => {
        const activeAssignment = assignments.find(
          (assignment: DeceasedStorageResponse) =>
            assignment.deceasedId === deceased.deceasedId &&
            !assignment.dateRemoved
        );

        return {
          ...deceased,
          assignment: activeAssignment || null,
          storageId: activeAssignment?.storageId || null,
          unitNumber: activeAssignment?.storage?.unitNumber || null,
          assignmentId: activeAssignment?.assignmentId || null,
          dateAssigned: activeAssignment?.dateAssigned || null,
          dateRemoved: activeAssignment?.dateRemoved || null,
        };
      });

      setDeceasedRecords(deceasedWithAssignments);

      setSelectedDeceased((currentSelected) => {
        if (!currentSelected) {
          return null;
        }
        return deceasedWithAssignments.find(
          (d) => d.deceasedId === currentSelected.deceasedId
        ) ?? null;
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load deceased records.";
      addNotification({
        title: "Deceased Load Failed",
        message,
        type: "error",
      });
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadDeceased();
  }, [loadDeceased]);

  const handleEditClick = () => {
    setIsEditing(true);
  };

  const handleEditCancel = () => {
    setIsEditing(false);
  };

  const handleEditSave = async (deceasedId: string, data: UpdateDeceasedRequest) => {
    try {
      await updateDeceased(deceasedId, data);
      await loadDeceased();
      setIsEditing(false);

      addNotification({
        title: "Deceased Updated",
        message: "The deceased record was updated successfully.",
        type: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to update deceased record.";
      addNotification({
        title: "Update Failed",
        message,
        type: "error",
      });
      throw error;
    }
  };

  const handleRelease = async () => {
    if (!selectedDeceased) return;

    try {
      await releaseDeceased(selectedDeceased.deceasedId);
      await loadDeceased();

      addNotification({
        title: "Deceased Released",
        message: "The deceased has been released successfully.",
        type: "success",
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to release deceased.";
      addNotification({
        title: "Release Failed",
        message,
        type: "error",
      });
    }
  };

  const columns = [
    {
      key: "deceasedId",
      label: "Deceased ID",
      render: (row: DeceasedDetailsView) => (
        <span className="font-medium text-gray-900">{row.deceasedId}</span>
      ),
    },
    {
      key: "fullName",
      label: "Deceased Name",
      render: (row: DeceasedDetailsView) => (
        <span>{row.fullName}</span>
      ),
    },
    {
      key: "unitNumber",
      label: "Assigned Unit",
      render: (row: DeceasedDetailsView) => (
        <span>{row.unitNumber || "Not Assigned"}</span>
      ),
    },
    {
      key: "dateAssigned",
      label: "Assigned Date",
      render: (row: DeceasedDetailsView) => (
        <span>{formatDate(row.dateAssigned)}</span>
      ),
    },
    {
      key: "policyId",
      label: "Related Policy",
      render: (row: DeceasedDetailsView) => (
        <span>{row.policyId}</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (row: DeceasedDetailsView) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(row.isReleased)}`}
        >
          {getStatusLabel(row.isReleased)}
        </span>
      ),
    },
  ];

  const handleViewDeceased = (deceased: DeceasedDetailsView) => {
    setSelectedDeceased(deceased);
    setSelectedDeceasedId(deceased.deceasedId);
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <PageBreadcrumb pageTitle="Manage Deceased" />
        <ComponentCard title="Deceased">
          <div className="py-12 text-center">
            <p className="text-gray-500">Loading deceased records...</p>
          </div>
        </ComponentCard>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Manage Deceased" />

      <DeceasedMetricCard
        totDeceased={deceasedRecords.length}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <ComponentCard title="Deceased">
            <div className="mb-4 flex w-full items-center justify-between">
              <Link
                href="/clerk/deceased/create"
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                + Capture Deceased Details
              </Link>

              <button
                type="button"
                onClick={loadDeceased}
                className="text-sm font-medium text-teal-600 hover:text-teal-700"
              >
                Refresh
              </button>
            </div>

            {deceasedRecords.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">No deceased records found.</p>
              </div>
            ) : (
              <ReusableTable
                columns={columns}
                data={deceasedRecords}
                onRowClick={handleViewDeceased}
              />
            )}
          </ComponentCard>
        </div>

        <div className="col-span-4">
          <ComponentCard title={isEditing ? "Edit Deceased" : "Deceased Details"}>
            {selectedDeceased ? (
              isEditing ? (
                <EditDeceasedDetails
                  deceased={selectedDeceased}
                  onSave={handleEditSave}
                  onCancel={handleEditCancel}
                />
              ) : (
                <DeceasedDetails
                  deceased={selectedDeceased}
                  onEdit={handleEditClick}
                  onRelease={handleRelease}
                />
              )
            ) : (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  Select a deceased to view details
                </p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>
    </div>
  );
}