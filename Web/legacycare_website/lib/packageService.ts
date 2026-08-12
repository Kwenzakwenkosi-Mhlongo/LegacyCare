import { apiFetch } from "./api";
import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/Package`;

export async function getPackages() {
  const response = await apiFetch(API_URL);

  if (!response.ok) {
    throw new Error("Failed to fetch packages");
  }

  return response.json();
}