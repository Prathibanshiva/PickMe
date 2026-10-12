export type UserRole = "passenger" | "driver" | "admin";

export interface AdminUser {
  id: string;
  phoneNumber: string;
  name?: string;
  email?: string;
  role: UserRole;
  isBlocked?: boolean;
  isSuspended?: boolean;
  createdAt?: string;
}

export interface AdminSession {
  token: string;
  admin: AdminUser;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  token?: string;
  user?: {
    id: string;
    phoneNumber: string;
    name?: string;
    email?: string;
    defaultRole?: string;
    isBlocked?: boolean;
    isSuspended?: boolean;
  };
  admin?: AdminUser;
  code?: string;
  data?: T;
}

export interface ApiError {
  message: string;
  code?: string;
  status?: number;
}
