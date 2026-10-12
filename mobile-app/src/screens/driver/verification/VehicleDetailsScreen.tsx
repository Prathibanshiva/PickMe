import React, { useMemo, useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
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

type VehicleType =
  | "bike"
  | "auto"
  | "car"
  | "sedan"
  | "suv";

const VEHICLES: {
  type: VehicleType;
  label: string;
  icon: keyof typeof MaterialIcons.glyphMap;
  capacity: number;
}[] = [
  {
    type: "bike",
    label: "Bike",
    icon: "two-wheeler",
    capacity: 1,
  },
  {
    type: "auto",
    label: "Auto",
    icon: "electric-rickshaw",
    capacity: 3,
  },
  {
    type: "car",
    label: "Car",
    icon: "directions-car",
    capacity: 4,
  },
  {
    type: "sedan",
    label: "Sedan",
    icon: "electric-car",
    capacity: 4,
  },
  {
    type: "suv",
    label: "SUV",
    icon: "airport-shuttle",
    capacity: 6,
  },
];

const COLORS = {
  background: "#F9F9FF",
  surface: "#FFFFFF",
  primary: "#1FC600",
  primaryDark: "#0D6E00",
  text: "#141B2B",
  secondaryText: "#3D4B37",
  muted: "#6D7B65",
  border: "#DCE2F7",
  cardBackground: "#F1F3FF",
  iconBackground: "#E9EDFF",
  error: "#BA1A1A",
};

export default function VehicleDetailsScreen() {
  const insets = useSafeAreaInsets();

  const {
    data,
    setVehicleType,
    setVehicleNumber,
  } = useDriverOnboarding();

  const [error, setError] = useState("");

  const selectedVehicle = data.vehicleType ?? "auto";
  const registrationNumber = data.vehicleNumber;

  const selectedVehicleData = useMemo(
    () =>
      VEHICLES.find(
        (vehicle) =>
          vehicle.type === selectedVehicle
      )!,
    [selectedVehicle]
  );

  const handleVehicleSelect = (
    vehicle: VehicleType
  ) => {
    setVehicleType(vehicle);
    setError("");
  };

  const formatRegistrationNumber = (
    value: string
  ) => {
    return value
      .toUpperCase()
      .replace(/[^A-Z0-9 ]/g, "")
      .replace(/\s+/g, " ")
      .slice(0, 13);
  };

  const validateRegistrationNumber = (
    value: string
  ) => {
    const normalized = value
      .replace(/\s/g, "")
      .toUpperCase();

    /*
     * Indian registration format:
     * State code + district number + series + number
     *
     * Examples:
     * KA01AB1234
     * KA01A1234
     * TN38AB1234
     */
    const registrationRegex =
      /^[A-Z]{2}[0-9]{1,2}[A-Z]{1,3}[0-9]{1,4}$/;

    return registrationRegex.test(normalized);
  };

  const handleContinue = () => {
    const value = registrationNumber.trim();

    if (!data.vehicleType) {
      Alert.alert(
        "Vehicle Type Required",
        "Please select your vehicle type."
      );
      return;
    }

    if (!value) {
      setError(
        "Registration number is required."
      );
      return;
    }

    if (!validateRegistrationNumber(value)) {
      setError(
        "Enter a valid vehicle registration number."
      );
      return;
    }

    setError("");

    router.push(
      "/driver/verification/vehicle-photo"
    );
  };

  return (
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : undefined
        }
      >
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
                120 + insets.bottom,
            },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.topBar}>
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

            <View style={styles.headerSpacer} />
          </View>

          {/* Page Header */}
          <View style={styles.pageHeader}>
            <View style={styles.brandBlock}>
              <Text style={styles.brandText}>
                PICKME
              </Text>

              <Text style={styles.stepText}>
                Step 2 of 4
              </Text>
            </View>

            <Text style={styles.title}>
              Vehicle Details
            </Text>

            <Text style={styles.description}>
              Select your primary vehicle type for
              receiving ride requests.
            </Text>
          </View>

          {/* Vehicle Type */}
          <View style={styles.vehicleSection}>
            <Text style={styles.sectionTitle}>
              Vehicle Type
            </Text>

            <View style={styles.vehicleGrid}>
              {VEHICLES.map((vehicle) => {
                const selected =
                  selectedVehicle ===
                  vehicle.type;

                return (
                  <Pressable
                    key={vehicle.type}
                    onPress={() =>
                      handleVehicleSelect(
                        vehicle.type
                      )
                    }
                    style={[
                      styles.vehicleCard,
                      vehicle.type === "suv" &&
                        styles.suvCard,
                      selected &&
                        styles.vehicleCardSelected,
                    ]}
                  >
                    {selected && (
                      <View
                        style={styles.selectedDot}
                      />
                    )}

                    <MaterialIcons
                      name={vehicle.icon}
                      size={29}
                      color={
                        selected
                          ? COLORS.primary
                          : COLORS.secondaryText
                      }
                    />

                    <Text
                      style={[
                        styles.vehicleLabel,
                        selected &&
                          styles.vehicleLabelSelected,
                      ]}
                    >
                      {vehicle.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Capacity Info */}
            <View style={styles.capacityCard}>
              <MaterialIcons
                name="info"
                size={18}
                color={COLORS.primary}
                style={styles.capacityIcon}
              />

              <View
                style={styles.capacityTextContainer}
              >
                <Text
                  style={styles.capacityLabel}
                >
                  Maximum passenger capacity:
                </Text>

                <Text
                  style={styles.capacityValue}
                >
                  {selectedVehicleData.capacity}{" "}
                  {selectedVehicleData.capacity ===
                  1
                    ? "passenger"
                    : "passengers"}
                </Text>
              </View>
            </View>
          </View>

          {/* Registration Number */}
          <View
            style={styles.registrationSection}
          >
            <Text style={styles.sectionTitle}>
              Registration Number
            </Text>

            <View
              style={[
                styles.inputWrapper,
                error &&
                  styles.inputWrapperError,
              ]}
            >
              <TextInput
                value={registrationNumber}
                onChangeText={(value) => {
                  setVehicleNumber(
                    formatRegistrationNumber(
                      value
                    )
                  );

                  if (error) {
                    setError("");
                  }
                }}
                placeholder="KA 01 AB 1234"
                placeholderTextColor="#9BA3B7"
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={13}
                returnKeyType="done"
                style={styles.input}
              />

              <View
                style={styles.pinContainer}
              >
                <MaterialIcons
                  name="pin"
                  size={16}
                  color={COLORS.secondaryText}
                />
              </View>
            </View>

            {error ? (
              <Text style={styles.errorText}>
                {error}
              </Text>
            ) : (
              <Text style={styles.helperText}>
                Enter the number exactly as it
                appears on your RC book.
              </Text>
            )}
          </View>
        </ScrollView>

        {/* Bottom Continue Button */}
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
              pressed &&
                styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueText}>
              Continue
            </Text>

            <MaterialIcons
              name="arrow-forward"
              size={20}
              color={COLORS.surface}
            />
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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

  /* Header */

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

  /* Page Header */

  pageHeader: {
    marginTop: 18,
  },

  brandBlock: {
    marginBottom: 8,
  },

  brandText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 1.2,
    color: COLORS.primaryDark,
    textTransform: "uppercase",
  },

  stepText: {
    marginTop: 2,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: COLORS.secondaryText,
  },

  title: {
    marginTop: 2,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
    color: COLORS.text,
  },

  description: {
    marginTop: 6,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: COLORS.secondaryText,
    maxWidth: 340,
  },

  /* Vehicle */

  vehicleSection: {
    marginTop: 28,
  },

  sectionTitle: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 12,
  },

  vehicleGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },

  vehicleCard: {
    width: "31.9%",
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  suvCard: {
    width: "65.8%",
  },

  vehicleCardSelected: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.cardBackground,
  },

  selectedDot: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: COLORS.primary,
  },

  vehicleLabel: {
    marginTop: 7,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    letterSpacing: 0.5,
    color: COLORS.secondaryText,
  },

  vehicleLabelSelected: {
    color: COLORS.text,
  },

  /* Capacity */

  capacityCard: {
    marginTop: 10,
    minHeight: 58,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.cardBackground,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
  },

  capacityIcon: {
    marginRight: 8,
  },

  capacityTextContainer: {
    flex: 1,
  },

  capacityLabel: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: "400",
    color: COLORS.secondaryText,
  },

  capacityValue: {
    marginTop: 2,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "600",
    color: COLORS.text,
  },

  /* Registration */

  registrationSection: {
    marginTop: 28,
  },

  inputWrapper: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    flexDirection: "row",
    alignItems: "center",
    paddingLeft: 16,
    paddingRight: 12,
  },

  inputWrapperError: {
    borderColor: COLORS.error,
  },

  input: {
    flex: 1,
    height: "100%",
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",
    color: COLORS.text,
    letterSpacing: 1,
    textTransform: "uppercase",
    paddingVertical: 0,
  },

  pinContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.iconBackground,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
  },

  helperText: {
    marginTop: 8,
    paddingLeft: 4,
    fontSize: 11,
    lineHeight: 16,
    fontWeight: "400",
    color: COLORS.muted,
  },

  errorText: {
    marginTop: 8,
    paddingLeft: 4,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "500",
    color: COLORS.error,
  },

  /* Bottom Button */

  bottomContainer: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 20,
    paddingTop: 32,
    backgroundColor: COLORS.background,
  },

  continueButton: {
    height: 56,
    width: "100%",
    borderRadius: 10,
    backgroundColor: COLORS.text,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    elevation: 4,
    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },

  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  continueText: {
    fontSize: 16,
    lineHeight: 24,
    fontWeight: "600",
    color: COLORS.surface,
  },
});