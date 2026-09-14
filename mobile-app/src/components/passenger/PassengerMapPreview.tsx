import React, { useEffect, useRef } from "react";
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Colors, Radius } from "@/theme";

interface PassengerMapPreviewProps {
  mode?: "search" | "route";
  height?: number;
  pickupLabel?: string;
  dropoffLabel?: string;
}

export default function PassengerMapPreview({
  mode = "search",
  height = 220,
  pickupLabel = "4th Block, Koramangala",
  dropoffLabel = "Oil Mill Road",
}: PassengerMapPreviewProps) {
  // Pulse animation for the GPS beacon
  const pulseAnim = useRef(new Animated.Value(0.95)).current;
  const pulseOpacity = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.35,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.15,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 0.95,
            duration: 1400,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.8,
            duration: 1400,
            useNativeDriver: true,
          }),
        ]),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, [pulseAnim, pulseOpacity]);

  return (
    <View style={[styles.mapContainer, { height }]}>
      {/* Visual map road network simulation */}
      <View style={styles.mapCanvas}>
        {/* City Blocks */}
        <View style={[styles.cityBlock, { top: 20, left: 16, width: 85, height: 60 }]} />
        <View style={[styles.cityBlock, styles.parkBlock, { top: 16, left: 115, width: 90, height: 50 }]} />
        <View style={[styles.cityBlock, { top: 18, left: 220, width: 130, height: 55 }]} />
        <View style={[styles.cityBlock, { top: 140, left: 14, width: 85, height: 70 }]} />
        <View style={[styles.cityBlock, { top: 150, left: 115, width: 100, height: 60 }]} />
        <View style={[styles.cityBlock, styles.parkBlock, { top: 140, left: 230, width: 120, height: 75 }]} />

        {/* Roads */}
        <View style={[styles.roadHorizontal, { top: 85 }]} />
        <View style={[styles.roadVertical, { left: 105 }]} />
        <View style={[styles.roadVertical, { left: 212 }]} />
        <View style={[styles.roadDiagonal]} />

        {mode === "route" && (
          /* Route Line preview */
          <View style={styles.routePathContainer}>
            <View style={styles.routeGlowLine} />
            <View style={styles.routeCoreLine} />
          </View>
        )}
      </View>

      {mode === "search" ? (
        <>
          {/* Top-Left Info Pill: "3 Cabs nearby" */}
          <View style={styles.infoPill}>
            <View style={styles.pulsingGreenDot} />
            <Text style={styles.infoPillText}>3 Cabs nearby</Text>
          </View>

          {/* Cab 1 Marker: Sedan (Top) */}
          <View style={[styles.cabMarkerContainer, { top: "18%", left: "44%" }]}>
            <View style={styles.etaPill}>
              <View style={styles.tinyGreenDot} />
              <Text style={styles.etaMinutes}>3 min</Text>
              <Text style={styles.etaBullet}>•</Text>
              <Text style={styles.etaVehicle}>Sedan</Text>
            </View>
            <View style={styles.cabVehicleIcon}>
              <MaterialIcons name="electric-car" size={20} color={Colors.primary} />
            </View>
          </View>

          {/* Cab 2 Marker: Car / Mini (Southwest) */}
          <View style={[styles.cabMarkerContainer, { top: "62%", left: "18%" }]}>
            <View style={styles.etaPill}>
              <View style={styles.tinyGreenDot} />
              <Text style={styles.etaMinutes}>4 min</Text>
              <Text style={styles.etaBullet}>•</Text>
              <Text style={styles.etaVehicle}>Car</Text>
            </View>
            <View style={styles.cabVehicleIcon}>
              <MaterialIcons name="directions-car" size={18} color="#046E00" />
            </View>
          </View>

          {/* Cab 3 Marker: XL / SUV (East) */}
          <View style={[styles.cabMarkerContainer, { top: "45%", left: "74%" }]}>
            <View style={styles.etaPill}>
              <View style={styles.tinyGreenDot} />
              <Text style={styles.etaMinutes}>2 min</Text>
              <Text style={styles.etaBullet}>•</Text>
              <Text style={styles.etaVehicle}>SUV</Text>
            </View>
            <View style={styles.cabVehicleIcon}>
              <MaterialIcons name="airport-shuttle" size={20} color={Colors.primary} />
            </View>
          </View>

          {/* Centered "You are here" GPS Beacon */}
          <View style={styles.gpsCenterBeacon}>
            <Animated.View
              style={[
                styles.beaconRing,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <View style={styles.beaconPin}>
              <View style={styles.beaconCoreDot} />
            </View>
            <View style={styles.hereTag}>
              <Text style={styles.hereTagText}>You are here</Text>
            </View>
          </View>
        </>
      ) : (
        /* Route Mode with Pickup and Drop-off Pins */
        <>
          {/* Pickup Pin */}
          <View style={[styles.routePinContainer, { top: 120, left: 60 }]}>
            <View style={styles.pinTag}>
              <Text style={styles.pinTagText}>Pickup: 4 min</Text>
            </View>
            <View style={styles.pickupCircle}>
              <View style={styles.pickupDot} />
            </View>
          </View>

          {/* Drop-off Pin */}
          <View style={[styles.routePinContainer, { top: 30, right: 50 }]}>
            <View style={[styles.pinTag, { backgroundColor: "#111827" }]}>
              <Text style={styles.pinTagText}>Drop-off</Text>
            </View>
            <Ionicons name="location" size={26} color={Colors.primary} />
          </View>

          {/* Active Cab ETA on route */}
          <View style={[styles.etaRouteBubble, { top: 75, left: 160 }]}>
            <MaterialIcons name="electric-car" size={14} color={Colors.primary} />
            <Text style={styles.etaRouteText}>Sedan 4m</Text>
          </View>
        </>
      )}

      {/* Recenter / My Location Floating Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        activeOpacity={0.8}
        accessibilityLabel="Current Location"
      >
        <MaterialIcons name="my-location" size={20} color={Colors.primary} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  mapContainer: {
    width: "100%",
    backgroundColor: "#EEF4EC",
    position: "relative",
    overflow: "hidden",
    borderBottomWidth: 1,
    borderBottomColor: "#E2EBE0",
  },
  mapCanvas: {
    ...StyleSheet.absoluteFill,
  },
  cityBlock: {
    position: "absolute",
    backgroundColor: "#F9FBF8",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E2EBE0",
  },
  parkBlock: {
    backgroundColor: "#D8EDD2",
    borderColor: "#CAE6C2",
  },
  roadHorizontal: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 18,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E9DF",
  },
  roadVertical: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: "#FFFFFF",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: "#E0E9DF",
  },
  roadDiagonal: {
    position: "absolute",
    top: 50,
    left: -20,
    width: 320,
    height: 22,
    backgroundColor: "#FFFFFF",
    transform: [{ rotate: "-24deg" }],
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#E0E9DF",
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
    shadowOpacity: 0.06,
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
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 10,
  },
  cabMarkerContainer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 5,
  },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.08)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
    marginBottom: 2,
  },
  tinyGreenDot: {
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  etaMinutes: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  etaBullet: {
    fontSize: 8,
    color: Colors.text.secondary,
  },
  etaVehicle: {
    fontSize: 9,
    fontWeight: "700",
    color: "#0D6E00",
  },
  cabVehicleIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 3,
    elevation: 2,
  },
  gpsCenterBeacon: {
    position: "absolute",
    top: "50%",
    left: "50%",
    marginLeft: -16,
    marginTop: -16,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 8,
  },
  beaconRing: {
    position: "absolute",
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(31, 198, 0, 0.3)",
  },
  beaconPin: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  beaconCoreDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.primary,
  },
  hereTag: {
    marginTop: 4,
    backgroundColor: Colors.text.primary,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.pill,
  },
  hereTagText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  routePathContainer: {
    position: "absolute",
    top: 45,
    left: 75,
    width: 220,
    height: 100,
  },
  routeGlowLine: {
    position: "absolute",
    top: 20,
    left: 0,
    width: 210,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(31, 198, 0, 0.35)",
    transform: [{ rotate: "-22deg" }],
  },
  routeCoreLine: {
    position: "absolute",
    top: 21,
    left: 0,
    width: 210,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.primary,
    transform: [{ rotate: "-22deg" }],
  },
  routePinContainer: {
    position: "absolute",
    alignItems: "center",
    zIndex: 7,
  },
  pinTag: {
    backgroundColor: Colors.text.primary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginBottom: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  pinTagText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  pickupCircle: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.primary,
    borderWidth: 2,
    borderColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#FFFFFF",
  },
  etaRouteBubble: {
    position: "absolute",
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.1)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    zIndex: 6,
  },
  etaRouteText: {
    fontSize: 10,
    fontWeight: "800",
    color: Colors.text.primary,
  },
});
