// mobile-app/src/screens/passenger/FindingRideScreen.tsx

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PassengerMapPreview from "@/components/passenger/PassengerMapPreview";
import rideLifecycleService from "@/services/ride-lifecycle.service";
import {
  RideMode,
  VEHICLE_DEFINITIONS,
  VehicleType,
} from "@/constants/vehicles";
import { Colors, Radius, Spacing } from "@/theme";

const VEHICLE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  bike: "two-wheeler",
  auto: "electric-rickshaw",
  car: "directions-car",
  sedan: "electric-car",
  suv: "airport-shuttle",
};

export default function FindingRideScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    pickupTitle?: string;
    pickupSubtitle?: string;
    pickupLat?: string;
    pickupLng?: string;
    destinationTitle?: string;
    destinationSubtitle?: string;
    destLat?: string;
    destLng?: string;
    distanceKm?: string;
    vehicleType?: string;
    rideMode?: string;
    requestedSeats?: string;
    fare?: string;
    paymentMethod?: string;
  }>();

  // Route & Ride Parameters with Robust Stitch Reference Defaults
  const pickupTitle = params.pickupTitle || "4th Block, Koramangala";
  const pickupSubtitle = params.pickupSubtitle || "Near Sony Signal junction";
  const pickupLat = parseFloat(params.pickupLat || "12.9352");
  const pickupLng = parseFloat(params.pickupLng || "77.6245");

  const destinationTitle = params.destinationTitle || "100ft Road, Indiranagar";
  const destinationSubtitle = params.destinationSubtitle || "HAL 2nd Stage, Bengaluru";
  const destLat = parseFloat(params.destLat || "12.9784");
  const destLng = parseFloat(params.destLng || "77.6408");

  const vehicleKey = (params.vehicleType as VehicleType) || "sedan";
  const rideMode = (params.rideMode as RideMode) || "shared";
  const requestedSeats = parseInt(params.requestedSeats || "1", 10);
  const fare = params.fare || "280";
  const paymentMethod = params.paymentMethod || "Cash";

  const vehicleDef = VEHICLE_DEFINITIONS[vehicleKey] || VEHICLE_DEFINITIONS.sedan;
  const vehicleIconName = VEHICLE_ICONS[vehicleKey] || "electric-car";

  // Countdown Search Timer State (Starts at 42s as in Stitch design)
  const [countdown, setCountdown] = useState<number>(42);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => (prev > 1 ? prev - 1 : 1));
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // ─── Subscribe to shared ride lifecycle ─────────────────────────────────────
  // Navigate to RideBooked when the driver accepts the request.
  // Also keep a long fallback timeout (60s) for graceful timeout UX.
  useEffect(() => {
    let navigated = false;

    const navigateToBooked = () => {
      if (navigated) return;
      navigated = true;
      router.replace({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pathname: "/passenger/ride-booked" as any,
        params: {
          pickupTitle,
          pickupSubtitle,
          pickupLat: String(pickupLat),
          pickupLng: String(pickupLng),
          destinationTitle,
          destinationSubtitle,
          destLat: String(destLat),
          destLng: String(destLng),
          vehicleType: vehicleKey,
          rideMode,
          fare,
          paymentMethod,
        },
      });
    };

    // Subscribe: driver accepting → navigate passenger to RideBooked
    const unsubscribe = rideLifecycleService.subscribePassenger((status) => {
      if (status === "DRIVER_ASSIGNED" || status === "DRIVER_EN_ROUTE") {
        navigateToBooked();
      }
    });

    // Eagerly check if driver already accepted before this screen mounted
    const currentStatus = rideLifecycleService.getPassengerStatus();
    if (currentStatus === "DRIVER_ASSIGNED" || currentStatus === "DRIVER_EN_ROUTE") {
      navigateToBooked();
    }

    // 60-second fallback: no driver found — show alert
    const fallbackTimer = setTimeout(() => {
      if (navigated) return;
      Alert.alert(
        "No Driver Found",
        "We couldn't find a driver nearby. Please try again.",
        [
          {
            text: "OK",
            onPress: () => {
              rideLifecycleService.cancelRide();
              if (router.canGoBack()) {
                router.back();
              } else {
                router.replace("/passenger/destination-search");
              }
            },
          },
        ]
      );
    }, 60000);

    return () => {
      unsubscribe();
      clearTimeout(fallbackTimer);
    };
  }, []);

  const formattedCountdown = `0:${countdown < 10 ? `0${countdown}` : countdown}`;

  // High-Velocity Green Progress Bar Animation
  const scanProgress = useRef(new Animated.Value(0)).current;
  const liveDotPulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous scanner beam animation
    const scanLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanProgress, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scanProgress, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    // Continuous pulse for network status indicator
    const dotLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(liveDotPulse, {
          toValue: 1,
          duration: 800,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(liveDotPulse, {
          toValue: 0,
          duration: 800,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    scanLoop.start();
    dotLoop.start();

    return () => {
      scanLoop.stop();
      dotLoop.stop();
    };
  }, [scanProgress, liveDotPulse]);

  // Handle Ride Cancellation
  const handleCancelSearch = () => {
    Alert.alert(
      "Cancel Ride Search?",
      `Are you sure you want to cancel your ride search for ${pickupTitle}?`,
      [
        { text: "Keep Searching", style: "cancel" },
        {
          text: "Cancel Ride",
          style: "destructive",
          onPress: () => {
            if (router.canGoBack()) {
              router.back();
            } else {
              router.replace("/passenger/destination-search");
            }
          },
        },
      ]
    );
  };

  // Back Navigation Handler
  const handleGoBack = () => {
    handleCancelSearch();
  };

  // Share Trip Information Handler
  const handleShareTrip = async () => {
    try {
      await Share.share({
        title: "PickMe Ride In Progress",
        message: `I'm booking a ${vehicleDef.label} with PickMe from ${pickupTitle} to ${destinationTitle}. Fare: ₹${fare}.`,
      });
    } catch {
      // User dismissed share dialog
    }
  };

  // Edit Pickup Handler
  const handleEditPickup = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/passenger/destination-search");
    }
  };

  return (
    <View style={styles.root}>
      {/* Top Header Bar strictly respecting Android status bar safe insets */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Finding your ride</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.circleButton}
            activeOpacity={0.7}
            onPress={() =>
              Alert.alert(
                "Safety & SOS",
                "PickMe 24/7 Safety Support is active for this trip search."
              )
            }
            accessibilityLabel="Emergency SOS"
          >
            <MaterialIcons name="security" size={20} color="#0D6E00" />
          </TouchableOpacity>

          <View style={styles.profileBadge}>
            <MaterialIcons name="person" size={16} color="#FFFFFF" />
          </View>
        </View>
      </View>

      <ScrollView
        style={styles.scrollArea}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
        {/* Map Viewport with Living Radar & Driver Markers */}
        <PassengerMapPreview
          mode="finding"
          height={320}
          pickupCoords={{
            latitude: pickupLat,
            longitude: pickupLng,
            title: pickupTitle,
            subtitle: pickupSubtitle,
          }}
          destinationCoords={{
            latitude: destLat,
            longitude: destLng,
            title: destinationTitle,
            subtitle: destinationSubtitle,
          }}
          scanningRadiusKm={2.0}
        />

        {/* Indeterminate High-Velocity Green Progress Bar */}
        <View style={styles.progressBarTrack}>
          <Animated.View
            style={[
              styles.progressBarBeam,
              {
                transform: [
                  {
                    translateX: scanProgress.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-120, 260],
                    }),
                  },
                ],
                opacity: scanProgress.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: [0.7, 1, 0.7],
                }),
              },
            ]}
          />
        </View>

        {/* Main Interactive Search Station & Ride Spec Card */}
        <View style={styles.searchCard}>
          {/* Drag Handle / Grip Indicator */}
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          {/* Searching Driver Headline & Dynamic Ping Metrics */}
          <View style={styles.headlineSection}>
            <View style={styles.liveBroadcastBadge}>
              <Animated.View
                style={[
                  styles.liveBroadcastDot,
                  {
                    transform: [
                      {
                        scale: liveDotPulse.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.8, 1.3],
                        }),
                      },
                    ],
                    opacity: liveDotPulse.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                  },
                ]}
              />
              <Text style={styles.liveBroadcastText}>Live Network Broadcast</Text>
            </View>

            <Text style={styles.searchHeadline}>
              Connecting with nearby drivers...
            </Text>

            <View style={styles.pingMetricsRow}>
              <Text style={styles.pingMetricsText}>
                Contacting 4 nearby {vehicleDef.label}s
              </Text>
              <Text style={styles.pingMetricsDot}>•</Text>
              <Text style={styles.pingMetricsHighlight}>Avg response: 45s</Text>
            </View>
          </View>

          {/* Countdown Timer Card */}
          <View style={styles.timerCard}>
            <View style={styles.timerLeft}>
              <View style={styles.timerIconCircle}>
                <MaterialIcons name="timelapse" size={18} color="#0D6E00" />
              </View>
              <Text style={styles.timerLabel}>
                Estimated search time remaining:
              </Text>
            </View>
            <View style={styles.timerBadge}>
              <Text style={styles.timerValue}>{formattedCountdown}</Text>
            </View>
          </View>

          {/* Ride Specifications Bento Card */}
          <View style={styles.rideSpecCard}>
            <View style={styles.rideSpecTopRow}>
              <View style={styles.rideSpecLeft}>
                <View style={styles.vehicleIconBox}>
                  <MaterialIcons
                    name={vehicleIconName}
                    size={28}
                    color="#0D6E00"
                  />
                  <View style={styles.vehicleActiveDot} />
                </View>

                <View style={styles.vehicleMetaCol}>
                  <View style={styles.vehicleTitleRow}>
                    <Text style={styles.vehicleTitle}>{vehicleDef.label}</Text>
                    <View style={styles.topRatedBadge}>
                      <MaterialIcons name="star" size={11} color="#046D00" />
                      <Text style={styles.topRatedText}>Top Rated</Text>
                    </View>
                  </View>

                  <View style={styles.vehicleFeaturesRow}>
                    <View style={styles.featurePill}>
                      <MaterialIcons
                        name="airline-seat-recline-normal"
                        size={12}
                        color="#0D6E00"
                      />
                      <Text style={styles.featurePillText}>
                        {rideMode === "personal"
                          ? "Exclusive"
                          : `${requestedSeats} Seat${requestedSeats > 1 ? "s" : ""}`}
                      </Text>
                    </View>

                    <View style={styles.featurePill}>
                      <MaterialIcons name="ac-unit" size={12} color="#0D6E00" />
                      <Text style={styles.featurePillText}>AC</Text>
                    </View>
                  </View>
                </View>
              </View>

              <View style={styles.fareCol}>
                <Text style={styles.fareAmount}>₹{fare}</Text>
                <View style={styles.guaranteedFareRow}>
                  <MaterialIcons name="lock" size={11} color="#0D6E00" />
                  <Text style={styles.guaranteedFareText}>Guaranteed Fare</Text>
                </View>
              </View>
            </View>

            {/* Bento 2-Column Info Grid */}
            <View style={styles.bentoGrid}>
              <View style={styles.bentoCell}>
                <View style={styles.bentoIconBox}>
                  <MaterialIcons
                    name="account-balance-wallet"
                    size={16}
                    color="#0D6E00"
                  />
                </View>
                <View style={styles.bentoContent}>
                  <Text style={styles.bentoLabel}>PAYMENT</Text>
                  <Text style={styles.bentoValue} numberOfLines={1}>
                    {paymentMethod} / UPI Auto
                  </Text>
                </View>
              </View>

              <View style={styles.bentoCell}>
                <View style={styles.bentoIconBox}>
                  <MaterialIcons name="near-me" size={16} color="#0D6E00" />
                </View>
                <View style={styles.bentoContent}>
                  <Text style={styles.bentoLabel}>PICKUP ETA</Text>
                  <Text style={styles.bentoValue} numberOfLines={1}>
                    ~3-5 mins away
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Detailed Confirmed Route Trajectory Preview */}
          <View style={styles.routeCard}>
            <Text style={styles.routeCardHeading}>CONFIRMED ROUTE</Text>

            <View style={styles.routeTimeline}>
              {/* Connecting Vertical Line */}
              <View style={styles.routeConnectorLine} />

              {/* Pickup Spot Node */}
              <View style={styles.routePointRow}>
                <View style={styles.pickupSpotDot} />
                <View style={styles.routePointContent}>
                  <Text style={styles.routePointType}>PICKUP SPOT</Text>
                  <Text style={styles.routePointTitle} numberOfLines={1}>
                    {pickupTitle}
                  </Text>
                  <Text style={styles.routePointSubtitle} numberOfLines={1}>
                    {pickupSubtitle}
                  </Text>
                </View>

                <TouchableOpacity
                  style={styles.editRouteButton}
                  activeOpacity={0.7}
                  onPress={handleEditPickup}
                >
                  <Text style={styles.editRouteText}>Edit</Text>
                </TouchableOpacity>
              </View>

              {/* Dropoff Node */}
              <View style={styles.routePointRow}>
                <View style={styles.dropoffSpotSquare} />
                <View style={styles.routePointContent}>
                  <Text style={styles.routePointType}>DROPOFF</Text>
                  <Text style={styles.routePointTitle} numberOfLines={1}>
                    {destinationTitle}
                  </Text>
                  <Text style={styles.routePointSubtitle} numberOfLines={1}>
                    {destinationSubtitle}
                  </Text>
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Action Controls Deck */}
          <View style={styles.actionDeck}>
            {/* Primary Cancel Search Button */}
            <TouchableOpacity
              style={styles.cancelSearchButton}
              activeOpacity={0.85}
              onPress={handleCancelSearch}
            >
              <MaterialIcons name="close" size={20} color="#BA1A1A" />
              <Text style={styles.cancelSearchText}>Cancel Search</Text>
            </TouchableOpacity>

            {/* Auxiliary Utility Actions */}
            <View style={styles.auxiliaryRow}>
              <TouchableOpacity
                style={styles.auxiliaryButton}
                activeOpacity={0.7}
                onPress={handleEditPickup}
              >
                <MaterialIcons name="edit-location" size={17} color="#4B5563" />
                <Text style={styles.auxiliaryButtonText}>Edit Pickup</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.auxiliaryButton}
                activeOpacity={0.7}
                onPress={handleShareTrip}
              >
                <MaterialIcons name="share" size={17} color="#4B5563" />
                <Text style={styles.auxiliaryButtonText}>Share Trip</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Safe bottom spacer */}
          <View style={{ height: Math.max(insets.bottom, 20) }} />
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },
  topHeader: {
    backgroundColor: "rgba(249, 249, 255, 0.95)",
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(0,0,0,0.04)",
    zIndex: 20,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#141B2B",
    letterSpacing: -0.2,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  circleButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 2,
    elevation: 2,
  },
  profileBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  // High-Velocity Animated Progress Bar
  progressBarTrack: {
    width: "100%",
    height: 4,
    backgroundColor: "#DCE2F7",
    overflow: "hidden",
    position: "relative",
  },
  progressBarBeam: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 140,
    backgroundColor: "#1FC600",
    borderRadius: 2,
  },
  // Bottom Card Deck
  searchCard: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 18,
    paddingTop: 12,
    marginTop: -10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 8,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingVertical: 4,
    marginBottom: 8,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#DCE2F7",
  },
  // Headline & Live Ping Section
  headlineSection: {
    alignItems: "center",
    marginBottom: 16,
  },
  liveBroadcastBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: 8,
  },
  liveBroadcastDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#0D6E00",
  },
  liveBroadcastText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#141B2B",
    letterSpacing: 0.2,
  },
  searchHeadline: {
    fontSize: 20,
    fontWeight: "800",
    color: "#141B2B",
    textAlign: "center",
    letterSpacing: -0.3,
  },
  pingMetricsRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 4,
  },
  pingMetricsText: {
    fontSize: 13,
    color: "#4B5563",
    fontWeight: "500",
  },
  pingMetricsDot: {
    fontSize: 12,
    color: "#9CA3AF",
  },
  pingMetricsHighlight: {
    fontSize: 13,
    color: "#0D6E00",
    fontWeight: "700",
  },
  // Countdown Timer Card
  timerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    marginBottom: 14,
  },
  timerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  timerIconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E1E8FD",
    alignItems: "center",
    justifyContent: "center",
  },
  timerLabel: {
    fontSize: 13,
    color: "#374151",
    fontWeight: "500",
    flex: 1,
  },
  timerBadge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  timerValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#141B2B",
    fontVariant: ["tabular-nums"],
  },
  // Ride Specifications Bento Card
  rideSpecCard: {
    backgroundColor: "#F1F3FF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
    gap: 12,
  },
  rideSpecTopRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rideSpecLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    flex: 1,
  },
  vehicleIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: "rgba(31, 198, 0, 0.4)",
    position: "relative",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  vehicleActiveDot: {
    position: "absolute",
    bottom: 3,
    right: 3,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0D6E00",
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  vehicleMetaCol: {
    flex: 1,
    gap: 3,
  },
  vehicleTitleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  vehicleTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#141B2B",
  },
  topRatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#0EF900",
    paddingHorizontal: 6,
    paddingVertical: 1.5,
    borderRadius: Radius.pill,
  },
  topRatedText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#046D00",
    textTransform: "uppercase",
  },
  vehicleFeaturesRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  featurePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  featurePillText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#374151",
  },
  fareCol: {
    alignItems: "flex-end",
  },
  fareAmount: {
    fontSize: 22,
    fontWeight: "800",
    color: "#141B2B",
  },
  guaranteedFareRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    marginTop: 1,
  },
  guaranteedFareText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#0D6E00",
  },
  // Bento 2-Column Info Grid
  bentoGrid: {
    flexDirection: "row",
    gap: 8,
  },
  bentoCell: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderRadius: Radius.md,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  bentoIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: "#E9EDFF",
    alignItems: "center",
    justifyContent: "center",
  },
  bentoContent: {
    flex: 1,
  },
  bentoLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  bentoValue: {
    fontSize: 11,
    fontWeight: "700",
    color: "#141B2B",
    marginTop: 1,
  },
  // Route Trajectory Card
  routeCard: {
    backgroundColor: "#F1F3FF",
    borderRadius: 20,
    padding: 14,
    marginBottom: 14,
  },
  routeCardHeading: {
    fontSize: 11,
    fontWeight: "800",
    color: "#4B5563",
    letterSpacing: 0.8,
    marginBottom: 12,
  },
  routeTimeline: {
    position: "relative",
    paddingLeft: 22,
    gap: 16,
  },
  routeConnectorLine: {
    position: "absolute",
    left: 6,
    top: 10,
    bottom: 12,
    width: 2,
    backgroundColor: "#BCCBB2",
  },
  routePointRow: {
    position: "relative",
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  pickupSpotDot: {
    position: "absolute",
    left: -22,
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#1FC600",
    borderWidth: 2.5,
    borderColor: "#E9EDFF",
  },
  dropoffSpotSquare: {
    position: "absolute",
    left: -22,
    top: 3,
    width: 14,
    height: 14,
    borderRadius: 3,
    backgroundColor: "#BA1A1A",
    borderWidth: 2.5,
    borderColor: "#E9EDFF",
  },
  routePointContent: {
    flex: 1,
    paddingRight: 8,
  },
  routePointType: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
  },
  routePointTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#141B2B",
    marginTop: 1,
  },
  routePointSubtitle: {
    fontSize: 11,
    color: "#6B7280",
    marginTop: 1,
  },
  editRouteButton: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.sm,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1,
    elevation: 1,
  },
  editRouteText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0D6E00",
  },
  // Bottom Action Deck
  actionDeck: {
    gap: 10,
    marginTop: 4,
  },
  cancelSearchButton: {
    width: "100%",
    backgroundColor: "#FFDAD6",
    borderRadius: Radius.pill,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 3,
    elevation: 2,
  },
  cancelSearchText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#BA1A1A",
    letterSpacing: 0.2,
  },
  auxiliaryRow: {
    flexDirection: "row",
    gap: 10,
  },
  auxiliaryButton: {
    flex: 1,
    backgroundColor: "#F1F3FF",
    borderRadius: Radius.md,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 1,
  },
  auxiliaryButtonText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#141B2B",
  },
});
