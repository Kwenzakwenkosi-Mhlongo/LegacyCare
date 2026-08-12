"use client";

interface RequestMetricCardProps {
  totalRequests: number;
  pendingRequests: number;
  approvedRequests: number;
  rejectedRequests: number;
}

export default function RequestMetricCard({
  totalRequests,
  pendingRequests,
  approvedRequests,
  rejectedRequests,
}: RequestMetricCardProps) {
  return (
    <div className="grid grid-cols-4 gap-4">
      <div className="rounded-xl border border-blue-200 bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-blue-100 p-2.5">
            <svg className="h-5 w-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-blue-600">{totalRequests}</p>
            <p className="text-sm text-gray-500">Total Requests</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-yellow-200 bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-yellow-100 p-2.5">
            <svg className="h-5 w-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-yellow-600">{pendingRequests}</p>
            <p className="text-sm text-gray-500">Pending Review</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-green-200 bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-green-100 p-2.5">
            <svg className="h-5 w-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-green-600">{approvedRequests}</p>
            <p className="text-sm text-gray-500">Approved</p>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-red-200 bg-white p-6 shadow-sm transition hover:shadow-md">
        <div className="flex items-center gap-3">
          <div className="rounded-lg bg-red-100 p-2.5">
            <svg className="h-5 w-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div>
            <p className="text-2xl font-bold text-red-600">{rejectedRequests}</p>
            <p className="text-sm text-gray-500">Rejected</p>
          </div>
        </div>
      </div>
    </div>
  );
}