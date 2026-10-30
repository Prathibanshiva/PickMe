// mobile-app/src/components/driver/DriverMapPreview.tsx

import React, { useEffect, useMemo, useRef } from "react";
import {
  Animated,
  Easing,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";

import { Colors, Radius } from "@/theme";
import MapService, {
  DEFAULT_DELTA,
  DEFAULT_MAP_CENTER,
  type GeoCoordinates,
  type MapMarkerPoint,
} from "@/services/map.service";

export type DriverMapMode = "idle" | "offer" | "en_route" | "arrived" | "live_trip";

interface DriverMapPreviewProps {
  mode?: DriverMapMode;
  height?: number | string;
  driverLocation?: GeoCoordinates;
  pickupCoords?: MapMarkerPoint;
  destinationCoords?: MapMarkerPoint;
  speedText?: string;
  showRecenterButton?: boolean;
}

export default function DriverMapPreview({
  mode = "idle",
  height = 280,
  driverLocation = { latitude: 12.9385, longitude: 77.6215 },
  pickupCoords,
  destinationCoords,
  speedText = "34 km/h",
  showRecenterButton = true,
}: DriverMapPreviewProps) {
  const mapRef = useRef<MapView>(null);

  // Radar pulse animation (idle mode)
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim]);

  // Compute the driver vehicle marker position based on mode
  const driverMarkerPoint: MapMarkerPoint = useMemo(() => {
    if (mode === "arrived" && pickupCoords) {
      return { latitude: pickupCoords.latitude, longitude: pickupCoords.longitude, title: "Your Cab" };
    }
    if (mode === "live_trip" && pickupCoords && destinationCoords) {
      return {
        latitude: pickupCoords.latitude + (destinationCoords.latitude - pickupCoords.latitude) * 0.45,
        longitude: pickupCoords.longitude + (destinationCoords.longitude - pickupCoords.longitude) * 0.45,
        title: "Your Cab",
      };
    }
    return {
      latitude: driverLocation.latitude,
      longitude: driverLocation.longitude,
      title: "Your Cab",
    };
  }, [mode, driverLocation, pickupCoords, destinationCoords]);

  // Camera framing on mode/coord changes
  useEffect(() => {
    if (!mapRef.current) return;

    if (mode === "idle" || mode === "arrived") {
      MapService.animateTo(mapRef, driverMarkerPoint, { latitudeDelta: 0.008, longitudeDelta: 0.008 });
    } else if (mode === "en_route" && pickupCoords) {
      MapService.fitPoints(mapRef, [driverMarkerPoint, pickupCoords], {
        top: 70, right: 60, bottom: 60, left: 60,
      });
    } else if ((mode === "offer" || mode === "live_trip") && pickupCoords && destinationCoords) {
      MapService.fitPoints(mapRef, [pickupCoords, destinationCoords], {
        top: 70, right: 60, bottom: 60, left: 60,
      });
    }
  }, [
    mode,
    driverMarkerPoint.latitude,
    driverMarkerPoint.longitude,
    pickupCoords?.latitude,
    pickupCoords?.longitude,
    destinationCoords?.latitude,
    destinationCoords?.longitude,
  ]);

  const handleRecenter = () => {
    if (!mapRef.current) return;
    if ((mode === "offer" || mode === "live_trip") && pickupCoords && destinationCoords) {
      MapService.fitPoints(mapRef, [pickupCoords, destinationCoords], {
        top: 70, right: 60, bottom: 60, left: 60,
      });
    } else if (mode === "en_route" && pickupCoords) {
      MapService.fitPoints(mapRef, [driverMarkerPoint, pickupCoords], {
        top: 70, right: 60, bottom: 60, left: 60,
      });
    } else {
      MapService.animateTo(mapRef, driverMarkerPoint, { latitudeDelta: 0.008, longitudeDelta: 0.008 });
    }
  };

  const initialRegion = useMemo(() => {
    return MapService.toRegion(driverMarkerPoint, { latitudeDelta: 0.008, longitudeDelta: 0.008 });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <View style={[styles.container, { height: height as number }]}>
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        provider={PROVIDER_GOOGLE}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        toolbarEnabled={false}
      >
        {/* ── Driver Vehicle Marker ── */}
        <Marker
          coordinate={{ latitude: driverMarkerPoint.latitude, longitude: driverMarkerPoint.longitude }}
          anchor={{ x: 0.5, y: 0.5 }}
          flat={false}
        >
          <View style={styles.driverMarkerContainer}>
            {mode === "live_trip" && (
              <View style={styles.speedBadge}>
                <View style={styles.greenLiveDot} />
                <Text style={styles.speedBadgeText}>{speedText}</Text>
              </View>
            )}
            {mode === "arrived" && (
              <View style={styles.waitingBadge}>
                <Text style={styles.waitingBadgeText}>You are at Pickup</Text>
              </View>
            )}
            <View style={styles.driverCarCircle}>
              <MaterialIcons name="directions-car" size={20} color="#064B00" />
            </View>
          </View>
        </Marker>

        {/* ── Pickup Marker ── */}
        {pickupCoords && (mode === "offer" || mode === "en_route" || mode === "arrived" || mode === "live_trip") && (
          <Marker
            coordinate={{ latitude: pickupCoords.latitude, longitude: pickupCoords.longitude }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.pickupMarkerWrap}>
              <View style={styles.pickupCallout}>
                <Text style={styles.calloutText} numberOfLines={1}>
                  {pickupCoords.title || "Passenger Pickup"}
                </Text>
              </View>
              <View style={styles.pickupDotCircle}>
                <View style={styles.pickupInnerDot} />
              </View>
            </View>
          </Marker>
        )}

        {/* ── Destination Marker ── */}
        {destinationCoords && (mode === "offer" || mode === "live_trip") && (
          <Marker
            coordinate={{ latitude: destinationCoords.latitude, longitude: destinationCoords.longitude }}
            anchor={{ x: 0.5, y: 1 }}
          >
            <View style={styles.pickupMarkerWrap}>
              <View style={[styles.pickupCallout, { backgroundColor: "#0F172A" }]}>
                <Text style={styles.calloutText} numberOfLines={1}>
                  {destinationCoords.title || "Drop-off"}
                </Text>
              </View>
              <Ionicons name="location" size={28} color="#0D6E00" />
            </View>
          </Marker>
        )}
      </MapView>

      {/* Recenter Button */}
      {showRecenterButton && (
        <TouchableOpacity
          style={styles.recenterButton}
          onPress={handleRecenter}
          activeOpacity={0.8}
          accessibilityLabel="Re-center map"
        >
          <MaterialIcons name="my-location" size={20} color="#0D6E00" />
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
  driverMarkerContainer: {
    alignItems: "center",
  },
  driverCarCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#1FC600",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  speedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#0F172A",
    borderWidth: 1,
    borderColor: "#334155",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    marginBottom: 4,
  },
  greenLiveDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#1FC600",
  },
  speedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  waitingBadge: {
    backgroundColor: "#064B00",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: 4,
  },
  waitingBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pickupMarkerWrap: {
    alignItems: "center",
  },
  pickupCallout: {
    backgroundColor: "#064B00",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: 2,
    maxWidth: 160,
  },
  calloutText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pickupDotCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#0D6E00",
    borderWidth: 3,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 4,
  },
  pickupInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  recenterButton: {
    position: "absolute",
    right: 14,
    bottom: 14,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 5,
    elevation: 4,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
  },
});
