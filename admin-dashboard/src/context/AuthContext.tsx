import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { AdminUser, ApiError } from "../types/auth";
import {
  getStoredToken,
  removeStoredToken,
} from "../api/client";
import {
  loginAdmin,
  fetchCurrentAdmin,
  persistAdminToken,
  clearAdminSession,
} from "../api/auth";

export interface AuthContextValue {
  admin: AdminUser | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasAdminRole: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => void;
  clearError: () => void;
  refreshAdmin: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [token, setToken] = useState<string | null>(getStoredToken());
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Validate existing stored session on mount
  useEffect(() => {
    let isMounted = true;

    async function hydrateSession() {
      const storedToken = getStoredToken();
      if (!storedToken) {
        if (isMounted) {
          setIsLoading(false);
        }
        return;
      }

      try {
        const verifiedAdmin = await fetchCurrentAdmin();
        if (isMounted) {
          setAdmin(verifiedAdmin);
          setToken(storedToken);
          setError(null);
        }
      } catch (err: unknown) {
        // Token invalid, expired, or not an admin
        removeStoredToken();
        if (isMounted) {
          setAdmin(null);
          setToken(null);
          const apiErr = err as ApiError;
          if (apiErr.status === 403) {
            setError(
              apiErr.message ||
                "Your account does not have administrator privileges."
            );
          }
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    hydrateSession();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = useCallback(
    async (email: string, password: string): Promise<AdminUser> => {
      setError(null);
      setIsLoading(true);

      try {
        const result = await loginAdmin(email, password);
        const authToken = result.token;

        // Persist token in session storage
        persistAdminToken(authToken);
        setToken(authToken);
        setAdmin(result.admin);
        setIsLoading(false);

        return result.admin;
      } catch (err: unknown) {
        setIsLoading(false);
        const apiErr = err as ApiError;
        setError(apiErr.message || "Authentication failed. Please check credentials.");
        throw apiErr;
      }
    },
    []
  );

  const logout = useCallback(() => {
    clearAdminSession();
    setAdmin(null);
    setToken(null);
    setError(null);
  }, []);

  const refreshAdmin = useCallback(async () => {
    try {
      const verifiedAdmin = await fetchCurrentAdmin();
      setAdmin(verifiedAdmin);
    } catch {
      logout();
    }
  }, [logout]);

  const value: AuthContextValue = {
    admin,
    token,
    isLoading,
    isAuthenticated: !!admin && !!token,
    hasAdminRole: admin?.role === "admin",
    error,
    login,
    logout,
    clearError,
    refreshAdmin,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
