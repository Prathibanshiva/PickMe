import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "@/theme";
import { VehicleType } from "@/constants/vehicles";

interface PersonalRideBannerProps {
  vehicleType: VehicleType;
}

export default function PersonalRideBanner({ vehicleType }: PersonalRideBannerProps) {
  const vehicleLabel = vehicleType === "bike" ? "bike" : vehicleType === "auto" ? "auto" : "vehicle";

  return (
    <View style={styles.banner}>
      <View style={styles.leftContent}>
        <MaterialIcons name="verified" size={20} color={Colors.primary} />
        <View style={styles.textColumn}>
          <Text style={styles.title}>
            Entire {vehicleLabel} reserved for you
          </Text>
          <Text style={styles.subtitle}>
            Exclusive ride · Direct route with no stops
          </Text>
        </View>
      </View>

      <View style={styles.badge}>
        <Text style={styles.badgeText}>Exclusive</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "rgba(31, 198, 0, 0.08)",
    borderWidth: 1,
    borderColor: "rgba(31, 198, 0, 0.25)",
    borderRadius: Radius.lg,
    paddingVertical: 10,
    paddingHorizontal: 12,
    marginBottom: Spacing.sm,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    flex: 1,
  },
  textColumn: {
    flex: 1,
  },
  title: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.primary,
    lineHeight: 16,
  },
  subtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 14,
    marginTop: 1,
  },
  badge: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(31, 198, 0, 0.3)",
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0D6E00",
  },
});
