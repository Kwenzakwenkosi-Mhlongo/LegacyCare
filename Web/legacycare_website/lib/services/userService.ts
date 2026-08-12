import { API_BASE_URL } from "../config";
import { apiFetch } from "../api";

const API_URL = `${API_BASE_URL}/User`;

export interface UserProfile {
    userId: string;
    idNumber: string;
    fullName: string;
    email: string;
    role: string;
    cellNo: string;
    address: string;
    dateCreated: string;
    isActive: boolean;
    lastLogin?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export async function getProfile(): Promise<UserProfile> {
  const response = await apiFetch(`${API_URL}/profile`);

  if (!response.ok) {
    const responseBody = await response.text();

    throw new Error(
      responseBody ||
        `Profile request failed (${response.status} ${response.statusText})`
    );
  }

  return response.json();
}

export async function changePassword(request: ChangePasswordRequest): Promise<void> {
    const response = await apiFetch(`${API_URL}/profile/password`,
        {
            method: "PUT",
            body: JSON.stringify(request),
        }
    );
    if (!response.ok) {
        const error = await response.text();
        throw new Error(error || "Failed to change password");
    }
}
