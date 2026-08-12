export interface AuthUser {
  token: string;
  fullName: string;
  email: string;
  role: string;
}

export function saveAuth(user: AuthUser) {
  if (typeof window === "undefined") return;
  localStorage.setItem("auth", JSON.stringify(user));
}

export function getAuth(): AuthUser | null {
  if (typeof window === "undefined") return null;
  
  const auth = localStorage.getItem("auth");
  if (!auth) return null;
  
  try {
    return JSON.parse(auth);
  } catch {
    return null;
  }
}

export function logout() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("auth");
}

export function getRole() {
  return getAuth()?.role ?? null;
}

export function getToken() {
  return getAuth()?.token ?? null;
}

export function isAuthenticated() {
  return !!getAuth();
}