import React from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

import {
  Colors,
  Spacing,
  Typography,
} from "@/theme";

const VERIFICATION_ITEMS = [
  "Profile Photo",
  "Aadhaar Card",
  "Driving Licence",
  "Vehicle Details",
  "Vehicle Photo",
];

export default function DriverVerificationIntroScreen() {
  const handleBack = () => {
    router.back();
  };

  const handleContinue = () => {
    router.push("/driver/verification/identity-verification");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <Pressable
            onPress={handleBack}
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.pressed,
            ]}
          >
            <Ionicons
              name="arrow-back"
              size={20}
              color={Colors.primary}
            />
          </Pressable>

          <Text style={styles.logo}>
            PickMe
          </Text>

          <View style={styles.headerSpacer} />
        </View>

        {/* Content */}
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={
            styles.scrollContent
          }
        >
          {/* Introduction */}
          <View style={styles.introduction}>
            <Text style={styles.smallBrand}>
              PickMe
            </Text>

            <Text style={styles.title}>
              Complete your driver profile
            </Text>

            <Text style={styles.description}>
              We need a few details to verify your
              identity and vehicle. This helps keep
              our community safe and secure.
            </Text>
          </View>

          {/* Illustration */}
          <View style={styles.illustrationContainer}>
            <Image
  source={require("@/../assets/images/driver/verification/driver-verification-intro.png")}
  style={styles.illustration}
  resizeMode="cover"
/>
          </View>

          {/* Checklist */}
          <View style={styles.checklistCard}>
            {VERIFICATION_ITEMS.map(
              (item, index) => (
                <React.Fragment key={item}>
                  <View style={styles.checkItem}>
                    <View
                      style={styles.checkCircle}
                    />

                    <Text style={styles.checkText}>
                      {item}
                    </Text>
                  </View>

                  {index <
                    VERIFICATION_ITEMS.length -
                      1 && (
                    <View
                      style={styles.divider}
                    />
                  )}
                </React.Fragment>
              )
            )}
          </View>

          {/* Bottom spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Continue Button */}
        <View style={styles.bottomAction}>
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
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },

  container: {
    flex: 1,
    backgroundColor: "#F9F9FF",
  },

  /*
   * Stitch header:
   * 48px height with horizontal padding.
   *
   * SafeAreaView handles the system status-bar
   * area, so we don't manually add status-bar
   * padding here.
   */
  topBar: {
    height: 48,
    paddingHorizontal: 20,
    backgroundColor: "#F9F9FF",

    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",

    borderBottomWidth: 0,
  },

  backButton: {
    width: 40,
    height: 40,

    alignItems: "center",
    justifyContent: "center",

    borderRadius: 20,
  },

  pressed: {
    opacity: 0.65,
  },

  logo: {
    position: "absolute",
    left: 60,

    fontSize: 16,
    lineHeight: 20,
    fontWeight: "800",

    color: "#0D6E00",
  },

  headerSpacer: {
    width: 40,
  },

  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 100,
  },

  introduction: {
    marginBottom: 32,
  },

  smallBrand: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",
    color: "#1FC600",

    marginBottom: 4,
  },

  title: {
    fontSize: 24,
    lineHeight: 32,
    fontWeight: "700",

    color: "#141B2B",

    marginBottom: 8,
  },

  description: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "400",

    color: "#3D4B37",
  },

  illustrationContainer: {
    width: "100%",
    height: 192,

    borderRadius: 12,

    backgroundColor: "#F1F3FF",

    overflow: "hidden",

    marginBottom: 32,
  },

  illustration: {
    width: "100%",
    height: "100%",
  },

  checklistCard: {
    width: "100%",

    backgroundColor: "#FFFFFF",

    borderWidth: 1,
    borderColor: "#E1E8FD",

    borderRadius: 12,

    paddingHorizontal: 16,
    paddingVertical: 4,

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },

  checkItem: {
    minHeight: 48,

    flexDirection: "row",
    alignItems: "center",

    gap: 16,
  },

  checkCircle: {
    width: 14,
    height: 14,

    borderRadius: 7,

    borderWidth: 1,
    borderColor: "#BCCBB2",

    backgroundColor: "#FFFFFF",
  },

  checkText: {
    flex: 1,

    fontSize: 16,
    lineHeight: 24,
    fontWeight: "400",

    color: "#141B2B",
  },

  divider: {
    height: 1,
    width: "100%",

    backgroundColor: "#E1E8FD",
  },

  bottomSpacing: {
    height: 20,
  },

  bottomAction: {
    position: "absolute",

    left: 0,
    right: 0,
    bottom: 0,

    backgroundColor: "#F9F9FF",

    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 12,

    borderTopWidth: 1,
    borderTopColor: "#E1E8FD",
  },

  continueButton: {
    width: "100%",
    height: 48,

    borderRadius: 8,

    backgroundColor: "#1FC600",

    alignItems: "center",
    justifyContent: "center",
  },

  continueButtonPressed: {
    opacity: 0.85,
  },

  continueText: {
    fontSize: 12,
    lineHeight: 16,
    fontWeight: "700",

    letterSpacing: 0.6,

    color: "#064B00",
  },
});