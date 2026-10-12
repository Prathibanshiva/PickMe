import { apiClient, setStoredToken, removeStoredToken } from "./client";
import { AdminUser } from "../types/auth";

export interface AdminLoginResult {
  success: boolean;
  message: string;
  token: string;
  admin: AdminUser;
}

export interface AdminMeResult {
  success: boolean;
  message: string;
  admin: AdminUser;
}

/**
 * Direct email and password authentication for administrator portal.
 * Target: POST /api/admin/auth/login
 */
export async function loginAdmin(
  email: string,
  password: string
): Promise<AdminLoginResult> {
  const result = await apiClient<AdminLoginResult>("/api/admin/auth/login", {
    method: "POST",
    body: { email, password },
    requiresAuth: false,
  });

  if (!result.token) {
    throw {
      message: "Authentication token missing from server response.",
      status: 500,
    };
  }

  return result;
}

/**
 * Verify administrator clearance and role on the server.
 * Uses backend endpoint: GET /api/admin/me (protected by authenticate + requireAdmin)
 */
export async function fetchCurrentAdmin(): Promise<AdminUser> {
  const result = await apiClient<AdminMeResult>("/api/admin/me", {
    method: "GET",
    requiresAuth: true,
  });

  return result.admin;
}

/**
 * Store admin token in secure session storage.
 */
export function persistAdminToken(token: string): void {
  setStoredToken(token);
}

/**
 * Clear admin session.
 */
export function clearAdminSession(): void {
  removeStoredToken();
}
