// mobile-app/src/screens/driver/DriverTripCompletedScreen.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import rideLifecycleService from "@/services/ride-lifecycle.service";
import { Radius } from "@/theme";

export default function DriverTripCompletedScreen() {
  const insets = useSafeAreaInsets();
  const offer = rideLifecycleService.getActiveState().activeOffer || rideLifecycleService.triggerIncomingRequest();

  const [passengerRating, setPassengerRating] = useState<number>(5);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1000,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();
    return () => pulseLoop.stop();
  }, []);

  const handleReturnHome = () => {
    rideLifecycleService.resetToAvailable();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace("/driver/home" as any);
  };

  const completionTime = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  return (
    <View style={styles.root}>
      {/* ── Fixed Header ──────────────────────────────────────────────────── */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <Text style={styles.headerTitle}>Trip Settlement</Text>
        <View style={styles.settledBadge}>
          <MaterialIcons name="check" size={14} color="#064B00" />
          <Text style={styles.settledBadgeText}>SETTLED</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom + 20, 36) },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Arrival Hero ────────────────────────────────────────────────── */}
        <View style={styles.heroSection}>
          <View style={styles.checkCircleWrap}>
            <Animated.View
              style={[
                styles.pulseRing,
                {
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.7, 0.15],
                  }),
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [1, 1.4],
                      }),
                    },
                  ],
                },
              ]}
            />
            <View style={styles.checkCore}>
              <MaterialIcons name="check" size={40} color="#064B00" />
            </View>
          </View>

          <Text style={styles.heroHeadline}>Trip Completed!</Text>
          <Text style={styles.heroSubhead}>
            Passenger dropped off at {offer.destinationTitle} · {completionTime}
          </Text>
        </View>

        {/* ── Net Earnings Card ───────────────────────────────────────────── */}
        <View style={styles.earningsCard}>
          <Text style={styles.earningsCardLabel}>NET DRIVER EARNINGS</Text>
          <Text style={styles.earningsBigAmount}>₹{offer.driverEarnings.toFixed(2)}</Text>
          <Text style={styles.earningsNote}>Credited directly to your PickMe Wallet</Text>

          <View style={styles.breakdownBox}>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>Total Passenger Fare</Text>
              <Text style={styles.breakdownValue}>₹{offer.estimatedFare.toFixed(2)}</Text>
            </View>
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownLabel}>PickMe Platform Fee (15%)</Text>
              <Text style={styles.breakdownFee}>-₹{(offer.estimatedFare - offer.driverEarnings).toFixed(2)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.breakdownRow}>
              <Text style={styles.breakdownNetLabel}>Your Payout (85%)</Text>
              <Text style={styles.breakdownNetValue}>₹{offer.driverEarnings.toFixed(2)}</Text>
            </View>
          </View>
        </View>

        {/* ── Trip Summary Recap ──────────────────────────────────────────── */}
        <View style={styles.recapCard}>
          <Text style={styles.cardHeaderTitle}>TRIP DETAILS</Text>

          <View style={styles.routeItem}>
            <View style={styles.pickupDot} />
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>Pickup</Text>
              <Text style={styles.routeTitle}>{offer.pickupTitle}</Text>
            </View>
          </View>

          <View style={styles.routeConnector} />

          <View style={styles.routeItem}>
            <View style={styles.destDot} />
            <View style={styles.routeTextWrap}>
              <Text style={styles.routeLabel}>Dropoff</Text>
              <Text style={styles.routeTitle}>{offer.destinationTitle}</Text>
            </View>
          </View>

          <View style={styles.recapStatsRow}>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Distance</Text>
              <Text style={styles.statVal}>{offer.distanceKm} km</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Duration</Text>
              <Text style={styles.statVal}>{offer.durationMin} mins</Text>
            </View>
            <View style={styles.statCol}>
              <Text style={styles.statLabel}>Ride Mode</Text>
              <Text style={styles.statVal}>{offer.rideMode}</Text>
            </View>
          </View>
        </View>

        {/* ── Rate Passenger Card ─────────────────────────────────────────── */}
        <View style={styles.ratingCard}>
          <Text style={styles.ratingPrompt}>Rate {offer.passengerName}</Text>
          <View style={styles.starRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setPassengerRating(star)}
                activeOpacity={0.7}
                style={styles.starTouch}
              >
                <MaterialIcons
                  name={star <= passengerRating ? "star" : "star-border"}
                  size={36}
                  color={star <= passengerRating ? "#1FC600" : "#CBD5E1"}
                />
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* ── Primary Return to Home CTA ──────────────────────────────────── */}
        <TouchableOpacity
          style={styles.readyHomeButton}
          onPress={handleReturnHome}
          activeOpacity={0.85}
          accessibilityLabel="Return to Driver Home"
        >
          <MaterialIcons name="check" size={22} color="#064B00" />
          <Text style={styles.readyHomeButtonText}>READY FOR NEXT RIDE</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#F8FAFC",
  },
  header: {
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#0F172A",
  },
  settledBadge: {
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
  settledBadgeText: {
    fontSize: 10,
    fontWeight: "900",
    color: "#065F46",
    letterSpacing: 0.4,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 14,
  },
  heroSection: {
    alignItems: "center",
    paddingVertical: 10,
  },
  checkCircleWrap: {
    width: 86,
    height: 86,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    marginBottom: 10,
  },
  pulseRing: {
    position: "absolute",
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: "rgba(31, 198, 0, 0.25)",
  },
  checkCore: {
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
  heroHeadline: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
    marginBottom: 4,
  },
  heroSubhead: {
    fontSize: 12,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    maxWidth: 290,
  },
  earningsCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  earningsCardLabel: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
  },
  earningsBigAmount: {
    fontSize: 34,
    fontWeight: "900",
    color: "#0D6E00",
    marginTop: 2,
    letterSpacing: -0.5,
  },
  earningsNote: {
    fontSize: 11,
    fontWeight: "600",
    color: "#059669",
    marginTop: 2,
    marginBottom: 14,
  },
  breakdownBox: {
    width: "100%",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 12,
    gap: 8,
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
    fontWeight: "700",
    color: "#0F172A",
  },
  breakdownFee: {
    fontSize: 12,
    fontWeight: "700",
    color: "#DC2626",
  },
  divider: {
    height: 1,
    backgroundColor: "#E2E8F0",
    marginVertical: 2,
  },
  breakdownNetLabel: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0F172A",
  },
  breakdownNetValue: {
    fontSize: 15,
    fontWeight: "900",
    color: "#0D6E00",
  },
  recapCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  cardHeaderTitle: {
    fontSize: 10,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  routeItem: {
    flexDirection: "row",
    alignItems: "flex-start",
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
  routeTextWrap: {
    flex: 1,
  },
  routeLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    textTransform: "uppercase",
  },
  routeTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0F172A",
  },
  routeConnector: {
    width: 2,
    height: 14,
    backgroundColor: "#E2E8F0",
    marginLeft: 4,
    marginVertical: 2,
  },
  recapStatsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 12,
    padding: 10,
    marginTop: 14,
  },
  statCol: {
    alignItems: "center",
  },
  statLabel: {
    fontSize: 9,
    fontWeight: "700",
    color: "#64748B",
    textTransform: "uppercase",
  },
  statVal: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 1,
  },
  ratingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 22,
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
    alignItems: "center",
  },
  ratingPrompt: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginBottom: 8,
  },
  starRow: {
    flexDirection: "row",
    gap: 8,
  },
  starTouch: {
    padding: 4,
  },
  readyHomeButton: {
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
  readyHomeButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#064B00",
    letterSpacing: 0.5,
  },
});
