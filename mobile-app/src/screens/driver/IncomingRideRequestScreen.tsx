// mobile-app/src/screens/driver/IncomingRideRequestScreen.tsx

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
import { RideRequestOffer } from "@/types/driver.types";
import { Radius } from "@/theme";

export default function IncomingRideRequestScreen() {
  const insets = useSafeAreaInsets();

  const [activeOffer, setActiveOffer] = useState<RideRequestOffer>(() => {
    return rideLifecycleService.getActiveState().activeOffer || rideLifecycleService.triggerIncomingRequest();
  });

  const [countdown, setCountdown] = useState<number>(activeOffer.expiresInSeconds || 15);

  const countdownAnim = useRef(new Animated.Value(1)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Reactively listen for passenger cancellation while request is offered
  useEffect(() => {
    const unsubscribe = rideLifecycleService.subscribe((state) => {
      if (state.lifecycleStatus === "CANCELLED" || (state.lifecycleStatus === "IDLE" && !state.activeOffer)) {
        Alert.alert("Request Cancelled", "This ride request was cancelled by the passenger.");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace("/driver/home" as any);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    // 15-second progress bar animation
    Animated.timing(countdownAnim, {
      toValue: 0,
      duration: (activeOffer.expiresInSeconds || 15) * 1000,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    // Pulse loop for radar beacon
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 800,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // 1-second interval timer
    const interval = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          handleDecline();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      clearInterval(interval);
      pulseLoop.stop();
    };
  }, []);

  const handleAccept = () => {
    const success = rideLifecycleService.acceptRequest();
    if (success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace("/driver/accepted" as any);
    } else {
      Alert.alert("Request Expired", "This ride request is no longer available.");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace("/driver/home" as any);
    }
  };

  const handleDecline = () => {
    rideLifecycleService.declineRequest();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace("/driver/home" as any);
  };

  return (
    <View style={styles.root}>
      {/* ── Map Header Overview ───────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <DriverMapPreview
          mode="offer"
          height="100%"
          pickupCoords={{
            latitude: activeOffer.pickupLat,
            longitude: activeOffer.pickupLng,
            title: activeOffer.pickupTitle,
          }}
          destinationCoords={{
            latitude: activeOffer.destLat,
            longitude: activeOffer.destLng,
            title: activeOffer.destinationTitle,
          }}
          showRecenterButton={false}
        />

        {/* Top Banner Strip */}
        <View style={[styles.topBannerStrip, { paddingTop: Math.max(insets.top + 6, 16) }]}>
          <View style={styles.incomingBadgePill}>
            <Animated.View
              style={[
                styles.pulseIndicatorDot,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.5, 1],
                  }),
                },
              ]}
            />
            <Text style={styles.incomingBadgeText}>NEW RIDE REQUEST</Text>
          </View>

          <View style={styles.countdownPill}>
            <MaterialIcons name="timer" size={14} color="#DC2626" />
            <Text style={styles.countdownText}>{countdown}s</Text>
          </View>
        </View>
      </View>

      {/* ── Request Details Sheet ─────────────────────────────────────────── */}
      <View
        style={[
          styles.requestSheet,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
      >
        {/* Animated Countdown Progress Bar */}
        <View style={styles.progressTrack}>
          <Animated.View
            style={[
              styles.progressBarFill,
              {
                width: countdownAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: ["0%", "100%"],
                }),
              },
            ]}
          />
        </View>

        {/* Earnings Highlight & Ride Mode */}
        <View style={styles.earningsHeaderRow}>
          <View>
            <Text style={styles.earningsSubLabel}>GUARANTEED EARNINGS</Text>
            <Text style={styles.earningsMainText}>₹{activeOffer.driverEarnings.toFixed(2)}</Text>
            <Text style={styles.fareBreakdownNote}>
              Total Fare: ₹{activeOffer.estimatedFare} · Net Payout (85%)
            </Text>
          </View>

          <View style={styles.rideTypeBadge}>
            <MaterialIcons name="directions-car" size={16} color="#0D6E00" />
            <Text style={styles.rideTypeBadgeText}>
              {activeOffer.vehicleType} · {activeOffer.rideMode}
            </Text>
          </View>
        </View>

        {/* Passenger Profile Strip */}
        <View style={styles.passengerStrip}>
          <View style={styles.passengerAvatar}>
            <MaterialIcons name="person" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.passengerMeta}>
            <View style={styles.passengerNameRow}>
              <Text style={styles.passengerName}>{activeOffer.passengerName}</Text>
              <View style={styles.ratingPill}>
                <MaterialIcons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingValue}>{activeOffer.passengerRating}</Text>
              </View>
            </View>
            <Text style={styles.passengerTripsText}>
              {activeOffer.passengerTrips} trips with PickMe
            </Text>
          </View>
          <View style={styles.pickupDistTag}>
            <Text style={styles.pickupDistVal}>1.2 km</Text>
            <Text style={styles.pickupDistLabel}>away</Text>
          </View>
        </View>

        {/* Route Details Card */}
        <View style={styles.routeCard}>
          <View style={styles.routePointRow}>
            <View style={styles.pickupDot} />
            <View style={styles.routePointContent}>
              <Text style={styles.routePointLabel}>PICKUP (3 MIN AWAY)</Text>
              <Text style={styles.routePointTitle} numberOfLines={1}>
                {activeOffer.pickupTitle}
              </Text>
              <Text style={styles.routePointSub} numberOfLines={1}>
                {activeOffer.pickupSubtitle}
              </Text>
            </View>
          </View>

          <View style={styles.routeConnectorLine} />

          <View style={styles.routePointRow}>
            <View style={styles.destDot} />
            <View style={styles.routePointContent}>
              <Text style={styles.routePointLabel}>
                DROPOFF ({activeOffer.distanceKm} km · {activeOffer.durationMin} min)
              </Text>
              <Text style={styles.routePointTitle} numberOfLines={1}>
                {activeOffer.destinationTitle}
              </Text>
              <Text style={styles.routePointSub} numberOfLines={1}>
                {activeOffer.destinationSubtitle}
              </Text>
            </View>
          </View>
        </View>

        {/* Action Buttons: Accept & Decline */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.declineButton}
            onPress={handleDecline}
            activeOpacity={0.8}
            accessibilityLabel="Decline ride request"
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.acceptButton}
            onPress={handleAccept}
            activeOpacity={0.85}
            accessibilityLabel="Accept ride request"
          >
            <MaterialIcons name="check" size={20} color="#064B00" />
            <Text style={styles.acceptButtonText}>ACCEPT RIDE</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  mapContainer: {
    flex: 1,
    width: "100%",
  },
  topBannerStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    zIndex: 20,
  },
  incomingBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  pulseIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1FC600",
  },
  incomingBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  countdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#FEE2E2",
    borderWidth: 1,
    borderColor: "#FCA5A5",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#DC2626",
  },
  requestSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.15,
    shadowRadius: 14,
    elevation: 12,
  },
  progressTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#E2E8F0",
    borderRadius: 2,
    overflow: "hidden",
    marginBottom: 4,
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#1FC600",
  },
  earningsHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  earningsSubLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  earningsMainText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#0D6E00",
    lineHeight: 32,
    letterSpacing: -0.5,
    marginTop: 1,
  },
  fareBreakdownNote: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 2,
  },
  rideTypeBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  rideTypeBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#065F46",
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
  passengerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerMeta: {
    flex: 1,
  },
  passengerNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  ratingValue: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400E",
  },
  passengerTripsText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  pickupDistTag: {
    alignItems: "flex-end",
  },
  pickupDistVal: {
    fontSize: 14,
    fontWeight: "900",
    color: "#0F172A",
  },
  pickupDistLabel: {
    fontSize: 9,
    fontWeight: "600",
    color: "#64748B",
  },
  routeCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
  },
  routePointRow: {
    flexDirection: "row",
    gap: 10,
  },
  pickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0D6E00",
    marginTop: 3,
  },
  destDot: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "#0F172A",
    marginTop: 3,
  },
  routePointContent: {
    flex: 1,
  },
  routePointLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.3,
  },
  routePointTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
    marginTop: 1,
  },
  routePointSub: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  routeConnectorLine: {
    width: 2,
    height: 16,
    backgroundColor: "#E2E8F0",
    marginLeft: 4,
    marginVertical: 2,
  },
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 4,
  },
  declineButton: {
    flex: 1,
    height: 52,
    borderRadius: Radius.pill,
    borderWidth: 1.5,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#F8FAFC",
  },
  declineButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#64748B",
  },
  acceptButton: {
    flex: 2,
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
  acceptButtonText: {
    fontSize: 16,
    fontWeight: "900",
    color: "#064B00",
    letterSpacing: 0.5,
  },
});
