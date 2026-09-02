import React, { useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { useDriverOnboarding } from "@/context/DriverOnboardingContext";
import {
  submitDriverProfile,
} from "@/services/driver.service";

const COLORS = {
  background: "#F9F9FF",
  surface: "#FFFFFF",
  primary: "#1FC600",
  primaryDark: "#0D6E00",
  text: "#141B2B",
  secondaryText: "#3D4B37",
  border: "#DCE2F7",
  surfaceHigh: "#E1E8FD",
  error: "#93000A",
  errorBackground: "#FFDAD6",
};

export default function ReviewSubmitScreen() {
  const insets = useSafeAreaInsets();

  const { data } = useDriverOnboarding();

  const [submitting, setSubmitting] =
    useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const handleEditIdentity = () => {
    if (submitting) {
      return;
    }

    router.push(
      "/driver/verification/identity-verification"
    );
  };

  const handleEditVehicle = () => {
    if (submitting) {
      return;
    }

    router.push(
      "/driver/verification/vehicle-details"
    );
  };

  const handleEditVehiclePhoto = () => {
    if (submitting) {
      return;
    }

    router.push(
      "/driver/verification/vehicle-photo"
    );
  };

  const handleSubmit = async () => {
    if (submitting) {
      return;
    }

    setErrorMessage("");

    if (
      !data.driverName.trim() ||
      !data.profilePhoto ||
      !data.aadhaarDocument ||
      !data.drivingLicenceDocument ||
      !data.vehicleType ||
      !data.vehicleNumber.trim() ||
      !data.vehiclePhoto
    ) {
      setErrorMessage(
        "Please complete all verification details before submitting."
      );

      return;
    }

    setSubmitting(true);

    try {
      console.log(
        "Submitting driver verification..."
      );

      const submittedProfile =
        await submitDriverProfile({
          driverName:
            data.driverName.trim(),

          profilePhoto:
            data.profilePhoto,

          aadhaarDocument:
            data.aadhaarDocument,

          drivingLicenceDocument:
            data.drivingLicenceDocument,

          vehicleType:
            data.vehicleType,

          vehicleNumber:
            data.vehicleNumber.trim(),

          vehiclePhoto:
            data.vehiclePhoto,
        });

      console.log(
        "Driver verification submitted successfully:",
        submittedProfile
      );

      console.log(
        "Verification status:",
        submittedProfile.verificationStatus
      );

      /*
       * The backend must return "pending" after
       * a successful driver verification submission.
       */
      if (
        submittedProfile.verificationStatus !==
        "pending"
      ) {
        throw new Error(
          "Driver verification was submitted, but the verification status could not be confirmed."
        );
      }

      /*
       * Open the dedicated submission-success
       * screen only after the backend confirms
       * successful submission.
       */
      router.replace(
        "/driver/verification-submitted"
      );
    } catch (error) {
      console.error(
        "Driver verification submission failed:",
        error
      );

      setErrorMessage(
        error instanceof Error
          ? error.message
          : "Unable to submit verification. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const vehicleTypeLabel = data.vehicleType
    ? data.vehicleType.charAt(0).toUpperCase() +
      data.vehicleType.slice(1)
    : "Not selected";

  const registrationNumber =
    data.vehicleNumber || "Not provided";

  const driverName =
    data.driverName || "Not provided";

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(
              insets.top,
              12
            ),
            paddingBottom:
              150 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Top App Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={10}
            disabled={submitting}
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

            <Text style={styles.stepText}>
              Step 4 of 4
            </Text>

            <Text style={styles.headerTitle}>
              Review & Submit
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        <View style={styles.progressTrack}>
          <View style={styles.progressFill} />
        </View>

        {/* Error Message */}
        {errorMessage ? (
          <View style={styles.errorCard}>
            <MaterialIcons
              name="error-outline"
              size={20}
              color={COLORS.error}
            />

            <Text style={styles.errorText}>
              {errorMessage}
            </Text>
          </View>
        ) : null}

        {/* Identity Card */}
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

          <View style={styles.itemsContainer}>
            <ReviewItem
              label="Driver Name"
              value={driverName}
              onEdit={handleEditIdentity}
            />

            <ReviewItem
              label="Profile Photo"
              value={
                data.profilePhoto
                  ? "Added"
                  : "Not added"
              }
              onEdit={handleEditIdentity}
            />

            <ReviewItem
              label="Aadhaar Card"
              value={
                data.aadhaarDocument
                  ? "Added"
                  : "Not added"
              }
              onEdit={handleEditIdentity}
            />

            <ReviewItem
              label="Driving Licence"
              value={
                data.drivingLicenceDocument
                  ? "Added"
                  : "Not added"
              }
              onEdit={handleEditIdentity}
              last
            />
          </View>
        </View>

        {/* Vehicle Card */}
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

          <View style={styles.itemsContainer}>
            <ReviewItem
              label="Vehicle Type"
              value={vehicleTypeLabel}
              onEdit={handleEditVehicle}
            />

            <ReviewItem
              label="Registration Number"
              value={registrationNumber}
              onEdit={handleEditVehicle}
            />

            <ReviewItem
              label="Vehicle Photo"
              value={
                data.vehiclePhoto
                  ? "Added"
                  : "Not added"
              }
              onEdit={handleEditVehiclePhoto}
              last
            />
          </View>
        </View>

        {/* Bottom Information */}
        <View style={styles.bottomContent}>
          <Text style={styles.infoText}>
            Your documents will be reviewed by our
            admin team for verification. Please ensure
            all details are correct.
          </Text>

          <Pressable
            onPress={handleSubmit}
            disabled={submitting}
            style={({ pressed }) => [
              styles.submitButton,
              pressed &&
                !submitting &&
                styles.submitButtonPressed,
              submitting &&
                styles.submitButtonDisabled,
            ]}
          >
            {submitting ? (
              <>
                <ActivityIndicator
                  size="small"
                  color="#000000"
                />

                <Text
                  style={[
                    styles.submitText,
                    styles.submittingText,
                  ]}
                >
                  Submitting...
                </Text>
              </>
            ) : (
              <Text style={styles.submitText}>
                Submit for Verification
              </Text>
            )}
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function ReviewItem({
  label,
  value,
  onEdit,
  last = false,
}: {
  label: string;
  value: string;
  onEdit: () => void;
  last?: boolean;
}) {
  return (
    <View
      style={[
        styles.reviewItem,
        !last && styles.reviewItemBorder,
      ]}
    >
      <View style={styles.itemLeft}>
        <MaterialIcons
          name="check-circle"
          size={20}
          color={COLORS.primaryDark}
        />

        <View style={styles.itemTextContainer}>
          <Text style={styles.itemLabel}>
            {label}
          </Text>

          <Text style={styles.itemValue}>
            {value}
          </Text>
        </View>
      </View>

      <Pressable
        onPress={onEdit}
        hitSlop={8}
        style={styles.editButton}
      >
        <Text style={styles.editText}>
          Edit
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },

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

  stepText: {
    marginTop: 1,
    fontSize: 9,
    lineHeight: 12,
    color: COLORS.secondaryText,
  },

  headerTitle: {
    marginTop: 1,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "700",
    color: COLORS.text,
  },

  progressTrack: {
    height: 4,
    width: "100%",
    backgroundColor: COLORS.surfaceHigh,
    marginBottom: 16,
  },

  progressFill: {
    height: "100%",
    width: "100%",
    backgroundColor: COLORS.primary,
  },

  errorCard: {
    flexDirection: "row",
    alignItems: "center",

    backgroundColor: COLORS.errorBackground,

    borderWidth: 1,
    borderColor: "#FFB4AB",

    borderRadius: 12,

    paddingHorizontal: 12,
    paddingVertical: 10,

    marginBottom: 16,
  },

  errorText: {
    flex: 1,

    marginLeft: 8,

    fontSize: 12,
    lineHeight: 17,

    color: COLORS.error,
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

  itemsContainer: {
    width: "100%",
  },

  reviewItem: {
    minHeight: 52,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 8,
  },

  reviewItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: COLORS.surfaceHigh,
  },

  itemLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },

  itemTextContainer: {
    flex: 1,
  },

  itemLabel: {
    fontSize: 14,
    lineHeight: 20,
    color: COLORS.text,
  },

  itemValue: {
    marginTop: 2,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.secondaryText,
  },

  editButton: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },

  editText: {
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  bottomContent: {
    marginTop: 16,
    paddingTop: 16,
    paddingBottom: 16,
    alignItems: "center",
  },

  infoText: {
    fontSize: 12,
    lineHeight: 16,
    color: COLORS.secondaryText,
    textAlign: "center",
    paddingHorizontal: 12,
    marginBottom: 16,
  },

  submitButton: {
    width: "100%",
    height: 56,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },

  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  submitButtonDisabled: {
    opacity: 0.65,
  },

  submitText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: "#000000",
  },

  submittingText: {
    marginLeft: 8,
  },
});