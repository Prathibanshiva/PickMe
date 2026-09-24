// mobile-app/src/components/passenger/PassengerMapPreview.tsx

import React, { useEffect, useMemo, useRef } from "react";
import {
  NativeSyntheticEvent,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Camera,
  type CameraRef,
  Map,
  Marker,
  type PressEvent,
  UserLocation,
} from "@maplibre/maplibre-react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { Colors, Radius } from "@/theme";
import MapService, {
  DEFAULT_MAP_CENTER,
  DEFAULT_ZOOM,
  GeoCoordinates,
  MapMarkerPoint,
  OSM_RASTER_STYLE,
  toLngLat,
} from "@/services/map.service";

interface PassengerMapPreviewProps {
  mode?: "search" | "route";
  height?: number;
  pickupCoords?: MapMarkerPoint;
  destinationCoords?: MapMarkerPoint;
  onPickupChange?: (coords: GeoCoordinates) => void;
  isInteractivePickup?: boolean;
}

export default function PassengerMapPreview({
  mode = "search",
  height = 240,
  pickupCoords = DEFAULT_MAP_CENTER,
  destinationCoords,
  onPickupChange,
  isInteractivePickup = false,
}: PassengerMapPreviewProps) {
  const cameraRef = useRef<CameraRef | null>(null);

  // Compute initial camera view state
  const initialCenter = useMemo(() => {
    return toLngLat(pickupCoords);
  }, [pickupCoords.latitude, pickupCoords.longitude]);

  // Frame both points in route mode or focus pickup in search mode
  useEffect(() => {
    if (!cameraRef.current) return;

    if (
      mode === "route" &&
      destinationCoords &&
      destinationCoords.latitude &&
      destinationCoords.longitude
    ) {
      MapService.fitPoints(
        cameraRef.current,
        [pickupCoords, destinationCoords],
        { top: 50, right: 50, bottom: 50, left: 50 },
        600
      );
    } else if (mode === "search") {
      MapService.recenterCamera(cameraRef.current, pickupCoords, DEFAULT_ZOOM, 500);
    }
  }, [
    mode,
    pickupCoords.latitude,
    pickupCoords.longitude,
    destinationCoords?.latitude,
    destinationCoords?.longitude,
  ]);

  const handleRecenter = () => {
    if (cameraRef.current) {
      MapService.recenterCamera(cameraRef.current, pickupCoords, DEFAULT_ZOOM, 500);
    }
  };

  const handleMapPress = (e: NativeSyntheticEvent<PressEvent>) => {
    if (isInteractivePickup && onPickupChange && e.nativeEvent?.lngLat) {
      const [lng, lat] = e.nativeEvent.lngLat;
      onPickupChange({ latitude: lat, longitude: lng });
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Real MapLibre Native Map with OpenStreetMap raster tiles */}
      <Map
        style={StyleSheet.absoluteFill}
        mapStyle={OSM_RASTER_STYLE}
        dragPan={true}
        touchZoom={true}
        attribution={false}
        logo={false}
        onPress={handleMapPress}
      >
        <Camera
          ref={cameraRef}
          initialViewState={{
            center: initialCenter,
            zoom: DEFAULT_ZOOM,
          }}
        />

        {/* Real Device User Location Puck */}
        <UserLocation animated={true} />

        {/* Pickup Marker */}
        <Marker
          id="pickup-marker"
          lngLat={toLngLat(pickupCoords)}
          anchor="bottom"
        >
          <View style={styles.markerContainer}>
            <View style={styles.pickupPinCallout}>
              <View style={styles.pulsingCore} />
              <Text style={styles.calloutText} numberOfLines={1}>
                {pickupCoords.title || "Pickup"}
              </Text>
            </View>
            <View style={styles.pickupMarkerCircle}>
              <View style={styles.pickupMarkerDot} />
            </View>
          </View>
        </Marker>

        {/* Destination Marker (Route Mode) */}
        {mode === "route" && destinationCoords && destinationCoords.latitude && (
          <Marker
            id="destination-marker"
            lngLat={toLngLat(destinationCoords)}
            anchor="bottom"
          >
            <View style={styles.markerContainer}>
              <View style={[styles.pickupPinCallout, { backgroundColor: "#111827" }]}>
                <Text style={styles.calloutText} numberOfLines={1}>
                  {destinationCoords.title || "Drop-off"}
                </Text>
              </View>
              <Ionicons name="location" size={30} color={Colors.primary} />
            </View>
          </Marker>
        )}
      </Map>

      {/* Status Badges Matching Stitch Aesthetic */}
      {mode === "search" && (
        <View style={styles.infoPill}>
          <View style={styles.pulsingGreenDot} />
          <Text style={styles.infoPillText}>
            {isInteractivePickup ? "Tap map to adjust pickup" : "MapLibre & OpenStreetMap"}
          </Text>
        </View>
      )}

      {/* Floating Re-center / My Location Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        activeOpacity={0.8}
        onPress={handleRecenter}
        accessibilityLabel="Re-center map"
      >
        <MaterialIcons name="my-location" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: "100%",
    position: "relative",
    overflow: "hidden",
    backgroundColor: "#EEF4EC",
  },
  markerContainer: {
    alignItems: "center",
  },
  pickupPinCallout: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#064B00",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
    maxWidth: 160,
  },
  calloutText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pulsingCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  pickupMarkerCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.primary,
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pickupMarkerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  infoPill: {
    position: "absolute",
    top: 12,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(109, 123, 101, 0.2)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
    zIndex: 10,
  },
  pulsingGreenDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  infoPillText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  recenterButton: {
    position: "absolute",
    bottom: 12,
    right: 14,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
    zIndex: 10,
  },
});
