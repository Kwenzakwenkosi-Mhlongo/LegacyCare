import { createContext, useContext, useEffect, useState } from "react";
import { getToken, getUser, removeToken, removeUser, saveToken, saveUser } from "../services/auth";

interface User {
    userId: string;
    fullName: string;
    email: string;
    role: string;
}

interface AuthContextType {
    user: User | null;
    loading: boolean;
    token: string | null;
    login: (user: User, token: string) => Promise<void>;
    logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: any) {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const storedUser = await getUser();
        const storedToken = await getToken();

        if (storedUser) {
            setUser(storedUser);
        }
        if (storedToken) {
            setToken(storedToken);
        }
        setLoading(false);
    };

    const login = async (userData: User, authToken: string) => {
        await saveUser(userData);
        await saveToken(authToken);
        setUser(userData);
        setToken(authToken);
    };

    const logout = async () => {
        await removeUser();
        await removeToken();
        setUser(null);
        setToken(null);
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

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error("useAuth must be used inside AuthProvider");
    }

    return context;
}