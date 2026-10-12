import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
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

export interface NearbyDriverMarker {
  id: string;
  latitude: number;
  longitude: number;
  etaText?: string;
  isPrimary?: boolean;
}

interface PassengerMapPreviewProps {
  mode?: "search" | "route" | "finding" | "booked" | "live";
  height?: number;
  pickupCoords?: MapMarkerPoint;
  destinationCoords?: MapMarkerPoint;
  onPickupChange?: (coords: GeoCoordinates) => void;
  isInteractivePickup?: boolean;
  nearbyDrivers?: NearbyDriverMarker[];
  scanningRadiusKm?: number;
  showRecenterButton?: boolean;
}

export default function PassengerMapPreview({
  mode = "search",
  height = 240,
  pickupCoords = DEFAULT_MAP_CENTER,
  destinationCoords,
  onPickupChange,
  isInteractivePickup = false,
  nearbyDrivers,
  scanningRadiusKm = 2.0,
  showRecenterButton = true,
}: PassengerMapPreviewProps) {
  const cameraRef = useRef<CameraRef | null>(null);

  // Radar Pulse Animation Values
  const pulseAnim1 = useRef(new Animated.Value(0)).current;
  const pulseAnim2 = useRef(new Animated.Value(0)).current;
  const pulseAnim3 = useRef(new Animated.Value(0)).current;

  // Compute initial camera view state
  const initialCenter = useMemo(() => {
    return toLngLat(pickupCoords);
  }, [pickupCoords.latitude, pickupCoords.longitude]);

  // Generate deterministic nearby drivers if none provided
  const activeNearbyDrivers = useMemo<NearbyDriverMarker[]>(() => {
    if (mode !== "finding" && mode !== "booked" && mode !== "live") return [];
    if (nearbyDrivers && nearbyDrivers.length > 0) return nearbyDrivers;

    const lat = pickupCoords.latitude;
    const lng = pickupCoords.longitude;

    if (mode === "booked") {
      // Single assigned driver approaching pickup — positioned close (~3 min away)
      return [
        { id: "assigned-driver", latitude: lat + 0.0018, longitude: lng - 0.0025, etaText: "3 min", isPrimary: true },
      ];
    }

    if (mode === "live") {
      // Vehicle in progress along the route between pickup and destination (~45% of the distance)
      const dLat = destinationCoords?.latitude ?? (lat + 0.04);
      const dLng = destinationCoords?.longitude ?? (lng + 0.02);
      return [
        {
          id: "live-car",
          latitude: lat + (dLat - lat) * 0.45,
          longitude: lng + (dLng - lng) * 0.45,
          etaText: "38 km/h",
          isPrimary: true,
        },
      ];
    }

    return [
      { id: "driver-1", latitude: lat + 0.0022, longitude: lng - 0.0031, etaText: "2m away", isPrimary: true },
      { id: "driver-2", latitude: lat - 0.0024, longitude: lng + 0.0026, isPrimary: false },
      { id: "driver-3", latitude: lat + 0.0016, longitude: lng + 0.0034, isPrimary: false },
      { id: "driver-4", latitude: lat - 0.0019, longitude: lng - 0.0022, isPrimary: true },
    ];
  }, [mode, nearbyDrivers, pickupCoords.latitude, pickupCoords.longitude, destinationCoords?.latitude, destinationCoords?.longitude]);

  // Frame both points in route mode or focus pickup in search/finding mode
  useEffect(() => {
    if (!cameraRef.current) return;

    if (
      (mode === "route" || mode === "booked" || mode === "live") &&
      destinationCoords &&
      destinationCoords.latitude &&
      destinationCoords.longitude
    ) {
      MapService.fitPoints(
        cameraRef.current,
        [pickupCoords, destinationCoords],
        { top: 80, right: 50, bottom: 50, left: 50 },
        600
      );
    } else if (mode === "finding") {
      MapService.recenterCamera(cameraRef.current, pickupCoords, 14.8, 500);
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

  // Start animated radar waves when in finding or booked mode
  useEffect(() => {
    if (mode !== "finding" && mode !== "booked") return;

    const createPulse = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2600,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
    };

    const p1 = createPulse(pulseAnim1, 0);
    const p2 = createPulse(pulseAnim2, 850);
    const p3 = createPulse(pulseAnim3, 1700);

    p1.start();
    p2.start();
    p3.start();

    return () => {
      p1.stop();
      p2.stop();
      p3.stop();
    };
  }, [mode, pulseAnim1, pulseAnim2, pulseAnim3]);

  const handleRecenter = () => {
    if (cameraRef.current) {
      if ((mode === "route" || mode === "booked" || mode === "live") && destinationCoords) {
        MapService.fitPoints(
          cameraRef.current,
          [pickupCoords, destinationCoords],
          { top: 80, right: 50, bottom: 50, left: 50 },
          500
        );
      } else {
        MapService.recenterCamera(
          cameraRef.current,
          pickupCoords,
          mode === "finding" ? 14.8 : DEFAULT_ZOOM,
          500
        );
      }
    }
  };

  const handleMapPress = (e: NativeSyntheticEvent<PressEvent>) => {
    if (isInteractivePickup && onPickupChange && e.nativeEvent?.lngLat) {
      const [lng, lat] = e.nativeEvent.lngLat;
      onPickupChange({ latitude: lat, longitude: lng });
    }
  };

  const getWaveStyle = (anim: Animated.Value) => ({
    transform: [
      {
        scale: anim.interpolate({
          inputRange: [0, 1],
          outputRange: [0.35, 2.5],
        }),
      },
    ],
    opacity: anim.interpolate({
      inputRange: [0, 0.25, 0.8, 1],
      outputRange: [0.7, 0.45, 0.15, 0],
    }),
  });

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
            zoom: (mode === "finding" || mode === "booked") ? 14.8 : DEFAULT_ZOOM,
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
                {mode === "finding" ? "You are here" : pickupCoords.title || "Pickup"}
              </Text>
            </View>
            <View style={styles.pickupMarkerCircle}>
              <View style={styles.pickupMarkerDot} />
            </View>
          </View>
        </Marker>

        {/* Nearby Drivers / Assigned Driver / Live Vehicle Marker */}
        {(mode === "finding" || mode === "booked" || mode === "live") &&
          activeNearbyDrivers.map((driver) => (
            <Marker
              key={driver.id}
              id={`driver-marker-${driver.id}`}
              lngLat={[driver.longitude, driver.latitude]}
              anchor="center"
            >
              <View style={styles.driverMarkerContainer}>
                <View
                  style={[
                    styles.driverMarkerCircle,
                    (driver.isPrimary || mode === "live" || mode === "booked") && styles.driverMarkerCirclePrimary,
                    mode === "live" && styles.driverMarkerCircleLive,
                  ]}
                >
                  <MaterialIcons
                    name={mode === "live" ? "directions-car" : "local-taxi"}
                    size={driver.isPrimary || mode === "live" ? 18 : 14}
                    color={driver.isPrimary || mode === "live" || mode === "booked" ? "#0D6E00" : "#4B5563"}
                  />
                </View>
                {driver.etaText && (
                  <View style={[styles.driverEtaBadge, mode === "live" && styles.driverSpeedBadge]}>
                    {mode === "live" && <View style={styles.driverSpeedDot} />}
                    <Text style={[styles.driverEtaText, mode === "live" && styles.driverSpeedText]}>
                      {driver.etaText}
                    </Text>
                  </View>
                )}
              </View>
            </Marker>
          ))}

        {/* Destination Marker (Route, Booked, Live Modes) */}
        {(mode === "route" || mode === "booked" || mode === "live") && destinationCoords && destinationCoords.latitude && (
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

      {/* Central Pulsing Radar Waves (Finding Mode) */}
      {mode === "finding" && (
        <View style={styles.radarOverlay} pointerEvents="none">
          <Animated.View style={[styles.radarCircle, getWaveStyle(pulseAnim1)]} />
          <Animated.View style={[styles.radarCircle, getWaveStyle(pulseAnim2)]} />
          <Animated.View style={[styles.radarCircle, getWaveStyle(pulseAnim3)]} />
        </View>
      )}

      {/* Floating Mini Context Route Pill (Finding Mode) */}
      {mode === "finding" && (
        <View style={styles.findingRoutePill}>
          <View style={styles.findingRoutePillLeft}>
            <View style={styles.pulsingGreenDot} />
            <Text style={styles.findingRoutePillSearching}>Searching for rides</Text>
          </View>
          {destinationCoords?.title && (
            <View style={styles.findingRoutePillRight}>
              <Ionicons name="location" size={13} color="#EF4444" />
              <Text style={styles.findingRoutePillDest} numberOfLines={1}>
                {destinationCoords.title}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Status Badges Matching Stitch Aesthetic (Search Mode) */}
      {mode === "search" && (
        <View style={styles.infoPill}>
          <View style={styles.pulsingGreenDot} />
          <Text style={styles.infoPillText}>
            {isInteractivePickup ? "Tap map to adjust pickup" : "MapLibre & OpenStreetMap"}
          </Text>
        </View>
      )}

      {/* Bottom Floating Map Controls (Finding Mode) */}
      {mode === "finding" && (
        <View style={styles.findingBottomOverlay}>
          <View style={styles.scanningPill}>
            <View style={styles.scanningDot} />
            <Text style={styles.scanningText}>
              Scanning {scanningRadiusKm.toFixed(1)} km radius
            </Text>
          </View>

          <TouchableOpacity
            style={styles.recenterButtonFinding}
            activeOpacity={0.8}
            onPress={handleRecenter}
            accessibilityLabel="Re-center map"
          >
            <MaterialIcons name="my-location" size={18} color="#0D6E00" />
          </TouchableOpacity>
        </View>
      )}

      {/* Floating Re-center Button (Search & Route Modes) */}
      {mode !== "finding" && showRecenterButton && (
        <TouchableOpacity
          style={styles.recenterButton}
          activeOpacity={0.8}
          onPress={handleRecenter}
          accessibilityLabel="Re-center map"
        >
          <MaterialIcons name="my-location" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}
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
  // Driver Markers
  driverMarkerContainer: {
    alignItems: "center",
  },
  driverMarkerCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.18,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  driverMarkerCirclePrimary: {
    borderColor: "rgba(31, 198, 0, 0.4)",
    backgroundColor: "#F3FBF0",
  },
  driverEtaBadge: {
    marginTop: 2,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    elevation: 1,
  },
  driverEtaText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#111827",
  },
  driverMarkerCircleLive: {
    borderColor: "#0D6E00",
    borderWidth: 2,
    backgroundColor: "#FFFFFF",
    width: 32,
    height: 32,
    borderRadius: 16,
    shadowColor: "#0D6E00",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 5,
  },
  driverSpeedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0F172A",
    borderColor: "#334155",
    borderWidth: 1,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginTop: 3,
  },
  driverSpeedDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#1FC600",
  },
  driverSpeedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  // Radar Overlay
  radarOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
  },
  radarCircle: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: "rgba(31, 198, 0, 0.45)",
    backgroundColor: "rgba(31, 198, 0, 0.08)",
  },
  // Floating Mini Route Pill in Finding Mode
  findingRoutePill: {
    position: "absolute",
    top: 14,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  findingRoutePillLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
  },
  findingRoutePillSearching: {
    fontSize: 12,
    fontWeight: "700",
    color: "#111827",
  },
  findingRoutePillRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F3F4F6",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    maxWidth: 140,
  },
  findingRoutePillDest: {
    fontSize: 11,
    fontWeight: "600",
    color: "#374151",
  },
  // Bottom Map Overlay in Finding Mode
  findingBottomOverlay: {
    position: "absolute",
    bottom: 12,
    left: 14,
    right: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 10,
  },
  scanningPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  scanningDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#0D6E00",
  },
  scanningText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#111827",
  },
  recenterButtonFinding: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  // Search Mode info pill
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
