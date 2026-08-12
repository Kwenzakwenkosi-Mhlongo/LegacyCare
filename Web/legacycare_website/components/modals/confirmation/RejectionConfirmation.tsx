"use client";

import { CloseLineIcon } from "@/icons";

interface RejectionConfirmationProps {
  isOpen: boolean;
  itemName: string;
  onCancel: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function RejectionConfirmation({
  isOpen,
  itemName,
  onCancel,
  onConfirm,
  isLoading = false,
}: RejectionConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 shadow-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <CloseLineIcon className="h-8 w-8 text-red-600" />
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-900">
            Reject Request
          </h3>
          <p className="text-gray-500">
            Are you sure you want to reject request <strong>{itemName}</strong>?
          </p>
          <p className="mt-1 text-sm text-gray-400">
            The client will be notified of this decision.
          </p>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 rounded-md border border-gray-300 px-4 py-2 text-gray-700 transition hover:bg-gray-50 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 rounded-md border border-red-300 px-4 py-2 text-red-600 transition hover:bg-red-50 disabled:opacity-50"
          >
            {isLoading ? "Processing..." : "Yes, Reject"}
          </button>
        </div>
      </div>
    </div>
  );
}