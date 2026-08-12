import { apiFetch } from "./api";

const API_URL = "http://localhost:5224/api/branch";

export async function getBranches() {
  const response = await apiFetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch branches");
  }

  return response.json();
}