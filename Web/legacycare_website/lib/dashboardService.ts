import { apiFetch } from "./api";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/Dashboard`;

export async function getDashboardData() {
  const response = await apiFetch(API_URL, {
    method: "GET",
  });

  if (!response.ok) {
    const errorText = await response.text();

    if (response.status === 401) {
      throw new Error("Unauthorized. Please log in again.");
    }

    if (response.status === 403) {
      throw new Error(
        "You do not have permission to view the admin dashboard."
      );
    }

    if (response.status === 404) {
      throw new Error(
        "Dashboard API endpoint was not found. Please check the Azure backend deployment."
      );
    }

    throw new Error(
      errorText || `Dashboard request failed: ${response.status}`
    );
  }

  return response.json();
}