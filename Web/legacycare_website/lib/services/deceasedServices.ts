import { apiFetch } from "../api";
import { API_BASE_URL } from "../config";

import type {
  CreateDeceasedRequest,
  DeceasedResponse,
  UpdateDeceasedRequest,
} from "@/types/deceased";

const API_URL = `${API_BASE_URL}/Deceased`;

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

export async function getDeceasedRecords(): Promise<DeceasedResponse[]> {
  try {
    const response = await apiFetch(API_URL, {
      method: "GET",
    });

    if (!response.ok) {
      const errorMsg = await getErrorMessage(response, "Unable to retrieve deceased records.");
      console.error("Deceased API error:", response.status, errorMsg);
      throw new Error(errorMsg);
    }

    const data = await response.json();
    console.log("Deceased records loaded:", data.length);
    return data;
  } catch (error) {
    console.error("getDeceasedRecords error:", error);
    throw error;
  }
}

export async function getDeceasedById(deceasedId: string): Promise<DeceasedResponse> {
  try {
    const response = await apiFetch(`${API_URL}/${deceasedId}`, {
      method: "GET",
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Unable to retrieve the deceased record.")
      );
    }

    return response.json();
  } catch (error) {
    console.error("getDeceasedById error:", error);
    throw error;
  }
}

export async function createDeceased(data: CreateDeceasedRequest): Promise<DeceasedResponse> {
  try {
    const response = await apiFetch(API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Unable to create the deceased record.")
      );
    }

    return response.json();
  } catch (error) {
    console.error("createDeceased error:", error);
    throw error;
  }
}

export async function updateDeceased(
  deceasedId: string,
  data: UpdateDeceasedRequest
): Promise<DeceasedResponse> {
  try {
    const response = await apiFetch(`${API_URL}/${deceasedId}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Unable to update the deceased record.")
      );
    }

    return response.json();
  } catch (error) {
    console.error("updateDeceased error:", error);
    throw error;
  }
}

export async function releaseDeceased(deceasedId: string): Promise<void> {
  try {
    const response = await apiFetch(`${API_URL}/${deceasedId}/release`, {
      method: "PUT",
    });

    if (!response.ok) {
      throw new Error(
        await getErrorMessage(response, "Unable to release the deceased record.")
      );
    }
  } catch (error) {
    console.error("releaseDeceased error:", error);
    throw error;
  }
}