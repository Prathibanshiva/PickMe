import React from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";

import { Image } from "react-native";
import { Images } from "@/assets";

import {
  Colors,
  Shadows,
  Spacing,
  Typography,
} from "@/theme";

interface HeaderProps {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}

export default function Header({
  title,
  subtitle,
  onBack,
}: HeaderProps) {
  return (
    <View style={styles.container}>
  <View style={styles.topRow}>
    {onBack ? (
      <Pressable
        onPress={onBack}
        accessibilityRole="button"
        accessibilityLabel="Go Back"
        style={styles.backButton}
      >
        <Text style={styles.backIcon}>←</Text>
      </Pressable>
    ) : (
      <View style={styles.backPlaceholder} />
    )}

    <Image
      source={Images.logo}
      style={styles.logo}
      resizeMode="contain"
    />

    <View style={styles.backPlaceholder} />
  </View>

  <Text style={styles.title}>{title}</Text>

  {subtitle ? (
    <Text style={styles.subtitle}>
      {subtitle}
    </Text>
  ) : null}
</View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: Spacing.xl,
  },
  title: {
    ...Typography.headingLarge,
    color: Colors.text.primary,
  },

  subtitle: {
    marginTop: Spacing.sm,

    ...Typography.bodyMedium,
    color: Colors.text.secondary,
    lineHeight: 22,
  },

  topRow: {
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",

  marginBottom: Spacing.xl,
},

logo: {
  width: 300,
  height: 150,

  transform: [
    {
      translateX: -8,
    },
  ],
},

backPlaceholder: {
  width: 52,
},

backButton: {
  width: 52,
  height: 52,

  borderRadius: 26,

  backgroundColor: Colors.surface,

  justifyContent: "center",
  alignItems: "center",

  ...Shadows.sm,
},

backIcon: {
  fontSize: 30,
  fontWeight: "700",
  color: Colors.text.primary,
  lineHeight: 32,
  includeFontPadding: false,
},

});