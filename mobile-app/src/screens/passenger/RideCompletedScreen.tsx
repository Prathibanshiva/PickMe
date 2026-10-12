// mobile-app/src/screens/passenger/RideCompletedScreen.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Easing,
  LayoutAnimation,
  Platform,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  UIManager,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Radius } from "@/theme";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ─── Preset Compliment Chips ──────────────────────────────────────────────────

interface ComplimentItem {
  id: string;
  label: string;
  iconName: keyof typeof MaterialIcons.glyphMap;
}

const COMPLIMENT_OPTIONS: ComplimentItem[] = [
  { id: "polite", label: "Polite & Professional", iconName: "sentiment-satisfied" },
  { id: "smooth", label: "Smooth Driving", iconName: "airline-seat-recline-extra" },
  { id: "clean", label: "Clean Car", iconName: "local-car-wash" },
  { id: "route", label: "Great Route", iconName: "alt-route" },
  { id: "safe", label: "Safe Driving", iconName: "shield" },
];

const RATING_MOODS: Record<number, string> = {
  1: "Poor experience",
  2: "Below Expectations",
  3: "Good / Average",
  4: "Very Good!",
  5: "Outstanding!",
};

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function RideCompletedScreen() {
  const insets = useSafeAreaInsets();

  const params = useLocalSearchParams<{
    pickupTitle?: string;
    pickupSubtitle?: string;
    destinationTitle?: string;
    destinationSubtitle?: string;
    fare?: string;
    paymentMethod?: string;
    vehicleType?: string;
    rideMode?: string;
    driverName?: string;
    driverPlate?: string;
    driverModel?: string;
  }>();

  const destinationTitle = params.destinationTitle || "100ft Road, Indiranagar";
  const fare = params.fare || "280";
  const paymentMethod = params.paymentMethod || "UPI AutoPay";
  const driverName = params.driverName || "Rajesh Kumar";
  const driverPlate = params.driverPlate || "KA 01 MX 7823";
  const driverModel = params.driverModel || "White Maruti Suzuki Dzire";

  const firstName = driverName.split(" ")[0];

  // ── States ───────────────────────────────────────────────────────────────
  const [rating, setRating] = useState<number>(5);
  const [selectedCompliments, setSelectedCompliments] = useState<string[]>([
    "polite",
    "smooth",
  ]);
  const [feedbackNote, setFeedbackNote] = useState<string>("");
  const [showBreakdown, setShowBreakdown] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSubmitted, setIsSubmitted] = useState<boolean>(false);

  // ── Animations ───────────────────────────────────────────────────────────
  const pingAnim = useRef(new Animated.Value(0)).current;
  const contentFade = useRef(new Animated.Value(0)).current;
  const contentSlide = useRef(new Animated.Value(24)).current;
  const chevronRotation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Arrival Ripple Pulse
    const pingLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pingAnim, {
          toValue: 1,
          duration: 1200,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pingAnim, {
          toValue: 0,
          duration: 1200,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pingLoop.start();

    // Content Entrance
    Animated.parallel([
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(contentSlide, {
        toValue: 0,
        friction: 8,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    return () => pingLoop.stop();
  }, []);

  // ── Handlers ─────────────────────────────────────────────────────────────

  const toggleBreakdown = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    const nextState = !showBreakdown;
    setShowBreakdown(nextState);

    Animated.timing(chevronRotation, {
      toValue: nextState ? 1 : 0,
      duration: 220,
      useNativeDriver: true,
    }).start();
  };

  const toggleCompliment = (id: string) => {
    setSelectedCompliments((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const handleShareReceipt = async () => {
    try {
      await Share.share({
        title: "PickMe Trip Receipt",
        message:
          `🚗 PickMe Ride Receipt\n` +
          `📍 Destination: ${destinationTitle}\n` +
          `👨‍✈️ Driver: ${driverName} (${driverPlate})\n` +
          `💰 Total Paid: ₹${fare} via ${paymentMethod}\n` +
          `⭐ Rating: ${rating}/5 Stars\n` +
          `Thank you for riding with PickMe!`,
      });
    } catch {
      // dismissed
    }
  };

  const handleDownloadInvoice = () => {
    Alert.alert(
      "Download Invoice",
      `Invoice for trip #PKM-${driverPlate.replace(/\s+/g, "")}-7294 has been generated (PDF).\n\nSent to your registered email.`,
      [{ text: "OK" }]
    );
  };

  const handleSubmitRating = () => {
    if (isSubmitting || isSubmitted) return;

    setIsSubmitting(true);
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSubmitted(true);

      setTimeout(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace("/passenger/destination-search" as any);
      }, 1000);
    }, 800);
  };

  const handleBackToHome = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace("/passenger/destination-search" as any);
  };

  const handleNeedHelp = () => {
    Alert.alert(
      "Trip Support & Help",
      "Need assistance with this ride?\n\n• Report Lost Item\n• Review Fare Calculation\n• Driver or Vehicle Feedback\n• 24/7 PickMe Support Desk",
      [
        { text: "Dismiss", style: "cancel" },
        { text: "Contact Support", onPress: () => Alert.alert("Connecting to Support...") },
      ]
    );
  };

  const chevronInterpolate = chevronRotation.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "180deg"],
  });

  // Calculate simulated breakdown values based on total fare
  const totalNum = parseFloat(fare) || 280;
  const baseFare = 60;
  const timeFare = 45;
  const taxFee = 25;
  const distanceFare = Math.max(0, totalNum - baseFare - timeFare - taxFee);

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <View style={styles.root}>
      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleBackToHome}
            activeOpacity={0.75}
            accessibilityLabel="Back to Home"
          >
            <Ionicons name="arrow-back" size={22} color="#141B2B" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Trip Completion</Text>
        </View>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.headerIconButton}
            onPress={handleShareReceipt}
            activeOpacity={0.75}
            accessibilityLabel="Share trip receipt"
          >
            <MaterialIcons name="share" size={20} color="#3D4B37" />
          </TouchableOpacity>
          <View style={styles.profileAvatarMini}>
            <MaterialIcons name="person" size={17} color="#FFFFFF" />
          </View>
        </View>
      </View>

      {/* ── Scrollable Body ───────────────────────────────────────────────── */}
      <Animated.ScrollView
        style={[
          styles.scrollBody,
          {
            opacity: contentFade,
            transform: [{ translateY: contentSlide }],
          },
        ]}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 40) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Arrival Hero ────────────────────────────────────────────────── */}
        <View style={styles.arrivalHero}>
          {/* Animated Green Checkmark Rings */}
          <View style={styles.checkRingContainer}>
            <Animated.View
              style={[
                styles.checkRingOuter,
                {
                  opacity: pingAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.65, 0.1],
                  }),
                  transform: [
                    {
                      scale: pingAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.45],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.checkRingMiddle} />
            <View style={styles.checkCircleCore}>
              <MaterialIcons name="check" size={36} color="#064B00" />
            </View>
          </View>

          {/* Status Badge */}
          <View style={styles.tripCompletedBadge}>
            <View style={styles.tripCompletedDot} />
            <Text style={styles.tripCompletedBadgeText}>TRIP COMPLETED</Text>
          </View>

          <Text style={styles.arrivalHeadline}>You have arrived!</Text>
          <Text style={styles.arrivalSubhead}>
            Dropped off at {destinationTitle} at 5:14 PM
          </Text>
        </View>

        {/* ── Final Fare Card ─────────────────────────────────────────────── */}
        <View style={styles.card}>
          <View style={styles.fareHeaderRow}>
            <View>
              <Text style={styles.cardLabel}>FINAL FARE</Text>
              <Text style={styles.fareBigText}>₹{fare}</Text>
            </View>

            <View style={styles.paidBadge}>
              <MaterialIcons name="verified" size={15} color="#0D6E00" />
              <Text style={styles.paidBadgeText}>
                {paymentMethod.includes("Cash") ? "Cash Paid" : "Paid via AutoPay"}
              </Text>
            </View>
          </View>

          {/* Payment Method Details Row */}
          <View style={styles.paymentMethodCard}>
            <View style={styles.paymentIconWrap}>
              <MaterialIcons name="payments" size={18} color="#0D6E00" />
            </View>
            <View style={styles.paymentMethodInfo}>
              <Text style={styles.paymentMethodTitle}>{paymentMethod}</Text>
              <Text style={styles.paymentMethodSub}>
                {paymentMethod.includes("Cash") ? "Paid to Driver" : "Debited Automatically"}
              </Text>
            </View>
            <Text style={styles.paymentAmountValue}>₹{totalNum.toFixed(2)}</Text>
          </View>

          {/* Collapsible Fare Breakdown Toggle */}
          <TouchableOpacity
            style={styles.breakdownToggle}
            onPress={toggleBreakdown}
            activeOpacity={0.7}
            accessibilityLabel="Toggle Fare Breakdown"
          >
            <View style={styles.breakdownToggleLeft}>
              <MaterialIcons name="receipt-long" size={18} color="#5C5F60" />
              <Text style={styles.breakdownToggleText}>Fare Breakdown</Text>
            </View>
            <Animated.View style={{ transform: [{ rotate: chevronInterpolate }] }}>
              <MaterialIcons name="expand-more" size={20} color="#64748B" />
            </Animated.View>
          </TouchableOpacity>

          {/* Collapsible Breakdown Content */}
          {showBreakdown && (
            <View style={styles.breakdownContent}>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Base Fare</Text>
                <Text style={styles.breakdownValue}>₹{baseFare.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Distance Fare (6.2 km)</Text>
                <Text style={styles.breakdownValue}>₹{distanceFare.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Time Fare (20 mins)</Text>
                <Text style={styles.breakdownValue}>₹{timeFare.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownLabel}>Taxes &amp; Platform Fee</Text>
                <Text style={styles.breakdownValue}>₹{taxFee.toFixed(2)}</Text>
              </View>
              <View style={styles.breakdownDivider} />
              <View style={styles.breakdownRow}>
                <Text style={styles.breakdownTotalLabel}>Total Fare</Text>
                <Text style={styles.breakdownTotalValue}>₹{totalNum.toFixed(2)}</Text>
              </View>
            </View>
          )}

          {/* Download Invoice Button */}
          <TouchableOpacity
            style={styles.downloadInvoiceButton}
            onPress={handleDownloadInvoice}
            activeOpacity={0.75}
            accessibilityLabel="Download Invoice PDF"
          >
            <MaterialIcons name="download" size={18} color="#0D6E00" />
            <Text style={styles.downloadInvoiceText}>Download Invoice (PDF)</Text>
          </TouchableOpacity>
        </View>

        {/* ── Driver Rating & Compliments Card ────────────────────────────── */}
        <View style={styles.driverRatingCard}>
          {/* Driver Avatar & Rating Badge */}
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={44} color="#FFFFFF" />
            </View>
            <View style={styles.driverRatingBadge}>
              <MaterialIcons name="star" size={12} color="#064B00" />
              <Text style={styles.driverRatingBadgeText}>4.9</Text>
            </View>
          </View>

          {/* Driver Identity */}
          <Text style={styles.driverNameText}>{driverName}</Text>
          <View style={styles.driverCarRow}>
            <MaterialIcons name="directions-car" size={15} color="#0D6E00" />
            <Text style={styles.driverCarModel}>{driverModel}</Text>
            <View style={styles.dotSeparator} />
            <Text style={styles.driverPlateText}>{driverPlate}</Text>
          </View>

          <View style={styles.topRatedBadge}>
            <MaterialIcons name="verified-user" size={13} color="#0D6E00" />
            <Text style={styles.topRatedBadgeText}>Top Rated Driver • 4,200+ trips</Text>
          </View>

          <View style={styles.cardDivider} />

          {/* Rating Prompt & Stars */}
          <Text style={styles.ratingPromptText}>How was your ride with {firstName}?</Text>
          <Text style={styles.ratingMoodText}>{RATING_MOODS[rating] || ""}</Text>

          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((starNum) => {
              const isFilled = starNum <= rating;
              return (
                <TouchableOpacity
                  key={starNum}
                  style={styles.starButton}
                  onPress={() => setRating(starNum)}
                  activeOpacity={0.7}
                  accessibilityLabel={`Rate ${starNum} stars`}
                >
                  <MaterialIcons
                    name={isFilled ? "star" : "star-border"}
                    size={38}
                    color={isFilled ? "#1FC600" : "#C5C7C8"}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Compliment Chips */}
          <View style={styles.complimentsHeaderRow}>
            <Text style={styles.cardLabel}>GIVE A COMPLIMENT</Text>
          </View>

          <View style={styles.complimentsGrid}>
            {COMPLIMENT_OPTIONS.map((item) => {
              const isSelected = selectedCompliments.includes(item.id);
              return (
                <TouchableOpacity
                  key={item.id}
                  style={[
                    styles.complimentChip,
                    isSelected && styles.complimentChipSelected,
                  ]}
                  onPress={() => toggleCompliment(item.id)}
                  activeOpacity={0.8}
                >
                  <MaterialIcons
                    name={item.iconName}
                    size={16}
                    color={isSelected ? "#064B00" : "#475569"}
                  />
                  <Text
                    style={[
                      styles.complimentChipText,
                      isSelected && styles.complimentChipTextSelected,
                    ]}
                  >
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Feedback Note Input */}
          <View style={styles.feedbackInputContainer}>
            <TextInput
              style={styles.feedbackInput}
              placeholder={`Add a note or feedback for ${firstName} (optional)...`}
              placeholderTextColor="#94A3B8"
              multiline={true}
              numberOfLines={2}
              value={feedbackNote}
              onChangeText={setFeedbackNote}
            />
          </View>
        </View>

        {/* ── Submit Rating & Navigation Actions ──────────────────────────── */}
        <View style={styles.actionsContainer}>
          <TouchableOpacity
            style={[
              styles.submitButton,
              isSubmitted && styles.submitButtonDone,
            ]}
            onPress={handleSubmitRating}
            activeOpacity={0.85}
            disabled={isSubmitting || isSubmitted}
            accessibilityLabel="Submit Rating"
          >
            {isSubmitting ? (
              <>
                <MaterialIcons name="hourglass-empty" size={20} color="#064B00" />
                <Text style={styles.submitButtonText}>Submitting Rating…</Text>
              </>
            ) : isSubmitted ? (
              <>
                <MaterialIcons name="check-circle" size={20} color="#FFFFFF" />
                <Text style={styles.submitButtonTextDone}>Feedback Sent!</Text>
              </>
            ) : (
              <>
                <Text style={styles.submitButtonText}>Submit Rating</Text>
                <MaterialIcons name="arrow-forward" size={20} color="#064B00" />
              </>
            )}
          </TouchableOpacity>

          {/* Bottom Row: Back to Home + Need Help */}
          <View style={styles.secondaryActionsRow}>
            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleBackToHome}
              activeOpacity={0.7}
            >
              <MaterialIcons name="home" size={18} color="#475569" />
              <Text style={styles.secondaryButtonText}>Back to Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={handleNeedHelp}
              activeOpacity={0.7}
            >
              <MaterialIcons name="help" size={18} color="#475569" />
              <Text style={styles.secondaryButtonText}>Need Help?</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Animated.ScrollView>
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },

  // Fixed Header
  header: {
    backgroundColor: "rgba(249, 249, 255, 0.95)",
    borderBottomWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    zIndex: 50,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  headerIconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#141B2B",
  },
  profileAvatarMini: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
  },

  // Scroll Content
  scrollBody: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 14,
  },

  // Arrival Hero
  arrivalHero: {
    alignItems: "center",
    textAlign: "center",
    paddingVertical: 12,
  },
  checkRingContainer: {
    width: 90,
    height: 90,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    position: "relative",
  },
  checkRingOuter: {
    position: "absolute",
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: "rgba(31, 198, 0, 0.2)",
  },
  checkRingMiddle: {
    position: "absolute",
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: "rgba(31, 198, 0, 0.3)",
  },
  checkCircleCore: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#1FC600",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#1FC600",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  tripCompletedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#E2E8F0",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: 8,
  },
  tripCompletedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#1FC600",
  },
  tripCompletedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#3D4B37",
    letterSpacing: 0.5,
  },
  arrivalHeadline: {
    fontSize: 24,
    fontWeight: "800",
    color: "#141B2B",
    marginBottom: 4,
  },
  arrivalSubhead: {
    fontSize: 13,
    fontWeight: "500",
    color: "#475569",
    textAlign: "center",
    maxWidth: 290,
    lineHeight: 18,
  },

  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },

  // Fare Details
  fareHeaderRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
  },
  fareBigText: {
    fontSize: 34,
    fontWeight: "900",
    color: "#141B2B",
    lineHeight: 38,
    marginTop: 2,
    letterSpacing: -0.5,
  },
  paidBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(31, 198, 0, 0.15)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
  },
  paidBadgeText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#0D6E00",
    textTransform: "uppercase",
  },
  paymentMethodCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 10,
    marginTop: 12,
  },
  paymentIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  paymentMethodInfo: {
    flex: 1,
  },
  paymentMethodTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#141B2B",
  },
  paymentMethodSub: {
    fontSize: 10,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  paymentAmountValue: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0D6E00",
  },

  // Breakdown
  breakdownToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 14,
    paddingBottom: 4,
  },
  breakdownToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  breakdownToggleText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#334155",
  },
  breakdownContent: {
    paddingTop: 8,
    paddingBottom: 4,
    gap: 7,
  },
  breakdownRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  breakdownLabel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  breakdownValue: {
    fontSize: 12,
    fontWeight: "600",
    color: "#141B2B",
  },
  breakdownDivider: {
    height: 1,
    backgroundColor: "#F1F5F9",
    marginVertical: 4,
  },
  breakdownTotalLabel: {
    fontSize: 14,
    fontWeight: "800",
    color: "#141B2B",
  },
  breakdownTotalValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0D6E00",
  },
  downloadInvoiceButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginTop: 10,
    paddingVertical: 8,
  },
  downloadInvoiceText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D6E00",
  },

  // Driver Rating Card
  driverRatingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 18,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  avatarWrap: {
    position: "relative",
    marginBottom: 10,
  },
  avatarCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  driverRatingBadge: {
    position: "absolute",
    bottom: -2,
    right: -2,
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    backgroundColor: "#1FC600",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  driverRatingBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#064B00",
  },
  driverNameText: {
    fontSize: 17,
    fontWeight: "800",
    color: "#141B2B",
  },
  driverCarRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 3,
  },
  driverCarModel: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
  },
  dotSeparator: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: "#94A3B8",
  },
  driverPlateText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    letterSpacing: 0.3,
  },
  topRatedBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    marginTop: 8,
  },
  topRatedBadgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#065F46",
  },
  cardDivider: {
    height: 1,
    width: "100%",
    backgroundColor: "#F1F5F9",
    marginVertical: 14,
  },
  ratingPromptText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#141B2B",
    marginBottom: 2,
  },
  ratingMoodText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D6E00",
    marginBottom: 8,
  },
  starRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 14,
  },
  starButton: {
    padding: 3,
  },
  complimentsHeaderRow: {
    width: "100%",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  complimentsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    width: "100%",
    marginBottom: 12,
  },
  complimentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    backgroundColor: "#F1F5F9",
    borderWidth: 1,
    borderColor: "#E2E8F0",
  },
  complimentChipSelected: {
    backgroundColor: "#1FC600",
    borderColor: "#0D6E00",
    shadowColor: "#1FC600",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 2,
  },
  complimentChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#334155",
  },
  complimentChipTextSelected: {
    color: "#064B00",
    fontWeight: "800",
  },
  feedbackInputContainer: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  feedbackInput: {
    fontSize: 13,
    color: "#141B2B",
    minHeight: 44,
    textAlignVertical: "top",
  },

  // Actions
  actionsContainer: {
    gap: 10,
    marginTop: 4,
  },
  submitButton: {
    width: "100%",
    backgroundColor: "#1FC600",
    paddingVertical: 15,
    borderRadius: Radius.pill,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    shadowColor: "#1FC600",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 4,
  },
  submitButtonDone: {
    backgroundColor: "#0D6E00",
    shadowColor: "#0D6E00",
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: "800",
    color: "#064B00",
  },
  submitButtonTextDone: {
    fontSize: 16,
    fontWeight: "800",
    color: "#FFFFFF",
  },
  secondaryActionsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 6,
  },
  secondaryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  secondaryButtonText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#475569",
  },
});
