
"use client";

import { useEffect, useState } from "react";

import ComponentCard from "@/components/common/ComponentCard";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import ReusableTable from "@/components/tables/ReusableTable";

import CategoryForm from "@/components/modals/admin/package/CategoryForm";
import PackageItemForm from "@/components/modals/admin/package/PackageItemForm";
import CatalogDeleteConfirmation from "@/components/modals/admin/package/CatalogDeleteConfirmation";

import {
  getPackageCategories,
  getPackageItems,
  createPackageCategory,
  updatePackageCategory,
  deletePackageCategory,
  createPackageItem,
  updatePackageItem,
  deletePackageItem,
} from "@/lib/packageCatalogService";

import { API_BASE_URL } from "@/lib/config";
import { getToken } from "@/lib/auth";

export default function AdminPackagesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);

  const [selectedCategory, setSelectedCategory] =
    useState<any>(null);

  const [loadingCategories, setLoadingCategories] =
    useState(true);

  const [loadingItems, setLoadingItems] =
    useState(false);

  const [error, setError] = useState("");

  const [showCategoryForm, setShowCategoryForm] =
    useState(false);

  const [editingCategory, setEditingCategory] =
    useState<any>(null);

  const [showItemForm, setShowItemForm] =
    useState(false);

  const [editingItem, setEditingItem] =
    useState<any>(null);

  const [deleteModal, setDeleteModal] =
    useState(false);

  const [deleteType, setDeleteType] =
    useState<"category" | "item">("category");

  const [itemToDelete, setItemToDelete] =
    useState<any>(null);

  const [itemImages, setItemImages] =
    useState<Record<string, string>>({});

  const [loadingImages, setLoadingImages] =
    useState<Record<string, boolean>>({});

  useEffect(() => {
    document.title = "Package Catalog";
    loadCategories();
  }, []);

  useEffect(() => {
    if (selectedCategory) {
      loadItems(selectedCategory.categoryId);
    } else {
      setItems([]);
      setItemImages({});
    }
  }, [selectedCategory]);

  useEffect(() => {
    loadItemImages(items);
  }, [items]);

  useEffect(() => {
    return () => {
      Object.values(itemImages).forEach((url) => {
        URL.revokeObjectURL(url);
      });
    };
  }, []);

  const loadCategories = async (
    categoryIdToSelect?: string
  ) => {
    try {
      setLoadingCategories(true);
      setError("");

      const data = await getPackageCategories();

      const sortedCategories = [...data].sort(
        (a: any, b: any) =>
          a.displayOrder - b.displayOrder
      );

      setCategories(sortedCategories);

      if (sortedCategories.length === 0) {
        setSelectedCategory(null);
        setItems([]);
        return;
      }

      if (categoryIdToSelect) {
        const category =
          sortedCategories.find(
            (item: any) =>
              item.categoryId === categoryIdToSelect
          );

        if (category) {
          setSelectedCategory(category);
          return;
        }
      }

      if (
        selectedCategory &&
        sortedCategories.some(
          (item: any) =>
            item.categoryId ===
            selectedCategory.categoryId
        )
      ) {
        const refreshedCategory =
          sortedCategories.find(
            (item: any) =>
              item.categoryId ===
              selectedCategory.categoryId
          );

        setSelectedCategory(refreshedCategory);
      } else {
        setSelectedCategory(
          sortedCategories[0]
        );
      }
    } catch (error: any) {
      console.error(error);

      setError(
        error.message ||
          "Failed to load package categories."
      );
    } finally {
      setLoadingCategories(false);
    }
  };

  const loadItems = async (
    categoryId: string
  ) => {
    try {
      setLoadingItems(true);
      setError("");

      const data =
        await getPackageItems(categoryId);

      const sortedItems = [...data].sort(
        (a: any, b: any) =>
          a.displayOrder - b.displayOrder
      );

      setItems(sortedItems);
    } catch (error: any) {
      console.error(error);

      setError(
        error.message ||
          "Failed to load package items."
      );
    } finally {
      setLoadingItems(false);
    }
  };

  const loadItemImages = async (
    packageItems: any[]
  ) => {
    const token = getToken();

    if (!token) {
      return;
    }

    for (const item of packageItems) {
      if (
        !item.imageBlobName ||
        !item.packageItemId
      ) {
        continue;
      }

      setLoadingImages((previous) => ({
        ...previous,
        [item.packageItemId]: true,
      }));

      try {
        const response = await fetch(
          `${API_BASE_URL}/package-catalog/items/${item.packageItemId}/picture`,
          {
            method: "GET",
            headers: {
              Accept: "image/*",
              Authorization: `Bearer ${token}`,
            },
            cache: "no-store",
          }
        );

        if (!response.ok) {
          continue;
        }

        const blob = await response.blob();

        if (!blob.type.startsWith("image/")) {
          continue;
        }

        const objectUrl =
          URL.createObjectURL(blob);

        setItemImages((previous) => {
          const oldUrl =
            previous[item.packageItemId];

          if (oldUrl) {
            URL.revokeObjectURL(oldUrl);
          }

          return {
            ...previous,
            [item.packageItemId]:
              objectUrl,
          };
        });
      } catch (error) {
        console.error(
          "Failed to load package item image:",
          error
        );
      } finally {
        setLoadingImages((previous) => ({
          ...previous,
          [item.packageItemId]: false,
        }));
      }
    }
  };

  const selectionModeLabel = (
    mode: number
  ) => {
    switch (mode) {
      case 0:
        return "Optional Single";

      case 1:
        return "Required Single";

      case 2:
        return "Optional Multiple";

      case 3:
        return "Required Multiple";

      default:
        return "Unknown";
    }
  };

  const handleCreateCategory =
    async (category: any) => {
      try {
        setError("");

        const createdCategory =
          await createPackageCategory(
            category
          );

        setShowCategoryForm(false);
        setEditingCategory(null);

        await loadCategories(
          createdCategory.categoryId
        );
      } catch (error: any) {
        console.error(error);

        setError(
          error.message ||
            "Failed to create category."
        );
      }
    };

  const handleUpdateCategory =
    async (category: any) => {
      if (!editingCategory) {
        return;
      }

      try {
        setError("");

        const updatedCategory =
          await updatePackageCategory(
            editingCategory.categoryId,
            category
          );

        setShowCategoryForm(false);
        setEditingCategory(null);

        await loadCategories(
          updatedCategory.categoryId
        );
      } catch (error: any) {
        console.error(error);

        setError(
          error.message ||
            "Failed to update category."
        );
      }
    };

  const handleDeleteCategory =
    async () => {
      if (!itemToDelete) {
        return;
      }

      try {
        setError("");

        await deletePackageCategory(
          itemToDelete.categoryId
        );

        setDeleteModal(false);
        setItemToDelete(null);

        await loadCategories();
      } catch (error: any) {
        console.error(error);

        setError(
          error.message ||
            "Failed to delete category."
        );
      }
    };

  const handleCreateItem =
    async (item: any) => {
      try {
        setError("");

        const createdItem =
          await createPackageItem(item);

        setShowItemForm(false);
        setEditingItem(null);

        await loadCategories(
          item.categoryId
        );

        await loadItems(
          item.categoryId
        );

        console.log(
          "Created package item:",
          createdItem
        );
      } catch (error: any) {
        console.error(error);

        setError(
          error.message ||
            "Failed to create package item."
        );
      }
    };

  const handleUpdateItem =
    async (item: any) => {
      if (!editingItem) {
        return;
      }

      try {
        setError("");

        const updatedItem =
          await updatePackageItem(
            editingItem.packageItemId,
            item
          );

        setShowItemForm(false);
        setEditingItem(null);

        await loadCategories(
          item.categoryId
        );

        await loadItems(
          item.categoryId
        );

        console.log(
          "Updated package item:",
          updatedItem
        );
      } catch (error: any) {
        console.error(error);

        setError(
          error.message ||
            "Failed to update package item."
        );
      }
    };

  const handleDeleteItem =
    async () => {
      if (!itemToDelete) {
        return;
      }

      try {
        setError("");

        await deletePackageItem(
          itemToDelete.packageItemId
        );

        setDeleteModal(false);
        setItemToDelete(null);

        if (selectedCategory) {
          await loadItems(
            selectedCategory.categoryId
          );

          await loadCategories(
            selectedCategory.categoryId
          );
        }
      } catch (error: any) {
        console.error(error);

        setError(
          error.message ||
            "Failed to delete package item."
        );
      }
    };

  const categoryColumns = [
    {
      key: "category",
      label: "Category",
      render: (row: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.name}
          </div>

          <div className="text-sm text-gray-500">
            {row.description ||
              "No description"}
          </div>
        </div>
      ),
    },

    {
      key: "selectionMode",
      label: "Selection",
      render: (row: any) => (
        <span className="text-sm text-gray-700">
          {selectionModeLabel(
            row.selectionMode
          )}
        </span>
      ),
    },

    {
      key: "status",
      label: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            row.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {row.isActive
            ? "Active"
            : "Inactive"}
        </span>
      ),
    },

    {
      key: "options",
      label: "Options",
    },
  ];

  const itemColumns = [
    {
      key: "picture",
      label: "Picture",
      render: (row: any) => {
        const imageUrl =
          itemImages[row.packageItemId];

        const isLoading =
          loadingImages[
            row.packageItemId
          ];

        if (isLoading) {
          return (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-xs text-gray-400">
                Loading
              </span>
            </div>
          );
        }

        if (!imageUrl) {
          return (
            <div className="flex h-14 w-14 items-center justify-center rounded-lg border border-gray-200 bg-gray-50">
              <span className="text-lg">
                🖼️
              </span>
            </div>
          );
        }

        return (
          <img
            src={imageUrl}
            alt={row.name}
            className="h-14 w-14 rounded-lg border border-gray-200 object-cover"
          />
        );
      },
    },

    {
      key: "item",
      label: "Item",
      render: (row: any) => (
        <div>
          <div className="font-medium text-gray-900">
            {row.name}
          </div>

          <div className="text-sm text-gray-500">
            {row.description ||
              "No description"}
          </div>
        </div>
      ),
    },

    {
      key: "serviceValue",
      label: "Service Value",
      render: (row: any) => (
        <span className="text-sm font-medium text-gray-700">
          R{" "}
          {Number(
            row.serviceValue
          ).toFixed(2)}
        </span>
      ),
    },

    {
      key: "monthlyPremiumContribution",
      label: "Monthly Premium",
      render: (row: any) => (
        <span className="text-sm font-medium text-gray-700">
          R{" "}
          {Number(
            row.monthlyPremiumContribution
          ).toFixed(2)}
        </span>
      ),
    },

    {
      key: "status",
      label: "Status",
      render: (row: any) => (
        <span
          className={`inline-flex rounded-full px-3 py-1 text-xs font-medium ${
            row.isActive
              ? "bg-green-100 text-green-700"
              : "bg-red-100 text-red-600"
          }`}
        >
          {row.isActive
            ? "Active"
            : "Inactive"}
        </span>
      ),
    },

    {
      key: "options",
      label: "Options",
    },
  ];

  return (
    <div className="space-y-6">
      <PageBreadcrumb pageTitle="Package Catalog" />

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {showCategoryForm && (
        <ComponentCard
          title={
            editingCategory
              ? "Edit Category"
              : "Add Category"
          }
          desc={
            editingCategory
              ? "Update the package category details."
              : "Create a new category for the package catalog."
          }
        >
          <CategoryForm
            category={editingCategory}
            onCancel={() => {
              setShowCategoryForm(
                false
              );
              setEditingCategory(null);
            }}
            onSave={
              editingCategory
                ? handleUpdateCategory
                : handleCreateCategory
            }
          />
        </ComponentCard>
      )}

      {showItemForm && (
        <ComponentCard
          title={
            editingItem
              ? "Edit Package Item"
              : "Add Package Item"
          }
          desc={
            editingItem
              ? "Update the package item details."
              : "Add a new item to the package catalog."
          }
        >
          <PackageItemForm
            item={editingItem}
            categories={categories}
            selectedCategoryId={
              selectedCategory?.categoryId
            }
            onCancel={() => {
              setShowItemForm(
                false
              );
              setEditingItem(null);
            }}
            onSave={
              editingItem
                ? handleUpdateItem
                : handleCreateItem
            }
          />
        </ComponentCard>
      )}

      {!showCategoryForm &&
        !showItemForm && (
          <div className="flex justify-end gap-3">
            <button
              onClick={() => {
                setEditingCategory(null);
                setShowCategoryForm(true);
              }}
              className="rounded-lg bg-teal-600 px-4 py-2 text-sm font-medium text-white hover:bg-teal-700"
            >
              + Add Category
            </button>

            <button
              onClick={() => {
                if (!selectedCategory) {
                  setError(
                    "Please create or select a category before adding an item."
                  );

                  return;
                }

                setError("");
                setEditingItem(null);
                setShowItemForm(true);
              }}
              className="rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
            >
              + Add Item
            </button>
          </div>
        )}

      <div className="grid grid-cols-12 gap-6">
        {/* CATEGORIES */}

        <div className="col-span-12 lg:col-span-5">
          <ComponentCard
            title="Package Categories"
            desc="Manage the categories available for custom packages."
          >
            {loadingCategories ? (
              <div className="py-12 text-center text-gray-500">
                Loading categories...
              </div>
            ) : categories.length ===
              0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  No package categories
                  have been created yet.
                </p>

                <p className="mt-2 text-sm text-gray-400">
                  Create a category
                  first, then add
                  package items to it.
                </p>
              </div>
            ) : (
              <ReusableTable
                columns={
                  categoryColumns
                }
                data={categories.map(
                  (category) => ({
                    ...category,
                    selected:
                      selectedCategory?.categoryId ===
                      category.categoryId,
                  })
                )}
                onRowClick={(
                  category
                ) => {
                  setSelectedCategory(
                    category
                  );
                }}
                onEdit={(category) => {
                  setSelectedCategory(
                    category
                  );

                  setEditingCategory(
                    category
                  );

                  setShowCategoryForm(
                    true
                  );
                }}
                onDelete={(category) => {
                  setDeleteType(
                    "category"
                  );

                  setItemToDelete(
                    category
                  );

                  setDeleteModal(
                    true
                  );
                }}
              />
            )}
          </ComponentCard>
        </div>

        {/* ITEMS */}

        <div className="col-span-12 lg:col-span-7">
          <ComponentCard
            title={
              selectedCategory
                ? `${selectedCategory.name} Items`
                : "Package Items"
            }
            desc={
              selectedCategory
                ? "Items available within the selected category."
                : "Select a category to view its items."
            }
          >
            {!selectedCategory ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  Select a category to
                  view its package
                  items.
                </p>
              </div>
            ) : loadingItems ? (
              <div className="py-12 text-center text-gray-500">
                Loading items...
              </div>
            ) : items.length === 0 ? (
              <div className="py-12 text-center">
                <p className="text-gray-500">
                  No items have been
                  added to this category
                  yet.
                </p>

                <button
                  onClick={() => {
                    setError("");
                    setEditingItem(
                      null
                    );
                    setShowItemForm(
                      true
                    );
                  }}
                  className="mt-4 rounded-lg bg-gray-800 px-4 py-2 text-sm font-medium text-white hover:bg-gray-900"
                >
                  + Add First Item
                </button>
              </div>
            ) : (
              <ReusableTable
                columns={itemColumns}
                data={items}
                onRowClick={(item) => {
                  console.log(
                    "Selected package item:",
                    item
                  );
                }}
                onEdit={(item) => {
                  setError("");
                  setEditingItem(
                    item
                  );
                  setShowItemForm(
                    true
                  );
                }}
                onDelete={(item) => {
                  setDeleteType("item");
                  setItemToDelete(
                    item
                  );
                  setDeleteModal(
                    true
                  );
                }}
              />
            )}
          </ComponentCard>
        </div>
      </div>

      <CatalogDeleteConfirmation
        isOpen={deleteModal}
        itemName={
          itemToDelete?.name ?? ""
        }
        itemType={deleteType}
        onCancel={() => {
          setDeleteModal(false);
          setItemToDelete(null);
        }}
        onConfirm={
          deleteType ===
          "category"
            ? handleDeleteCategory
            : handleDeleteItem
        }
      />
    </div>
  );
}
