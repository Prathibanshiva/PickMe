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