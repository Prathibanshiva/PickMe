import React, { useState } from "react";
import { getCurrentUser } from "@/services/user.service";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";

import API_BASE_URL from "@/services/api";
import {
  getAuthSession,
  saveAuthSession,
} from "@/services/auth.service";

import Header from "@/components/Header";
import OTPInput from "@/components/OTPInput";
import PrimaryButton from "@/components/Button";
import LoadingOverlay from "@/components/LoadingOverlay";

import {
  Colors,
  Spacing,
  Typography,
} from "@/theme";

import { UserRole } from "@/types/auth";

interface OTPScreenProps {
  phoneNumber: string;
  role: UserRole;
}

export default function OTPScreen({
  phoneNumber,
  role,
}: OTPScreenProps) {
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleVerify = async () => {
    if (otp.length !== 6) {
      alert("Please enter the 6-digit OTP.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/verify-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber,
            otp,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "OTP verification failed."
        );
      }

      if (!data.token || !data.user) {
        throw new Error(
          "Authentication response is missing session data."
        );
      }

      console.log(
        "OTP verified successfully"
      );

      console.log(
        "User:",
        data.user
      );

      console.log(
        "Selected role:",
        role
      );

      console.log(
        "Authentication successful"
      );

      await saveAuthSession(
        data.token,
        data.user,
        role
      );

      const restoredSession = await getAuthSession();

console.log(
  "Session readback successful:",
  !!restoredSession
);

console.log(
  "Restored session role:",
  restoredSession?.role
);

console.log(
  "Restored user:",
  restoredSession?.user?.phoneNumber
);

      console.log(
        "Authentication session saved securely"
      );

      const currentUser =
  await getCurrentUser();

console.log(
  "Authenticated API request successful"
);

console.log(
  "Server user:",
  currentUser
);

      console.log(
        "Token received:",
        !!data.token
      );

      /*
       * We intentionally do not navigate to the
       * passenger/driver UI yet.
       *
       * Session restoration and authenticated
       * routing will be implemented in the next
       * milestone.
       */
    } catch (error) {
      console.error(
        "OTP verification failed:",
        error
      );

      alert(
        error instanceof Error
          ? error.message
          : "Unable to verify OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={
          Platform.OS === "ios"
            ? "padding"
            : "height"
        }
      >
        <LoadingOverlay
          visible={loading}
          message="Verifying OTP..."
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header
            title="Verify your number"
            subtitle="Enter the 6-digit code sent to your mobile number."
            onBack={handleBack}
          />

          <View style={styles.phoneContainer}>
            <Text style={styles.phoneLabel}>
              Verification code
            </Text>

            <Text style={styles.phoneNumber}>
              +91 {phoneNumber}
            </Text>
          </View>

          <View style={styles.otpSpacing}>
            <OTPInput
              value={otp}
              onChange={setOtp}
            />
          </View>

          <View style={styles.buttonSpacing} />

          <PrimaryButton
            title="Verify"
            onPress={handleVerify}
            disabled={otp.length !== 6}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  keyboardContainer: {
    flex: 1,
  },

  content: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xl,
  },

  phoneContainer: {
    marginTop: Spacing.lg,
  },

  phoneLabel: {
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },

  phoneNumber: {
    marginTop: Spacing.xs,
    ...Typography.headingSmall,
    color: Colors.text.primary,
  },

  otpSpacing: {
    marginTop: Spacing.xl,
  },

  buttonSpacing: {
    marginTop: Spacing.xl,
  },
});