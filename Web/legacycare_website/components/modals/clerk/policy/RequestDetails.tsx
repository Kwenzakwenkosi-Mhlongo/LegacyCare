"use client";

interface RequestDetailsProps {
  request: {
    requestId: string;
    policyId: string;
    typeLabel: string;
    clientName: string;
    statusLabel: string;
    requestDate: string;
    details: any;
    requestType: "beneficiary" | "package";
  };
  onApprove: () => void;
  onReject: () => void;
}

function formatDate(date?: string | null) {
  if (!date) return "N/A";
  const parsedDate = new Date(date);
  if (isNaN(parsedDate.getTime())) return date;
  return parsedDate.toLocaleDateString("en-ZA", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getValueSafe(value: any): string {
  if (value === null || value === undefined) return "N/A";
  if (typeof value === "string") {
    if (value.trim() === "") return "N/A";
    return value;
  }
  if (typeof value === "number") return String(value);
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") {
    if (value.name) return value.name;
    if (value.packageName) return value.packageName;
    if (value.fullName) return value.fullName;
    if (value.title) return value.title;
    if (value.label) return value.label;
    return "N/A";
  }
  return String(value);
}

export default function RequestDetails({ request, onApprove, onReject }: RequestDetailsProps) {
  const isPending = request.statusLabel === "Pending";
  const details = request.details;

  return (
    <div className="w-full overflow-hidden rounded-xl border border-gray-200 bg-white shadow-xl">
      <div className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              {request.requestId}
            </h2>
            <p className="text-sm text-gray-500">
              Requested on {formatDate(request.requestDate)}
            </p>
          </div>
          <span className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            request.statusLabel === "Pending"
              ? "bg-yellow-100 text-yellow-700"
              : request.statusLabel === "Approved"
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-700"
          }`}>
            {request.statusLabel}
          </span>
        </div>

        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="w-24 text-sm text-gray-500">Type:</span>
            <span className="text-sm font-medium text-gray-900">{request.typeLabel}</span>
          </div>
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="w-24 text-sm text-gray-500">Client:</span>
            <span className="text-sm font-medium text-gray-900">{request.clientName}</span>
          </div>
          <div className="flex items-center gap-3 border-b border-gray-100 pb-3">
            <span className="w-24 text-sm text-gray-500">Policy:</span>
            <span className="text-sm font-medium text-gray-900">{request.policyId}</span>
          </div>
        </div>

        {request.requestType === "beneficiary" && details && (
          <>
            <h3 className="mt-6 mb-3 text-sm font-semibold text-gray-700">
              Beneficiary Information
            </h3>
            <div className="space-y-3 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500">Full Name:</span>
                <span className="text-sm font-medium text-gray-900">
                  {getValueSafe(details.fullName) || 
                   getValueSafe(details.beneficiary?.fullName) || 
                   details.description?.replace("Request to remove ", "").replace(" as beneficiary", "") ||
                   "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500">ID Number:</span>
                <span className="text-sm font-medium text-gray-900">
                  {getValueSafe(details.idNumber) || 
                   getValueSafe(details.beneficiary?.idNumber) || 
                   "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500">Relationship:</span>
                <span className="text-sm font-medium text-gray-900">
                  {getValueSafe(details.relationship) || 
                   getValueSafe(details.beneficiary?.relationship) || 
                   "N/A"}
                </span>
              </div>
              {details.description && (
                <div className="flex items-start gap-3 border-t border-gray-200 pt-3">
                  <span className="w-24 text-sm text-gray-500">Description:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getValueSafe(details.description)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        {request.requestType === "package" && details && (
          <>
            <h3 className="mt-6 mb-3 text-sm font-semibold text-gray-700">
              Package Change Details
            </h3>
            <div className="space-y-3 rounded-lg bg-gray-50 p-4">
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500">Current Package:</span>
                <span className="text-sm font-medium text-gray-900">
                  {details.policy?.package?.name || 
                   details.currentPackage || 
                   details.oldPackage || 
                   details.existingPackage || 
                   (details.policy?.packageId === "6fa1a0a9-0a7a-42d7-b766-5f0723845bc8" ? "Basic Funeral Plan" : "N/A")}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500">New Package:</span>
                <span className="text-sm font-medium text-gray-900">
                  {details.newPackage?.name || 
                   details.requestedPackage?.name || 
                   details.newPackage || 
                   "N/A"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500">Monthly Premium:</span>
                <span className="text-sm font-medium text-gray-900">
                  R {details.newPackage?.monthlyPremium || 
                     details.requestedPackage?.monthlyPremium || 
                     "0.00"}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <span className="w-24 text-sm text-gray-500">Max Beneficiaries:</span>
                <span className="text-sm font-medium text-gray-900">
                  {details.newPackage?.maxBeneficiaries || 
                   details.requestedPackage?.maxBeneficiaries || 
                   "N/A"}
                </span>
              </div>
              {details.newPackage?.description && (
                <div className="flex items-start gap-3 border-t border-gray-200 pt-3">
                  <span className="w-24 text-sm text-gray-500">Package Description:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getValueSafe(details.newPackage.description)}
                  </span>
                </div>
              )}
              {details.description && (
                <div className="flex items-start gap-3 border-t border-gray-200 pt-3">
                  <span className="w-24 text-sm text-gray-500">Request Note:</span>
                  <span className="text-sm font-medium text-gray-900">
                    {getValueSafe(details.description)}
                  </span>
                </div>
              )}
            </div>
          </>
        )}

        <div className="mt-6 flex gap-3 border-t border-gray-200 pt-6">
          <button
            type="button"
            onClick={onApprove}
            disabled={!isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-teal-700 py-2.5 text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            Approve Request
          </button>
          <button
            type="button"
            onClick={onReject}
            disabled={!isPending}
            className="flex flex-1 items-center justify-center gap-2 rounded-md border border-red-300 py-2.5 text-red-600 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
            Reject Request
          </button>
        </div>
      </div>
    </div>
  );
}