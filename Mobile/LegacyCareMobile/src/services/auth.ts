// src/services/auth.ts

import {
  clearAuth,
  getToken as getRootToken,
  getStoredUser,
  saveAuth,
} from "../../services/auth";

export async function saveUser(
  user: any
): Promise<void> {
  const token =
    await getRootToken();

  if (!token) {
    throw new Error(
      "Cannot save user without an authentication token."
    );
  }

  await saveAuth(
    token,
    user
  );
}

export async function getUser(): Promise<any | null> {
  return getStoredUser();
}

export async function removeUser(): Promise<void> {
  await clearAuth();
}

export async function saveToken(
  token: string
): Promise<void> {
  const user =
    await getStoredUser();

  await saveAuth(
    token,
    user
  );
}

export async function getToken(): Promise<string | null> {
  return getRootToken();
}

export async function removeToken(): Promise<void> {
  await clearAuth();
}