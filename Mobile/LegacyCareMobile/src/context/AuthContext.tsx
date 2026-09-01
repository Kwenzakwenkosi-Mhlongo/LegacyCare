// src/context/AuthContext.tsx

import {
    createContext,
    ReactNode,
    useContext,
    useEffect,
    useState,
} from "react";

import {
    clearAuth,
    getStoredUser,
    getToken,
    saveAuth,
} from "../../services/auth";

export interface User {
  userId: string;
  fullName: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  token: string | null;

  login: (
    user: User,
    token: string
  ) => Promise<void>;

  logout: () => Promise<void>;
}

interface AuthProviderProps {
  children: ReactNode;
}

const AuthContext =
  createContext<
    AuthContextType | undefined
  >(undefined);

function isValidStoredUser(
  value: unknown
): value is User {
  if (
    typeof value !== "object" ||
    value === null
  ) {
    return false;
  }

  const candidate =
    value as Partial<User>;

  return Boolean(
    candidate.userId?.trim() &&
      candidate.fullName?.trim() &&
      candidate.email?.trim() &&
      candidate.role?.trim()
  );
}

export function AuthProvider({
  children,
}: AuthProviderProps) {
  const [
    user,
    setUser,
  ] =
    useState<User | null>(
      null
    );

  const [
    token,
    setToken,
  ] =
    useState<
      string | null
    >(null);

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  useEffect(() => {
    const loadSession =
      async (): Promise<void> => {
        try {
          const [
            storedUser,
            storedToken,
          ] =
            await Promise.all([
              getStoredUser(),
              getToken(),
            ]);

          if (
            storedUser &&
            storedToken &&
            isValidStoredUser(
              storedUser
            )
          ) {
            setUser(
              storedUser
            );

            setToken(
              storedToken
            );

            return;
          }

          await clearAuth();

          setUser(null);
          setToken(null);
        } catch (error) {
          console.log(
            "[AUTH CONTEXT] Failed to restore session:",
            error
          );

          setUser(null);
          setToken(null);
        } finally {
          setLoading(
            false
          );
        }
      };

    void loadSession();
  }, []);

  const login =
    async (
      userData: User,
      authToken: string
    ): Promise<void> => {
      const cleanToken =
        authToken.trim();

      if (!cleanToken) {
        throw new Error(
          "Authentication token is required."
        );
      }

      await saveAuth(
        cleanToken,
        userData
      );

      setUser(
        userData
      );

      setToken(
        cleanToken
      );
    };

  const logout =
    async (): Promise<void> => {
      try {
        await clearAuth();
      } finally {
        setUser(null);
        setToken(null);
      }
    };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        token,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context =
    useContext(
      AuthContext
    );

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider."
    );
  }

  return context;
}