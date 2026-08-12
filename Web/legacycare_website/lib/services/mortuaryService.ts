import { apiFetch } from "../api";
import { API_BASE_URL } from "../config";
import type { DeceasedStorageResponse, MortuaryUnitView, StorageResponse } from "@/types/mortuary";

export interface AssignStorageRequest {
  assignmentId: string;
  storageId: string;
  deceasedId: string;
  dateAssigned: string;
}

const STORAGE_API_URL = `${API_BASE_URL}/Storage`;
const ASSIGNMENT_API_URL = `${API_BASE_URL}/DeceasedStorage`;

async function getErrorMessage(
  response: Response,
  fallbackMessage: string
): Promise<string> {
  try {
    const contentType = response.headers.get("content-type");

    if (contentType?.includes("application/json")) {
      const data = await response.json();
      return data.message || data.title || fallbackMessage;
    }

    const message = await response.text();
    return message || fallbackMessage;
  } catch {
    return fallbackMessage;
  }
}

export async function getStorageUnits(): Promise<StorageResponse[]> {
  try {
    const response = await apiFetch(STORAGE_API_URL, {
      method: "GET",
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response, "Unable to retrieve storage units.");
      console.error("Storage API error:", response.status, errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log("Storage units loaded:", data.length);
    return data;
  } catch (error) {
    console.error("getStorageUnits error:", error);
    throw error;
  }
}

export async function getStorageAssignments(): Promise<DeceasedStorageResponse[]> {
  try {
    const response = await apiFetch(ASSIGNMENT_API_URL, {
      method: "GET",
    });

    if (!response.ok) {
      console.warn("Storage assignments API returned:", response.status);
      return [];
    }

    const data = await response.json();
    console.log("Storage assignments loaded:", data.length);
    return data;
  } catch (error) {
    console.error("getStorageAssignments error:", error);
    return [];
  }
}

export async function getMortuaryUnits(): Promise<MortuaryUnitView[]> {
  try {
    const [storageUnits, assignments] = await Promise.all([
      getStorageUnits(),
      getStorageAssignments(),
    ]);

    return storageUnits.map((storage) => {
      const activeAssignment = assignments.find(
        (assignment) =>
          assignment.storageId === storage.storageId &&
          assignment.dateRemoved == null
      );

      return {
        storageId: storage.storageId,
        unitNumber: storage.unitNumber,
        branchId: storage.branchId,
        isAvailable: storage.isAvailable,

        assignmentId: activeAssignment?.assignmentId ?? null,
        deceasedId: activeAssignment?.deceasedId ?? null,
        deceasedName: activeAssignment?.deceased?.fullName ?? null,
        dateAssigned: activeAssignment?.dateAssigned ?? null,
      };
    });
  } catch (error) {
    console.error("getMortuaryUnits error:", error);
    throw error;
  }
}

export async function assignStorage(data: AssignStorageRequest): Promise<DeceasedStorageResponse> {
  try {
    const response = await apiFetch(ASSIGNMENT_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Unable to assign the storage unit.")
      );
    }
    return response.json();
  } catch (error) {
    console.error("assignStorage error:", error);
    throw error;
  }
}

export async function releaseStorage(assignmentId: string): Promise<void> {
  try {
    const response = await apiFetch(`${ASSIGNMENT_API_URL}/${assignmentId}/release`, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Unable to release the storage unit.")
      );
    }
  } catch (error) {
    console.error("releaseStorage error:", error);
    throw error;
  }
}

export async function getAvailableStorageUnits(): Promise<StorageResponse[]> {
  try {
    const response = await apiFetch(`${STORAGE_API_URL}/available`, {
      method: "GET",
    });

    if (!response.ok) {
      console.warn("Available storage API returned:", response.status);
      return [];
    }

    const data = await response.json();
    console.log("Available storage units loaded:", data.length);
    return data;
  } catch (error) {
    console.error("getAvailableStorageUnits error:", error);
    return [];
  }
}