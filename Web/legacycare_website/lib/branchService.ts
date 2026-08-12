import { apiFetch } from "./api";

const API_URL = "https://legacycare-backend.onrender.com/api/branch";

export async function getBranches() {
  const response = await apiFetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch branches");
  }

  return response.json();
}