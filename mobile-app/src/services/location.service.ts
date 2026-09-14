// mobile-app/src/services/location.service.ts

import * as Location from "expo-location";
import { LocationPoint } from "@/types/ride.types";

export const BENGALURU_FALLBACK_LOCATION: LocationPoint = {
  title: "Koramangala 4th Block",
  subtitle: "Bengaluru, Karnataka (Fallback Location)",
  latitude: 12.9352,
  longitude: 77.6245,
};

/**
 * Requests device location permission and retrieves current GPS coordinates.
 * Uses native Android Geocoder (zero Google Web Service billing) to resolve address.
 */
export async function getCurrentPickupLocation(): Promise<LocationPoint> {
  try {
    const { status } = await Location.requestForegroundPermissionsAsync();

    if (status !== "granted") {
      console.warn("Location permission not granted, using fallback coordinates");
      return BENGALURU_FALLBACK_LOCATION;
    }

    const location = await Location.getCurrentPositionAsync({
      accuracy: Location.Accuracy.Balanced,
    });

    const { latitude, longitude } = location.coords;

    // Use native OS Geocoder (built-in Android/iOS, zero Google Geocoding API cost)
    const geocoded = await reverseGeocodeCoordinates(latitude, longitude);

    return {
      title: geocoded.title,
      subtitle: geocoded.subtitle,
      latitude,
      longitude,
    };
  } catch (error) {
    console.warn("Error getting current location, using fallback:", error);
    return BENGALURU_FALLBACK_LOCATION;
  }
}

/**
 * Reverse geocode coordinates into a human-readable title and subtitle
 * using the native device geocoder.
 */
export async function reverseGeocodeCoordinates(
  latitude: number,
  longitude: number
): Promise<{ title: string; subtitle: string }> {
  try {
    const addresses = await Location.reverseGeocodeAsync({
      latitude,
      longitude,
    });

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
  } catch (error) {
    console.warn("Native reverse geocoding failed:", error);
  }

  return {
    title: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
    subtitle: "Selected Map Coordinates",
  };
}
