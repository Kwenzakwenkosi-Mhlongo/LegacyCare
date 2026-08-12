import { getToken } from "./auth";

export async function apiFetch(url: string, options: RequestInit = {}) {
  const token = getToken();

  console.log("=== API FETCH ===");
  console.log("URL:", url);
  console.log("Token:", token ? "Present" : "MISSING");

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers: headers as HeadersInit,
  });

  console.log("Response status:", response.status);

  if (!response.ok) {
    const text = await response.text();
    console.error("Error response:", text);
    throw new Error(`HTTP ${response.status}: ${text}`);
  }

  return response;
}