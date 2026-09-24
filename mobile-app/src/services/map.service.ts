// mobile-app/src/services/map.service.ts

import type { CameraRef, LngLat, LngLatBounds, StyleSpecification, ViewPadding } from "@maplibre/maplibre-react-native";

export interface GeoCoordinates {
  latitude: number;
  longitude: number;
}

export interface MapMarkerPoint extends GeoCoordinates {
  title?: string;
  subtitle?: string;
}

/**
 * Standard OpenStreetMap Raster Tile Style Specification for MapLibre
 * Completely open-source, client-side rendering with zero commercial API keys or vendor lock-in.
 */
export const OSM_RASTER_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    osm: {
      type: "raster",
      tiles: ["https://tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "© OpenStreetMap contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm-tiles",
      type: "raster",
      source: "osm",
      minzoom: 0,
      maxzoom: 19,
    },
  ],
};

/**
 * Bengaluru fallback coordinate for development & GPS offline mode
 */
export const DEFAULT_MAP_CENTER: GeoCoordinates = {
  latitude: 12.9352,
  longitude: 77.6245,
};

export const DEFAULT_ZOOM = 14;
export const ROUTE_ZOOM = 12;

/**
 * Convert application GeoCoordinates { latitude, longitude } to MapLibre LngLat [longitude, latitude]
 */
export function toLngLat(coords: GeoCoordinates): LngLat {
  return [coords.longitude, coords.latitude];
}

/**
 * Convert MapLibre LngLat [longitude, latitude] to application GeoCoordinates { latitude, longitude }
 */
export function fromLngLat(lngLat: LngLat): GeoCoordinates {
  return {
    longitude: lngLat[0],
    latitude: lngLat[1],
  };
}

/**
 * Calculate bounding box [west, south, east, north] (i.e. [minLng, minLat, maxLng, maxLat])
 * for a list of coordinates, with fallback padding for single/identical points.
 */
export function calculateBoundingBox(points: GeoCoordinates[]): LngLatBounds {
  if (!points || points.length === 0) {
    return [
      DEFAULT_MAP_CENTER.longitude - 0.02,
      DEFAULT_MAP_CENTER.latitude - 0.02,
      DEFAULT_MAP_CENTER.longitude + 0.02,
      DEFAULT_MAP_CENTER.latitude + 0.02,
    ];
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

  // If points are identical or extremely close, expand bounds slightly
  const deltaLat = Math.max(maxLat - minLat, 0.01);
  const deltaLng = Math.max(maxLng - minLng, 0.01);

  return [
    minLng - deltaLng * 0.15,
    minLat - deltaLat * 0.15,
    maxLng + deltaLng * 0.15,
    maxLat + deltaLat * 0.15,
  ];
}

/**
 * MapService: Modular abstraction for MapLibre operations
 * Decouples Passenger business logic from mapping library specifics.
 */
export const MapService = {
  getStyle: (): StyleSpecification => OSM_RASTER_STYLE,
  toLngLat,
  fromLngLat,
  calculateBoundingBox,

  /**
   * Smoothly animates camera to target coordinates
   */
  recenterCamera(
    cameraRef: CameraRef | null,
    coords: GeoCoordinates,
    zoom: number = DEFAULT_ZOOM,
    duration: number = 600
  ): void {
    if (!cameraRef) return;
    cameraRef.easeTo({
      center: toLngLat(coords),
      zoom,
      duration,
    });
  },

  /**
   * Frames multiple points (e.g. pickup & destination) within visible viewport
   */
  fitPoints(
    cameraRef: CameraRef | null,
    points: GeoCoordinates[],
    padding: ViewPadding = { top: 60, right: 60, bottom: 60, left: 60 },
    duration: number = 600
  ): void {
    if (!cameraRef || points.length === 0) return;
    const bounds = calculateBoundingBox(points);
    cameraRef.fitBounds(bounds, {
      padding,
      duration,
    });
  },
};

export default MapService;
