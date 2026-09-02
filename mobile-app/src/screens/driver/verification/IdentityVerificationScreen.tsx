import React, { useState } from "react";
import * as ImagePicker from "expo-image-picker";
import {
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
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
  surfaceLow: "#F1F3FF",
  surfaceHigh: "#E9EDFF",
  error: "#BA1A1A",
};

export default function IdentityVerificationScreen() {
  const insets = useSafeAreaInsets();

  const {
    data,
    setDriverName,
    setProfilePhoto,
    setAadhaarDocument,
    setDrivingLicenceDocument,
  } = useDriverOnboarding();

  const [nameError, setNameError] = useState("");

  const profilePhotoAdded = Boolean(data.profilePhoto);

  const aadhaarAdded = (() => {
    if (!data.aadhaarDocument) {
      return false;
    }

    try {
      const aadhaar = JSON.parse(data.aadhaarDocument);

      return Boolean(aadhaar.front);
    } catch {
      return false;
    }
  })();

  const drivingLicenceAdded = Boolean(
    data.drivingLicenceDocument
  );

  const handleProfilePhoto = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo Permission Required",
        "Please allow photo library access to select your profile photo."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri) {
      return;
    }

    setProfilePhoto(asset.uri);
  };

  const handleAadhaar = async () => {
    const permission =
      await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permission.granted) {
      Alert.alert(
        "Photo Permission Required",
        "Please allow photo library access to select your Aadhaar image."
      );
      return;
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        quality: 0.8,
      });

    if (result.canceled) {
      return;
    }

    const asset = result.assets[0];

    if (!asset?.uri) {
      return;
    }

    setAadhaarDocument(
      JSON.stringify({
        front: asset.uri,
      })
    );
  };

  const handleDrivingLicence = () => {
    setDrivingLicenceDocument(
      "temporary-driving-licence-document"
    );
  };

  const handleContinue = () => {
    const trimmedName = data.driverName.trim();

    if (!trimmedName) {
      setNameError("Driver name is required.");
      return;
    }

    if (trimmedName.length < 2) {
      setNameError("Enter a valid driver name.");
      return;
    }

    if (!profilePhotoAdded) {
      Alert.alert(
        "Profile Photo Required",
        "Please add your profile photo before continuing."
      );
      return;
    }

    if (!drivingLicenceAdded) {
      Alert.alert(
        "Driving Licence Required",
        "Please upload your driving licence before continuing."
      );
      return;
    }

    if (!aadhaarAdded) {
      Alert.alert(
        "Aadhaar Required",
        "Please upload the front image of your Aadhaar card before continuing."
      );
      return;
    }

    setNameError("");

    router.push("/driver/verification/vehicle-details");
  };

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.flex}
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 8),
            paddingBottom: 110 + insets.bottom,
          },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
            hitSlop={10}
          >
            <MaterialIcons
              name="arrow-back"
              size={22}
              color={COLORS.primaryDark}
            />
          </Pressable>

          <View style={styles.headerCenter}>
            <Text style={styles.headerBrand}>PICKME</Text>

            <Text style={styles.headerStep}>
              Step 1 of 4
            </Text>

            <Text style={styles.headerTitle}>
              Identity Verification
            </Text>
          </View>

          <View style={styles.headerSpacer} />
        </View>

        {/* Progress */}
        <View style={styles.progressBackground}>
          <View style={styles.progressFill} />
        </View>

        {/* Main Content */}
        <View style={styles.main}>
          <Text style={styles.helperText}>
            These documents are required for background verification.
          </Text>

          {/* Driver Name */}
          <View style={styles.nameSection}>
            <Text style={styles.fieldLabel}>
              DRIVER NAME{" "}
              <Text style={styles.required}>*</Text>
            </Text>

            <TextInput
              value={data.driverName}
              onChangeText={(value) => {
                setDriverName(value);

                if (nameError) {
                  setNameError("");
                }
              }}
              placeholder="Enter your full name"
              placeholderTextColor="#9BA3B7"
              autoCapitalize="words"
              autoCorrect={false}
              style={[
                styles.nameInput,
                nameError && styles.inputError,
              ]}
            />

            {nameError ? (
              <Text style={styles.errorText}>
                {nameError}
              </Text>
            ) : null}
          </View>

          {/* Profile Photo */}
          <View style={styles.profileSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>
                Profile Photo
              </Text>

              <View style={styles.requiredBadge}>
                <Text style={styles.requiredBadgeText}>
                  Required
                </Text>
              </View>
            </View>

            <Pressable
              onPress={handleProfilePhoto}
              style={styles.profilePhotoWrapper}
            >
              <View
                style={[
                  styles.profilePhoto,
                  profilePhotoAdded &&
                    styles.profilePhotoAdded,
                ]}
              >
                {profilePhotoAdded ? (
                  <View style={styles.profilePhotoFilled}>
                    <MaterialIcons
                      name="person"
                      size={48}
                      color={COLORS.primaryDark}
                    />
                  </View>
                ) : (
                  <MaterialIcons
                    name="add-a-photo"
                    size={36}
                    color={COLORS.secondaryText}
                  />
                )}
              </View>

              <View style={styles.addPhotoButton}>
                <MaterialIcons
                  name={
                    profilePhotoAdded
                      ? "check"
                      : "add"
                  }
                  size={16}
                  color={COLORS.primaryDark}
                />
              </View>
            </Pressable>

            <Text style={styles.photoHint}>
              {profilePhotoAdded
                ? "Profile photo added"
                : "Use a clear photo of yourself"}
            </Text>

            {profilePhotoAdded && (
              <Pressable
                onPress={() => setProfilePhoto("")}
                style={styles.replacePhotoButton}
              >
                <Text style={styles.replacePhotoText}>
                  Replace
                </Text>
              </Pressable>
            )}
          </View>

          {/* Aadhaar */}
          <View style={styles.documentSection}>
            <Pressable
              onPress={handleAadhaar}
              style={[
                styles.documentCard,
                aadhaarAdded &&
                  styles.documentCardAdded,
              ]}
            >
              <View style={styles.documentHeader}>
                <Text style={styles.documentTitle}>
                  Aadhaar Card
                </Text>

                <View style={styles.requiredBadge}>
                  <Text style={styles.requiredBadgeText}>
                    Required
                  </Text>
                </View>
              </View>

              {!aadhaarAdded ? (
                <View style={styles.uploadArea}>
                  <MaterialIcons
                    name="upload-file"
                    size={28}
                    color={COLORS.secondaryText}
                  />

                  <Text style={styles.uploadText}>
                    Tap to upload Aadhaar front
                  </Text>
                </View>
              ) : (
                <View style={styles.documentUploaded}>
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={COLORS.primary}
                  />

                  <Text style={styles.documentUploadedText}>
                    Aadhaar front added
                  </Text>

                  <Pressable
                    onPress={handleAadhaar}
                  >
                    <Text style={styles.replaceText}>
                      Replace
                    </Text>
                  </Pressable>
                </View>
              )}
            </Pressable>

            {/* Driving Licence */}
            <View style={styles.licenceCard}>
              <View style={styles.documentHeader}>
                <Text style={styles.documentTitle}>
                  Driving Licence
                </Text>

                {drivingLicenceAdded && (
                  <MaterialIcons
                    name="check-circle"
                    size={20}
                    color={COLORS.primary}
                  />
                )}
              </View>

              {drivingLicenceAdded ? (
                <View style={styles.licenceUploaded}>
                  <View style={styles.licenceFile}>
                    <MaterialIcons
                      name="image"
                      size={20}
                      color={COLORS.secondaryText}
                    />

                    <Text
                      style={styles.licenceFileName}
                      numberOfLines={1}
                    >
                      license_front.jpg
                    </Text>
                  </View>

                  <Pressable
                    onPress={() =>
                      setDrivingLicenceDocument("")
                    }
                  >
                    <Text style={styles.replaceText}>
                      Replace
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <Pressable
                  onPress={handleDrivingLicence}
                  style={styles.uploadArea}
                >
                  <MaterialIcons
                    name="upload-file"
                    size={28}
                    color={COLORS.secondaryText}
                  />

                  <Text style={styles.uploadText}>
                    Tap to upload front and back
                  </Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Continue */}
      <View
        style={[
          styles.bottomContainer,
          {
            paddingBottom: Math.max(
              insets.bottom,
              16
            ),
          },
        ]}
      >
        <Pressable
          onPress={handleContinue}
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.continuePressed,
          ]}
        >
          <Text style={styles.continueText}>
            Continue
          </Text>

          <MaterialIcons
            name="arrow-forward"
            size={20}
            color={COLORS.primaryDark}
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

  content: {
    paddingHorizontal: 12,
  },

  header: {
    height: 72,
    flexDirection: "row",
    alignItems: "center",
    position: "relative",
    backgroundColor: COLORS.surface,
  },

  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },

  headerCenter: {
    position: "absolute",
    left: 50,
    right: 50,
    alignItems: "center",
  },

  headerBrand: {
    fontSize: 10,
    lineHeight: 12,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: COLORS.primary,
  },

  headerStep: {
    fontSize: 9,
    lineHeight: 11,
    color: COLORS.secondaryText,
  },

  headerTitle: {
    marginTop: 1,
    fontSize: 20,
    lineHeight: 25,
    fontWeight: "700",
    color: COLORS.text,
  },

  headerSpacer: {
    width: 40,
    marginLeft: "auto",
  },

  progressBackground: {
    height: 3,
    width: "100%",
    backgroundColor: "#E1E8FD",
  },

  progressFill: {
    width: "66%",
    height: "100%",
    backgroundColor: COLORS.primary,
  },

  main: {
    paddingHorizontal: 8,
    paddingTop: 16,
  },

  helperText: {
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.secondaryText,
    marginBottom: 20,
  },

  nameSection: {
    marginBottom: 20,
  },

  fieldLabel: {
    fontSize: 10,
    lineHeight: 14,
    fontWeight: "700",
    letterSpacing: 0.6,
    color: COLORS.secondaryText,
    marginBottom: 7,
  },

  required: {
    color: COLORS.error,
  },

  nameInput: {
    width: "100%",
    height: 56,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    paddingHorizontal: 12,
    fontSize: 13,
    color: COLORS.text,
  },

  inputError: {
    borderColor: COLORS.error,
  },

  errorText: {
    marginTop: 5,
    fontSize: 11,
    color: COLORS.error,
  },

  profileSection: {
    alignItems: "center",
    marginBottom: 20,
  },

  sectionHeader: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  sectionTitle: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    color: COLORS.text,
  },

  requiredBadge: {
    backgroundColor: COLORS.surfaceHigh,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
  },

  requiredBadgeText: {
    fontSize: 8,
    lineHeight: 10,
    fontWeight: "700",
    color: COLORS.secondaryText,
  },

  profilePhotoWrapper: {
    position: "relative",
    width: 132,
    height: 132,
  },

  profilePhoto: {
    width: 132,
    height: 132,
    borderRadius: 66,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },

  profilePhotoAdded: {
    borderStyle: "solid",
    borderWidth: 2,
    borderColor: COLORS.primary,
  },

  profilePhotoFilled: {
    width: "100%",
    height: "100%",
    backgroundColor: COLORS.surfaceHigh,
    alignItems: "center",
    justifyContent: "center",
  },

  addPhotoButton: {
    position: "absolute",
    right: 0,
    bottom: 0,
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: COLORS.primary,
    borderWidth: 2,
    borderColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },

  photoHint: {
    marginTop: 8,
    fontSize: 11,
    lineHeight: 16,
    color: COLORS.secondaryText,
  },

  replacePhotoButton: {
    marginTop: 3,
  },

  replacePhotoText: {
    fontSize: 11,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  documentSection: {
    gap: 12,
    marginBottom: 10,
  },

  documentCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: "#DCE2F7",
    borderRadius: 20,
    padding: 12,
  },

  documentCardAdded: {
    borderColor: COLORS.primary,
  },

  licenceCard: {
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: 20,
    padding: 12,
  },

  documentHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 10,
  },

  documentTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontWeight: "600",
    color: COLORS.text,
  },

  uploadArea: {
    minHeight: 64,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: COLORS.border,
    borderRadius: 10,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
  },

  uploadText: {
    marginTop: 5,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.secondaryText,
  },

  documentUploaded: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceHigh,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    gap: 8,
  },

  documentUploadedText: {
    flex: 1,
    fontSize: 11,
    color: COLORS.text,
  },

  licenceUploaded: {
    minHeight: 48,
    borderRadius: 10,
    backgroundColor: COLORS.surfaceHigh,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },

  licenceFile: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingRight: 8,
  },

  licenceFileName: {
    flex: 1,
    fontSize: 10,
    color: COLORS.secondaryText,
  },

  replaceText: {
    fontSize: 9,
    fontWeight: "700",
    color: COLORS.primaryDark,
  },

  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 12,
    paddingTop: 18,
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
});