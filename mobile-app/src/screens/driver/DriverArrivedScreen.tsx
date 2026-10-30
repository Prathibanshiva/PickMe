// mobile-app/src/screens/driver/DriverArrivedScreen.tsx

import React, { useState } from "react";
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import DriverMapPreview from "@/components/driver/DriverMapPreview";
import rideLifecycleService from "@/services/ride-lifecycle.service";
import { Radius } from "@/theme";

export default function DriverArrivedScreen() {
  const insets = useSafeAreaInsets();
  const offer = rideLifecycleService.getActiveState().activeOffer || rideLifecycleService.triggerIncomingRequest();

  // Reactively listen for ride cancellation
  React.useEffect(() => {
    const unsubscribe = rideLifecycleService.subscribe((state) => {
      if (state.lifecycleStatus === "CANCELLED") {
        Alert.alert("Ride Cancelled", "This ride was cancelled by the passenger.");
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        router.replace("/driver/home" as any);
      }
    });
    return () => unsubscribe();
  }, []);

  const [enteredOtp, setEnteredOtp] = useState<string>("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState<boolean>(false);

  const handleVerifyOtp = async () => {
    if (isVerifying) return;
    if (enteredOtp.trim().length !== 4) {
      setErrorMessage("Please enter the 4-digit PIN provided by the passenger.");
      return;
    }

    setErrorMessage(null);
    setIsVerifying(true);
    const result = await rideLifecycleService.verifyOtp(enteredOtp);
    setIsVerifying(false);

    if (result.success) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      router.replace("/driver/live-trip" as any);
    } else {
      setErrorMessage(result.message || "Invalid OTP PIN. Please check with passenger.");
      Alert.alert("PIN Verification Failed", result.message || "Invalid OTP.");
    }
  };

  const handleCallPassenger = () => {
    Alert.alert("Call Passenger", `Calling ${offer.passengerName} (${offer.passengerPhone})…`);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      {/* ── Top Header Strip ──────────────────────────────────────────────── */}
      <View style={[styles.topHeader, { paddingTop: Math.max(insets.top + 6, 16) }]}>
        <View style={styles.statusPill}>
          <MaterialIcons name="check-circle" size={16} color="#1FC600" />
          <Text style={styles.statusPillText}>AT PICKUP POINT</Text>
        </View>

        <TouchableOpacity
          style={styles.callButton}
          onPress={handleCallPassenger}
          activeOpacity={0.8}
          accessibilityLabel="Call passenger"
        >
          <MaterialIcons name="call" size={18} color="#0D6E00" />
          <Text style={styles.callButtonText}>Call</Text>
        </TouchableOpacity>
      </View>

      {/* ── Map Context (Driver parked at pickup) ─────────────────────────── */}
      <View style={styles.mapContainer}>
        <DriverMapPreview
          mode="arrived"
          height="100%"
          pickupCoords={{
            latitude: offer.pickupLat,
            longitude: offer.pickupLng,
            title: offer.pickupTitle,
          }}
          showRecenterButton={false}
        />
      </View>

      {/* ── OTP Verification Drawer ───────────────────────────────────────── */}
      <View
        style={[
          styles.bottomSheet,
          { paddingBottom: Math.max(insets.bottom + 12, 24) },
        ]}
      >
        {/* Passenger Info Banner */}
        <View style={styles.passengerBanner}>
          <View style={styles.avatar}>
            <MaterialIcons name="person" size={26} color="#FFFFFF" />
          </View>
          <View style={styles.passengerMeta}>
            <Text style={styles.passengerName}>Passenger: {offer.passengerName}</Text>
            <Text style={styles.destinationHint} numberOfLines={1}>
              Heading to: {offer.destinationTitle}
            </Text>
          </View>
        </View>

        {/* OTP Input Card */}
        <View style={styles.otpCard}>
          <Text style={styles.otpCardTitle}>Enter 4-Digit Passenger PIN</Text>
          <Text style={styles.otpCardSubtitle}>
            Ask {offer.passengerName.split(" ")[0]} for the PIN shown on their PickMe screen
          </Text>

          {/* 4 Digit Boxes */}
          <View style={styles.otpBoxesRow}>
            {[0, 1, 2, 3].map((idx) => {
              const digit = enteredOtp[idx] || "";
              return (
                <View
                  key={idx}
                  style={[
                    styles.otpBox,
                    digit ? styles.otpBoxFilled : null,
                  ]}
                >
                  <Text style={styles.otpBoxText}>{digit}</Text>
                </View>
              );
            })}
          </View>

          {/* Hidden/Direct Input to easily edit PIN */}
          <TextInput
            style={styles.realOtpInput}
            value={enteredOtp}
            onChangeText={(text) => setEnteredOtp(text.slice(0, 4))}
            keyboardType="number-pad"
            maxLength={4}
            placeholder="Type 4-digit PIN"
            placeholderTextColor="#94A3B8"
          />

          {errorMessage && (
            <Text style={styles.errorText}>{errorMessage}</Text>
          )}

          <View style={styles.pinHelperStrip}>
            <MaterialIcons name="info-outline" size={14} color="#0D6E00" />
            <Text style={styles.pinHelperText}>
              Passenger demo PIN is <Text style={{ fontWeight: "900" }}>{offer.otp}</Text>
            </Text>
          </View>
        </View>

        {/* Verify & Start CTA */}
        <TouchableOpacity
          style={[
            styles.verifyButton,
            enteredOtp.length < 4 && styles.verifyButtonDisabled,
          ]}
          onPress={handleVerifyOtp}
          disabled={enteredOtp.length < 4}
          activeOpacity={0.85}
          accessibilityLabel="Verify PIN and start trip"
        >
          <MaterialIcons name="play-arrow" size={24} color="#064B00" />
          <Text style={styles.verifyButtonText}>VERIFY PIN &amp; START TRIP</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
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
    zIndex: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  statusPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#0F172A",
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: Radius.pill,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: "900",
    color: "#FFFFFF",
    letterSpacing: 0.5,
  },
  callButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    borderWidth: 1,
    borderColor: "#A7F3D0",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: "800",
    color: "#0D6E00",
  },
  mapContainer: {
    flex: 1,
    width: "100%",
  },
  bottomSheet: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
    borderTopWidth: 1,
    borderColor: "rgba(226, 232, 240, 0.9)",
    shadowColor: "#0F172A",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 8,
  },
  passengerBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    backgroundColor: "#F8FAFC",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 14,
    padding: 10,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#0D6E00",
    alignItems: "center",
    justifyContent: "center",
  },
  passengerMeta: {
    flex: 1,
  },
  passengerName: {
    fontSize: 14,
    fontWeight: "800",
    color: "#0F172A",
  },
  destinationHint: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    marginTop: 1,
  },
  otpCard: {
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 16,
    padding: 14,
    alignItems: "center",
  },
  otpCardTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: "#0F172A",
  },
  otpCardSubtitle: {
    fontSize: 11,
    fontWeight: "500",
    color: "#64748B",
    textAlign: "center",
    marginTop: 3,
    marginBottom: 12,
  },
  otpBoxesRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
  },
  otpBox: {
    width: 52,
    height: 54,
    borderRadius: 12,
    backgroundColor: "#F8FAFC",
    borderWidth: 2,
    borderColor: "#CBD5E1",
    alignItems: "center",
    justifyContent: "center",
  },
  otpBoxFilled: {
    borderColor: "#1FC600",
    backgroundColor: "#F0FDF4",
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0F172A",
  },
  realOtpInput: {
    borderWidth: 1,
    borderColor: "#E2E8F0",
    borderRadius: 10,
    backgroundColor: "#F8FAFC",
    paddingHorizontal: 12,
    paddingVertical: 6,
    fontSize: 13,
    color: "#0F172A",
    textAlign: "center",
    width: 140,
    marginTop: 4,
  },
  errorText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#DC2626",
    marginTop: 6,
    textAlign: "center",
  },
  pinHelperStrip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#ECFDF5",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    marginTop: 10,
  },
  pinHelperText: {
    fontSize: 11,
    color: "#065F46",
    fontWeight: "600",
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    opacity: 0.5,
  },
  verifyButtonText: {
    fontSize: 15,
    fontWeight: "900",
    color: "#064B00",
    letterSpacing: 0.5,
  },
});
