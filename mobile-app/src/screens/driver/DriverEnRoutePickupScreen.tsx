// mobile-app/src/screens/driver/DriverEnRoutePickupScreen.tsx

import React from "react";
import {
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DriverMapPreview from "@/components/driver/DriverMapPreview";
import rideLifecycleService from "@/services/ride-lifecycle.service";
import { Radius } from "@/theme";

export default function DriverEnRoutePickupScreen() {
  const insets = useSafeAreaInsets();
  const offer = rideLifecycleService.getActiveState().activeOffer || rideLifecycleService.triggerIncomingRequest();

  // Reactively listen for ride cancellation
  React.useEffect(() => {
    const unsubscribe = rideLifecycleService.subscribe((state) => {
      if (state.lifecycleStatus === "CANCELLED") {
        Alert.alert("Ride Cancelled", "This ride was cancelled by the passenger.");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace("/driver/home" as any);
      }
    });
    return () => unsubscribe();
  }, []);

  const handleArrivedAtPickup = () => {
    rideLifecycleService.arriveAtPickup();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace("/driver/arrived" as any);
  };

  const handleCallPassenger = () => {
    Alert.alert("Call Passenger", `Calling ${offer.passengerName} (${offer.passengerPhone})…`);
  };

  return (
    <View style={styles.root}>
      {/* ── Top Turn-by-Turn Navigation Banner ────────────────────────────── */}
      <View style={[styles.topBanner, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.maneuverBox}>
          <View style={styles.turnIconWrap}>
            <MaterialIcons name="turn-left" size={24} color="#1FC600" />
          </View>
          <View style={styles.maneuverTexts}>
            <Text style={styles.maneuverInstruction}>In 300m, turn left</Text>
            <Text style={styles.maneuverSubhead}>onto 80ft Rd toward Sony Signal</Text>
          </View>
        </View>

        <View style={styles.etaBadgePill}>
          <Text style={styles.etaMins}>3 min</Text>
          <Text style={styles.etaDist}>1.2 km</Text>
        </View>
      </View>

      {/* ── Active Map View ───────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <DriverMapPreview
          mode="en_route"
          height="100%"
          pickupCoords={{
            latitude: offer.pickupLat,
            longitude: offer.pickupLng,
            title: offer.pickupTitle,
          }}
          showRecenterButton={true}
        />
      </View>

      {/* ── Passenger Contact & Arrived CTA ───────────────────────────────── */}
      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
      >
        <View style={styles.passengerRow}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.passengerInfo}>
            <Text style={styles.passengerName}>Picking up {offer.passengerName}</Text>
            <Text style={styles.pickupAddress} numberOfLines={1}>
              {offer.pickupTitle}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallPassenger}
            activeOpacity={0.8}
            accessibilityLabel="Call passenger"
          >
            <MaterialIcons name="call" size={20} color="#0D6E00" />
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.arrivedButton}
          onPress={handleArrivedAtPickup}
          activeOpacity={0.85}
          accessibilityLabel="I have arrived at passenger pickup"
        >
          <MaterialIcons name="pin-drop" size={22} color="#064B00" />
          <Text style={styles.arrivedButtonText}>ARRIVED AT PICKUP</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  topBanner: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    paddingHorizontal: 14,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  maneuverBox: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  turnIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(31, 198, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  maneuverTexts: {
    flex: 1,
  },
  maneuverInstruction: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  maneuverSubhead: {
    fontSize: 10,
    fontWeight: "500",
    color: "#94A3B8",
    marginTop: 1,
  },
  etaBadgePill: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  etaMins: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0D6E00",
  },
  etaDist: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  mapContainer: {
    flex: 1,
    width: "100%",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
    borderTopWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  passengerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 12,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerInfo: {
    flex: 1,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  pickupAddress: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  callBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  arrivedButton: {
    width: "100%",
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: "#1FC600",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1FC600",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 5,
  },
  arrivedButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#064B00",
    letterSpacing: 0.5,
  },
});
