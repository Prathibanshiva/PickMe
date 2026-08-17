import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  clearAuthSession,
  getAuthSession,
} from "@/services/auth.service";

import { getCurrentUser } from "@/services/user.service";

import {
  AuthSession,
  AuthUser,
  UserRole,
} from "@/types/auth";

interface AuthContextValue {
  session: AuthSession | null;
  user: AuthUser | null;
  role: UserRole | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext =
  createContext<AuthContextValue | undefined>(
    undefined
  );

export function AuthProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [session, setSession] =
    useState<AuthSession | null>(null);

  const [isLoading, setIsLoading] =
    useState(true);

  const refreshSession =
    useCallback(async () => {
      setIsLoading(true);

      try {
        const storedSession =
          await getAuthSession();

        if (!storedSession) {
          setSession(null);
          return;
        }

        try {
          /*
           * The locally stored session is only a
           * starting point.
           *
           * The backend remains the source of truth.
           */
          const currentUser =
            await getCurrentUser();

          const validatedSession: AuthSession = {
            token: storedSession.token,
            user: currentUser,
            role: storedSession.role,
          };

          setSession(validatedSession);
        } catch (error) {
          console.error(
            "Stored session validation failed:",
            error
          );

          /*
           * If the server rejects the stored JWT,
           * remove the local session and return the
           * user to authentication.
           */
          await clearAuthSession();
          setSession(null);
        }
      } catch (error) {
        console.error(
          "Failed to restore authentication session:",
          error
        );

        setSession(null);
      } finally {
        setIsLoading(false);
      }
    }, []);

  const logout = useCallback(async () => {
    await clearAuthSession();
    setSession(null);
  }, []);

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  const value = useMemo(
    () => ({
      session,
      user: session?.user ?? null,
      role: session?.role ?? null,
      isLoading,
      isAuthenticated: !!session,
      refreshSession,
      logout,
    }),
    [
      session,
      isLoading,
      refreshSession,
      logout,
    ]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error(
      "useAuth must be used inside AuthProvider"
    );
  }

  return context;
}