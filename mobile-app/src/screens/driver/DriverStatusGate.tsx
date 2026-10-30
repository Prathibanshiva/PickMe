import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import DriverHomeScreen from "@/screens/driver/DriverHomeScreen";
import {
  DriverProfile,
  DriverProfileStatus,
  getDriverProfileStatus,
} from "@/services/driver.service";
import { saveAuthSession } from "@/services/auth.service";
import { useAuth } from "@/store/auth.store";
import { useDriverOnboarding } from "@/context/DriverOnboardingContext";
import { Colors, Spacing, Radius } from "@/theme";

type GateState =
  | { type: "loading" }
  | { type: "redirecting" }
  | { type: "pending" }
  | { type: "rejected"; reason: string; code: string; profile?: DriverProfile }
  | { type: "approved" }
  | { type: "error"; message: string };

export default function DriverStatusGate() {
  const { session, logout, refreshSession } = useAuth();
  const { populateFromProfile } = useDriverOnboarding();
  const [gateState, setGateState] = useState<GateState>({ type: "loading" });

  const checkStatus = useCallback(async () => {
    setGateState({ type: "loading" });

    try {
      const status: DriverProfileStatus = await getDriverProfileStatus();

      if (status.state === "not_found") {
        setGateState({ type: "redirecting" });
        router.replace("/driver/verification-intro");
        return;
      }

      if (status.state === "incomplete") {
        setGateState({ type: "redirecting" });
        populateFromProfile(status.profile, session?.user?.name);
        const p = status.profile;
        if (!p.profilePhoto || !p.aadhaarDocument || !p.drivingLicenceDocument) {
          router.replace("/driver/verification/identity-verification");
        } else if (!p.vehicleType || !p.vehicleNumber) {
          router.replace("/driver/verification/vehicle-details");
        } else if (!p.vehiclePhoto) {
          router.replace("/driver/verification/vehicle-photo");
        } else {
          router.replace("/driver/verification/review-submit");
        }
        return;
      }

      if (status.state === "approved") {
        setGateState({ type: "approved" });
        return;
      }

      if (status.state === "rejected") {
        setGateState({
          type: "rejected",
          reason: status.rejectionReason,
          code: status.rejectionCode,
          profile: status.profile,
        });
        return;
      }

      // status.state === "pending"
      setGateState({ type: "pending" });
    } catch (error: any) {
      console.error("Driver status gate check error:", error);
      setGateState({
        type: "error",
        message:
          error?.message ||
          "Unable to verify driver status. Please check your internet connection.",
      });
    }
  }, [populateFromProfile, session?.user?.name]);

  useEffect(() => {
    checkStatus();
  }, [checkStatus]);

  const handleSwitchToPassenger = async () => {
    if (session?.token && session?.user) {
      try {
        await saveAuthSession(session.token, session.user, "passenger");
        await refreshSession();
      } catch (err) {
        console.error("Failed to switch role to passenger:", err);
      }
    }
    router.replace("/" as any);
  };

  const handleResubmit = () => {
    if (gateState.type === "rejected" && gateState.profile) {
      populateFromProfile(gateState.profile, session?.user?.name);
    }
    router.push("/driver/verification-intro");
  };

  // 1. Loading state
  if (gateState.type === "loading" || gateState.type === "redirecting") {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loadingText}>
            {gateState.type === "redirecting"
              ? "Directing to driver onboarding..."
              : "Checking driver profile status..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // 2. Approved state -> Driver Home Screen
  if (gateState.type === "approved") {
    return <DriverHomeScreen />;
  }

  // 3. Pending Review state
  if (gateState.type === "pending") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>PICKME DRIVER</Text>
            <Text style={styles.screenTitle}>Verification Under Review</Text>
          </View>

          {/* Pending Icon Container */}
          <View style={styles.iconCirclePending}>
            <Ionicons name="hourglass-outline" size={48} color="#D97706" />
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.statusBadgePending}>
              <View style={styles.dotPending} />
              <Text style={styles.statusBadgeTextPending}>PENDING APPROVAL</Text>
            </View>

            <Text style={styles.cardTitle}>Application Received</Text>
            <Text style={styles.cardDescription}>
              Your onboarding documents and vehicle details were submitted and are
              currently being reviewed by our operations team.
            </Text>

            <View style={styles.infoRow}>
              <Ionicons name="time-outline" size={18} color={Colors.text.secondary} />
              <Text style={styles.infoText}>Review usually takes 24–48 hours</Text>
            </View>

            <View style={styles.infoRow}>
              <Ionicons
                name="shield-checkmark-outline"
                size={18}
                color={Colors.text.secondary}
              />
              <Text style={styles.infoText}>
                You will be able to go online once approved
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={checkStatus}
            >
              <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
              <Text style={styles.primaryButtonText}>Check Approval Status</Text>
            </Pressable>

            {session?.user && (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSwitchToPassenger}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.secondaryButtonText}>Use as Passenger</Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.textButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={logout}
            >
              <Text style={styles.textButtonText}>Sign Out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 4. Rejected state
  if (gateState.type === "rejected") {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.brandTitle}>PICKME DRIVER</Text>
            <Text style={styles.screenTitle}>Verification Needs Attention</Text>
          </View>

          {/* Rejected Icon Container */}
          <View style={styles.iconCircleRejected}>
            <Ionicons name="alert-circle-outline" size={48} color="#DC2626" />
          </View>

          {/* Card */}
          <View style={styles.card}>
            <View style={styles.statusBadgeRejected}>
              <View style={styles.dotRejected} />
              <Text style={styles.statusBadgeTextRejected}>ACTION REQUIRED</Text>
            </View>

            <Text style={styles.cardTitle}>Application Not Approved</Text>
            <Text style={styles.cardDescription}>
              Our team reviewed your submission and found an issue with your
              documents:
            </Text>

            <View style={styles.rejectionBox}>
              <Ionicons
                name="information-circle-outline"
                size={18}
                color="#DC2626"
                style={{ marginTop: 2, marginRight: 8 }}
              />
              <Text style={styles.rejectionReasonText}>
                {gateState.reason || "Please resubmit your documents with clear, valid details."}
              </Text>
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionsContainer}>
            <Pressable
              style={({ pressed }) => [
                styles.primaryButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleResubmit}
            >
              <Ionicons
                name="document-text-outline"
                size={18}
                color="#FFFFFF"
                style={{ marginRight: 8 }}
              />
              <Text style={styles.primaryButtonText}>Update & Resubmit</Text>
            </Pressable>

            {session?.user && (
              <Pressable
                style={({ pressed }) => [
                  styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleSwitchToPassenger}
              >
                <Ionicons
                  name="person-outline"
                  size={18}
                  color={Colors.primary}
                  style={{ marginRight: 8 }}
                />
                <Text style={styles.secondaryButtonText}>Use as Passenger</Text>
              </Pressable>
            )}

            <Pressable
              style={({ pressed }) => [
                styles.textButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={logout}
            >
              <Text style={styles.textButtonText}>Sign Out</Text>
            </Pressable>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // 5. Error state
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.centerContent}>
        <View style={styles.iconCircleError}>
          <Ionicons name="cloud-offline-outline" size={44} color="#DC2626" />
        </View>

        <Text style={styles.errorTitle}>Connection Error</Text>
        <Text style={styles.errorMessage}>{gateState.message}</Text>

        <Pressable
          style={({ pressed }) => [
            styles.primaryButton,
            { width: "80%", marginTop: Spacing.xl },
            pressed && styles.buttonPressed,
          ]}
          onPress={checkStatus}
        >
          <Ionicons name="refresh" size={18} color="#FFFFFF" style={{ marginRight: 8 }} />
          <Text style={styles.primaryButtonText}>Retry</Text>
        </Pressable>

        {session?.user && (
          <Pressable
            style={({ pressed }) => [
              styles.secondaryButton,
              { width: "80%", marginTop: Spacing.md },
              pressed && styles.buttonPressed,
            ]}
            onPress={handleSwitchToPassenger}
          >
            <Text style={styles.secondaryButtonText}>Use as Passenger</Text>
          </Pressable>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.textButton,
            { marginTop: Spacing.md },
            pressed && styles.buttonPressed,
          ]}
          onPress={logout}
        >
          <Text style={styles.textButtonText}>Sign Out</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl,
    alignItems: "center",
  },
  header: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  brandTitle: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 20,
    color: Colors.text.primary,
    fontWeight: "700",
    textAlign: "center",
  },
  iconCirclePending: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FEF3C7",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  iconCircleRejected: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.xl,
  },
  iconCircleError: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#FEE2E2",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.lg,
  },
  card: {
    width: "100%",
    backgroundColor: Colors.surface,
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.border.light,
    marginBottom: Spacing.xl,
  },
  statusBadgePending: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
  },
  dotPending: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#D97706",
    marginRight: 6,
  },
  statusBadgeTextPending: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B45309",
    letterSpacing: 0.5,
  },
  statusBadgeRejected: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#FEE2E2",
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginBottom: Spacing.md,
  },
  dotRejected: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#DC2626",
    marginRight: 6,
  },
  statusBadgeTextRejected: {
    fontSize: 11,
    fontWeight: "700",
    color: "#B91C1C",
    letterSpacing: 0.5,
  },
  cardTitle: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  cardDescription: {
    fontSize: 14,
    color: Colors.text.secondary,
    lineHeight: 20,
    marginBottom: Spacing.md,
  },
  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  infoText: {
    fontSize: 13,
    color: Colors.text.secondary,
    marginLeft: Spacing.xs,
  },
  rejectionBox: {
    flexDirection: "row",
    backgroundColor: "#FEF2F2",
    borderWidth: 1,
    borderColor: "#FECACA",
    borderRadius: Radius.md,
    padding: Spacing.md,
    marginTop: Spacing.xs,
  },
  rejectionReasonText: {
    flex: 1,
    fontSize: 14,
    color: "#991B1B",
    lineHeight: 20,
  },
  actionsContainer: {
    width: "100%",
  },
  primaryButton: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  primaryButtonText: {
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  secondaryButton: {
    flexDirection: "row",
    width: "100%",
    backgroundColor: Colors.surface,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderRadius: Radius.md,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: Spacing.md,
  },
  secondaryButtonText: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: "600",
  },
  textButton: {
    paddingVertical: Spacing.sm,
    alignItems: "center",
  },
  textButtonText: {
    fontSize: 14,
    color: Colors.text.secondary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.text.secondary,
  },
  errorTitle: {
    fontSize: 18,
    color: Colors.text.primary,
    fontWeight: "700",
    marginBottom: Spacing.xs,
  },
  errorMessage: {
    fontSize: 14,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 20,
  },
});
