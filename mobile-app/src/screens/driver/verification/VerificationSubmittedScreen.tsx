import React from "react";
import {
  Pressable,
  SafeAreaView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const COLORS = {
  background: "#F9F9FF",
  surface: "#FFFFFF",
  primary: "#1FC600",
  primaryDark: "#0D6E00",
  text: "#141B2B",
  secondaryText: "#3D4B37",
  border: "#E2E6F0",
  pendingBackground: "#F0F3FF",
  pendingIconBackground: "#E9EDFF",
};

export default function VerificationSubmittedScreen() {
  const handleContinue = () => {
    router.replace("/");
  };

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.brand}>PICKME</Text>
          <Text style={styles.headerTitle}>
            Verification Submitted
          </Text>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {/* Success Illustration */}
          <View style={styles.illustrationContainer}>
            <View style={styles.illustrationCircle}>
              <View style={styles.folder}>
                <View style={styles.folderTab} />

                <View style={styles.folderBody}>
                  <View style={styles.checkCircle}>
                    <Ionicons
                      name="checkmark"
                      size={28}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
              </View>
            </View>

            <Text style={styles.illustrationCaption}>
              Verification Submitted
            </Text>

            <Text style={styles.illustrationSubCaption}>
              Your documents are now under review
            </Text>
          </View>

          {/* Title */}
          <Text style={styles.title}>
            Verification Submitted
          </Text>

          <Text style={styles.description}>
            Your documents were submitted successfully
            and are now awaiting review.
          </Text>

          {/* Status Card */}
          <View style={styles.statusCard}>
            <View style={styles.statusIcon}>
              <Ionicons
                name="hourglass-outline"
                size={20}
                color={COLORS.primaryDark}
              />
            </View>

            <View style={styles.statusContent}>
              <Text style={styles.statusLabel}>
                STATUS
              </Text>

              <Text style={styles.statusValue}>
                Verification Pending
              </Text>
            </View>

            <View style={styles.statusDot} />
          </View>

          {/* What Happens Next */}
          <View style={styles.nextCard}>
            <Text style={styles.nextTitle}>
              What happens next?
            </Text>

            <View style={styles.nextItem}>
              <View style={styles.nextIcon}>
                <Ionicons
                  name="search-outline"
                  size={14}
                  color={COLORS.primaryDark}
                />
              </View>

              <Text style={styles.nextText}>
                Our team will review your submitted driver
                license and background check details.
              </Text>
            </View>

            <View style={styles.nextItem}>
              <View style={styles.nextIcon}>
                <Ionicons
                  name="notifications-outline"
                  size={14}
                  color={COLORS.primaryDark}
                />
              </View>

              <Text style={styles.nextText}>
                You will receive a notification and an email
                once your account is fully approved.
              </Text>
            </View>

            <View style={styles.nextItem}>
              <View style={styles.nextIcon}>
                <Ionicons
                  name="time-outline"
                  size={14}
                  color={COLORS.primaryDark}
                />
              </View>

              <Text style={styles.nextText}>
                Usually takes 24–48 hours.
              </Text>
            </View>
          </View>
        </View>

        {/* Continue */}
        <View style={styles.bottom}>
          <Pressable
            onPress={handleContinue}
            style={({ pressed }) => [
              styles.continueButton,
              pressed &&
                styles.continueButtonPressed,
            ]}
          >
            <Text style={styles.continueText}>
              Continue to Driver Home
            </Text>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  container: {
    flex: 1,
    paddingHorizontal: 16,
  },

  header: {
    alignItems: "center",
    paddingTop: 80,
  },

  brand: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "800",
    letterSpacing: 1.5,
    color: COLORS.primaryDark,
  },

  headerTitle: {
    marginTop: 2,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.secondaryText,
  },

  content: {
    flex: 1,
    paddingTop: 20,
  },

  illustrationContainer: {
    alignItems: "center",
  },

  illustrationCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: "#F0F2FA",
    alignItems: "center",
    justifyContent: "center",
  },

  folder: {
    width: 68,
    height: 54,
    position: "relative",
  },

  folderTab: {
    position: "absolute",
    left: 7,
    top: 0,
    width: 25,
    height: 10,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
    backgroundColor: "#B8BBC4",
  },

  folderBody: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 45,
    borderRadius: 7,
    backgroundColor: "#C7CAD3",
    alignItems: "center",
    justifyContent: "center",
  },

  checkCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },

  illustrationCaption: {
    marginTop: 8,
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "600",
    color: COLORS.text,
  },

  illustrationSubCaption: {
    marginTop: 1,
    fontSize: 6,
    lineHeight: 9,
    color: COLORS.secondaryText,
  },

  title: {
    marginTop: 24,
    fontSize: 20,
    lineHeight: 28,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },

  description: {
    marginTop: 8,
    paddingHorizontal: 24,
    fontSize: 12,
    lineHeight: 17,
    color: COLORS.secondaryText,
    textAlign: "center",
  },

  statusCard: {
    marginTop: 20,
    minHeight: 62,
    borderRadius: 12,
    backgroundColor: COLORS.pendingBackground,
    borderWidth: 1,
    borderColor: "#E0E5FA",
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
  },

  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.pendingIconBackground,
    alignItems: "center",
    justifyContent: "center",
  },

  statusContent: {
    flex: 1,
    marginLeft: 10,
  },

  statusLabel: {
    fontSize: 8,
    lineHeight: 11,
    fontWeight: "600",
    color: COLORS.secondaryText,
    letterSpacing: 0.7,
  },

  statusValue: {
    marginTop: 2,
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: COLORS.text,
  },

  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#B8BCC8",
  },

  nextCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
  },

  nextTitle: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },

  nextItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: 8,
  },

  nextIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "#F1F9ED",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },

  nextText: {
    flex: 1,
    fontSize: 10,
    lineHeight: 14,
    color: COLORS.secondaryText,
  },

  bottom: {
    paddingBottom: 14,
    paddingTop: 10,
  },

  continueButton: {
    width: "100%",
    height: 52,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },

  continueButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.99 }],
  },

  continueText: {
    fontSize: 13,
    lineHeight: 18,
    fontWeight: "600",
    color: "#000000",
  },
});