export interface AuthUser {
  token: string;
  fullName: string;
  email: string;
  role: string;
  userId: string;
  isActive: boolean;
  lastLogin?: string;
}

/**
 * Save authenticated user information.
 */
export function saveAuth(user: AuthUser): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.setItem("auth", JSON.stringify(user));
  } catch (error) {
    console.error("[Auth] Failed to save authentication:", error);
  }
}

/**
 * Get authenticated user information.
 */
export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;

  const auth = localStorage.getItem("auth");

  if (!auth) {
    return null;
  }

  try {
    const parsed: AuthUser = JSON.parse(auth);

    // Make sure the stored object actually contains a token.
    if (!parsed || !parsed.token) {
      console.warn("[Auth] Stored authentication does not contain a token.");
      return null;
    }

    return parsed;
  } catch (error) {
    console.error("[Auth] Invalid authentication data:", error);

    // Remove only corrupted authentication data.
    localStorage.removeItem("auth");

    return null;
  }
}

/**
 * Log the user out.
 *
 * This should ONLY be called when we intentionally want
 * to terminate the user's session.
 */
export function logout(): void {
  if (typeof window === "undefined") return;

  localStorage.removeItem("auth");
}

/**
 * Get the current user's role.
 */
export function getRole(): string | null {
  const auth = getAuth();
  return auth?.role ?? null;
}

/**
 * Get the JWT token.
 */
export function getToken(): string | null {
  const auth = getAuth();
  return auth?.token ?? null;
}

/**
 * Get the current user's ID.
 */
export function getUserId(): string | null {
  const auth = getAuth();
  return auth?.userId ?? null;
}

/**
 * Get the current user's email.
 */
export function getUserEmail(): string | null {
  const auth = getAuth();
  return auth?.email ?? null;
}

/**
 * Get the current user's full name.
 */
export function getFullName(): string | null {
  const auth = getAuth();
  return auth?.fullName ?? null;
}

/**
 * Check whether authentication exists.
 */
export function isAuthenticated(): boolean {
  const auth = getAuth();

  return !!(
    auth &&
    auth.token &&
    auth.userId &&
    auth.role
  );
}

/**
 * Get the Authorization header.
 *
 * Use this for API requests:
 *
 * headers: {
 *   ...getAuthHeaders(),
 *   "Content-Type": "application/json"
 * }
 */
export function getAuthHeaders(): Record<string, string> {
  const token = getToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
}

/**
 * Get authentication information for debugging.
 *
 * Does NOT expose the actual JWT token.
 */
export function getAuthDebugInfo() {
  const auth = getAuth();

  if (!auth) {
    return {
      authenticated: false,
      hasToken: false,
      userId: null,
      role: null,
    };
  }

  return {
    authenticated: true,
    hasToken: !!auth.token,
    userId: auth.userId,
    role: auth.role,
    email: auth.email,
  };
}