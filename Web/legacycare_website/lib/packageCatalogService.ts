import { apiFetch } from "./api";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/package-catalog`;

/* =========================
   TYPES
========================= */

export interface PackageItemCategory {
    categoryId: string;
    name: string;
    description: string;
    selectionMode: number;
    minimumSelections: number;
    maximumSelections: number;
    minimumActiveChoices: number;
    isActive: boolean;
    displayOrder: number;
    dateCreated: string;
    items?: PackageItem[];
}

export interface PackageItem {
    packageItemId: string;
    categoryId: string;
    name: string;
    description: string;
    serviceValue: number;
    monthlyPremiumContribution: number;
    imageBlobName?: string | null;
    isActive: boolean;
    displayOrder: number;
    dateCreated: string;
    dateUpdated?: string | null;
    category?: PackageItemCategory | null;
}

/* =========================
   CATEGORIES
========================= */

export async function getPackageCategories() {
    const response = await apiFetch(`${API_URL}/categories`);

    if (!response.ok) {
        throw new Error("Failed to fetch package categories");
    }

    return response.json();
}

export async function getPackageCategory(categoryId: string) {
    const response = await apiFetch(
        `${API_URL}/categories/${categoryId}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch package category");
    }

    return response.json();
}

export async function createPackageCategory(
    category: Omit<PackageItemCategory, "categoryId" | "dateCreated" | "items">
) {
    const response = await apiFetch(`${API_URL}/categories`, {
        method: "POST",
        body: JSON.stringify(category),
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function updatePackageCategory(
    categoryId: string,
    category: Omit<PackageItemCategory, "categoryId" | "dateCreated" | "items">
) {
    const response = await apiFetch(
        `${API_URL}/categories/${categoryId}`,
        {
            method: "PUT",
            body: JSON.stringify(category),
        }
    );

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function deletePackageCategory(categoryId: string) {
    const response = await apiFetch(
        `${API_URL}/categories/${categoryId}`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return true;
}

/* =========================
   ITEMS
========================= */

export async function getPackageItems(categoryId?: string) {
    const url = categoryId
        ? `${API_URL}/items?categoryId=${encodeURIComponent(categoryId)}`
        : `${API_URL}/items`;

    const response = await apiFetch(url);

    if (!response.ok) {
        throw new Error("Failed to fetch package items");
    }

    return response.json();
}

export async function getPackageItem(packageItemId: string) {
    const response = await apiFetch(
        `${API_URL}/items/${packageItemId}`
    );

    if (!response.ok) {
        throw new Error("Failed to fetch package item");
    }

    return response.json();
}

export async function createPackageItem(
    item: Omit<
        PackageItem,
        "packageItemId" | "dateCreated" | "dateUpdated" | "category"
    >
) {
    const response = await apiFetch(`${API_URL}/items`, {
        method: "POST",
        body: JSON.stringify(item),
    });

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function updatePackageItem(
    packageItemId: string,
    item: Omit<
        PackageItem,
        "packageItemId" | "dateCreated" | "dateUpdated" | "category"
    >
) {
    const response = await apiFetch(
        `${API_URL}/items/${packageItemId}`,
        {
            method: "PUT",
            body: JSON.stringify(item),
        }
    );

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function deletePackageItem(packageItemId: string) {
    const response = await apiFetch(
        `${API_URL}/items/${packageItemId}`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return true;
}

/* =========================
   ITEM PICTURES
========================= */

export async function uploadPackageItemPicture(
    packageItemId: string,
    file: File
) {
    const formData = new FormData();
    formData.append("file", file);

    const response = await apiFetch(
        `${API_URL}/items/${packageItemId}/picture`,
        {
            method: "POST",
            body: formData,
        }
    );

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return response.json();
}

export async function deletePackageItemPicture(
    packageItemId: string
) {
    const response = await apiFetch(
        `${API_URL}/items/${packageItemId}/picture`,
        {
            method: "DELETE",
        }
    );

    if (!response.ok) {
        const errorMessage = await response.text();
        throw new Error(errorMessage);
    }

    return true;
}