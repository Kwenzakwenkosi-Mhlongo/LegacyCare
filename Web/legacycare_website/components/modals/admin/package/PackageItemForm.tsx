
"use client";

import { useEffect, useState } from "react";

import Button from "@/components/ui/button/Button";
import PackageItemPicture from "./PackageItemPicture";

interface PackageItemFormProps {
  item?: any;
  categories: any[];
  selectedCategoryId?: string;
  onCancel: () => void;
  onSave: (item: any) => void;
}

export default function PackageItemForm({
  item,
  categories,
  selectedCategoryId,
  onCancel,
  onSave,
}: PackageItemFormProps) {
  const isEditing = !!item;

  const [categoryId, setCategoryId] = useState(
    item?.categoryId ?? selectedCategoryId ?? ""
  );

  const [name, setName] = useState(
    item?.name ?? ""
  );

  const [description, setDescription] = useState(
    item?.description ?? ""
  );

  const [serviceValue, setServiceValue] = useState(
    item?.serviceValue ?? ""
  );

  const [
    monthlyPremiumContribution,
    setMonthlyPremiumContribution,
  ] = useState(
    item?.monthlyPremiumContribution ?? ""
  );

  const [displayOrder, setDisplayOrder] = useState(
    item?.displayOrder ?? 0
  );

  const [isActive, setIsActive] = useState(
    item?.isActive ?? true
  );

  const [imageBlobName, setImageBlobName] = useState<
    string | null
  >(item?.imageBlobName ?? null);

  useEffect(() => {
    if (!item && selectedCategoryId) {
      setCategoryId(selectedCategoryId);
    }
  }, [selectedCategoryId, item]);

  useEffect(() => {
    setImageBlobName(
      item?.imageBlobName ?? null
    );
  }, [item]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!categoryId) {
      return;
    }

    onSave({
      categoryId,
      name: name.trim(),
      description: description.trim(),
      serviceValue: Number(serviceValue),
      monthlyPremiumContribution: Number(
        monthlyPremiumContribution
      ),
      displayOrder: Number(displayOrder),
      isActive,
      imageBlobName,
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      {/* CATEGORY */}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Category
        </label>

        <select
          value={categoryId}
          onChange={(e) =>
            setCategoryId(e.target.value)
          }
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">
            Select a category
          </option>

          {categories.map((category) => (
            <option
              key={category.categoryId}
              value={category.categoryId}
            >
              {category.name}
            </option>
          ))}
        </select>
      </div>

      {/* ITEM NAME */}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Item Name
        </label>

        <input
          type="text"
          value={name}
          onChange={(e) =>
            setName(e.target.value)
          }
          required
          maxLength={150}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          placeholder="e.g. Standard Coffin"
        />
      </div>

      {/* DESCRIPTION */}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Description
        </label>

        <textarea
          value={description}
          onChange={(e) =>
            setDescription(e.target.value)
          }
          maxLength={1000}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          placeholder="Describe what this package item provides..."
        />
      </div>

      {/* VALUES */}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {/* SERVICE VALUE */}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Service Value
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              R
            </span>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={serviceValue}
              onChange={(e) =>
                setServiceValue(e.target.value)
              }
              required
              className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Value of the service or benefit provided.
          </p>
        </div>

        {/* MONTHLY PREMIUM */}

        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Monthly Premium Contribution
          </label>

          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-500">
              R
            </span>

            <input
              type="number"
              min="0.01"
              step="0.01"
              value={
                monthlyPremiumContribution
              }
              onChange={(e) =>
                setMonthlyPremiumContribution(
                  e.target.value
                )
              }
              required
              className="w-full rounded-lg border border-gray-300 py-2 pl-8 pr-3 text-sm focus:border-teal-500 focus:outline-none"
              placeholder="0.00"
            />
          </div>

          <p className="mt-1 text-xs text-gray-500">
            Amount added to the client's monthly premium.
          </p>
        </div>
      </div>

      {/* DISPLAY ORDER */}

      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Display Order
        </label>

        <input
          type="number"
          min="0"
          value={displayOrder}
          onChange={(e) =>
            setDisplayOrder(
              Number(e.target.value)
            )
          }
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
          placeholder="0"
        />

        <p className="mt-1 text-xs text-gray-500">
          Lower numbers appear first.
        </p>
      </div>

      {/* ACTIVE */}

      {isEditing && (
        <label className="flex items-center gap-3 text-sm text-gray-700">
          <input
            type="checkbox"
            checked={isActive}
            onChange={(e) =>
              setIsActive(e.target.checked)
            }
            className="h-4 w-4"
          />

          Item is active
        </label>
      )}

      {/* PICTURE */}

      {isEditing && (
        <div className="border-t border-gray-100 pt-5">
          <PackageItemPicture
            packageItemId={
              item.packageItemId
            }
            imageBlobName={imageBlobName}
            onImageChange={(newImage) => {
              setImageBlobName(newImage);
            }}
          />
        </div>
      )}

      {/* ACTIONS */}

      <div className="flex justify-end gap-3 border-t border-gray-100 pt-5">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100"
        >
          Cancel
        </button>

        <Button type="submit">
          {isEditing
            ? "Save Changes"
            : "Create Item"}
        </Button>
      </div>
    </form>
  );
}
