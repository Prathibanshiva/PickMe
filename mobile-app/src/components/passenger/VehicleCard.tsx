import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { Colors, Radius, Spacing } from "@/theme";
import { VehicleDefinition } from "@/constants/vehicles";

interface VehicleCardProps {
  vehicle: VehicleDefinition;
  isSelected: boolean;
  fareDisplay: number;
  onSelect: () => void;
  disabled?: boolean;
}

const VEHICLE_ICONS: Record<string, keyof typeof MaterialIcons.glyphMap> = {
  bike: "two-wheeler",
  auto: "electric-rickshaw",
  car: "directions-car",
  sedan: "electric-car",
  suv: "airport-shuttle",
};

export default function VehicleCard({
  vehicle,
  isSelected,
  fareDisplay,
  onSelect,
  disabled = false,
}: VehicleCardProps) {
  const iconName = VEHICLE_ICONS[vehicle.type] || "directions-car";

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onSelect}
      disabled={disabled}
      style={[
        styles.card,
        isSelected && styles.cardSelected,
        disabled && styles.cardDisabled,
      ]}
    >
      {/* Recommended Badge */}
      {vehicle.isRecommended && (
        <View style={styles.recommendedBadge}>
          <Text style={styles.recommendedText}>Recommended</Text>
        </View>
      )}

      <View style={styles.cardContent}>
        {/* Vehicle Icon Box */}
        <View style={[styles.iconBox, isSelected && styles.iconBoxSelected]}>
          <MaterialIcons
            name={iconName}
            size={28}
            color={isSelected ? Colors.primary : Colors.text.primary}
          />
        </View>

        {/* Vehicle Details */}
        <View style={styles.detailsColumn}>
          <View style={styles.titleRow}>
            <Text style={styles.vehicleName}>{vehicle.label}</Text>

            {/* ETA pill */}
            <View style={styles.etaBadge}>
              <Text style={styles.etaText}>{vehicle.etaText}</Text>
            </View>

            {/* Capacity pill */}
            <View style={styles.capacityRow}>
              <MaterialIcons
                name={vehicle.capacity === 1 ? "person" : "group"}
                size={12}
                color={Colors.text.secondary}
              />
              <Text style={styles.capacityText}>
                {vehicle.capacity} {vehicle.capacity === 1 ? "seat" : "seats"}
              </Text>
            </View>
          </View>

          <Text style={styles.tagline} numberOfLines={1}>
            {vehicle.tagline}
          </Text>
        </View>

        {/* Fare Display */}
        <View style={styles.fareContainer}>
          <Text style={[styles.fareText, isSelected && styles.fareTextSelected]}>
            ₹{fareDisplay}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    position: "relative",
    overflow: "hidden",
  },
  cardSelected: {
    borderColor: Colors.primary,
    borderWidth: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 3,
  },
  cardDisabled: {
    opacity: 0.45,
  },
  recommendedBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.primary,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderBottomLeftRadius: Radius.md,
    zIndex: 10,
  },
  recommendedText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#064B00",
    letterSpacing: 0.2,
  },
  cardContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  iconBox: {
    width: 58,
    height: 44,
    borderRadius: Radius.md,
    backgroundColor: "#F1F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  iconBoxSelected: {
    backgroundColor: "rgba(31, 198, 0, 0.12)",
  },
  detailsColumn: {
    flex: 1,
    justifyContent: "center",
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    flexWrap: "wrap",
    marginBottom: 2,
  },
  vehicleName: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  etaBadge: {
    backgroundColor: "#DCE2F7",
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  etaText: {
    fontSize: 10,
    fontWeight: "700",
    color: "#3D4B37",
  },
  capacityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
  },
  capacityText: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  tagline: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  fareContainer: {
    paddingLeft: 8,
    alignItems: "flex-end",
  },
  fareText: {
    fontSize: 17,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  fareTextSelected: {
    color: Colors.text.primary,
  },
});
