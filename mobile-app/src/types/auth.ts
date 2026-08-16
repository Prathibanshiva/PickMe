export type UserRole = "passenger" | "driver";

export interface AuthUser {
  id: string;
  phoneNumber: string;
  name: string;
  email: string;
  gender: "Male" | "Female" | "Other" | null;
  defaultRole: UserRole;
  isBlocked: boolean;
  isSuspended: boolean;
}

export interface AuthSession {
  token: string;
  user: AuthUser;
  role: UserRole;
}