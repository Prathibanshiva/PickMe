import API_BASE_URL from "@/services/api";
import { getAuthSession } from "@/services/auth.service";

export interface DriverProfile {
  id: string;
  userId: string;

  verificationStatus:
    | "pending"
    | "approved"
    | "rejected";

  rejectionReason: string;
  rejectionCode?: string;

  profilePhoto: string;

  aadhaarDocument: string;

  drivingLicenceDocument: string;

  vehicleType:
    | "bike"
    | "auto"
    | "car"
    | "sedan"
    | "suv"
    | null;

  vehicleNumber: string;

  vehiclePhoto: string;

  verifiedAt: string | null;

  createdAt: string;

  updatedAt: string;
}

export interface SubmitDriverProfilePayload {
  driverName: string;
  profilePhoto: string;
  aadhaarDocument: string;
  drivingLicenceDocument: string;
  vehicleType:
    | "bike"
    | "auto"
    | "car"
    | "sedan"
    | "suv";
  vehicleNumber: string;
  vehiclePhoto: string;
}

export async function createOrGetDriverProfile(): Promise<DriverProfile> {
  const session = await getAuthSession();

  if (!session?.token) {
    throw new Error(
      "Authentication session not found."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/driver/profile`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to create driver profile."
    );
  }

  return data.driverProfile;
}

export async function submitDriverProfile(
  payload: SubmitDriverProfilePayload
): Promise<DriverProfile> {
  const session = await getAuthSession();

  if (!session?.token) {
    throw new Error(
      "Authentication session not found."
    );
  }

  const response = await fetch(
    `${API_BASE_URL}/api/driver/profile`,
    {
      method: "PUT",

      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.token}`,
      },

      body: JSON.stringify(payload),
    }
  );

  const data = await response.json();

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Unable to submit driver profile."
    );
  }

  return data.driverProfile;
}

export type DriverProfileStatus =
  | { state: "not_found" }
  | { state: "incomplete"; profile: DriverProfile }
  | { state: "pending"; profile: DriverProfile }
  | { state: "rejected"; rejectionReason: string; rejectionCode: string; profile: DriverProfile }
  | { state: "approved"; profile: DriverProfile };

export async function getDriverProfileStatus(): Promise<DriverProfileStatus> {
  const session = await getAuthSession();

  if (!session?.token) {
    throw new Error("Authentication session not found.");
  }

  const response = await fetch(`${API_BASE_URL}/api/driver/profile`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${session.token}`,
    },
  });

  if (response.status === 404) {
    return { state: "not_found" };
  }

  if (!response.ok) {
    let errorMessage = "Unable to fetch driver profile.";
    try {
      const errData = await response.json();
      if (errData?.message) errorMessage = errData.message;
    } catch {
      // Keep default error message
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  const profile: DriverProfile = data.driverProfile;

  // Verify that all required onboarding fields are present
  const isComplete = Boolean(
    profile.profilePhoto &&
    profile.aadhaarDocument &&
    profile.drivingLicenceDocument &&
    profile.vehicleType &&
    profile.vehicleNumber &&
    profile.vehiclePhoto
  );

  if (!isComplete) {
    return { state: "incomplete", profile };
  }

  if (profile.verificationStatus === "approved") {
    return { state: "approved", profile };
  }

  if (profile.verificationStatus === "rejected") {
    return {
      state: "rejected",
      rejectionReason: profile.rejectionReason || "Your verification documents were not approved.",
      rejectionCode: profile.rejectionCode || "",
      profile,
    };
  }

  return { state: "pending", profile };
}