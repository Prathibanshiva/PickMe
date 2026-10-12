import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "@/theme";
import { VehicleDefinition } from "@/constants/vehicles";

interface SeatSelectorProps {
  vehicle: VehicleDefinition;
  seats: number;
  maxSeats: number;
  onSeatChange: (seats: number) => void;
}

export default function SeatSelector({
  vehicle,
  seats,
  maxSeats,
  onSeatChange,
}: SeatSelectorProps) {
  const canDecrease = seats > 1;
  const canIncrease = seats < maxSeats;

  const handleDecrease = () => {
    if (canDecrease) {
      onSeatChange(seats - 1);
    }
  };

  const handleIncrease = () => {
    if (canIncrease) {
      onSeatChange(seats + 1);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftContent}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="group" size={18} color={Colors.text.secondary} />
        </View>
        <View>
          <Text style={styles.title}>Seats Needed</Text>
          <Text style={styles.subtext}>
            Select 1 to {maxSeats} seats for {vehicle.label}
          </Text>
        </View>
      </View>

      <View style={styles.stepperContainer}>
        {/* Minus button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleDecrease}
          disabled={!canDecrease}
          style={[styles.stepperButton, !canDecrease && styles.stepperButtonDisabled]}
          accessibilityLabel="Decrease seats"
        >
          <MaterialIcons
            name="remove"
            size={16}
            color={canDecrease ? Colors.text.primary : "#9CA3AF"}
          />
        </TouchableOpacity>

        {/* Seat count */}
        <Text style={styles.seatCountText}>{seats}</Text>

        {/* Plus button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={handleIncrease}
          disabled={!canIncrease}
          style={[styles.stepperButton, !canIncrease && styles.stepperButtonDisabled]}
          accessibilityLabel="Increase seats"
        >
          <MaterialIcons
            name="add"
            size={16}
            color={canIncrease ? Colors.text.primary : "#9CA3AF"}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.sm,
    paddingVertical: 4,
  },
  leftContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  iconCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
    lineHeight: 16,
  },
  subtext: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 14,
    marginTop: 1,
  },
  stepperContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3FF",
    borderRadius: Radius.pill,
    padding: 2,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  stepperButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  stepperButtonDisabled: {
    opacity: 0.4,
    shadowOpacity: 0,
    elevation: 0,
  },
  seatCountText: {
    fontSize: 14,
    fontWeight: "800",
    color: Colors.text.primary,
    width: 32,
    textAlign: "center",
  },
});
