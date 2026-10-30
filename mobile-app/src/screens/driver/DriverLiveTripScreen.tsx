// mobile-app/src/screens/driver/DriverLiveTripScreen.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
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

export default function DriverLiveTripScreen() {
  const insets = useSafeAreaInsets();
  const offer = rideLifecycleService.getActiveState().activeOffer || rideLifecycleService.triggerIncomingRequest();

  const [isTrafficOn, setIsTrafficOn] = useState<boolean>(true);
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 0.65,
      duration: 1200,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, []);

  // Reactively listen to lifecycle in case trip is completed or cancelled
  useEffect(() => {
    let navigated = false;
    const unsubscribe = rideLifecycleService.subscribe((state) => {
      if (state.lifecycleStatus === "TRIP_COMPLETED" && !navigated) {
        navigated = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace("/driver/trip-completed" as any);
      }
    });

    if (rideLifecycleService.getActiveState().lifecycleStatus === "TRIP_COMPLETED" && !navigated) {
      navigated = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace("/driver/trip-completed" as any);
    }

    return () => {
      unsubscribe();
    };
  }, []);

  const handleCompleteTrip = () => {
    Alert.alert(
      "Complete Trip?",
      `Confirm arrival at ${offer.destinationTitle}?\n\nFare ₹${offer.estimatedFare} will be settled.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Yes, Complete Trip",
          style: "default",
          onPress: async () => {
            await rideLifecycleService.completeTrip();
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.replace("/driver/trip-completed" as any);
          },
        },
      ]
    );
  };

  const handleCallPassenger = () => {
    Alert.alert("Call Passenger", `Calling ${offer.passengerName} (${offer.passengerPhone})…`);
  };

  const handleEmergencySos = () => {
    Alert.alert(
      "Driver Emergency SOS",
      "Triggering emergency SOS alerts the PickMe safety desk and shares your live GPS location with emergency response services.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trigger SOS",
          style: "destructive",
          onPress: () => Alert.alert("SOS Triggered", "Emergency team alerted."),
        },
      ]
    );
  };

  return (
    <View style={styles.root}>
      {/* ── Top Turn-by-Turn Navigation Banner ────────────────────────────── */}
      <View style={[styles.topBanner, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.maneuverBox}>
          <View style={styles.turnIconWrap}>
            <MaterialIcons name="turn-right" size={24} color="#1FC600" />
          </View>
          <View style={styles.maneuverTexts}>
            <Text style={styles.maneuverInstruction}>In 450m, turn right</Text>
            <Text style={styles.maneuverSubhead}>onto 80 Feet Rd / Domlur</Text>
          </View>
        </View>

        <View style={styles.etaBadgePill}>
          <Text style={styles.etaMins}>{offer.durationMin} min</Text>
          <Text style={styles.etaDist}>{offer.distanceKm} km</Text>
        </View>
      </View>

      {/* ── Floating Controls on Map ──────────────────────────────────────── */}
      <View style={[styles.floatingTools, { top: Math.max(insets.top + 76, 88) }]}>
        <TouchableOpacity
          style={[styles.toolBtn, isTrafficOn && styles.toolBtnActive]}
          onPress={() => setIsTrafficOn((prev) => !prev)}
          activeOpacity={0.8}
          accessibilityLabel="Toggle Traffic layer"
        >
          <MaterialIcons name="traffic" size={20} color={isTrafficOn ? "#0D6E00" : "#64748B"} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.toolBtn, styles.toolBtnSos]}
          onPress={handleEmergencySos}
          activeOpacity={0.8}
          accessibilityLabel="Driver Emergency SOS"
        >
          <MaterialIcons name="security" size={20} color="#DC2626" />
        </TouchableOpacity>
      </View>

      {/* ── Live Map Overview ─────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <DriverMapPreview
          mode="live_trip"
          height="100%"
          pickupCoords={{
            latitude: offer.pickupLat,
            longitude: offer.pickupLng,
            title: offer.pickupTitle,
          }}
          destinationCoords={{
            latitude: offer.destLat,
            longitude: offer.destLng,
            title: offer.destinationTitle,
          }}
          speedText="38 km/h"
          showRecenterButton={true}
        />
      </View>

      {/* ── Trip Details & Complete CTA Drawer ────────────────────────────── */}
      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
      >
        {/* Destination & Progress Header */}
        <View style={styles.tripProgressHeader}>
          <View style={styles.destTextCol}>
            <View style={styles.onTripBadge}>
              <View style={styles.livePulseDot} />
              <Text style={styles.onTripBadgeText}>TRIP IN PROGRESS</Text>
            </View>
            <Text style={styles.destinationTitleText} numberOfLines={1}>
              {offer.destinationTitle}
            </Text>
          </View>

          <View style={styles.earningsTag}>
            <Text style={styles.earningsTagLabel}>FARE</Text>
            <Text style={styles.earningsTagVal}>₹{offer.estimatedFare}</Text>
          </View>
        </View>

        {/* Animated Progress Bar */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: progressAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Passenger Context Strip */}
        <View style={styles.passengerStrip}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.passengerMeta}>
            <Text style={styles.passengerName}>{offer.passengerName}</Text>
            <Text style={styles.passengerSub}>
              {offer.rideMode} · Guaranteed Payout: ₹{offer.driverEarnings.toFixed(2)}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.callBtn}
            onPress={handleCallPassenger}
            activeOpacity={0.8}
            accessibilityLabel="Call passenger"
          >
            <MaterialIcons name="call" size={18} color="#0D6E00" />
          </TouchableOpacity>
        </View>

        {/* Primary CTA: Complete Trip */}
        <TouchableOpacity
          style={styles.completeButton}
          onPress={handleCompleteTrip}
          activeOpacity={0.85}
          accessibilityLabel="Complete trip at drop-off"
        >
          <MaterialIcons name="check-circle" size={22} color="#064B00" />
          <Text style={styles.completeButtonText}>COMPLETE TRIP (ARRIVED)</Text>
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
  floatingTools: {
    position: "absolute",
    right: 14,
    zIndex: 25,
    gap: 8,
  },
  toolBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  toolBtnActive: {
    backgroundColor: "#F0FDF4",
    borderColor: "rgba(13, 110, 0, 0.3)",
  },
  toolBtnSos: {
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
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
    gap: 12,
    borderTopWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  tripProgressHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  destTextCol: {
    flex: 1,
    marginRight: 10,
  },
  onTripBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    alignSelf: "flex-start",
    marginBottom: 4,
  },
  livePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1FC600",
  },
  onTripBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065F46",
    letterSpacing: 0.4,
  },
  destinationTitleText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#0F172A",
  },
  earningsTag: {
    alignItems: "flex-end",
  },
  earningsTagLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.4,
  },
  earningsTagVal: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0D6E00",
  },
  progressBarTrack: {
    width: "100%",
    height: 6,
    backgroundColor: "#E2E8F0",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0D6E00",
    borderRadius: 3,
  },
  passengerStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerMeta: {
    flex: 1,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  passengerSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  callBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    alignItems: "center",
    justifyContent: "center",
  },
  completeButton: {
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
  completeButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#064B00",
    letterSpacing: 0.5,
  },
});
