import React, { useEffect, useState } from "react";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

import { useAuth } from "@/store/auth.store";
import {
  createOrGetDriverProfile,
  DriverProfile,
} from "@/services/driver.service";

import {
  Colors,
  Spacing,
  Typography,
} from "@/theme";

export default function DriverHomeScreen() {
  const { user, role } = useAuth();
  const insets = useSafeAreaInsets();

  const [driverProfile, setDriverProfile] =
    useState<DriverProfile | null>(null);

  useEffect(() => {
    const loadDriverProfile = async () => {
      try {
        const profile =
          await createOrGetDriverProfile();

        console.log(
          "Driver profile request successful"
        );

        console.log(
          "Driver profile:",
          profile
        );

        setDriverProfile(profile);
      } catch (error) {
        console.error(
          "Driver profile request failed:",
          error
        );
      }
    };

    loadDriverProfile();
  }, []);

const handleCompleteVerification = () => {
  console.log(
    "Complete Driver Verification pressed"
  );

  router.push(
    "/driver/verification/identity-verification"
  );
};

const handleViewVerificationDetails = () => {
  console.log(
    "View Verification Details pressed"
  );

  router.push(
    "/driver/verification-details"
  );
};

  const displayName =
    user?.name?.trim() || "Driver";

  /*
   * A newly-created driver profile starts with
   * "pending" on the backend, so we must also check
   * whether all onboarding documents have actually
   * been uploaded.
   */
  const hasCompletedDocuments =
    !!driverProfile?.profilePhoto &&
    !!driverProfile?.aadhaarDocument &&
    !!driverProfile?.drivingLicenceDocument &&
    !!driverProfile?.vehicleType &&
    !!driverProfile?.vehicleNumber &&
    !!driverProfile?.vehiclePhoto;

  const verificationStatus =
    driverProfile?.verificationStatus;

  const isIncomplete =
    !driverProfile ||
    !hasCompletedDocuments;

  const isPending =
    !isIncomplete &&
    verificationStatus === "pending";

  const isApproved =
    !isIncomplete &&
    verificationStatus === "approved";

  const isRejected =
    !isIncomplete &&
    verificationStatus === "rejected";

  const verificationTitle = isApproved
    ? "Verification Approved"
    : isPending
      ? "Verification Pending"
      : isRejected
        ? "Verification Rejected"
        : "Verification Incomplete";

  const verificationDescription = isApproved
    ? "Your driver profile has been verified. You can now start earning."
    : isPending
      ? "Your documents have been submitted. Our admin team will review your verification."
      : isRejected
        ? driverProfile?.rejectionReason
          ? `Your verification was rejected. Reason: ${driverProfile.rejectionReason}`
          : "Your verification was rejected. Please update your details and submit again."
        : "Your profile is incomplete. Complete verification to start earning.";

  const verificationIcon = isApproved
    ? "checkmark-circle-outline"
    : isPending
      ? "time-outline"
      : isRejected
        ? "close-circle-outline"
        : "warning-outline";

  const verificationIconColor = isApproved
    ? "#0D6E00"
    : isPending
      ? "#8A5A00"
      : isRejected
        ? "#93000A"
        : "#93000A";

  const verificationIconBackground = isApproved
    ? "#D9F7D2"
    : isPending
      ? "#FFF1C7"
      : isRejected
        ? "#FFDAD6"
        : "#FFDAD6";

  const verificationButtonText = isRejected
    ? "Update Verification Details"
    : isIncomplete
      ? "Complete Driver Verification"
      : "View Verification Details";

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View
        style={[
          styles.topBar,
          {
            paddingTop: insets.top,
            height: 64 + insets.top,
          },
        ]}
      >
        <View style={styles.profileSection}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {displayName.charAt(0).toUpperCase()}
            </Text>
          </View>

          <Text style={styles.appTitle}>
            PickMe Driver
          </Text>
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Settings"
          style={styles.settingsButton}
          onPress={() =>
            console.log("Settings pressed")
          }
        >
          <Ionicons
            name="settings-outline"
            size={21}
            color={Colors.primary}
          />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={
          styles.scrollContent
        }
      >
        {/* Greeting */}
        <View style={styles.greetingSection}>
          <Text style={styles.greeting}>
            Hello, {displayName}!
          </Text>

          <Text style={styles.roleText}>
            Current Role:{" "}
            {role
              ? role.charAt(0).toUpperCase() +
                role.slice(1)
              : "Driver"}
          </Text>
        </View>

        {/* Verification Card */}
        <View style={styles.verificationCard}>
          {/* Decorative background circle */}
          <View
            style={[
              styles.decorativeCircle,
              isPending &&
                styles.decorativeCirclePending,
              isApproved &&
                styles.decorativeCircleApproved,
            ]}
          />

          {/* Verification Icon */}
          <View
            style={[
              styles.warningIcon,
              {
                backgroundColor:
                  verificationIconBackground,
              },
            ]}
          >
            <Ionicons
              name={verificationIcon}
              size={31}
              color={verificationIconColor}
            />
          </View>

          {/* Verification Text */}
          <View style={styles.verificationText}>
            <Text
              style={styles.verificationTitle}
            >
              {verificationTitle}
            </Text>

            <Text
              style={styles.verificationDescription}
            >
              {verificationDescription}
            </Text>
          </View>

          {/* CTA */}
          {!isApproved && (
            <Pressable
              style={({ pressed }) => [
                styles.verificationButton,
                pressed &&
                  styles.verificationButtonPressed,
              ]}
              onPress={
  isIncomplete
    ? handleCompleteVerification
    : isRejected
      ? handleCompleteVerification
      : handleViewVerificationDetails
}
            >
              <Text
                style={
                  styles.verificationButtonText
                }
              >
                {verificationButtonText}
              </Text>

              <Ionicons
                name="arrow-forward"
                size={18}
                color="#000000"
              />
            </Pressable>
          )}

          {isApproved && (
            <View
              style={styles.approvedStatus}
            >
              <Ionicons
                name="checkmark-circle"
                size={18}
                color="#0D6E00"
              />

              <Text
                style={styles.approvedStatusText}
              >
                Driver verification complete
              </Text>
            </View>
          )}
        </View>

        {/* Summary Cards */}
        <View style={styles.summaryRow}>
          {/* Today's Earnings */}
          <View style={styles.summaryCard}>
            <Ionicons
              name="wallet-outline"
              size={22}
              color={Colors.text.secondary}
            />

            <Text style={styles.summaryLabel}>
              Today's Earnings
            </Text>

            <Text style={styles.summaryValue}>
              ₹0.00
            </Text>
          </View>

          {/* Online Time */}
          <View style={styles.summaryCard}>
            <Ionicons
              name="timer-outline"
              size={22}
              color={Colors.text.secondary}
            />

            <Text style={styles.summaryLabel}>
              Online Time
            </Text>

            <Text style={styles.summaryValue}>
              0h 0m
            </Text>
          </View>
        </View>

        {/* Temporary bottom spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNavigation}>
        <BottomNavItem
          icon="home"
          label="Home"
          active
          onPress={() =>
            console.log("Home pressed")
          }
        />

        <BottomNavItem
          icon="cash-outline"
          label="Earnings"
          onPress={() =>
            console.log("Earnings pressed")
          }
        />

        <BottomNavItem
          icon="calendar-outline"
          label="Schedule"
          onPress={() =>
            console.log("Schedule pressed")
          }
        />

        <BottomNavItem
          icon="person-outline"
          label="Profile"
          onPress={() =>
            console.log("Profile pressed")
          }
        />
      </View>
    </SafeAreaView>
  );
}

interface BottomNavItemProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  active?: boolean;
  onPress: () => void;
}

function BottomNavItem({
  icon,
  label,
  active = false,
  onPress,
}: BottomNavItemProps) {
  return (
    <Pressable
      style={styles.bottomNavItem}
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
    >
      <Ionicons
        name={icon}
        size={23}
        color={
          active
            ? "#1FC600"
            : "#6B7280"
        }
      />

      <Text
        style={[
          styles.bottomNavLabel,
          active &&
            styles.bottomNavLabelActive,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },

  /*
   * TOP APP BAR
   */

  topBar: {
    height: 64,
    paddingHorizontal: Spacing.lg,
    backgroundColor: "#F9F9FF",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,

    elevation: 2,
  },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
  },

  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E9EDFF",
    alignItems: "center",
    justifyContent: "center",
  },

  avatarText: {
    fontSize: 14,
    fontWeight: "700",
    color: Colors.primary,
  },

  appTitle: {
    marginLeft: Spacing.md,
    fontSize: 16,
    fontWeight: "700",
    color: Colors.primary,
  },

  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },

  /*
   * MAIN CONTENT
   */

  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 100,
  },

  greetingSection: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.xl,
  },

  greeting: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    color: "#141B2B",
  },

  roleText: {
    marginTop: Spacing.xs,
    ...Typography.bodyMedium,
    color: "#3D4B37",
  },

  /*
   * VERIFICATION CARD
   */

  verificationCard: {
    position: "relative",
    overflow: "hidden",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#BCCBB2",

    borderRadius: 24,

    padding: Spacing.lg,

    alignItems: "center",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.05,
    shadowRadius: 6,

    elevation: 2,
  },

  decorativeCircle: {
    position: "absolute",
    width: 128,
    height: 128,
    borderRadius: 64,

    right: -64,
    top: -64,

    backgroundColor: "#FFEBE8",
    opacity: 0.6,
  },

  decorativeCirclePending: {
    backgroundColor: "#FFF1C7",
  },

  decorativeCircleApproved: {
    backgroundColor: "#D9F7D2",
  },

  warningIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: Spacing.sm,
  },

  verificationText: {
    alignItems: "center",
    paddingHorizontal: Spacing.sm,
  },

  verificationTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",
    color: "#141B2B",
    textAlign: "center",
  },

  verificationDescription: {
    marginTop: Spacing.xs,

    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",

    color: "#3D4B37",

    textAlign: "center",
  },

  verificationButton: {
    width: "100%",

    minHeight: 52,

    marginTop: Spacing.lg,

    paddingHorizontal: Spacing.md,

    borderRadius: 16,

    backgroundColor: "#1FC600",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    shadowColor: "#1FC600",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 7,

    elevation: 3,
  },

  verificationButtonPressed: {
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  verificationButtonText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#000000",

    marginRight: Spacing.sm,
  },

  approvedStatus: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",

    marginTop: Spacing.lg,

    paddingVertical: 12,
    paddingHorizontal: 16,

    borderRadius: 12,

    backgroundColor: "#EAF8E6",
  },

  approvedStatusText: {
    marginLeft: 8,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: "#0D6E00",
  },

  /*
   * SUMMARY CARDS
   */

  summaryRow: {
    flexDirection: "row",
    gap: Spacing.md,

    marginTop: Spacing.xl,
  },

  summaryCard: {
    flex: 1,

    minHeight: 120,

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#DCE2F7",

    borderRadius: 16,

    padding: Spacing.md,

    justifyContent: "space-between",
  },

  summaryLabel: {
    marginTop: Spacing.sm,

    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",

    color: "#3D4B37",
  },

  summaryValue: {
    marginTop: Spacing.xs,

    fontSize: 20,
    lineHeight: 28,
    fontWeight: "600",

    color: "#141B2B",

    opacity: 0.5,
  },

  bottomSpacing: {
    height: 20,
  },

  /*
   * BOTTOM NAVIGATION
   */

  bottomNavigation: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    height: 68,

    backgroundColor: "#FFFFFF",

    borderTopWidth: 1,
    borderTopColor: "#F0F1F5",

    flexDirection: "row",
    alignItems: "center",

    paddingBottom: 4,

    elevation: 8,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },

  bottomNavItem: {
    flex: 1,

    height: "100%",

    alignItems: "center",
    justifyContent: "center",
  },

  bottomNavLabel: {
    marginTop: 3,

    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",

    color: "#6B7280",
  },

  bottomNavLabelActive: {
    color: "#1FC600",
  },
});