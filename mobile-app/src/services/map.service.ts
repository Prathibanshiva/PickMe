// mobile-app/src/services/map.service.ts
//
// Map service abstraction.
// Previously based on MapLibre; now provides helpers for react-native-maps
// (Google Maps provider). All MapLibre-specific types removed.

import type MapView from "react-native-maps";

// ─── Coordinate Types ────────────────────────────────────────────────────────

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapMarkerPoint extends GeoCoordinates {
  title?: string;
  subtitle?: string;
}

// ─── Region Helpers ──────────────────────────────────────────────────────────

/** Default region latitude/longitude delta for a street-level view. */
export const DEFAULT_DELTA = { latitudeDelta: 0.015, longitudeDelta: 0.015 };

/** Route/multi-point overview delta. */
export const ROUTE_DELTA = { latitudeDelta: 0.08, longitudeDelta: 0.08 };

/** Fallback map center (Koramangala 4th Block, Bengaluru). */
export const DEFAULT_MAP_CENTER: GeoCoordinates = {
  latitude: 12.9352,
  longitude: 77.6245,
};

/** Construct a react-native-maps Region from a coordinate + delta. */
export function toRegion(
  coords: GeoCoordinates,
  delta: { latitudeDelta: number; longitudeDelta: number } = DEFAULT_DELTA
) {
  return {
    latitude: coords.latitude,
    longitude: coords.longitude,
    ...delta,
  };
}

// ─── Bounding-Box / Fit Helpers ───────────────────────────────────────────────

/**
 * Calculate the minimal bounding region that contains all given coordinates.
 * Used to frame pickup + destination together in route/booked/live views.
 */
export function calculateFitRegion(
  points: GeoCoordinates[],
  paddingFraction = 0.15
) {
  if (!points || points.length === 0) {
    return toRegion(DEFAULT_MAP_CENTER, ROUTE_DELTA);
  }

  let minLat = points[0].latitude;
  let maxLat = points[0].latitude;
  let minLng = points[0].longitude;
  let maxLng = points[0].longitude;

  for (const pt of points) {
    if (pt.latitude < minLat) minLat = pt.latitude;
    if (pt.latitude > maxLat) maxLat = pt.latitude;
    if (pt.longitude < minLng) minLng = pt.longitude;
    if (pt.longitude > maxLng) maxLng = pt.longitude;
  }

  const latDelta = Math.max(maxLat - minLat, 0.01);
  const lngDelta = Math.max(maxLng - minLng, 0.01);
  const pad = paddingFraction;

  return {
    latitude: (minLat + maxLat) / 2,
    longitude: (minLng + maxLng) / 2,
    latitudeDelta: latDelta * (1 + pad * 2),
    longitudeDelta: lngDelta * (1 + pad * 2),
  };
}

// ─── MapService Object ────────────────────────────────────────────────────────

/**
 * MapService: Modular abstraction for Google Maps (react-native-maps) operations.
 * Decouples passenger and driver business logic from mapping library specifics.
 */
export const MapService = {
  toRegion,
  calculateFitRegion,
  DEFAULT_MAP_CENTER,
  DEFAULT_DELTA,
  ROUTE_DELTA,

  /**
   * Animate the map camera to a target location.
   * mapRef is the React ref attached to <MapView ref={mapRef} />.
   */
  animateTo(
    mapRef: React.RefObject<MapView | null>,
    coords: GeoCoordinates,
    delta = DEFAULT_DELTA,
    duration = 600
  ): void {
    mapRef.current?.animateToRegion(toRegion(coords, delta), duration);
  },

  /**
   * Fit camera to show all provided coordinate points.
   */
  fitPoints(
    mapRef: React.RefObject<MapView | null>,
    points: GeoCoordinates[],
    edgePadding = { top: 80, right: 60, bottom: 80, left: 60 },
    animated = true
  ): void {
    if (!mapRef.current || points.length === 0) return;
    mapRef.current.fitToCoordinates(points, { edgePadding, animated });
  },
};

export default MapService;
