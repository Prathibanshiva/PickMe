// mobile-app/src/screens/passenger/LiveRideScreen.tsx

import React, { useEffect, useRef, useState } from "react";
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

// ─── Mock Trip Data ──────────────────────────────────────────────────────────

const MOCK_DRIVER = {
  name: "Rajesh Kumar",
  rating: "4.9",
  trips: "4,200+",
  vehiclePlate: "KA 01 MX 7823",
  vehicleModel: "White Maruti Suzuki Dzire",
  vehicleType: "Sedan",
  speed: "38 km/h",
  etaRemainingMin: 18,
  distanceRemainingKm: "5.4",
  nextStopName: "Domlur Flyover",
  nextStopMin: 6,
  nextStopDist: "1.8 km",
  otp: "7294",
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function LiveRideScreen() {
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
    driverName?: string;
    driverPlate?: string;
    driverModel?: string;
    otp?: string;
  }>();

  const pickupTitle = params.pickupTitle || "4th Block, Koramangala";
  const pickupSubtitle = params.pickupSubtitle || "Near Sony World Signal, 80ft Road";
  const pickupLat = parseFloat(params.pickupLat || "12.9352");
  const pickupLng = parseFloat(params.pickupLng || "77.6245");
  const destinationTitle = params.destinationTitle || "100ft Road, Indiranagar";
  const destinationSubtitle = params.destinationSubtitle || "Opposite Toit Brewpub, Stage 2";
  const destLat = parseFloat(params.destLat || "12.9784");
  const destLng = parseFloat(params.destLng || "77.6408");
  const vehicleKey = (params.vehicleType as VehicleType) || "sedan";
  const fare = params.fare || "280";
  const paymentMethod = params.paymentMethod || "UPI AutoPay";
  const vehicleDef = VEHICLE_DEFINITIONS[vehicleKey] || VEHICLE_DEFINITIONS.sedan;

  const driverName = params.driverName || MOCK_DRIVER.name;
  const driverPlate = params.driverPlate || MOCK_DRIVER.vehiclePlate;
  const driverModel = params.driverModel || MOCK_DRIVER.vehicleModel;
  const otpCode = params.otp || MOCK_DRIVER.otp;

  // ── States ───────────────────────────────────────────────────────────────
  const [isMuted, setIsMuted] = useState(false);
  const [isTrafficOn, setIsTrafficOn] = useState(true);

  // ── Animations ───────────────────────────────────────────────────────────
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const cardSlide = useRef(new Animated.Value(30)).current;
  const cardFade = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Beacon Pulse Loop
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 900,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 900,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Sheet Slide-up Entrance
    Animated.parallel([
      Animated.spring(cardSlide, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
      Animated.timing(cardFade, {
        toValue: 1,
        duration: 350,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: 0.65,
        duration: 1200,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: false,
      }),
    ]).start();

    return () => pulseLoop.stop();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const handleBack = () => {
    Alert.alert(
      "Trip in Progress",
      "Your trip with Rajesh Kumar is currently active. Return to passenger home while keeping trip active?",
      [
        { text: "Stay on Trip", style: "cancel" },
        {
          text: "Minimize Trip",
          onPress: () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            router.replace("/passenger/destination-search" as any);
          },
        },
      ]
    );
  };

  const handleShareTrip = async () => {
    try {
      await Share.share({
        title: "PickMe Live Trip Tracking",
        message:
          `🚗 I'm on a PickMe ride to ${destinationTitle}!\n` +
          `📍 Picked up: ${pickupTitle}\n` +
          `👨‍✈️ Driver: ${driverName} · ${driverPlate}\n` +
          `⏱️ Est. Arrival: ${MOCK_DRIVER.etaRemainingMin} min (${MOCK_DRIVER.distanceRemainingKm} km left)\n` +
          `🔗 Live track: https://track.pickme.app/live/${driverPlate.replace(/\s+/g, "")}`,
      });
    } catch {
      // dismissed
    }
  };

  const handleCallDriver = () => {
    Alert.alert(
      "Call Driver",
      `Calling ${driverName} (${driverPlate})…\n\nMasked cellular call connected.`,
      [{ text: "OK" }]
    );
  };

  const handleSendMessage = () => {
    Alert.alert(
      "Send Message",
      `Opening message chat with ${driverName}…`,
      [{ text: "OK" }]
    );
  };

  const handleSafetyDesk = () => {
    Alert.alert(
      "PickMe Safety & Support",
      "24/7 Safety Command Center is active for this trip.\n\n• Live GPS Route Monitoring: Active\n• Incident Detection: Enabled\n• Emergency Response Team: Standing by",
      [
        { text: "Dismiss", style: "cancel" },
        {
          text: "Call Safety Desk",
          style: "default",
          onPress: () => Alert.alert("Safety Desk", "Connecting to safety helpline…"),
        },
      ]
    );
  };

  const handleChangeDropoff = () => {
    Alert.alert(
      "Change Drop-off",
      "Would you like to modify your destination? Extra fare will be recalculated automatically.",
      [
        { text: "Keep Destination", style: "cancel" },
        {
          text: "Change",
          onPress: () => Alert.alert("Change Drop-off", "Destination search will open to update destination."),
        },
      ]
    );
  };

  const handleSplitFare = () => {
    Alert.alert(
      "Split Fare",
      `Total Guaranteed Fare: ₹${fare}\n\nInvite up to 3 co-passengers to split fare equally.`,
      [{ text: "Done" }]
    );
  };

  const handleEmergency = () => {
    Alert.alert(
      "Emergency SOS",
      "Triggering emergency SOS will notify local police (112) and your emergency contacts with your live GPS location.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Trigger SOS",
          style: "destructive",
          onPress: () => Alert.alert("SOS Triggered", "Emergency contacts and safety desk have been notified."),
        },
      ]
    );
  };

  const navigateToCompleted = () => {
    router.replace({
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pathname: "/passenger/ride-completed" as any,
      params: {
        pickupTitle,
        pickupSubtitle,
        destinationTitle,
        destinationSubtitle,
        fare,
        paymentMethod,
        vehicleType: vehicleKey,
        rideMode: params.rideMode || "personal",
        driverName,
        driverPlate,
        driverModel,
      },
    });
  };

  // ─── Subscribe to lifecycle: navigate to RideCompleted when driver completes trip
  useEffect(() => {
    let navigated = false;

    const unsubscribe = rideLifecycleService.subscribePassenger((status) => {
      if (status === "TRIP_COMPLETED" && !navigated) {
        navigated = true;
        navigateToCompleted();
      }
    });

    // Eagerly check in case driver already completed
    if (rideLifecycleService.getPassengerStatus() === "TRIP_COMPLETED" && !navigated) {
      navigated = true;
      navigateToCompleted();
    }

    // Periodic sync with backend to detect trip completion
    const pollInterval = setInterval(() => {
      rideLifecycleService.syncActiveRide();
    }, 3000);

    return () => {
      unsubscribe();
      clearInterval(pollInterval);
    };
  }, []);

  const handleCompleteTripDemo = () => {
    // If a shared session exists, mark it complete (which notifies both sides).
    // The subscription above will then auto-navigate.
    const offer = rideLifecycleService.getActiveState().activeOffer;
    if (offer) {
      rideLifecycleService.completeTrip();
    } else {
      navigateToCompleted();
    }
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Top Floating Navigation Strip ─────────────────────────────────── */}
      <View
        style={[styles.topStrip, { paddingTop: Math.max(insets.top + 6, 16) }]}
        pointerEvents="box-none"
      >
        {/* Back Button */}
        <TouchableOpacity
          style={styles.circleButton}
          onPress={handleBack}
          activeOpacity={0.8}
          accessibilityLabel="Back / Minimize Trip"
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={20} color="#1E293B" />
        </TouchableOpacity>

        {/* Maneuver Navigation Pill */}
        <View style={styles.maneuverPill}>
          <View style={styles.maneuverIconBox}>
            <MaterialIcons name="turn-right" size={18} color="#1FC600" />
          </View>
          <View style={styles.maneuverTextBox}>
            <Text style={styles.maneuverHeadline} numberOfLines={1}>
              In 450m, turn right
            </Text>
            <Text style={styles.maneuverSubhead} numberOfLines={1}>
              onto 80 Feet Rd / Domlur
            </Text>
          </View>
        </View>

        {/* Voice Audio Toggle Button */}
        <TouchableOpacity
          style={styles.circleButton}
          onPress={() => setIsMuted((prev) => !prev)}
          activeOpacity={0.8}
          accessibilityLabel={isMuted ? "Unmute audio navigation" : "Mute audio navigation"}
        >
          <MaterialIcons
            name={isMuted ? "volume-off" : "volume-up"}
            size={20}
            color={isMuted ? "#94A3B8" : "#334155"}
          />
        </TouchableOpacity>
      </View>

      {/* ── Floating Map Quick Tools (Right side) ─────────────────────────── */}
      <View
        style={[styles.floatingTools, { top: Math.max(insets.top + 76, 88) }]}
        pointerEvents="box-none"
      >
        {/* Traffic Layer Toggle */}
        <TouchableOpacity
          style={[styles.toolButton, isTrafficOn && styles.toolButtonActive]}
          onPress={() => setIsTrafficOn((prev) => !prev)}
          activeOpacity={0.8}
          accessibilityLabel="Toggle traffic conditions"
        >
          <MaterialIcons
            name="traffic"
            size={19}
            color={isTrafficOn ? "#0D6E00" : "#64748B"}
          />
        </TouchableOpacity>

        {/* Safety & Verified Ride Pin */}
        <TouchableOpacity
          style={[styles.toolButton, styles.toolButtonSecurity]}
          onPress={handleSafetyDesk}
          activeOpacity={0.8}
          accessibilityLabel="PickMe Secured Ride Safety"
        >
          <MaterialIcons name="verified-user" size={19} color="#0D6E00" />
        </TouchableOpacity>
      </View>

      {/* ── Map ───────────────────────────────────────────────────────────── */}
      <PassengerMapPreview
        mode="live"
        height={320}
        showRecenterButton={true}
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

      {/* ── Bottom Sheet ───────────────────────────────────────────────────── */}
      <Animated.View
        style={[
          styles.bottomSheet,
          {
            transform: [{ translateY: cardSlide }],
            opacity: cardFade,
          },
        ]}
      >
        {/* Sticky Grab Handle & Status Strip */}
        <View style={styles.sheetStickyHeader}>
          <View style={styles.dragHandle} />

          <View style={styles.statusStrip}>
            <View style={styles.statusLiveGroup}>
              <View style={styles.beaconWrap}>
                <Animated.View
                  style={[
                    styles.beaconPulse,
                    {
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.75, 0.15],
                      }),
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 2.2],
                          }),
                        },
                      ],
                    },
                  ]}
                />
                <View style={styles.beaconDot} />
              </View>
              <Text style={styles.statusTitle} numberOfLines={1}>
                ON TRIP TO {destinationTitle.toUpperCase()}
              </Text>
            </View>

            {/* ETA Countdown Pill */}
            <View style={styles.etaCountdownPill}>
              <MaterialIcons name="schedule" size={13} color="#0D6E00" />
              <Text style={styles.etaMinutesText}>{MOCK_DRIVER.etaRemainingMin} min</Text>
              <Text style={styles.etaDistanceText}>• {MOCK_DRIVER.distanceRemainingKm} km</Text>
            </View>
          </View>
        </View>

        {/* Scrollable Sheet Content */}
        <ScrollView
          contentContainerStyle={[
            styles.sheetScrollContent,
            { paddingBottom: Math.max(insets.bottom + 14, 32) },
          ]}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          {/* ── Driver & Vehicle Card ─────────────────────────────────────── */}
          <View style={styles.driverCard}>
            <View style={styles.driverTopRow}>
              {/* Avatar with rating badge */}
              <View style={styles.avatarContainer}>
                <View style={styles.avatarCircle}>
                  <MaterialIcons name="person" size={32} color="#FFFFFF" />
                </View>
                <View style={styles.ratingBadge}>
                  <Text style={styles.ratingBadgeText}>{MOCK_DRIVER.rating}</Text>
                  <MaterialIcons name="star" size={10} color="#F59E0B" />
                </View>
              </View>

              {/* Driver info */}
              <View style={styles.driverInfo}>
                <View style={styles.driverNameRow}>
                  <Text style={styles.driverName}>{driverName}</Text>
                  <MaterialIcons name="verified" size={16} color="#2563EB" />
                </View>
                <Text style={styles.driverVehicleModel}>{driverModel}</Text>
                <Text style={styles.driverTripBadge}>Top Rated • {MOCK_DRIVER.trips} trips</Text>
              </View>

              {/* License Plate Badge */}
              <View style={styles.plateBadge}>
                <Text style={styles.plateCountry}>IND</Text>
                <Text style={styles.plateNumber}>{driverPlate}</Text>
              </View>
            </View>
          </View>

          {/* ── Contact Row (Call & Chat) ─────────────────────────────────── */}
          <View style={styles.contactRow}>
            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleCallDriver}
              activeOpacity={0.8}
              accessibilityLabel="Call driver"
            >
              <MaterialIcons name="call" size={18} color="#334155" />
              <Text style={styles.contactButtonText}>Call Driver</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.contactButton}
              onPress={handleSendMessage}
              activeOpacity={0.8}
              accessibilityLabel="Send message to driver"
            >
              <MaterialIcons name="chat-bubble" size={17} color="#334155" />
              <Text style={styles.contactButtonText}>Send Message</Text>
            </TouchableOpacity>
          </View>

          {/* ── Trip Progress Bar ─────────────────────────────────────────── */}
          <View style={styles.progressSection}>
            <View style={styles.progressLabelRow}>
              <View style={styles.nextStopGroup}>
                <View style={styles.nextStopBadge}>
                  <Text style={styles.nextStopBadgeText}>NEXT STOP</Text>
                </View>
                <Text style={styles.nextStopTitle}>{MOCK_DRIVER.nextStopName}</Text>
              </View>
              <Text style={styles.nextStopDist}>
                {MOCK_DRIVER.nextStopMin} mins away ({MOCK_DRIVER.nextStopDist})
              </Text>
            </View>

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
          </View>

          {/* ── Live Route Timeline ───────────────────────────────────────── */}
          <View style={styles.timelineCard}>
            <View style={styles.timelineHeader}>
              <Text style={styles.timelineHeaderTitle}>LIVE ROUTE TIMELINE</Text>
              <Text style={styles.timelineOtpText}>
                OTP: <Text style={styles.timelineOtpCode}>{otpCode}</Text> (Verified)
              </Text>
            </View>

            {/* Stop 1: Pickup (Completed) */}
            <View style={styles.timelineStep}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineDoneNode}>
                  <View style={styles.timelineDoneNodeDot} />
                </View>
                <View style={styles.timelineConnector} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineStatusRow}>
                  <Text style={styles.timelineMutedLabel}>Picked Up • 4:54 PM</Text>
                  <View style={styles.completedPill}>
                    <Text style={styles.completedPillText}>Completed</Text>
                  </View>
                </View>
                <Text style={styles.timelineStepTitle}>{pickupTitle}</Text>
                <Text style={styles.timelineStepSubtitle}>{pickupSubtitle}</Text>
              </View>
            </View>

            {/* Stop 2: Upcoming Stop */}
            <View style={styles.timelineStep}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineActiveNode}>
                  <View style={styles.timelineActivePulse} />
                </View>
                <View style={styles.timelineConnector} />
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineStatusRow}>
                  <View style={styles.upcomingPill}>
                    <Text style={styles.upcomingPillText}>Upcoming Stop</Text>
                  </View>
                  <Text style={styles.upcomingEtaText}>In {MOCK_DRIVER.nextStopMin} min</Text>
                </View>
                <Text style={styles.timelineStepTitle}>{MOCK_DRIVER.nextStopName} Junction</Text>
                <Text style={styles.timelineStepSubtitle}>
                  Approaching in {MOCK_DRIVER.nextStopDist} • Traffic flowing smooth
                </Text>
              </View>
            </View>

            {/* Stop 3: Final Destination */}
            <View style={[styles.timelineStep, { paddingBottom: 0 }]}>
              <View style={styles.timelineNodeCol}>
                <View style={styles.timelineDestNode}>
                  <View style={styles.timelineDestNodeDot} />
                </View>
              </View>
              <View style={styles.timelineContent}>
                <View style={styles.timelineStatusRow}>
                  <Text style={styles.timelineDestLabel}>Destination • Est. 5:12 PM</Text>
                  <Text style={styles.timelineDestRemaining}>
                    {MOCK_DRIVER.distanceRemainingKm} km left
                  </Text>
                </View>
                <Text style={styles.timelineStepTitle}>{destinationTitle}</Text>
                <Text style={styles.timelineStepSubtitle}>{destinationSubtitle}</Text>
              </View>
            </View>
          </View>

          {/* ── Fare & Payment Summary ────────────────────────────────────── */}
          <View style={styles.fareCard}>
            <View style={styles.fareLeft}>
              <View style={styles.walletIconCircle}>
                <MaterialIcons name="account-balance-wallet" size={20} color="#0D6E00" />
              </View>
              <View>
                <Text style={styles.fareSubLabel}>Payment Method</Text>
                <View style={styles.paymentMethodRow}>
                  <Text style={styles.paymentMethodName}>{paymentMethod}</Text>
                  <View style={styles.gpayBadge}>
                    <Text style={styles.gpayBadgeText}>AutoPay</Text>
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.fareRight}>
              <Text style={styles.fareGuaranteedLabel}>GUARANTEED FARE</Text>
              <Text style={styles.fareAmountText}>₹{fare}</Text>
              <Text style={styles.noSurgeText}>No Surge Locked</Text>
            </View>
          </View>

          {/* ── Trip Tools & Security ─────────────────────────────────────── */}
          <View style={styles.toolsSection}>
            <Text style={styles.toolsSectionLabel}>TRIP TOOLS &amp; SECURITY</Text>

            <View style={styles.toolsGrid}>
              <TouchableOpacity
                style={styles.toolCard}
                onPress={handleShareTrip}
                activeOpacity={0.8}
                accessibilityLabel="Share trip tracking link"
              >
                <View style={styles.toolIconWrapGreen}>
                  <MaterialIcons name="share" size={18} color="#0D6E00" />
                </View>
                <View style={styles.toolCardText}>
                  <Text style={styles.toolCardTitle}>Share Trip</Text>
                  <Text style={styles.toolCardSub}>Live location link</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.toolCard}
                onPress={handleSafetyDesk}
                activeOpacity={0.8}
                accessibilityLabel="Safety and support center"
              >
                <View style={styles.toolIconWrapSlate}>
                  <MaterialIcons name="support-agent" size={18} color="#334155" />
                </View>
                <View style={styles.toolCardText}>
                  <Text style={styles.toolCardTitle}>Safety &amp; Help</Text>
                  <Text style={styles.toolCardSub}>24/7 dedicated desk</Text>
                </View>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── In-Ride Options Row ────────────────────────────────────────── */}
          <View style={styles.inRideOptionsRow}>
            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleChangeDropoff}
              activeOpacity={0.75}
            >
              <MaterialIcons name="edit-location-alt" size={15} color="#475569" />
              <Text style={styles.optionButtonText}>Change Drop-off</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.optionButton}
              onPress={handleSplitFare}
              activeOpacity={0.75}
            >
              <MaterialIcons name="receipt-long" size={15} color="#475569" />
              <Text style={styles.optionButtonText}>Split Fare</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.emergencyOptionButton}
              onPress={handleEmergency}
              activeOpacity={0.75}
            >
              <Text style={styles.emergencyOptionText}>Emergency</Text>
            </TouchableOpacity>
          </View>

          {/* ── Demo Complete Trip Button ──────────────────────────────────── */}
          <TouchableOpacity
            style={styles.completeTripButton}
            onPress={handleCompleteTripDemo}
            activeOpacity={0.85}
            accessibilityLabel="Simulate Trip Arrival"
          >
            <Ionicons name="checkmark-circle-outline" size={18} color="#0D6E00" />
            <Text style={styles.completeTripButtonText}>Complete Trip (Demo Arrive)</Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },

  // Top Floating Strip
  topStrip: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  circleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 5,
    elevation: 4,
  },
  maneuverPill: {
    flex: 1,
    marginHorizontal: 10,
    backgroundColor: "rgba(15, 23, 42, 0.96)",
    paddingVertical: 7,
    paddingHorizontal: 10,
    borderRadius: 16,
    flexDirection: "row",
    alignItems: "center",
    gap: 9,
    borderWidth: 1,
    borderColor: "#1E293B",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  maneuverIconBox: {
    width: 30,
    height: 30,
    borderRadius: 9,
    backgroundColor: "rgba(31, 198, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  maneuverTextBox: {
    flex: 1,
  },
  maneuverHeadline: {
    fontSize: 12,
    fontWeight: "800",
    color: "#FFFFFF",
    lineHeight: 15,
  },
  maneuverSubhead: {
    fontSize: 10,
    color: "#94A3B8",
    fontWeight: "500",
    lineHeight: 13,
  },

  // Floating Tools (Right side)
  floatingTools: {
    position: "absolute",
    right: 14,
    zIndex: 35,
    gap: 10,
  },
  toolButton: {
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
  toolButtonActive: {
    borderColor: "rgba(13, 110, 0, 0.3)",
    backgroundColor: "#F0FDF4",
  },
  toolButtonSecurity: {
    borderColor: "#A7F3D0",
    backgroundColor: "#ECFDF5",
  },

  // Bottom Sheet
  bottomSheet: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -20,
    borderTopWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 18,
    elevation: 12,
    overflow: "hidden",
  },
  sheetStickyHeader: {
    backgroundColor: "rgba(255, 255, 255, 0.98)",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    paddingTop: 8,
    paddingBottom: 10,
    paddingHorizontal: 16,
  },
  dragHandle: {
    width: 40,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#CBD5E1",
    alignSelf: "center",
    marginBottom: 8,
  },
  statusStrip: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  statusLiveGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 7,
    flex: 1,
  },
  beaconWrap: {
    width: 10,
    height: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  beaconPulse: {
    position: "absolute",
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "#1FC600",
  },
  beaconDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: "#0D6E00",
  },
  statusTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.4,
  },
  etaCountdownPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: Radius.pill,
  },
  etaMinutesText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0D6E00",
  },
  etaDistanceText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#047857",
  },

  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 12,
  },

  // Driver Card
  driverCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 12,
  },
  driverTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarContainer: {
    position: "relative",
  },
  avatarCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  ratingBadge: {
    position: "absolute",
    bottom: -3,
    right: -3,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: Radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 1,
    elevation: 1,
  },
  ratingBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0F172A",
  },
  driverInfo: {
    flex: 1,
  },
  driverNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  driverName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  driverVehicleModel: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  driverTripBadge: {
    fontSize: 10,
    fontWeight: "700",
    color: "#047857",
    marginTop: 2,
  },
  plateBadge: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1.8,
    borderColor: "#0F172A",
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
  },
  plateCountry: {
    fontSize: 7,
    fontWeight: "900",
    color: "#64748B",
    letterSpacing: 1,
    lineHeight: 8,
  },
  plateNumber: {
    fontSize: 11,
    fontWeight: "900",
    color: "#0F172A",
    letterSpacing: 0.5,
  },

  // Contact Row
  contactRow: {
    flexDirection: "row",
    gap: 10,
  },
  contactButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    paddingVertical: 10,
  },
  contactButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#334155",
  },

  // Progress Section
  progressSection: {
    gap: 6,
  },
  progressLabelRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  nextStopGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  nextStopBadge: {
    backgroundColor: "rgba(31, 198, 0, 0.16)",
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 4,
  },
  nextStopBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0D6E00",
    letterSpacing: 0.4,
  },
  nextStopTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0D6E00",
  },
  nextStopDist: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  progressBarTrack: {
    width: "100%",
    height: 8,
    backgroundColor: "#E2E8F0",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    backgroundColor: "#0D6E00",
    borderRadius: 4,
  },

  // Timeline Card
  timelineCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 14,
    gap: 6,
  },
  timelineHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderColor: "#F1F5F9",
    paddingBottom: 8,
    marginBottom: 6,
  },
  timelineHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#334155",
    letterSpacing: 0.5,
  },
  timelineOtpText: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
  },
  timelineOtpCode: {
    fontWeight: "800",
    color: "#0F172A",
  },

  timelineStep: {
    flexDirection: "row",
    gap: 12,
    paddingBottom: 4,
  },
  timelineNodeCol: {
    alignItems: "center",
    width: 16,
  },
  timelineDoneNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#94A3B8",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDoneNodeDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#FFFFFF",
  },
  timelineConnector: {
    width: 2,
    flex: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 3,
  },
  timelineActiveNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#DCFCE7",
    borderWidth: 2,
    borderColor: "#1FC600",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineActivePulse: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: "#0D6E00",
  },
  timelineDestNode: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
  },
  timelineDestNodeDot: {
    width: 5,
    height: 5,
    borderRadius: 1,
    backgroundColor: "#FFFFFF",
  },

  timelineContent: {
    flex: 1,
    paddingBottom: 8,
  },
  timelineStatusRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 2,
  },
  timelineMutedLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: "#94A3B8",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  completedPill: {
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  completedPillText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#059669",
  },
  upcomingPill: {
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 7,
    paddingVertical: 1,
    borderRadius: Radius.pill,
  },
  upcomingPillText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#047857",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  upcomingEtaText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0D6E00",
  },
  timelineDestLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#0D6E00",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  timelineDestRemaining: {
    fontSize: 11,
    fontWeight: "700",
    color: "#1E293B",
  },
  timelineStepTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  timelineStepSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },

  // Fare Card
  fareCard: {
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 18,
    padding: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  fareLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  walletIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    alignItems: "center",
    justifyContent: "center",
  },
  fareSubLabel: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
  },
  paymentMethodRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginTop: 1,
  },
  paymentMethodName: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  gpayBadge: {
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
  },
  gpayBadgeText: {
    fontSize: 9,
    fontWeight: "700",
    color: "#334155",
  },
  fareRight: {
    alignItems: "flex-end",
  },
  fareGuaranteedLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#94A3B8",
    letterSpacing: 0.4,
  },
  fareAmountText: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0F172A",
    lineHeight: 20,
    marginTop: 1,
  },
  noSurgeText: {
    fontSize: 10,
    fontWeight: "600",
    color: "#059669",
    marginTop: 1,
  },

  // Tools Section
  toolsSection: {
    gap: 6,
  },
  toolsSectionLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    paddingHorizontal: 2,
  },
  toolsGrid: {
    flexDirection: "row",
    gap: 10,
  },
  toolCard: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 10,
  },
  toolIconWrapGreen: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#ECFDF5",
    alignItems: "center",
    justifyContent: "center",
  },
  toolIconWrapSlate: {
    width: 32,
    height: 32,
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  toolCardText: {
    flex: 1,
  },
  toolCardTitle: {
    fontSize: 12,
    fontWeight: "700",
    color: "#1E293B",
  },
  toolCardSub: {
    fontSize: 10,
    fontWeight: "500",
    color: "#64748B",
  },

  // In-Ride Options Row
  inRideOptionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderColor: "#F1F5F9",
    paddingTop: 8,
  },
  optionButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  optionButtonText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#475569",
  },
  emergencyOptionButton: {
    paddingVertical: 4,
    paddingHorizontal: 6,
  },
  emergencyOptionText: {
    fontSize: 11,
    fontWeight: "600",
    color: "#DC2626",
  },

  // Complete Trip Button (Demo)
  completeTripButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: 14,
    paddingVertical: 12,
    marginTop: 4,
  },
  completeTripButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0D6E00",
  },
});
