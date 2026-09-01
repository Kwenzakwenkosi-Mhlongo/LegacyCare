// services/auth.ts

import AsyncStorage from "@react-native-async-storage/async-storage";

const TOKEN_KEY = "legacycare_access_token";
const USER_KEY = "legacycare_user";

export type StoredUser = {
  userId?: string;
  fullName?: string;
  email?: string;
  role?: string;
};

export async function saveAuth(
  token: string,
  user?: StoredUser | null
): Promise<void> {
  const cleanToken = token.trim();

  if (!cleanToken) {
    throw new Error(
      "Authentication token is empty."
    );
  }

  await AsyncStorage.setItem(
    TOKEN_KEY,
    cleanToken
  );

  if (user) {
    await AsyncStorage.setItem(
      USER_KEY,
      JSON.stringify(user)
    );
  } else {
    await AsyncStorage.removeItem(
      USER_KEY
    );
  }
}

export async function getToken(): Promise<string | null> {
  const token =
    await AsyncStorage.getItem(
      TOKEN_KEY
    );

  if (!token) {
    return null;
  }

  const cleanToken =
    token.trim();

  return cleanToken || null;
}

export async function requireToken(): Promise<string> {
  const token =
    await getToken();

  if (!token) {
    throw new Error(
      "You are not logged in. Please sign in again."
    );
  }

  return token;
}

export async function getStoredUser(): Promise<StoredUser | null> {
  const raw =
    await AsyncStorage.getItem(
      USER_KEY
    );

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(
      raw
    ) as StoredUser;
  } catch {
    await AsyncStorage.removeItem(
      USER_KEY
    );

    return null;
  }
}

export async function clearAuth(): Promise<void> {
  await AsyncStorage.multiRemove([
    TOKEN_KEY,
    USER_KEY,
  ]);
}

export async function isAuthenticated(): Promise<boolean> {
  const token =
    await getToken();

  return Boolean(token);
}