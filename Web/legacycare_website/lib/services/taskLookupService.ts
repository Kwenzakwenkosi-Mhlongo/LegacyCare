import { apiFetch } from "../api";
import type {
  StaffLookupResponse,
  DeceasedLookupResponse,
  EventLookupResponse,
} from "@/types/task";
import { API_BASE_URL } from "../config";

async function parseResponse<T>(
  response: Response,
  fallbackMessage: string
): Promise<T> {
  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || fallbackMessage);
  }

  return response.json() as Promise<T>;
}

export async function getStaffLookup(): Promise<StaffLookupResponse[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/Staff/lookup`,  // ← FIXED: /lookup
    {
      method: "GET",
    }
  );

  return parseResponse<StaffLookupResponse[]>(
    response,
    "Unable to retrieve staff."
  );
}

export async function getDeceasedLookup(): Promise<DeceasedLookupResponse[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/Deceased/lookup`,
    {
      method: "GET",
    }
  );

  return parseResponse<DeceasedLookupResponse[]>(
    response,
    "Unable to retrieve deceased records."
  );
}

export async function getEventLookup(): Promise<EventLookupResponse[]> {
  const response = await apiFetch(
    `${API_BASE_URL}/Event/lookup`,
    {
      method: "GET",
    }
  );

  return parseResponse<EventLookupResponse[]>(
    response,
    "Unable to retrieve events."
  );
}