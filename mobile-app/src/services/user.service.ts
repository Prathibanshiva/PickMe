import API_BASE_URL from "@/services/api";
import { getAuthSession } from "@/services/auth.service";
import { AuthUser } from "@/types/auth";

interface CurrentUserResponse {
  success: boolean;
  user: AuthUser;
}

export const getCurrentUser =
  async (): Promise<AuthUser> => {
    const session = await getAuthSession();

    if (!session) {
      throw new Error(
        "No authenticated session found."
      );
    }

    const response = await fetch(
      `${API_BASE_URL}/api/user/me`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${session.token}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data =
      (await response.json()) as
        | CurrentUserResponse
        | {
            success: false;
            message: string;
          };

    if (!response.ok) {
      throw new Error(
        "message" in data
          ? data.message
          : "Unable to retrieve current user."
      );
    }

    if (!("user" in data) || !data.user) {
      throw new Error(
        "Invalid user response from server."
      );
    }

    return data.user;
  };