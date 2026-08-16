import React, { useState } from "react";
import { router } from "expo-router";
import API_BASE_URL from "@/services/api";

import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  View,
} from "react-native";

import Header from "@/components/Header";
import PhoneInput from "@/components/PhoneInput";
import PrimaryButton from "@/components/Button";
import LoadingOverlay from "@/components/LoadingOverlay";

import {
  Colors,
  Spacing,
} from "@/theme";

interface PhoneNumberScreenProps {
  role: "passenger" | "driver";
}

export default function PhoneNumberScreen({
  role,
}: PhoneNumberScreenProps) {
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const handleBack = () => {
    router.back();
  };

  const handleContinue = async () => {
    if (phone.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/auth/send-otp`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            phoneNumber: phone,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data?.message || "Failed to send OTP."
        );
      }

      console.log("OTP request successful:", data);
      console.log("Selected role:", role);

      router.push({
        pathname: "/auth/verify-otp",
        params: {
          phoneNumber: phone,
          role,
        },
      });
    } catch (error) {
      console.error("OTP request failed:", error);

      alert(
        error instanceof Error
          ? error.message
          : "Unable to send OTP. Please try again."
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
          message="Sending OTP..."
        />

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Header
            title="Enter your mobile number"
            subtitle="We'll send you a verification code to verify your number."
            onBack={handleBack}
          />

          <View style={styles.inputSpacing}>
            <PhoneInput
              value={phone}
              onChangeText={setPhone}
            />
          </View>

          <View style={styles.buttonSpacing} />

          <PrimaryButton
            title="Continue"
            onPress={handleContinue}
          />

          <View style={styles.smallSpacing} />
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

  inputSpacing: {
    marginTop: Spacing.xl,
  },

  buttonSpacing: {
    marginTop: Spacing.xl,
  },

  smallSpacing: {
    marginTop: Spacing.md,
  },
});