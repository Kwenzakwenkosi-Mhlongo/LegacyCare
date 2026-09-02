"use client";

import { TrashBinIcon } from "@/icons";

interface CatalogDeleteConfirmationProps {
  itemName: string;
  itemType: "category" | "item";
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CatalogDeleteConfirmation({
  itemName,
  itemType,
  isOpen,
  onConfirm,
  onCancel,
}: CatalogDeleteConfirmationProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-3xl bg-white p-8 shadow-xl">
        <div className="flex flex-col items-center text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-red-100">
            <TrashBinIcon className="size-6 text-red-600" />
          </div>

          <h2 className="mt-4 text-xl font-bold text-gray-900">
            Confirm Delete
          </h2>

          <p className="mt-3 text-gray-500">
            Are you sure you want to delete this {itemType}?
            <span className="font-semibold text-black">
              {" "}
              {itemName}
            </span>
            ?
          </p>

          <div className="mt-8 flex w-full gap-4">
            <button
              onClick={onCancel}
              className="flex-1 rounded-xl border border-gray-300 p-3 hover:bg-gray-100"
            >
              Cancel
            </button>

            <button
              onClick={onConfirm}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 p-3 text-white hover:bg-red-700"
            >
              <TrashBinIcon className="size-5" />
              <span>Delete</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}