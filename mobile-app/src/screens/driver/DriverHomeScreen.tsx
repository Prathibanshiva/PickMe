// mobile-app/src/screens/driver/DriverHomeScreen.tsx

import React, { useEffect, useState } from "react";
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
import { DriverAvailabilityStatus } from "@/types/driver.types";
import { Colors, Radius } from "@/theme";
import API_BASE_URL from "@/services/api";
import { getAuthSession } from "@/services/auth.service";

export default function DriverHomeScreen() {
  const insets = useSafeAreaInsets();

  const [availability, setAvailability] = useState<DriverAvailabilityStatus>(
    rideLifecycleService.getAvailabilityStatus()
  );
  const earnings = rideLifecycleService.getEarningsSummary();

  const isOnline = availability === "ONLINE";

  // Pulse animation for Online status radar beacon
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  // Active ride recovery on mount (e.g. app restart or navigation)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const active = await rideLifecycleService.syncActiveRide();
      if (!isMounted) return;
      if (active.hasActiveRide && active.status) {
        if (active.status === "REQUEST_OFFERED") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.push("/driver/incoming-request" as any);
        } else if (active.status === "ACCEPTED" || active.status === "DRIVING_TO_PICKUP") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.replace("/driver/accepted" as any);
        } else if (active.status === "ARRIVED_AT_PICKUP") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.replace("/driver/arrived" as any);
        } else if (active.status === "TRIP_ACTIVE") {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          router.replace("/driver/live-trip" as any);
        }
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Poll available rides from backend when online
  useEffect(() => {
    if (!isOnline) return;

    let isPolling = true;

    const pollAvailableRides = async () => {
      const rides = await rideLifecycleService.fetchAvailableRides();
      if (!isPolling) return;

      const currentState = rideLifecycleService.getActiveState();
      if (
        rides.length > 0 &&
        currentState.lifecycleStatus === "IDLE" &&
        rideLifecycleService.getAvailabilityStatus() === "ONLINE"
      ) {
        // Offer the first available persistent ride from the backend queue
        rideLifecycleService.setActiveOffer(rides[0]);
      }
    };

    pollAvailableRides();
    const interval = setInterval(pollAvailableRides, 4000);

    return () => {
      isPolling = false;
      clearInterval(interval);
    };
  }, [isOnline]);

  useEffect(() => {
    const unsubscribe = rideLifecycleService.subscribeAvailability((status) => {
      setAvailability(status);
    });

    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );

    if (isOnline) {
      pulseLoop.start();
    } else {
      pulseAnim.setValue(0);
      pulseLoop.stop();
    }

    return () => {
      unsubscribe();
      pulseLoop.stop();
    };
  }, [isOnline]);

  // ── Subscribe to shared lifecycle: auto-navigate to incoming request ────────
  useEffect(() => {
    let navigated = false;

    const navigateToIncoming = () => {
      if (navigated) return;
      navigated = true;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.push("/driver/incoming-request" as any);
    };

    const unsubscribeRide = rideLifecycleService.subscribe((state) => {
      if (
        state.lifecycleStatus === "REQUEST_OFFERED" &&
        rideLifecycleService.getAvailabilityStatus() === "ONLINE"
      ) {
        navigateToIncoming();
      }
    });

    // Eagerly check
    const currentState = rideLifecycleService.getActiveState();
    if (
      currentState.lifecycleStatus === "REQUEST_OFFERED" &&
      rideLifecycleService.getAvailabilityStatus() === "ONLINE"
    ) {
      navigateToIncoming();
    }

    return () => {
      unsubscribeRide();
    };
  }, []);

  const handleToggleOnline = async () => {
    if (isOnline) {
      rideLifecycleService.setAvailabilityStatus("OFFLINE");
      setAvailability("OFFLINE");
      return;
    }

    // Verify driver verification status on backend
    try {
      const session = await getAuthSession();
      if (!session?.token) {
        Alert.alert("Authentication Required", "Please sign in as a driver partner.");
        return;
      }

      const res = await fetch(`${API_BASE_URL}/api/driver/profile`, {
        method: "GET",
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (res.status === 404) {
        Alert.alert(
          "Onboarding Required",
          "You must complete driver onboarding before going online."
        );
        return;
      }

      if (!res.ok) {
        Alert.alert(
          "Verification Error",
          "Unable to verify driver status. Please try again."
        );
        return;
      }

      const data = await res.json();
      const profile = data.driverProfile;
      if (profile?.verificationStatus !== "approved") {
        Alert.alert(
          "Verification Pending",
          "Your driver profile is currently under review by PickMe operations. You will be able to go online once approved by an administrator."
        );
        return;
      }

      rideLifecycleService.setAvailabilityStatus("ONLINE");
      setAvailability("ONLINE");
    } catch {
      Alert.alert(
        "Connection Error",
        "Unable to verify driver approval status. Please check your network connection and try again."
      );
    }
  };

  const handleSimulateIncomingRequest = () => {
    if (!isOnline) {
      Alert.alert(
        "Driver Offline",
        "You must go ONLINE first to receive ride requests.",
        [
          { text: "Go Online", onPress: handleToggleOnline },
          { text: "Cancel", style: "cancel" },
        ]
      );
      return;
    }

    rideLifecycleService.triggerIncomingRequest();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.push("/driver/incoming-request" as any);
  };

  const handleSwitchToPassenger = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    router.replace("/passenger/destination-search" as any);
  };

  return (
    <View style={styles.root}>
      {/* ── Top Floating Header Bar ───────────────────────────────────────── */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 4, 14) }]}>
        <View style={styles.driverProfileCol}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              <MaterialIcons name="person" size={26} color="#FFFFFF" />
            </View>
            <View style={styles.ratingBadge}>
              <MaterialIcons name="star" size={10} color="#F59E0B" />
              <Text style={styles.ratingBadgeText}>4.9</Text>
            </View>
          </View>
          <View>
            <Text style={styles.driverName}>Rajesh Kumar</Text>
            <Text style={styles.vehicleDetails}>Sedan · KA 01 MX 7823</Text>
          </View>
        </View>

        <View style={styles.headerRightActions}>
          <TouchableOpacity
            style={styles.switchModeButton}
            onPress={handleSwitchToPassenger}
            activeOpacity={0.8}
            accessibilityLabel="Switch to Passenger Mode"
          >
            <Ionicons name="swap-horizontal" size={16} color="#0D6E00" />
            <Text style={styles.switchModeText}>Passenger</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* ── Fullscreen Interactive Map ────────────────────────────────────── */}
      <View style={styles.mapContainer}>
        <DriverMapPreview
          mode="idle"
          height="100%"
          showRecenterButton={true}
        />

        {/* Central Online Status Beacon Pill */}
        {isOnline ? (
          <View style={styles.onlineBeaconContainer} pointerEvents="none">
            <View style={styles.onlineBeaconPill}>
              <Animated.View
                style={[
                  styles.onlineBeaconDot,
                  {
                    opacity: pulseAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.6, 1],
                    }),
                    transform: [
                      {
                        scale: pulseAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.9, 1.3],
                        }),
                      },
                    ],
                  },
                ]}
              />
              <Text style={styles.onlineBeaconText}>Searching for rides nearby…</Text>
            </View>
          </View>
        ) : (
          <View style={styles.onlineBeaconContainer} pointerEvents="none">
            <View style={styles.offlineBeaconPill}>
              <View style={styles.offlineBeaconDot} />
              <Text style={styles.offlineBeaconText}>You are currently offline</Text>
            </View>
          </View>
        )}
      </View>

      {/* ── Bottom Floating Controls & Earnings Drawer ────────────────────── */}
      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
      >
        {/* Online / Offline Giant Switch Button */}
        <TouchableOpacity
          style={[
            styles.onlineToggleButton,
            isOnline ? styles.onlineButtonActive : styles.offlineButtonActive,
          ]}
          onPress={handleToggleOnline}
          activeOpacity={0.85}
          accessibilityLabel={isOnline ? "Go Offline" : "Go Online"}
        >
          <View style={styles.toggleIconWrap}>
            <MaterialIcons
              name={isOnline ? "power-settings-new" : "power-off"}
              size={24}
              color={isOnline ? "#064B00" : "#FFFFFF"}
            />
          </View>
          <View style={styles.toggleTextWrap}>
            <Text
              style={[
                styles.toggleMainText,
                isOnline ? styles.toggleMainTextOnline : styles.toggleMainTextOffline,
              ]}
            >
              {isOnline ? "YOU ARE ONLINE" : "YOU ARE OFFLINE"}
            </Text>
            <Text
              style={[
                styles.toggleSubText,
                isOnline ? styles.toggleSubTextOnline : styles.toggleSubTextOffline,
              ]}
            >
              {isOnline ? "Tap to pause & go offline" : "Tap to go online & receive rides"}
            </Text>
          </View>
        </TouchableOpacity>

        {/* Today's Earnings Summary Strip */}
        <View style={styles.earningsCard}>
          <View style={styles.earningsCol}>
            <Text style={styles.earningsLabel}>TODAY'S EARNINGS</Text>
            <Text style={styles.earningsAmount}>₹{earnings.todayEarnings}</Text>
          </View>
          <View style={styles.dividerV} />
          <View style={styles.earningsCol}>
            <Text style={styles.earningsLabel}>TRIPS</Text>
            <Text style={styles.earningsStatValue}>{earnings.todayTrips}</Text>
          </View>
          <View style={styles.dividerV} />
          <View style={styles.earningsCol}>
            <Text style={styles.earningsLabel}>ONLINE</Text>
            <Text style={styles.earningsStatValue}>{earnings.onlineHours}</Text>
          </View>
          <View style={styles.dividerV} />
          <View style={styles.earningsCol}>
            <Text style={styles.earningsLabel}>ACCEPT</Text>
            <Text style={styles.earningsStatValue}>{earnings.acceptanceRate}</Text>
          </View>
        </View>

        {/* Demo Simulation Action */}
        <TouchableOpacity
          style={styles.simulateRequestButton}
          onPress={handleSimulateIncomingRequest}
          activeOpacity={0.85}
          accessibilityLabel="Simulate incoming passenger ride request"
        >
          <MaterialIcons name="notifications-active" size={18} color="#0D6E00" />
          <Text style={styles.simulateRequestButtonText}>
            Simulate Ride Request (Demo)
          </Text>
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
    zIndex: 30,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderBottomWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 4,
  },
  driverProfileCol: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  avatarWrap: {
    position: "relative",
  },
  avatarCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  ratingBadge: {
    position: "absolute",
    bottom: -3,
    right: -4,
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: Radius.pill,
    paddingHorizontal: 4,
    paddingVertical: 1,
  },
  ratingBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    color: "#0F172A",
  },
  driverName: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  vehicleDetails: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    marginTop: 1,
  },
  headerRightActions: {
    flexDirection: "row",
    alignItems: "center",
  },
  switchModeButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  switchModeText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D6E00",
  },
  mapContainer: {
    flex: 1,
    width: "100%",
  },
  onlineBeaconContainer: {
    position: "absolute",
    top: 96,
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 20,
  },
  onlineBeaconPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(15, 23, 42, 0.94)",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 5,
  },
  onlineBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#1FC600",
  },
  onlineBeaconText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  offlineBeaconPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255, 255, 255, 0.95)",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  offlineBeaconDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#94A3B8",
  },
  offlineBeaconText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#64748B",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.8)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 10,
  },
  onlineToggleButton: {
    width: "100%",
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 18,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    shadowOffset: { width: 0, height: 3 },
    shadowRadius: 6,
    elevation: 4,
  },
  onlineButtonActive: {
    backgroundColor: "#1FC600",
    shadowColor: "#1FC600",
    shadowOpacity: 0.35,
  },
  offlineButtonActive: {
    backgroundColor: "#1E293B",
    shadowColor: "#0F172A",
    shadowOpacity: 0.25,
  },
  toggleIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    alignItems: "center",
    justifyContent: "center",
  },
  toggleTextWrap: {
    flex: 1,
  },
  toggleMainText: {
    fontSize: 15,
    fontWeight: "900",
    letterSpacing: 0.5,
  },
  toggleMainTextOnline: {
    color: "#064B00",
  },
  toggleMainTextOffline: {
    color: "#FFFFFF",
  },
  toggleSubText: {
    fontSize: 11,
    fontWeight: "600",
    marginTop: 2,
  },
  toggleSubTextOnline: {
    color: "#064B00",
  },
  toggleSubTextOffline: {
    color: "#94A3B8",
  },
  earningsCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 10,
  },
  earningsCol: {
    flex: 1,
    alignItems: "center",
  },
  dividerV: {
    width: 1,
    height: 28,
    backgroundColor: "#E2E8F0",
  },
  earningsLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#64748B",
    letterSpacing: 0.4,
  },
  earningsAmount: {
    fontSize: 16,
    fontWeight: "900",
    color: "#0D6E00",
    marginTop: 2,
  },
  earningsStatValue: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
    marginTop: 2,
  },
  simulateRequestButton: {
    width: "100%",
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    borderRadius: Radius.pill,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  simulateRequestButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#0D6E00",
  },
});