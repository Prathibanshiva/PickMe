// mobile-app/src/screens/passenger/RideBookedScreen.tsx

import React, { useEffect, useRef } from "react";
import {
  Alert,
  Animated,
  Easing,
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
  VEHICLE_DEFINITIONS,
  VehicleType,
} from "@/constants/vehicles";
import { Colors, Radius } from "@/theme";

// ─── Mock Driver Data ────────────────────────────────────────────────────────

const MOCK_DRIVER = {
  name: "Rajesh Kumar",
  rating: "4.9",
  trips: "4.2k",
  vehiclePlate: "KA 01 MX 7823",
  vehicleModel: "White Maruti Suzuki Dzire",
  vehicleType: "Sedan",
  etaMinutes: 3,
  otp: ["7", "2", "9", "4"],
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function RideBookedScreen() {
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
    vehicleType?: string;
    rideMode?: string;
    fare?: string;
    paymentMethod?: string;
  }>();

  const pickupTitle = params.pickupTitle || "4th Block, Koramangala";
  const pickupSubtitle = params.pickupSubtitle || "Near Sony Signal junction";
  const pickupLat = parseFloat(params.pickupLat || "12.9352");
  const pickupLng = parseFloat(params.pickupLng || "77.6245");
  const destinationTitle = params.destinationTitle || "100ft Road, Indiranagar";
  const destinationSubtitle = params.destinationSubtitle || "HAL 2nd Stage, Bengaluru";
  const destLat = parseFloat(params.destLat || "12.9784");
  const destLng = parseFloat(params.destLng || "77.6408");
  const vehicleKey = (params.vehicleType as VehicleType) || "sedan";
  const fare = params.fare || "280";
  const paymentMethod = params.paymentMethod || "Cash";
  const vehicleDef = VEHICLE_DEFINITIONS[vehicleKey] || VEHICLE_DEFINITIONS.sedan;

  // ── Animations ───────────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const otpEntrance = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(36)).current;
  const cardFade = useRef(new Animated.Value(0)).current;

  useEffect(() => {
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

    Animated.sequence([
      Animated.parallel([
        Animated.spring(cardSlide, {
          toValue: 0,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(cardFade, {
          toValue: 1,
          duration: 380,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
      Animated.timing(otpEntrance, {
        toValue: 1,
        duration: 340,
        delay: 80,
        easing: Easing.out(Easing.back(1.4)),
        useNativeDriver: true,
      }),
    ]).start();

    return () => pulseLoop.stop();
  }, []);

  // ─── OTP from shared lifecycle session ─────────────────────────────────────
  // The service owns the OTP; the passenger shows it and the driver verifies it.
  const sessionOtp =
    rideLifecycleService.getActiveState().activeOffer?.otp || MOCK_DRIVER.otp.join("");
  const otpDigits = sessionOtp.split("");

  // ─── Lifecycle subscription: navigate to LiveRide when trip starts ──────────
  // When the driver verifies OTP → TRIP_ACTIVE → passenger moves to LiveRide.
  useEffect(() => {
    let navigated = false;

    const navigateToLiveRide = () => {
      if (navigated) return;
      navigated = true;
      const offer = rideLifecycleService.getActiveState().activeOffer;
      router.replace({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pathname: "/passenger/live-ride" as any,
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
          rideMode: params.rideMode || "personal",
          fare,
          paymentMethod,
          driverName: MOCK_DRIVER.name,
          driverPlate: MOCK_DRIVER.vehiclePlate,
          driverModel: MOCK_DRIVER.vehicleModel,
          otp: offer?.otp || sessionOtp,
        },
      });
    };

    const unsubscribe = rideLifecycleService.subscribePassenger((status) => {
      if (status === "TRIP_ACTIVE") {
        navigateToLiveRide();
      }
    });

    // Eagerly check — driver may already have verified OTP
    if (rideLifecycleService.getPassengerStatus() === "TRIP_ACTIVE") {
      navigateToLiveRide();
    }

    return () => {
      unsubscribe();
    };
  }, []);

  // ─── Manual demo button: simulate trip start without driver ─────────────────
  const handleStartTrip = () => {
    const offer = rideLifecycleService.getActiveState().activeOffer;
    // If a shared session exists, advance it; otherwise navigate directly.
    if (offer) {
      rideLifecycleService.startTripDirectly();
    } else {
      router.replace({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        pathname: "/passenger/live-ride" as any,
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
          rideMode: params.rideMode || "personal",
          fare,
          paymentMethod,
          driverName: MOCK_DRIVER.name,
          driverPlate: MOCK_DRIVER.vehiclePlate,
          driverModel: MOCK_DRIVER.vehicleModel,
          otp: MOCK_DRIVER.otp.join(""),
        },
      });
    }
  };


  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleCancelRide = () => {
    Alert.alert(
      "Cancel Ride?",
      "Are you sure? A cancellation fee may apply since the driver is en route.",
      [
        { text: "Keep Ride", style: "cancel" },
        {
          text: "Cancel Ride",
          style: "destructive",
          onPress: () => router.replace("/passenger/destination-search"),
        },
      ]
    );
  };

  const handleShareStatus = async () => {
    try {
      await Share.share({
        title: "PickMe – Ride In Progress",
        message:
          `🚗 I've booked a ${vehicleDef.label} with PickMe!\n` +
          `📍 From: ${pickupTitle}\n` +
          `📍 To: ${destinationTitle}\n` +
          `👨‍✈️ Driver: ${MOCK_DRIVER.name} · ${MOCK_DRIVER.vehiclePlate}\n` +
          `💰 Fare: ₹${fare} · ETA: ${MOCK_DRIVER.etaMinutes} min`,
      });
    } catch {
      // dismissed
    }
  };

  const handleCallDriver = () => {
    Alert.alert(
      "Call Driver",
      `Calling ${MOCK_DRIVER.name}…\n\nIn the live app this will initiate a masked call.`,
      [{ text: "OK" }]
    );
  };

  const handleChatDriver = () => {
    Alert.alert(
      "Chat with Driver",
      `Opening chat with ${MOCK_DRIVER.name}…\n\nIn-app chat will be available in the next build.`,
      [{ text: "OK" }]
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Floating Header ─────────────────────────────────────────────── */}
      <View
        style={[styles.floatingHeader, { paddingTop: Math.max(insets.top, 12) }]}
        pointerEvents="box-none"
      >
        <TouchableOpacity
          style={styles.circleButton}
          onPress={handleCancelRide}
          activeOpacity={0.75}
          accessibilityLabel="Cancel ride and go back"
          hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
        >
          <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
        </TouchableOpacity>

        <View style={styles.etaPill}>
          <Animated.View
            style={[
              styles.etaPillDot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.5, 1],
                }),
                transform: [
                  {
                    scale: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.85, 1.2],
                    }),
                  },
                ],
              },
            ]}
          />
          <Text style={styles.etaPillText}>
            Ride Confirmed · {MOCK_DRIVER.etaMinutes} min away
          </Text>
        </View>

        <TouchableOpacity
          style={styles.circleButton}
          onPress={() =>
            Alert.alert(
              "Safety & SOS",
              "PickMe 24/7 Safety Support is active for this trip."
            )
          }
          activeOpacity={0.75}
          accessibilityLabel="Safety and SOS"
        >
          <MaterialIcons name="security" size={20} color="#0D6E00" />
        </TouchableOpacity>
      </View>

      {/* ── Map ─────────────────────────────────────────────────────────── */}
      <PassengerMapPreview
        mode="booked"
        height={300}
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
      />

      {/* ── Bottom Sheet ─────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: cardSlide }],
            opacity: cardFade,
          },
        ]}
      >
        {/* Drag handle */}
        <View style={styles.dragHandleWrap}>
          <View style={styles.dragHandle} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.sheetContent,
            { paddingBottom: Math.max(insets.bottom + 10, 28) },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Header: Status Badge + Headline + Subtext + OTP ─────── */}
          <View style={styles.headerSection}>
            <View style={styles.statusBadge}>
              <Animated.View
                style={[
                  styles.statusBadgeDot,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.5, 1],
                    }),
                  },
                ]}
              />
              <Text style={styles.statusBadgeText}>DRIVER EN ROUTE</Text>
            </View>

            <Text style={styles.rideHeadline}>Your ride is on the way</Text>
            <Text style={styles.rideSubheadline}>
              Share this 4-digit PIN with your driver to start the trip
            </Text>

            {/* OTP PIN Box */}
            <Animated.View
              style={[
                styles.otpBox,
                {
                  transform: [
                    {
                      scale: otpEntrance.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.84, 1],
                      }),
                    },
                  ],
                  opacity: otpEntrance,
                },
              ]}
            >
              {otpDigits.map((digit, idx) => (
                <View key={idx} style={styles.otpDigitBox}>
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              ))}
            </Animated.View>
          </View>

          {/* ── Driver & Vehicle Card ─────────────────────────────────── */}
          <View style={styles.driverCard}>
            {/* Top: avatar + name/rating + call/chat */}
            <View style={styles.driverTopRow}>
              <View style={styles.avatarWrap}>
                <View style={styles.avatarCircle}>
                  <MaterialIcons name="person" size={34} color="#FFFFFF" />
                </View>
                <View style={styles.verifiedBadge}>
                  <MaterialIcons name="check" size={11} color="#FFFFFF" />
                </View>
              </View>

              <View style={styles.driverMeta}>
                <Text style={styles.driverName}>{MOCK_DRIVER.name}</Text>
                <View style={styles.ratingRow}>
                  <View style={styles.ratingPill}>
                    <MaterialIcons name="star" size={13} color="#F59E0B" />
                    <Text style={styles.ratingValue}>{MOCK_DRIVER.rating}</Text>
                  </View>
                  <Text style={styles.tripCount}>· {MOCK_DRIVER.trips} rides</Text>
                </View>
              </View>

              <View style={styles.commsRow}>
                <TouchableOpacity
                  style={styles.commsButton}
                  onPress={handleCallDriver}
                  activeOpacity={0.75}
                  accessibilityLabel="Call driver"
                >
                  <MaterialIcons name="call" size={20} color="#0D6E00" />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.commsButton}
                  onPress={handleChatDriver}
                  activeOpacity={0.75}
                  accessibilityLabel="Chat with driver"
                >
                  <MaterialIcons name="chat" size={20} color="#374151" />
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Vehicle details */}
            <View style={styles.vehicleRow}>
              <View style={styles.vehicleDetails}>
                <View style={styles.vehiclePlateRow}>
                  <Text style={styles.vehiclePlate}>{MOCK_DRIVER.vehiclePlate}</Text>
                  <View style={styles.vehicleTypeBadge}>
                    <Text style={styles.vehicleTypeBadgeText}>{MOCK_DRIVER.vehicleType}</Text>
                  </View>
                </View>
                <Text style={styles.vehicleModel}>{MOCK_DRIVER.vehicleModel}</Text>
              </View>
              <View style={styles.vehicleIconBox}>
                <MaterialIcons name="directions-car" size={26} color="#0D6E00" />
              </View>
            </View>
          </View>

          {/* ── Route Recap ───────────────────────────────────────────── */}
          <View style={styles.routeCard}>
            <View style={styles.routeRow}>
              <View style={styles.pickupDot} />
              <View style={styles.routeRowContent}>
                <Text style={styles.routeLabel}>Pickup</Text>
                <Text style={styles.routeValue} numberOfLines={1}>{pickupTitle}</Text>
              </View>
            </View>
            <View style={styles.routeConnector} />
            <View style={styles.routeRow}>
              <View style={styles.dropoffDot} />
              <View style={styles.routeRowContent}>
                <Text style={styles.routeLabel}>Dropoff</Text>
                <Text style={styles.routeValue} numberOfLines={1}>{destinationTitle}</Text>
              </View>
            </View>
          </View>

          {/* ── Fare & Payment ─────────────────────────────────────────── */}
          <View style={styles.fareRow}>
            <View style={styles.fareLeft}>
              <View style={styles.fareIconCircle}>
                <MaterialIcons name="payments" size={22} color="#0D6E00" />
              </View>
              <View>
                <Text style={styles.fareLabel}>GUARANTEED FARE</Text>
                <Text style={styles.fareAmount}>₹{fare}</Text>
              </View>
            </View>

            <View style={styles.paymentGroup}>
              <Text style={styles.paymentPillLabel}>PAYMENT</Text>
              <View style={styles.paymentPill}>
                <Text style={styles.paymentPillValue}>{paymentMethod} / UPI</Text>
                <MaterialIcons name="expand-more" size={15} color="#374151" />
              </View>
            </View>
          </View>

          {/* ── Demo Start Trip Button ──────────────────────────────────── */}
          <TouchableOpacity
            style={styles.startTripButton}
            onPress={handleStartTrip}
            activeOpacity={0.85}
            accessibilityLabel="Start trip immediately"
          >
            <MaterialIcons name="navigation" size={19} color="#FFFFFF" />
            <Text style={styles.startTripButtonText}>Start Trip · Driver Arrived (Demo)</Text>
          </TouchableOpacity>

          {/* ── Action Buttons ─────────────────────────────────────────── */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancelRide}
              activeOpacity={0.85}
              accessibilityLabel="Cancel ride"
            >
              <Text style={styles.cancelButtonText}>Cancel Ride</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.shareButton}
              onPress={handleShareStatus}
              activeOpacity={0.85}
              accessibilityLabel="Share ride status"
            >
              <MaterialIcons name="share" size={18} color="#F9F9FF" />
              <Text style={styles.shareButtonText}>Share Status</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },

  // Floating header
  floatingHeader: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 50,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 4,
  },
  etaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    backgroundColor: "rgba(255,255,255,0.96)",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.25)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.09,
    shadowRadius: 4,
    elevation: 4,
  },
  etaPillDot: {
    width: 9,
    height: 9,
    borderRadius: 5,
    backgroundColor: "#1FC600",
  },
  etaPillText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#141B2B",
    letterSpacing: 0.1,
  },

  // Bottom sheet
  bottomSheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.09,
    shadowRadius: 14,
    elevation: 10,
  },
  dragHandleWrap: {
    alignItems: "center",
    paddingVertical: 10,
  },
  dragHandle: {
    width: 44,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#DCE2F7",
  },
  sheetContent: {
    paddingHorizontal: 18,
    gap: 14,
  },

  // Header section
  headerSection: {
    alignItems: "center",
    gap: 6,
    paddingBottom: 2,
  },
  statusBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(31,198,0,0.08)",
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(31,198,0,0.22)",
  },
  statusBadgeDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#1FC600",
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0D6E00",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  rideHeadline: {
    fontSize: 22,
    fontWeight: "800",
    color: "#141B2B",
    textAlign: "center",
    letterSpacing: -0.4,
    marginTop: 2,
  },
  rideSubheadline: {
    fontSize: 13,
    color: "#4B5563",
    textAlign: "center",
    lineHeight: 18,
    maxWidth: 280,
  },

  // OTP
  otpBox: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    backgroundColor: "#F1F3FF",
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderWidth: 2,
    borderColor: "rgba(31,198,0,0.25)",
    marginTop: 4,
    alignSelf: "stretch",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  otpDigitBox: {
    flex: 1,
    height: 58,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.3)",
  },
  otpDigit: {
    fontSize: 34,
    fontWeight: "900",
    color: "#141B2B",
    letterSpacing: -0.5,
    fontVariant: ["tabular-nums"],
  },

  // Driver card
  driverCard: {
    backgroundColor: "#F1F3FF",
    borderRadius: 20,
    padding: 14,
    gap: 12,
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  driverTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  verifiedBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#1FC600",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  driverMeta: {
    flex: 1,
    gap: 3,
  },
  driverName: {
    fontSize: 17,
    fontWeight: "800",
    color: "#141B2B",
    letterSpacing: -0.2,
  },
  ratingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  ratingPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.3)",
  },
  ratingValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#141B2B",
  },
  tripCount: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  commsRow: {
    flexDirection: "row",
    gap: 8,
  },
  commsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.3)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  divider: {
    height: 1,
    backgroundColor: "rgba(188,203,178,0.35)",
  },
  vehicleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  vehicleDetails: {
    flex: 1,
    gap: 2,
  },
  vehiclePlateRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  vehiclePlate: {
    fontSize: 19,
    fontWeight: "800",
    color: "#141B2B",
    letterSpacing: 0.5,
  },
  vehicleTypeBadge: {
    backgroundColor: "rgba(31,198,0,0.12)",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  vehicleTypeBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0D6E00",
  },
  vehicleModel: {
    fontSize: 13,
    color: "#6B7280",
    fontWeight: "500",
  },
  vehicleIconBox: {
    width: 52,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.35)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },

  // Route recap
  routeCard: {
    backgroundColor: "#F1F3FF",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.22)",
    gap: 0,
  },
  routeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 4,
  },
  pickupDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#1FC600",
  },
  dropoffDot: {
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: "#141B2B",
  },
  routeConnector: {
    width: 2,
    height: 10,
    backgroundColor: "rgba(188,203,178,0.5)",
    marginLeft: 4.5,
  },
  routeRowContent: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  routeLabel: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  routeValue: {
    fontSize: 12,
    fontWeight: "800",
    color: "#141B2B",
    maxWidth: "65%",
    textAlign: "right",
  },

  // Fare & payment
  fareRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
  },
  fareLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  fareIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#F1F3FF",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.3)",
  },
  fareLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  fareAmount: {
    fontSize: 24,
    fontWeight: "900",
    color: "#141B2B",
    letterSpacing: -0.5,
    marginTop: 1,
  },
  paymentGroup: {
    alignItems: "flex-end",
    gap: 2,
  },
  paymentPillLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#6B7280",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  paymentPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(188,203,178,0.3)",
  },
  paymentPillValue: {
    fontSize: 12,
    fontWeight: "700",
    color: "#141B2B",
  },

  // Action buttons
  actionRow: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  cancelButton: {
    flex: 1,
    height: 50,
    borderRadius: Radius.pill,
    borderWidth: 2,
    borderColor: "rgba(186,26,26,0.75)",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "transparent",
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#BA1A1A",
  },
  shareButton: {
    flex: 1,
    height: 50,
    borderRadius: Radius.pill,
    backgroundColor: "#141B2B",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  shareButtonText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#F9F9FF",
  },
  startTripButton: {
    height: 52,
    borderRadius: Radius.pill,
    backgroundColor: "#0D6E00",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 4,
    shadowColor: "#0D6E00",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 4,
  },
  startTripButtonText: {
    fontSize: 15,
    fontWeight: "800",
    color: "#FFFFFF",
  },
});
