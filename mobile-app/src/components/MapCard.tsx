import React from "react";
import { Image, StyleSheet, Text, View } from "react-native";

import { Colors, Radius, Shadows, Spacing, Typography } from "@/theme";

interface MapCardProps {
  city: string;
  localName?: string;
  image: any;
}

export default function MapCard({
  city,
  localName,
  image,
}: MapCardProps) {
  return (
    <View style={styles.container}>
      <Image
        source={image}
        style={styles.image}
        resizeMode="cover"
      />

      <View style={styles.overlay}>
        <Text style={styles.city}>{city}</Text>

        {localName && (
          <Text style={styles.localName}>
            {localName}
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: Spacing.xxl,
    borderRadius: Radius.lg,
    overflow: "hidden",
    ...Shadows.md,
    backgroundColor: Colors.surface,
  },

  image: {
    width: "100%",
    height: 220,
  },

  overlay: {
    position: "absolute",
    bottom: 18,
    left: 0,
    right: 0,
    alignItems: "center",
  },

  city: {
    ...Typography.h2,
    color: Colors.text.primary,
  },

  localName: {
    marginTop: Spacing.xs,
    ...Typography.body,
    color: Colors.text.secondary,
  },
});