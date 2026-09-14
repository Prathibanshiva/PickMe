// mobile-app/src/services/places.service.ts

import API_BASE_URL from "@/services/api";
import { getAuthSession } from "@/services/auth.service";
import { LocationPoint } from "@/types/ride.types";

export interface PlaceSuggestion {
  placeId: string;
  mainText: string;
  secondaryText: string;
  fullText: string;
}

interface AutocompleteApiResponse {
  success: boolean;
  suggestions?: PlaceSuggestion[];
  code?: string;
  message?: string;
}

interface PlaceDetailsApiResponse {
  success: boolean;
  place?: {
    placeId: string;
    title: string;
    formattedAddress: string;
    latitude: number;
    longitude: number;
  };
  code?: string;
  message?: string;
}

/**
 * Generates a standard RFC4122 v4 UUID for Google Places API (New) session tokens.
 */
export function generateSessionToken(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/**
 * Fetch destination suggestions through the PickMe backend Places API proxy.
 * Reuses the search session token and biases results with the passenger's real pickup location.
 */
export async function fetchPlaceSuggestions(
  input: string,
  sessionToken: string,
  pickupCoords?: { latitude: number; longitude: number }
): Promise<PlaceSuggestion[]> {
  if (!input || !input.trim()) {
    return [];
  }

  const session = await getAuthSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const response = await fetch(`${API_BASE_URL}/api/places/autocomplete`, {
    method: "POST",
    headers,
    body: JSON.stringify({
      input: input.trim(),
      sessionToken,
      latitude: pickupCoords?.latitude,
      longitude: pickupCoords?.longitude,
    }),
  });

  const data: AutocompleteApiResponse = await response.json();

  if (!response.ok || !data.success) {
    if (data.code === "PLACES_API_KEY_MISSING") {
      throw new Error(
        "Google Places backend service not configured. Please configure GOOGLE_PLACES_API_KEY in backend/.env"
      );
    }
    throw new Error(data.message || "Failed to fetch place suggestions from server");
  }

  return data.suggestions || [];
}

/**
 * Fetch detailed coordinates and formatted address for a selected place.
 * Completes the Places API (New) billing session using the same session token.
 */
export async function fetchPlaceDetails(
  placeId: string,
  sessionToken: string
): Promise<LocationPoint> {
  const session = await getAuthSession();
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (session?.token) {
    headers.Authorization = `Bearer ${session.token}`;
  }

  const url = `${API_BASE_URL}/api/places/${encodeURIComponent(
    placeId
  )}?sessionToken=${encodeURIComponent(sessionToken)}`;

  const response = await fetch(url, {
    method: "GET",
    headers,
  });

  const data: PlaceDetailsApiResponse = await response.json();

  if (!response.ok || !data.success || !data.place) {
    if (data.code === "PLACES_API_KEY_MISSING") {
      throw new Error(
        "Google Places backend service not configured. Please configure GOOGLE_PLACES_API_KEY in backend/.env"
      );
    }
    throw new Error(data.message || "Failed to fetch place details from server");
  }

  return {
    title: data.place.title,
    subtitle: data.place.formattedAddress,
    latitude: data.place.latitude,
    longitude: data.place.longitude,
    placeId: data.place.placeId,
  };
}
