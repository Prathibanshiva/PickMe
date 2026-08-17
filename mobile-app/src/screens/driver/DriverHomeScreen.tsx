import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useEffect, useState } from "react";

import { useAuth } from "@/store/auth.store";
import { createOrGetDriverProfile } from "@/services/driver.service";

import {
  Colors,
  Spacing,
  Typography,
} from "@/theme";

export default function DriverHomeScreen() {
  const { user, role } = useAuth();

  const [verificationStatus, setVerificationStatus] =
    useState<string | null>(null);

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

        setVerificationStatus(
          profile.verificationStatus
        );
      } catch (error) {
        console.error(
          "Driver profile request failed:",
          error
        );
      }
    };

    loadDriverProfile();
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>
          Driver Home
        </Text>

        <Text style={styles.subtitle}>
          Driver mode is ready.
        </Text>

        <View style={styles.infoCard}>
          <Text style={styles.label}>
            Phone Number
          </Text>

          <Text style={styles.value}>
            +91 {user?.phoneNumber}
          </Text>

          <Text style={styles.label}>
            Current Role
          </Text>

          <Text style={styles.value}>
            {role}
          </Text>

          <Text style={styles.label}>
            Verification Status
          </Text>

          <Text style={styles.value}>
            {verificationStatus ??
              "Loading..."}
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },

  content: {
    flex: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xxl,
  },

  title: {
    ...Typography.headingLarge,
    color: Colors.text.primary,
  },

  subtitle: {
    marginTop: Spacing.xs,
    ...Typography.bodyMedium,
    color: Colors.text.secondary,
  },

  infoCard: {
    marginTop: Spacing.xxl,
    padding: Spacing.lg,
    borderRadius: 16,
    backgroundColor: "#F5F5F5",
  },

  label: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginTop: Spacing.sm,
  },

  value: {
    ...Typography.bodyMedium,
    color: Colors.text.primary,
    marginTop: Spacing.xs,
  },
});