import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { RideMode } from "@/constants/vehicles";
import { Colors, Radius, Spacing } from "@/theme";

interface RideModeSelectorProps {
  selectedMode: RideMode;
  onSelectMode: (mode: RideMode) => void;
}

export default function RideModeSelector({
  selectedMode,
  onSelectMode,
}: RideModeSelectorProps) {
  const isPersonal = selectedMode === "personal";
  const isShared = selectedMode === "shared";

  return (
    <View style={styles.container}>
      {/* Personal Ride Tab */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectMode("personal")}
        style={[
          styles.tabButton,
          isPersonal && styles.tabButtonActive,
        ]}
      >
        <Ionicons
          name="person"
          size={16}
          color={isPersonal ? Colors.text.primary : Colors.text.secondary}
        />
        <Text
          style={[
            styles.tabText,
            isPersonal ? styles.tabTextActive : styles.tabTextInactive,
          ]}
        >
          Personal Ride
        </Text>
      </TouchableOpacity>

      {/* Shared Ride Tab (Default) */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => onSelectMode("shared")}
        style={[
          styles.tabButton,
          isShared && styles.tabButtonActive,
        ]}
      >
        <MaterialIcons
          name="group"
          size={18}
          color={isShared ? Colors.primary : Colors.text.secondary}
        />
        <Text
          style={[
            styles.tabText,
            isShared ? styles.tabTextActive : styles.tabTextInactive,
          ]}
        >
          Shared Ride
        </Text>
        <View style={styles.discountBadge}>
          <Text style={styles.discountText}>Save 30%</Text>
        </View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    backgroundColor: "#F1F3FF",
    padding: 4,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#E1E8FD",
    marginBottom: Spacing.sm,
  },
  tabButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderRadius: Radius.md,
    gap: 6,
  },
  tabButtonActive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 2,
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.06)",
  },
  tabText: {
    fontSize: 12,
    fontWeight: "700",
  },
  tabTextActive: {
    color: Colors.text.primary,
  },
  tabTextInactive: {
    color: Colors.text.secondary,
  },
  discountBadge: {
    backgroundColor: "rgba(31, 198, 0, 0.15)",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
  },
  discountText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#064B00",
  },
});
