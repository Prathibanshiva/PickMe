import React from "react";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  Image,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useDriverOnboarding } from "@/context/DriverOnboardingContext";

const COLORS = {
  background: "#F9F9FF",
  surface: "#FFFFFF",
  primary: "#1FC600",
  primaryDark: "#0D6E00",
  text: "#141B2B",
  secondaryText: "#3D4B37",
  muted: "#6D7B65",
  border: "#BCCBB2",
  cardBackground: "#F1F3FF",
  successBackground: "#78FF5C",
};

export default function VehiclePhotoScreen() {
  const insets = useSafeAreaInsets();

  const {
  data: { vehiclePhoto },
  setVehiclePhoto,
} = useDriverOnboarding();

  const photoAdded = Boolean(vehiclePhoto);

  const handleAddPhoto = () => {
    /*
     * Temporary UI-only simulation.
     *
     * Real camera/gallery selection and secure upload
     * will be implemented in the document upload phase.
     */
    setVehiclePhoto("temporary-vehicle-photo");
  };

  const handleChangePhoto = () => {
    /*
     * Temporary UI-only simulation.
     * Real image picker will be connected later.
     */
    setVehiclePhoto("");
  };

  const handleContinue = () => {
    if (!vehiclePhoto) {
      Alert.alert(
        "Vehicle Photo Required",
        "Please add your vehicle photo before continuing."
      );
      return;
    }
    router.push("/driver/verification/review-submit");

    /*
     * Review & Submit will be connected in the next task.
     */
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: 120 + insets.bottom,
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
          >
            <MaterialIcons
              name="arrow-back"
              size={24}
              color={COLORS.primaryDark}
            />
          </Pressable>

          <View style={styles.headerSpacer} />
        </View>

        {/* Header */}
        <View style={styles.headerSection}>
          <Text style={styles.brandText}>PICKME</Text>

          <Text style={styles.stepText}>STEP 3 OF 4</Text>

          <Text style={styles.title}>Vehicle Photo</Text>

          <Text style={styles.description}>
            Make sure the full vehicle is visible and the number plate is
            readable.
          </Text>
        </View>

        {/* Upload Area */}
        <View style={styles.uploadContainer}>
          {!photoAdded ? (
            <Pressable
              onPress={handleAddPhoto}
              style={({ pressed }) => [
                styles.emptyUploadCard,
                pressed && styles.cardPressed,
              ]}
            >
              <View style={styles.cameraCircle}>
                <MaterialIcons
                  name="photo-camera"
                  size={32}
                  color={COLORS.primaryDark}
                />
              </View>

              <Text style={styles.addPhotoText}>Add Vehicle Photo</Text>

              <Text style={styles.uploadHint}>
                Tap to open camera or gallery
              </Text>
            </Pressable>
          ) : (
            <View style={styles.uploadedContainer}>
              <View style={styles.previewCard}>
                {/* Temporary Stitch preview image.
                    This will be replaced by the actual selected
                    image when secure upload is implemented. */}
                <Image
                  source={{
                    uri: "https://lh3.googleusercontent.com/aida-public/AB6AXuC2B6NpOeEAJvKYIw6X5TqQbH8m9TcwAsXQ5ARCxM3ViSYT41ogjgCG71rAbyoeuLBQbc-QiqQUEpaekwQDkvJrPn7P_5AJgmDK8ik5CrFZHokC1HP-zvCpjHWLfh4knDe89tVuwuO_BAlPcyTty93g12bbicLXy-_jrTygx0QcHkx2rLcphElvS7J3WudhNQNl36WGCPfFJU9o-g-unm8uSm8Rkba2yP-8hkAxaHJtVw1W_NVhPSz6VQ",
                  }}
                  style={styles.previewImage}
                  resizeMode="cover"
                />

                {/* Uploaded Badge */}
                <View style={styles.uploadedBadge}>
                  <MaterialIcons
                    name="check-circle"
                    size={16}
                    color={COLORS.primaryDark}
                  />

                  <Text style={styles.uploadedText}>Uploaded</Text>
                </View>
              </View>

              <Pressable
                onPress={handleChangePhoto}
                style={({ pressed }) => [
                  styles.changePhotoButton,
                  pressed && styles.changePhotoPressed,
                ]}
              >
                <Text style={styles.changePhotoText}>Change Photo</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Continue */}
      <View
        style={[
          styles.bottomContainer,
          {
            paddingBottom: Math.max(insets.bottom, 16),
          },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            !photoAdded && styles.continueButtonDisabled,
            pressed && photoAdded && styles.continuePressed,
          ]}
        >
          <Text
            style={[
              styles.continueText,
              !photoAdded && styles.continueTextDisabled,
            ]}
          >
            Continue
          </Text>

          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={
              photoAdded
                ? COLORS.primaryDark
                : "rgba(20,27,43,0.35)"
            }
          />
        </Pressable>
      </View>
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
    paddingHorizontal: 20,
  },

  /* Top App Bar */

  topBar: {
    height: 48,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: -8,
  },

  headerSpacer: {
    width: 40,
  },

  /* Header */

  headerSection: {
    marginTop: 20,
    marginBottom: 16,
  },

  brandText: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1.8,
    color: COLORS.primaryDark,
    textTransform: "uppercase",
  },

  stepText: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 1.4,
    color: COLORS.secondaryText,
  },

  title: {
    marginTop: 4,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.4,
    color: COLORS.text,
  },

  description: {
    marginTop: 5,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: COLORS.secondaryText,
    maxWidth: 350,
  },

  /* Upload */

  uploadContainer: {
    marginTop: 8,
    flex: 1,
  },

  emptyUploadCard: {
    minHeight: 320,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderStyle: "dashed",
    backgroundColor: COLORS.cardBackground,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  cardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  cameraCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: "rgba(31,198,0,0.18)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },

  addPhotoText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: COLORS.primaryDark,
  },

  uploadHint: {
    marginTop: 6,
    fontSize: 12,
    lineHeight: 18,
    fontWeight: "400",
    color: COLORS.secondaryText,
    textAlign: "center",
  },

  /* Uploaded */

  uploadedContainer: {
    width: "100%",
  },

  previewCard: {
    width: "100%",
    height: 320,
    borderRadius: 24,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    position: "relative",
  },

  previewImage: {
    width: "100%",
    height: "100%",
  },

  uploadedBadge: {
    position: "absolute",
    top: 16,
    right: 16,
    minHeight: 32,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: COLORS.successBackground,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    elevation: 2,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
  },

  uploadedText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  changePhotoButton: {
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
  },

  changePhotoPressed: {
    opacity: 0.7,
  },

  changePhotoText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",
    color: COLORS.primaryDark,
    textDecorationLine: "underline",
  },

  /* Bottom */

  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 24,
    backgroundColor: COLORS.background,
  },

  continueButton: {
    height: 56,
    width: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },

  continueButtonDisabled: {
    opacity: 0.5,
  },

  continuePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  continueText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: "#000000",
  },

  continueTextDisabled: {
    color: "rgba(20,27,43,0.35)",
  },
});