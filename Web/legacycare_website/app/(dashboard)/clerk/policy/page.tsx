"use client";

import React, { useCallback, useEffect, useState } from "react";
import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";
import Pagination from "@/components/tables/Pagination";
import ApprovalConfirmation from "@/components/modals/confirmation/ApprovalConfirmation";
import RejectionConfirmation from "@/components/modals/confirmation/RejectionConfirmation";
import RequestMetricCard from "@/components/dashboard/metriccard/clerk/RequestMetricCard";
import { useNotifications } from "@/components/notifications/NotificationContext";
import RequestDetails from "@/components/modals/clerk/policy/RequestDetails";
import { getBeneficiaryRequests, approveBeneficiaryRequest, rejectBeneficiaryRequest } from "@/lib/beneficiaryRequestService";
import { getPackageChangeRequests, approvePackageChangeRequest, rejectPackageChangeRequest } from "@/lib/packageChangeRequestService";

type RequestType = "beneficiary" | "package";

interface CombinedRequest {
  id: string;
  requestId: string;
  policyId: string;
  type: string;
  typeLabel: string;
  clientName: string;
  status: string;
  statusLabel: string;
  requestDate: string;
  details: any;
  requestType: RequestType;
}

function formatDate(date?: string | null) {
  if (!date) return "N/A";
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return date;
  return parsedDate.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function getStatusColor(status: string) {
  switch (status.toLowerCase()) {
    case "pending": return "bg-yellow-100 text-yellow-700";
    case "approved": return "bg-green-100 text-green-700";
    case "rejected": return "bg-red-100 text-red-700";
    default: return "bg-gray-100 text-gray-700";
  }
}

export default function ClerkPolicyPage() {
  const { addNotification } = useNotifications();

  useEffect(() => {
    document.title = "Manage Policy Requests";
  }, []);

  const [requests, setRequests] = useState<CombinedRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<CombinedRequest | null>(null);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("Pending");
  const [typeFilter, setTypeFilter] = useState("All");
  const [currentPage, setCurrentPage] = useState(1);
  const rowsPerPage = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, typeFilter]);

  const loadRequests = useCallback(async () => {
    try {
      setIsLoading(true);

      const [beneficiaryData, packageData] = await Promise.all([
        getBeneficiaryRequests().catch(() => []),
        getPackageChangeRequests().catch(() => []),
      ]);

      const beneficiaryRequests = beneficiaryData.map((req: any) => {
        let typeLabel = "Add Beneficiary";
        if (req.requestType === "Add") {
          typeLabel = "Add Beneficiary";
        } else if (req.requestType === "Remove") {
          typeLabel = "Remove Beneficiary";
        } else if (req.requestType === "Update") {
          typeLabel = "Update Beneficiary";
        } else {
          typeLabel = req.requestType || "Add Beneficiary";
        }

        return {
          id: req.requestId,
          requestId: req.requestId,
          policyId: req.policyId,
          type: "beneficiary",
          typeLabel: typeLabel,
          clientName: req.clientName || req.user?.fullName || "N/A",
          status: req.status || "Pending",
          statusLabel: req.status || "Pending",
          requestDate: req.requestDate,
          details: req,
          requestType: "beneficiary" as RequestType,
        };
      });

      const packageRequests = packageData.map((req: any) => ({
        id: req.requestId,
        requestId: req.requestId,
        policyId: req.policyId,
        type: "package",
        typeLabel: "Change Package",
        clientName: req.clientName || req.user?.fullName || "N/A",
        status: req.status || "Pending",
        statusLabel: req.status || "Pending",
        requestDate: req.requestDate,
        details: req,
        requestType: "package" as RequestType,
      }));

      setRequests([...beneficiaryRequests, ...packageRequests]);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to load requests.";
      addNotification({
        title: "Requests Load Failed",
        message,
        type: "error",
      });
      setRequests([]);
    } finally {
      setIsLoading(false);
    }
  }, [addNotification]);

  useEffect(() => {
    loadRequests();
  }, [loadRequests]);

  const filteredRequests = requests.filter((request) => {
    const searchableText = [
      request.requestId,
      request.policyId,
      request.clientName,
      request.typeLabel,
      request.statusLabel,
    ].join(" ").toLowerCase();

    const matchesSearch = searchTerm === "" || searchableText.includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "All" || request.statusLabel === statusFilter;
    const matchesType = typeFilter === "All" || request.typeLabel === typeFilter;

    return matchesSearch && matchesStatus && matchesType;
  });

  const sortedRequests = [...filteredRequests].sort((a, b) => {
    const statusOrder = { "Pending": 0, "Approved": 1, "Rejected": 2 };
    const aOrder = statusOrder[a.status as keyof typeof statusOrder] ?? 0;
    const bOrder = statusOrder[b.status as keyof typeof statusOrder] ?? 0;
    if (aOrder !== bOrder) {
      return aOrder - bOrder;
    }
    return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
  });

  const totalPages = Math.ceil(sortedRequests.length / rowsPerPage);
  const currentRequests = sortedRequests.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage
  );

  const totalRequests = requests.length;
  const pendingRequests = requests.filter(r => r.status === "Pending").length;
  const approvedRequests = requests.filter(r => r.status === "Approved").length;
  const rejectedRequests = requests.filter(r => r.status === "Rejected").length;

  const handleViewRequest = (request: CombinedRequest) => {
    setSelectedRequest(request);
  };

  const handleApprove = () => {
    if (!selectedRequest) return;
    setApproveModalOpen(true);
  };

  const handleReject = () => {
    if (!selectedRequest) return;
    setRejectModalOpen(true);
  };

  const handleConfirmApprove = async () => {
    if (!selectedRequest || isProcessing) return;

    setIsProcessing(true);
    try {
      if (selectedRequest.requestType === "beneficiary") {
        await approveBeneficiaryRequest(selectedRequest.requestId);
      } else {
        await approvePackageChangeRequest(selectedRequest.requestId);
      }

      addNotification({
        title: "Request Approved",
        message: `Request ${selectedRequest.requestId} was approved successfully.`,
        type: "success",
      });

      setApproveModalOpen(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to approve the request.";
      addNotification({
        title: "Approval Failed",
        message,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleConfirmReject = async () => {
    if (!selectedRequest || isProcessing) return;

    setIsProcessing(true);
    try {
      if (selectedRequest.requestType === "beneficiary") {
        await rejectBeneficiaryRequest(selectedRequest.requestId);
      } else {
        await rejectPackageChangeRequest(selectedRequest.requestId);
      }

      addNotification({
        title: "Request Rejected",
        message: `Request ${selectedRequest.requestId} was rejected successfully.`,
        type: "success",
      });

      setRejectModalOpen(false);
      setSelectedRequest(null);
      await loadRequests();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unable to reject the request.";
      addNotification({
        title: "Rejection Failed",
        message,
        type: "error",
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const columns = [
    {
      key: "requestId",
      label: "Request ID",
      render: (row: CombinedRequest) => (
        <span className="font-medium text-gray-900">{row.requestId}</span>
      ),
    },
    {
      key: "typeLabel",
      label: "Request Type",
      render: (row: CombinedRequest) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
          row.type === "beneficiary"
            ? "bg-blue-100 text-blue-700"
            : "bg-purple-100 text-purple-700"
        }`}>
          {row.typeLabel}
        </span>
      ),
    },
    {
      key: "clientName",
      label: "Client",
      render: (row: CombinedRequest) => (
        <span className="font-medium text-gray-900">{row.clientName}</span>
      ),
    },
    {
      key: "policyId",
      label: "Policy",
      render: (row: CombinedRequest) => (
        <span className="text-sm text-gray-500">{row.policyId}</span>
      ),
    },
    {
      key: "requestDate",
      label: "Date",
      render: (row: CombinedRequest) => (
        <span className="text-sm text-gray-500">{formatDate(row.requestDate)}</span>
      ),
    },
    {
      key: "statusLabel",
      label: "Status",
      render: (row: CombinedRequest) => (
        <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${getStatusColor(row.statusLabel)}`}>
          {row.statusLabel}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Manage Policy Requests" />

      <RequestMetricCard
        totalRequests={totalRequests}
        pendingRequests={pendingRequests}
        approvedRequests={approvedRequests}
        rejectedRequests={rejectedRequests}
      />

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-8">
          <ComponentCard title="Policy Requests">
            <div className="mb-4 flex w-full flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap gap-3">
                <input
                  type="text"
                  placeholder="Search by ID, Client, Policy..."
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-64 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                />

                <select
                  value={typeFilter}
                  onChange={(event) => setTypeFilter(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="All">All Types</option>
                  <option value="Add Beneficiary">Add Beneficiary</option>
                  <option value="Remove Beneficiary">Remove Beneficiary</option>
                  <option value="Change Package">Change Package</option>
                </select>

                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                >
                  <option value="All">All Status</option>
                  <option value="Pending">Pending</option>
                  <option value="Approved">Approved</option>
                  <option value="Rejected">Rejected</option>
                </select>
              </div>
            </div>

            <p className="mb-2 text-sm text-gray-500">
              Showing {sortedRequests.length} of {requests.length} requests
            </p>

            {isLoading ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">Loading requests...</p>
              </div>
            ) : sortedRequests.length === 0 ? (
              <div className="py-12 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <p className="text-gray-500">No requests found</p>
                <p className="text-sm text-gray-400">
                  {statusFilter !== "All" || typeFilter !== "All" 
                    ? "Try changing your filters" 
                    : "All requests have been processed"}
                </p>
              </div>
            ) : (
              <>
                <ReusableTable
                  columns={columns}
                  data={currentRequests}
                  onRowClick={handleViewRequest}
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

        <div className="col-span-4">
          <ComponentCard title="Request Details">
            {selectedRequest ? (
              <RequestDetails
                request={selectedRequest}
                onApprove={handleApprove}
                onReject={handleReject}
              />
            ) : (
              <div className="py-16 text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gray-100">
                  <svg className="h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                </div>
                <p className="text-gray-500">Select a request to view details</p>
                <p className="text-sm text-gray-400">Click on any row in the table above</p>
              </div>
            )}
          </ComponentCard>
        </div>
      </div>

      <ApprovalConfirmation
        isOpen={approveModalOpen}
        itemName={selectedRequest?.requestId ?? ""}
        onCancel={() => setApproveModalOpen(false)}
        onConfirm={handleConfirmApprove}
        isLoading={isProcessing}
      />

      <RejectionConfirmation
        isOpen={rejectModalOpen}
        itemName={selectedRequest?.requestId ?? ""}
        onCancel={() => setRejectModalOpen(false)}
        onConfirm={handleConfirmReject}
        isLoading={isProcessing}
      />
    </div>
  );
}