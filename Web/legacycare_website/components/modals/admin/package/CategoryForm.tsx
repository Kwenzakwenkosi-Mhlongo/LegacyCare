"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/button/Button";

interface CategoryFormProps {
  category?: any;
  onCancel: () => void;
  onSave: (category: any) => void;
}

export default function CategoryForm({
  category,
  onCancel,
  onSave,
}: CategoryFormProps) {
  const isEditing = !!category;

  const [name, setName] = useState(category?.name ?? "");
  const [description, setDescription] = useState(
    category?.description ?? ""
  );
  const [selectionMode, setSelectionMode] = useState(
    category?.selectionMode ?? 0
  );
  const [minimumSelections, setMinimumSelections] = useState(
    category?.minimumSelections ?? 0
  );
  const [maximumSelections, setMaximumSelections] = useState(
    category?.maximumSelections ?? 1
  );
  const [displayOrder, setDisplayOrder] = useState(
    category?.displayOrder ?? 0
  );
  const [isActive, setIsActive] = useState(
    category?.isActive ?? true
  );

  useEffect(() => {
    if (selectionMode === 0) {
      setMinimumSelections(0);
      setMaximumSelections(1);
    }

    if (selectionMode === 1) {
      setMinimumSelections(1);
      setMaximumSelections(1);
    }

    if (selectionMode === 3 && minimumSelections < 1) {
      setMinimumSelections(1);
    }
  }, [selectionMode]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    onSave({
      name,
      description,
      selectionMode: Number(selectionMode),
      minimumSelections: Number(minimumSelections),
      maximumSelections: Number(maximumSelections),
      minimumActiveChoices: category?.minimumActiveChoices ?? 10,
      isActive,
      displayOrder: Number(displayOrder),
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Category Name
        </label>

        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          placeholder="e.g. Funeral Services"
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          placeholder="Describe this package category..."
        />
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Selection Mode
        </label>

        <select
          value={selectionMode}
          onChange={(e) => setSelectionMode(Number(e.target.value))}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value={0}>Optional Single</option>
          <option value={1}>Required Single</option>
          <option value={2}>Optional Multiple</option>
          <option value={3}>Required Multiple</option>
        </select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Minimum Selections
          </label>

          <input
            type="number"
            min={selectionMode === 3 ? 1 : 0}
            value={minimumSelections}
            onChange={(e) =>
              setMinimumSelections(Number(e.target.value))
            }
            disabled={selectionMode === 0 || selectionMode === 1}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Maximum Selections
          </label>

          <input
            type="number"
            min={1}
            value={maximumSelections}
            onChange={(e) =>
              setMaximumSelections(Number(e.target.value))
            }
            disabled={selectionMode === 0 || selectionMode === 1}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm disabled:bg-gray-100"
          />
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Display Order
        </label>

        <input
          type="number"
          min={0}
          value={displayOrder}
          onChange={(e) =>
            setDisplayOrder(Number(e.target.value))
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        />
      </div>

      {isEditing && (
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) => setIsActive(e.target.checked)}
            className="h-4 w-4"
          />
          Category is active
        </label>
      )}

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>

        <Button type="submit">
          {isEditing ? "Save Changes" : "Create Category"}
        </Button>
      </div>
    </form>
  );
}