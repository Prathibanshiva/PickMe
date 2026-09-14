// mobile-app/src/components/passenger/PassengerMapPreview.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE, Region } from "react-native-maps";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import Constants from "expo-constants";

import { Colors, Radius } from "@/theme";

interface Coordinates {
  latitude: number;
  longitude: number;
  title?: string;
  subtitle?: string;
}

interface PassengerMapPreviewProps {
  mode?: "search" | "route";
  height?: number;
  pickupCoords?: Coordinates;
  destinationCoords?: Coordinates;
  onPickupChange?: (coords: { latitude: number; longitude: number }) => void;
  isInteractivePickup?: boolean;
}

const DEFAULT_BENGALURU_COORDS = {
  latitude: 12.9352,
  longitude: 77.6245,
};

export default function PassengerMapPreview({
  mode = "search",
  height = 240,
  pickupCoords = DEFAULT_BENGALURU_COORDS,
  destinationCoords,
  onPickupChange,
  isInteractivePickup = false,
}: PassengerMapPreviewProps) {
  const mapRef = useRef<MapView | null>(null);
  const [mapReady, setMapReady] = useState(false);

  // Check if Android Google Maps key is configured in Expo config
  const androidConfig = Constants.expoConfig?.android?.config?.googleMaps;
  const hasAndroidMapsKey = Boolean(
    androidConfig?.apiKey && androidConfig.apiKey.trim().length > 0
  );

  const initialRegion: Region = {
    latitude: pickupCoords.latitude,
    longitude: pickupCoords.longitude,
    latitudeDelta: 0.035,
    longitudeDelta: 0.035,
  };

  // Fit camera to both pickup and destination markers when in route mode
  useEffect(() => {
    if (
      mode === "route" &&
      mapRef.current &&
      mapReady &&
      destinationCoords &&
      destinationCoords.latitude &&
      destinationCoords.longitude
    ) {
      mapRef.current.fitToCoordinates(
        [
          {
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
          },
          {
            latitude: destinationCoords.latitude,
            longitude: destinationCoords.longitude,
          },
        ],
        {
          edgePadding: { top: 40, right: 40, bottom: 40, left: 40 },
          animated: true,
        }
      );
    }
  }, [mode, mapReady, pickupCoords, destinationCoords]);

  const handleRecenter = () => {
    if (mapRef.current) {
      mapRef.current.animateToRegion(
        {
          latitude: pickupCoords.latitude,
          longitude: pickupCoords.longitude,
          latitudeDelta: 0.015,
          longitudeDelta: 0.015,
        },
        600
      );
    }
  };

  return (
    <View style={[styles.container, { height }]}>
      {/* Real Google Map using PROVIDER_GOOGLE on Android */}
      <MapView
        ref={mapRef}
        provider={Platform.OS === "android" ? PROVIDER_GOOGLE : undefined}
        style={StyleSheet.absoluteFill}
        initialRegion={initialRegion}
        showsUserLocation={true}
        showsMyLocationButton={false}
        showsCompass={false}
        onMapReady={() => setMapReady(true)}
        onPress={(e) => {
          if (isInteractivePickup && onPickupChange) {
            onPickupChange(e.nativeEvent.coordinate);
          }
        }}
      >
        {/* Real Pickup Marker */}
        <Marker
          coordinate={{
            latitude: pickupCoords.latitude,
            longitude: pickupCoords.longitude,
          }}
          title={pickupCoords.title || "Pickup Location"}
          description={pickupCoords.subtitle || "Selected pickup"}
          draggable={isInteractivePickup}
          onDragEnd={(e) => {
            if (onPickupChange) {
              onPickupChange(e.nativeEvent.coordinate);
            }
          }}
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

        {/* Real Destination Marker (Route Mode) */}
        {mode === "route" && destinationCoords && destinationCoords.latitude && (
          <Marker
            coordinate={{
              latitude: destinationCoords.latitude,
              longitude: destinationCoords.longitude,
            }}
            title={destinationCoords.title || "Destination"}
            description={destinationCoords.subtitle || "Drop-off location"}
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
      </MapView>

      {/* Explicit error banner if Android Google Maps SDK key is not configured */}
      {!hasAndroidMapsKey && (
        <View style={styles.missingKeyBanner}>
          <MaterialIcons name="warning" size={18} color="#991B1B" />
          <View style={{ flex: 1 }}>
            <Text style={styles.missingKeyTitle}>Maps SDK Key Missing</Text>
            <Text style={styles.missingKeyDesc}>
              Google Maps Android SDK key not configured. Please configure GOOGLE_MAPS_ANDROID_API_KEY in mobile-app/.env
            </Text>
          </View>
        </View>
      )}

      {/* Status Badges Matching Stitch Aesthetic */}
      {mode === "search" && (
        <View style={styles.infoPill}>
          <View style={styles.pulsingGreenDot} />
          <Text style={styles.infoPillText}>
            {isInteractivePickup ? "Tap or drag pin to adjust pickup" : "Google Maps Active"}
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
  missingKeyBanner: {
    position: "absolute",
    top: 10,
    left: 12,
    right: 12,
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 8,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    zIndex: 20,
    elevation: 4,
  },
  missingKeyTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#991B1B",
  },
  missingKeyDesc: {
    fontSize: 10,
    color: "#7F1D1D",
    marginTop: 1,
    lineHeight: 13,
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
