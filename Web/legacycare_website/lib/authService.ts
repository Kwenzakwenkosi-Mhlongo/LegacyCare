import { API_BASE_URL } from "./config";

const API_URL = `${API_BASE_URL}/Authentication`;

export interface LoginResponse {
  token: string;
  expiration: string;
  fullName: string;
  email: string;
  role: string;
  userId: string;
  isActive: boolean;
  lastLogin: string;
}

export async function login(
  email: string,
  password: string
): Promise<LoginResponse> {

  const response = await fetch(`${API_URL}/login`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      email,
      password,
    }),
  });

  const responseText = await response.text();

  if (!response.ok) {
    let message = "Invalid email or password.";

    try {
      const errorData = JSON.parse(responseText);

      message =
        errorData.message ||
        errorData.title ||
        errorData.error ||
        message;
    } catch {
      if (responseText) {
        message = responseText;
      }
    }

    throw new Error(
      `${message} (HTTP ${response.status})`
    );
  }

  try {
    return JSON.parse(responseText);
  } catch {
    throw new Error("The server returned an invalid response.");
  }
}