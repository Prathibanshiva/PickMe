// mobile-app/src/screens/driver/DriverAcceptedScreen.tsx

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

export default function DriverAcceptedScreen() {
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

  const handleStartDriving = () => {
    rideLifecycleService.startDrivingToPickup();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace("/driver/en-route-pickup" as any);
  };

  const handleCallPassenger = () => {
    Alert.alert("Call Passenger", `Calling ${offer.passengerName} (${offer.passengerPhone})…`);
  };

  const handleChatPassenger = () => {
    Alert.alert("Message Passenger", `Opening chat with ${offer.passengerName}…`);
  };

  return (
    <View style={styles.root}>
      {/* ── Top Floating Header ───────────────────────────────────────────── */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.statusBadgePill}>
          <View style={styles.statusBadgeDot} />
          <Text style={styles.statusBadgeText}>RIDE ACCEPTED</Text>
        </View>

        <TouchableOpacity
          style={styles.cancelLinkButton}
          onPress={() => {
            Alert.alert(
              "Cancel Ride?",
              "Cancelling accepted rides may affect your driver rating.",
              [
                { text: "Keep Ride", style: "cancel" },
                {
                  text: "Cancel Ride",
                  style: "destructive",
                  onPress: () => {
                    rideLifecycleService.declineRequest();
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    router.replace("/driver/home" as any);
                  },
                },
              ]
            );
          }}
        >
          <Text style={styles.cancelLinkText}>Cancel</Text>
        </TouchableOpacity>
      </View>

      {/* ── Map Overview ──────────────────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <DriverMapPreview
          mode="en_route"
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
          showRecenterButton={true}
        />
      </View>

      {/* ── Details Sheet ─────────────────────────────────────────────────── */}
      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
      >
        {/* Passenger Profile Strip */}
        <View style={styles.passengerCard}>
          <View style={styles.avatarCircle}>
            <MaterialIcons name="person" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.passengerDetails}>
            <View style={styles.nameRow}>
              <Text style={styles.passengerName}>{offer.passengerName}</Text>
              <View style={styles.ratingBadge}>
                <MaterialIcons name="star" size={11} color="#F59E0B" />
                <Text style={styles.ratingText}>{offer.passengerRating}</Text>
              </View>
            </View>
            <Text style={styles.subtext}>
              {offer.rideMode} · {offer.vehicleType}
            </Text>
          </View>

          {/* Quick Contact Buttons */}
          <View style={styles.commsRow}>
            <TouchableOpacity
              style={styles.commsBtn}
              onPress={handleCallPassenger}
              activeOpacity={0.8}
              accessibilityLabel="Call passenger"
            >
              <MaterialIcons name="call" size={18} color="#0D6E00" />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.commsBtn}
              onPress={handleChatPassenger}
              activeOpacity={0.8}
              accessibilityLabel="Message passenger"
            >
              <MaterialIcons name="chat" size={18} color="#334155" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Pickup Location Card */}
        <View style={styles.pickupHighlightCard}>
          <View style={styles.pickupHeader}>
            <MaterialIcons name="navigation" size={16} color="#0D6E00" />
            <Text style={styles.pickupHeaderLabel}>PICKUP LOCATION · 1.2 KM (3 MIN)</Text>
          </View>
          <Text style={styles.pickupMainTitle}>{offer.pickupTitle}</Text>
          <Text style={styles.pickupSubTitle}>{offer.pickupSubtitle}</Text>
        </View>

        {/* Guaranteed Payout Strip */}
        <View style={styles.payoutStrip}>
          <View>
            <Text style={styles.payoutLabel}>TRIP EARNINGS</Text>
            <Text style={styles.payoutAmount}>₹{offer.driverEarnings.toFixed(2)}</Text>
          </View>
          <View style={styles.distCol}>
            <Text style={styles.payoutLabel}>TRIP DISTANCE</Text>
            <Text style={styles.distValue}>{offer.distanceKm} km</Text>
          </View>
          <View style={styles.distCol}>
            <Text style={styles.payoutLabel}>EST. DURATION</Text>
            <Text style={styles.distValue}>{offer.durationMin} min</Text>
          </View>
        </View>

        {/* Primary CTA: Start Driving to Pickup */}
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={handleStartDriving}
          activeOpacity={0.85}
          accessibilityLabel="Start driving to pickup"
        >
          <MaterialIcons name="directions" size={22} color="#064B00" />
          <Text style={styles.primaryActionText}>START DRIVING TO PICKUP</Text>
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
  topHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusBadgePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#1FC600",
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  cancelLinkButton: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  cancelLinkText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
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
  passengerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 10,
  },
  avatarCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  passengerName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  ratingBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  ratingText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#92400E",
  },
  subtext: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 2,
  },
  commsRow: {
    flexDirection: "row",
    gap: 8,
  },
  commsBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupHighlightCard: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 16,
    padding: 12,
  },
  pickupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginBottom: 4,
  },
  pickupHeaderLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#065F46",
    letterSpacing: 0.4,
  },
  pickupMainTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  pickupSubTitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#475569",
    marginTop: 1,
  },
  payoutStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  payoutLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.4,
  },
  payoutAmount: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0D6E00",
    marginTop: 2,
  },
  distCol: {
    alignItems: "flex-end",
  },
  distValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  primaryActionButton: {
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
    marginTop: 2,
  },
  primaryActionText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#064B00",
    letterSpacing: 0.5,
  },
});
