// mobile-app/src/services/location.service.ts
//
// Location & Geocoding service for PickMe passenger flows.
//
// GPS/permission: handled via expo-location (device native — no Google billing).
// Reverse geocoding & Places search: proxied through the PickMe backend
//   → which calls Google Maps Platform APIs using a server-side key.
//
// The backend URL is read from EXPO_PUBLIC_API_BASE_URL (set in .env).
// Falls back to Android-emulator 10.0.2.2 or iOS localhost when not set.

import { Platform } from "react-native";
import * as Location from "expo-location";
import { LocationPoint } from "@/types/ride.types";

// ─── Backend URL ──────────────────────────────────────────────────────────────

const API_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL || "").trim() ||
  (Platform.OS === "android" ? "http://10.0.2.2:5000" : "http://localhost:5000");

// ─── Fallback coordinate ──────────────────────────────────────────────────────

/** Used only when location permission is denied OR GPS times out. */
export const BENGALURU_FALLBACK_LOCATION: LocationPoint = {
  title: "Koramangala 4th Block",
  subtitle: "Bengaluru, Karnataka",
  latitude: 12.9352,
  longitude: 77.6245,
};

import { getAuthSession } from "@/services/auth.service";

// ─── Auth-header helper ───────────────────────────────────────────────────────

let _authToken: string | null = null;

/** Call this once after login so location service can attach the JWT. */
export function setLocationServiceAuthToken(token: string | null) {
  _authToken = token;
}

async function authHeaders(): Promise<Record<string, string>> {
  const h: Record<string, string> = { "Content-Type": "application/json" };
  let token = _authToken;
  if (!token) {
    try {
      const session = await getAuthSession();
      if (session?.token) {
        token = session.token;
        _authToken = token;
      }
    } catch {
      // Ignore SecureStore read errors in non-auth contexts
    }
  }
  if (token) h["Authorization"] = `Bearer ${token}`;
  return h;
}

// ─── GPS ──────────────────────────────────────────────────────────────────────

/**
 * Request foreground location permission if not already granted.
 * Returns the permission status.
 */
export async function requestLocationPermission(): Promise<Location.PermissionStatus> {
  const { status } = await Location.requestForegroundPermissionsAsync();
  return status;
}

/**
 * Returns the current permission status WITHOUT prompting the user.
 */
export async function getLocationPermissionStatus(): Promise<Location.PermissionStatus> {
  const { status } = await Location.getForegroundPermissionsAsync();
  return status;
}

/**
 * Get the device's current GPS coordinates.
 * Throws on failure — callers should handle permission-denied and timeout.
 */
export async function getDeviceCoordinates(): Promise<{
  latitude: number;
  longitude: number;
}> {
  const location = await Location.getCurrentPositionAsync({
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 0,
    distanceInterval: 0,
  });
  return {
    latitude: location.coords.latitude,
    longitude: location.coords.longitude,
  };
}

// ─── Reverse Geocoding (server proxy → Google Geocoding API) ──────────────────

/**
 * Convert GPS coordinates to a readable address using the backend proxy.
 * Falls back to native expo-location reverse geocoding if backend is unavailable,
 * and to coordinate strings as a last resort.
 * Never fabricates a location.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<{ title: string; subtitle: string }> {
  // Attempt 1: backend proxy (Google Geocoding API)
  try {
    const resp = await fetch(
      `${API_BASE_URL}/api/maps/reverse-geocode?lat=${latitude}&lng=${longitude}`,
      { headers: await authHeaders() }
    );
    if (resp.ok) {
      const data = await resp.json();
      if (data.success && data.address) {
        return {
          title: data.address.title || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
          subtitle: data.address.subtitle || "",
        };
      }
    }
  } catch {
    // Backend unreachable — fall through to native geocoder
  }

  // Attempt 2: native OS geocoder (expo-location, no Google billing)
  try {
    const addresses = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (addresses && addresses.length > 0) {
      const addr = addresses[0];
      const streetOrName =
        addr.name ||
        addr.street ||
        addr.district ||
        addr.subregion ||
        "Selected Location";
      const regionParts = [
        addr.district !== streetOrName ? addr.district : null,
        addr.city || addr.subregion,
        addr.region,
      ].filter(Boolean);
      return {
        title: streetOrName,
        subtitle: regionParts.join(", ") || "Selected on Map",
      };
    }
  } catch {
    // Native geocoding also failed
  }

  // Last resort: accurate coordinate string (not fabricated)
  return {
    title: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    subtitle: "Selected Map Coordinates",
  };
}

// ─── Full GPS + Geocoding Flow ────────────────────────────────────────────────

export type GetPickupResult =
  | { status: "ok"; location: LocationPoint }
  | { status: "permission_denied" }
  | { status: "unavailable"; error?: string }
  | { status: "timeout" };

/**
 * Request location permission (if needed), obtain GPS coordinates,
 * and reverse-geocode to a readable address.
 *
 * Returns a discriminated result — callers must handle all cases.
 * NEVER returns a fallback silently; the caller decides what to do.
 */
export async function getCurrentPickupLocation(): Promise<GetPickupResult> {
  try {
    // Check existing permission first to avoid repeated prompts
    let { status } = await Location.getForegroundPermissionsAsync();

    if (status === Location.PermissionStatus.UNDETERMINED) {
      const perm = await Location.requestForegroundPermissionsAsync();
      status = perm.status;
    }

    if (status !== Location.PermissionStatus.GRANTED) {
      return { status: "permission_denied" };
    }

    // Get GPS coordinates with a 10-second timeout
    const locationPromise = getDeviceCoordinates();
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("GPS_TIMEOUT")), 10000)
    );

    const coords = await Promise.race([locationPromise, timeoutPromise]);

    // Reverse geocode (best-effort, non-throwing)
    const geocoded = await reverseGeocodeCoordinates(
      coords.latitude,
      coords.longitude
    );

    return {
      status: "ok",
      location: {
        title: geocoded.title,
        subtitle: geocoded.subtitle,
        latitude: coords.latitude,
        longitude: coords.longitude,
      },
    };
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    if (msg === "GPS_TIMEOUT") {
      return { status: "timeout" };
    }
    return { status: "unavailable", error: msg };
  }
}

// ─── Places Autocomplete (server proxy → Google Places API New) ───────────────

export interface PlacePrediction {
  placeId: string;
  title: string;
  subtitle: string;
  description: string;
}

export type PlacesSearchResult =
  | { status: "ok"; predictions: PlacePrediction[] }
  | { status: "not_configured" }
  | { status: "error"; message: string };

/**
 * Search for places using the backend Google Places Autocomplete proxy.
 * sessiontoken should be a stable UUID for the current user's search session
 * (reused across autocomplete calls, sent once in getPlaceDetails to commit billing).
 */
export async function searchPlaces(
  input: string,
  opts: {
    sessiontoken?: string;
    lat?: number;
    lng?: number;
  } = {}
): Promise<PlacesSearchResult> {
  try {
    if (!input.trim()) return { status: "ok", predictions: [] };

    const params = new URLSearchParams({ input });
    if (opts.sessiontoken) params.set("sessiontoken", opts.sessiontoken);
    if (opts.lat != null && opts.lng != null) {
      params.set("lat", String(opts.lat));
      params.set("lng", String(opts.lng));
    }

    const resp = await fetch(
      `${API_BASE_URL}/api/maps/autocomplete?${params}`,
      { headers: await authHeaders() }
    );

    const data = await resp.json();

    if (resp.status === 503 && data.code === "MAPS_NOT_CONFIGURED") {
      return { status: "not_configured" };
    }

    if (!resp.ok || !data.success) {
      return {
        status: "error",
        message: data.message || "Places search failed.",
      };
    }

    return { status: "ok", predictions: data.predictions || [] };
  } catch {
    return { status: "error", message: "Network error during places search." };
  }
}

// ─── Place Details (server proxy → Google Places API New) ────────────────────

export type PlaceDetailsResult =
  | { status: "ok"; details: LocationPoint }
  | { status: "not_configured" }
  | { status: "error"; message: string };

/**
 * Fetch full details (coordinates + address) for a selected place ID.
 * Pass sessiontoken here to commit the Places billing session.
 */
export async function getPlaceDetails(
  placeId: string,
  sessiontoken?: string
): Promise<PlaceDetailsResult> {
  try {
    const params = new URLSearchParams({ place_id: placeId });
    if (sessiontoken) params.set("sessiontoken", sessiontoken);

    const resp = await fetch(
      `${API_BASE_URL}/api/maps/place-details?${params}`,
      { headers: await authHeaders() }
    );

    const data = await resp.json();

    if (resp.status === 503 && data.code === "MAPS_NOT_CONFIGURED") {
      return { status: "not_configured" };
    }

    if (!resp.ok || !data.success || !data.details) {
      return {
        status: "error",
        message: data.message || "Could not load place details.",
      };
    }

    const { name, formattedAddress, latitude, longitude, placeId: id } =
      data.details;

    return {
      status: "ok",
      details: {
        title: name || formattedAddress,
        subtitle: formattedAddress || "",
        latitude,
        longitude,
        placeId: id,
      },
    };
  } catch {
    return {
      status: "error",
      message: "Network error fetching place details.",
    };
  }
}
