import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import {
  createOrGetDriverProfile,
  DriverProfile,
} from "@/services/driver.service";
import { useAuth } from "@/store/auth.store";

const COLORS = {
  background: "#F9F9FF",
  surface: "#FFFFFF",
  primary: "#1FC600",
  primaryDark: "#0D6E00",
  text: "#141B2B",
  secondaryText: "#3D4B37",
  border: "#DCE2F7",
  pendingBackground: "#FFF1C7",
  pendingText: "#8A5A00",
  approvedBackground: "#D9F7D2",
  approvedText: "#0D6E00",
  rejectedBackground: "#FFDAD6",
  rejectedText: "#93000A",
};

export default function VerificationDetailsScreen() {
  const insets = useSafeAreaInsets();
  const { user } = useAuth();

  const [driverProfile, setDriverProfile] =
    useState<DriverProfile | null>(null);

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    const loadDriverProfile = async () => {
      try {
        setLoading(true);
        setErrorMessage("");

        const profile =
          await createOrGetDriverProfile();

        setDriverProfile(profile);
      } catch (error) {
        console.error(
          "Failed to load verification details:",
          error
        );

        setErrorMessage(
          error instanceof Error
            ? error.message
            : "Unable to load verification details."
        );
      } finally {
        setLoading(false);
      }
    };

    loadDriverProfile();
  }, []);

  const getStatusTitle = () => {
    switch (driverProfile?.verificationStatus) {
      case "approved":
        return "Verification Approved";

      case "rejected":
        return "Verification Rejected";

      case "pending":
      default:
        return "Verification Pending";
    }
  };

  const getStatusDescription = () => {
    switch (driverProfile?.verificationStatus) {
      case "approved":
        return "Your driver verification has been approved. Your submitted details are locked.";

      case "rejected":
        return driverProfile.rejectionReason
          ? `Reason: ${driverProfile.rejectionReason}`
          : "Your verification was rejected. Please update your details and submit again.";

      case "pending":
      default:
        return "Your documents are currently under review. Your submitted details cannot be changed while verification is pending.";
    }
  };

  const statusBackground =
    driverProfile?.verificationStatus === "approved"
      ? COLORS.approvedBackground
      : driverProfile?.verificationStatus === "rejected"
        ? COLORS.rejectedBackground
        : COLORS.pendingBackground;

  const statusColor =
    driverProfile?.verificationStatus === "approved"
      ? COLORS.approvedText
      : driverProfile?.verificationStatus === "rejected"
        ? COLORS.rejectedText
        : COLORS.pendingText;

  const statusIcon =
    driverProfile?.verificationStatus === "approved"
      ? "check-circle"
      : driverProfile?.verificationStatus === "rejected"
        ? "error"
        : "schedule";

  const vehicleTypeLabel = driverProfile?.vehicleType
    ? driverProfile.vehicleType.charAt(0).toUpperCase() +
      driverProfile.vehicleType.slice(1)
    : "Not provided";

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator
          size="large"
          color={COLORS.primary}
        />

        <Text style={styles.loadingText}>
          Loading verification details...
        </Text>
      </View>
    );
  }

  if (errorMessage || !driverProfile) {
    return (
      <View
        style={[
          styles.loadingScreen,
          {
            paddingTop: insets.top + 20,
          },
        ]}
      >
        <MaterialIcons
          name="error-outline"
          size={42}
          color={COLORS.rejectedText}
        />

        <Text style={styles.errorTitle}>
          Unable to Load Details
        </Text>

        <Text style={styles.errorMessage}>
          {errorMessage ||
            "Verification details could not be loaded."}
        </Text>

        <Pressable
          style={styles.backButtonLarge}
          onPress={() => router.back()}
        >
          <Text style={styles.backButtonText}>
            Go Back
          </Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(
              insets.top,
              12
            ),
            paddingBottom:
              32 + insets.bottom,
          },
        ]}
      >
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={10}
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={COLORS.primaryDark}
            />
          </Pressable>

          <View style={styles.headerContent}>
            <Text style={styles.brandText}>
              PICKME
            </Text>

            <Text style={styles.headerTitle}>
              Verification Details
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Status Card */}
        <View style={styles.statusCard}>
          <View
            style={[
              styles.statusIcon,
              {
                backgroundColor:
                  statusBackground,
              },
            ]}
          >
            <MaterialIcons
              name={statusIcon}
              size={30}
              color={statusColor}
            />
          </View>

          <Text style={styles.statusTitle}>
            {getStatusTitle()}
          </Text>

          <Text style={styles.statusDescription}>
            {getStatusDescription()}
          </Text>
        </View>

        {/* Identity */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="badge"
              size={20}
              color={COLORS.primaryDark}
            />

            <Text style={styles.cardTitle}>
              Identity
            </Text>
          </View>

          <DetailItem
            label="Driver Name"
            value={user?.name?.trim() || "Not provided"}
          />

          <DetailItem
            label="Profile Photo"
            value={
              driverProfile.profilePhoto
                ? "Added"
                : "Not provided"
            }
          />

          <DetailItem
            label="Aadhaar Card"
            value={
              driverProfile.aadhaarDocument
                ? "Added"
                : "Not provided"
            }
          />

          <DetailItem
            label="Driving Licence"
            value={
              driverProfile.drivingLicenceDocument
                ? "Added"
                : "Not provided"
            }
            last
          />
        </View>

        {/* Vehicle */}
        <View style={styles.card}>
          <View style={styles.cardHeader}>
            <MaterialIcons
              name="directions-car"
              size={20}
              color={COLORS.primaryDark}
            />

            <Text style={styles.cardTitle}>
              Vehicle
            </Text>
          </View>

          <DetailItem
            label="Vehicle Type"
            value={vehicleTypeLabel}
          />

          <DetailItem
            label="Registration Number"
            value={
              driverProfile.vehicleNumber ||
              "Not provided"
            }
          />

          <DetailItem
            label="Vehicle Photo"
            value={
              driverProfile.vehiclePhoto
                ? "Added"
                : "Not provided"
            }
            last
          />
        </View>

        {/* Read-only notice */}
        {driverProfile.verificationStatus !==
          "rejected" && (
          <View style={styles.noticeCard}>
            <MaterialIcons
              name="lock-outline"
              size={20}
              color={COLORS.primaryDark}
            />

            <Text style={styles.noticeText}>
              These verification details are
              read-only while your profile is{" "}
              {driverProfile.verificationStatus}.
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function DetailItem({
  label,
  value,
  last = false,
}: {
  label: string;
  value: string;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.detailItem,
        !last && styles.detailItemBorder,
      ]}
    >
      <View style={styles.detailLeft}>
        <MaterialIcons
          name="check-circle"
          size={19}
          color={COLORS.primaryDark}
        />

        <View style={styles.detailTextContainer}>
          <Text style={styles.detailLabel}>
            {label}
          </Text>

          <Text style={styles.detailValue}>
            {value}
          </Text>
        </View>
      </View>

      <MaterialIcons
        name="lock-outline"
        size={17}
        color="#7A8177"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  scrollContent: {
    paddingHorizontal: 16,
  },

  topBar: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  headerContent: {
    position: "absolute",
    left: 48,
    right: 48,
    alignItems: "center",
    justifyContent: "center",
  },

  headerSpacer: {
    width: 40,
    marginLeft: "auto",
  },

  brandText: {
    fontSize: 9,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 1.5,
    color: COLORS.primary,
    textTransform: "uppercase",
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: COLORS.text,
  },

  statusCard: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 20,
    alignItems: "center",
    marginBottom: 16,
  },

  statusIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },

  statusTitle: {
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  statusDescription: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
    textAlign: "center",
  },

  card: {
    backgroundColor: COLORS.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 16,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },

  cardTitle: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: "600",
    color: COLORS.text,
  },

  detailItem: {
    minHeight: 58,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  detailItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: "#E1E8FD",
  },

  detailLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  detailTextContainer: {
    flex: 1,
  },

  detailLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },

  detailValue: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.secondaryText,
  },

  noticeCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#EAF8E6",
    borderWidth: 1,
    borderColor: "#C8E8BF",
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 13,
    marginBottom: 16,
  },

  noticeText: {
    flex: 1,
    marginLeft: 10,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.secondaryText,
  },

  loadingScreen: {
    flex: 1,
    backgroundColor: COLORS.background,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },

  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: COLORS.secondaryText,
  },

  errorTitle: {
    marginTop: 14,
    fontSize: 20,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  errorMessage: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 19,
    color: COLORS.secondaryText,
    textAlign: "center",
  },

  backButtonLarge: {
    marginTop: 20,
    minWidth: 140,
    height: 48,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },

  backButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#000000",
  },
});