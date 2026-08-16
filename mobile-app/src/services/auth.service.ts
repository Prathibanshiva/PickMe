import * as SecureStore from "expo-secure-store";

import {
  AuthSession,
  AuthUser,
  UserRole,
} from "@/types/auth";

const AUTH_TOKEN_KEY = "pickme_auth_token";
const AUTH_USER_KEY = "pickme_auth_user";
const AUTH_ROLE_KEY = "pickme_auth_role";

export const saveAuthSession = async (
  token: string,
  user: AuthUser,
  role: UserRole
): Promise<void> => {
  await SecureStore.setItemAsync(
    AUTH_TOKEN_KEY,
    token
  );

  await SecureStore.setItemAsync(
    AUTH_USER_KEY,
    JSON.stringify(user)
  );

  await SecureStore.setItemAsync(
    AUTH_ROLE_KEY,
    role
  );
};

export const getAuthSession =
  async (): Promise<AuthSession | null> => {
    const token = await SecureStore.getItemAsync(
      AUTH_TOKEN_KEY
    );

    const userJson = await SecureStore.getItemAsync(
      AUTH_USER_KEY
    );

    const role = await SecureStore.getItemAsync(
      AUTH_ROLE_KEY
    );

    if (!token || !userJson || !role) {
      return null;
    }

    try {
      const user = JSON.parse(
        userJson
      ) as AuthUser;

      if (
        role !== "passenger" &&
        role !== "driver"
      ) {
        return null;
      }

      return {
        token,
        user,
        role,
      };
    } catch (error) {
      console.error(
        "Failed to parse stored authentication session:",
        error
      );

      return null;
    }
  };

export const clearAuthSession =
  async (): Promise<void> => {
    await SecureStore.deleteItemAsync(
      AUTH_TOKEN_KEY
    );

    await SecureStore.deleteItemAsync(
      AUTH_USER_KEY
    );

    await SecureStore.deleteItemAsync(
      AUTH_ROLE_KEY
    );
  };