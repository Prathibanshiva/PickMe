// mobile-app/src/screens/passenger/VehicleSelectionScreen.tsx

import React, { useMemo, useState } from "react";
import {
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PassengerMapPreview from "@/components/passenger/PassengerMapPreview";
import RideModeSelector from "@/components/passenger/RideModeSelector";
import SeatSelector from "@/components/passenger/SeatSelector";
import PersonalRideBanner from "@/components/passenger/PersonalRideBanner";
import VehicleCard from "@/components/passenger/VehicleCard";
import {
  CANONICAL_VEHICLE_CAPACITIES,
  getMaxSelectableSeats,
  getEstimatedFare,
  isVehicleAvailableForMode,
  RideMode,
  VEHICLE_DEFINITIONS,
  VehicleType,
} from "@/constants/vehicles";
import { Colors, Radius } from "@/theme";

export default function VehicleSelectionScreen() {
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    pickupTitle?: string;
    pickupSubtitle?: string;
    pickupLat?: string;
    pickupLng?: string;
    destinationTitle?: string;
    destinationSubtitle?: string;
    destLat?: string;
    destLng?: string;
    distanceKm?: string;
  }>();

  const pickupTitle = params.pickupTitle || "Current Location";
  const pickupSubtitle = params.pickupSubtitle || "";
  const pickupLat = parseFloat(params.pickupLat || "12.9352");
  const pickupLng = parseFloat(params.pickupLng || "77.6245");

  const destinationTitle = params.destinationTitle || "Destination";
  const destinationSubtitle = params.destinationSubtitle || "";
  const destLat = parseFloat(params.destLat || "13.0082");
  const destLng = parseFloat(params.destLng || "77.6321");

  // State: SHARED RIDE is DEFAULT
  const [selectedMode, setSelectedMode] = useState<RideMode>("shared");
  const [selectedVehicleKey, setSelectedVehicleKey] = useState<VehicleType>("sedan");
  const [requestedSeats, setRequestedSeats] = useState<number>(1);
  const [paymentMethod, setPaymentMethod] = useState<"Cash" | "Card">("Cash");
  const [confirmationModalVisible, setConfirmationModalVisible] = useState(false);

  // Available vehicles for the active mode
  const availableVehicleKeys = useMemo<VehicleType[]>(() => {
    const keys: VehicleType[] = ["auto", "car", "sedan", "suv"];
    if (selectedMode === "personal") {
      // Bike is strictly AVAILABLE ONLY in Personal Ride
      return ["bike", ...keys];
    }
    return keys;
  }, [selectedMode]);

  // Current vehicle definition
  const currentVehicleDef =
    VEHICLE_DEFINITIONS[selectedVehicleKey] || VEHICLE_DEFINITIONS.sedan;

  // Maximum selectable seats for current vehicle in current mode
  const maxSeatsForCurrentVehicle = useMemo(() => {
    return getMaxSelectableSeats(selectedVehicleKey, selectedMode);
  }, [selectedVehicleKey, selectedMode]);

  // Handle Mode Switching with proper resets/clamping
  const handleModeChange = (newMode: RideMode) => {
    setSelectedMode(newMode);

    if (newMode === "shared") {
      // If Bike was selected in personal mode, reset to an available shared vehicle (e.g. Sedan)
      if (selectedVehicleKey === "bike") {
        setSelectedVehicleKey("sedan");
        setRequestedSeats(1);
      } else {
        // Clamp seats to the shared max for the current vehicle (capacity - 1)
        const sharedMax = getMaxSelectableSeats(selectedVehicleKey, "shared");
        if (requestedSeats > sharedMax) {
          setRequestedSeats(sharedMax);
        }
      }
    } else {
      // In Personal Ride mode, seat count is not constrained by (capacity - 1)
      setRequestedSeats(1);
    }
  };

  // Handle Vehicle Selection
  const handleVehicleSelect = (vKey: VehicleType) => {
    setSelectedVehicleKey(vKey);

    // If in Shared Ride, clamp requested seats to vehicle capacity - 1
    if (selectedMode === "shared") {
      const maxForVehicle = getMaxSelectableSeats(vKey, "shared");
      if (requestedSeats > maxForVehicle) {
        setRequestedSeats(maxForVehicle);
      }
    }
  };

  // Live estimated fare computation
  const currentFare = useMemo(() => {
    return getEstimatedFare(selectedVehicleKey, selectedMode, requestedSeats);
  }, [selectedVehicleKey, selectedMode, requestedSeats]);

  // Back Navigation Handler
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/passenger/destination-search");
    }
  };

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* Top Navigation Shell strictly below Android status bar */}
        <View style={[styles.topHeader, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity
            style={styles.circleButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={20} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Route summary capsule */}
          <View style={styles.routeCapsule}>
            <View style={styles.pickupPill}>
              <View style={styles.pickupPillDot} />
              <Text style={styles.routePillText} numberOfLines={1}>
                {pickupTitle}
              </Text>
            </View>

            <Ionicons
              name="arrow-forward"
              size={13}
              color={Colors.text.secondary}
              style={{ marginHorizontal: 4 }}
            />

            <View style={styles.dropoffPill}>
              <View style={styles.dropoffPillDot} />
              <Text style={styles.routePillText} numberOfLines={1}>
                {destinationTitle}
              </Text>
            </View>
          </View>

          <TouchableOpacity
            style={styles.circleButton}
            activeOpacity={0.7}
            accessibilityLabel="Filter options"
          >
            <MaterialIcons name="tune" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* MapLibre + OpenStreetMap Preview with Dual Markers and Camera Fit */}
        <PassengerMapPreview
          mode="route"
          height={210}
          pickupCoords={{
            latitude: pickupLat,
            longitude: pickupLng,
            title: pickupTitle,
            subtitle: pickupSubtitle,
          }}
          destinationCoords={{
            latitude: destLat,
            longitude: destLng,
            title: destinationTitle,
            subtitle: destinationSubtitle,
          }}
        />

        {/* Bottom Sheet Area */}
        <View style={styles.bottomSheet}>
          <View style={styles.dragHandleContainer}>
            <View style={styles.dragHandle} />
          </View>

          <ScrollView
            style={styles.sheetScroll}
            contentContainerStyle={styles.sheetScrollContent}
            showsVerticalScrollIndicator={false}
          >
            <View style={styles.sheetHeaderRow}>
              <Text style={styles.sheetHeading}>Choose a ride</Text>
              <View style={styles.fastestEtaBadge}>
                <MaterialIcons name="auto-awesome" size={13} color={Colors.primary} />
                <Text style={styles.fastestEtaText}>Fastest ETA</Text>
              </View>
            </View>

            {/* Vehicle Selection List */}
            {availableVehicleKeys.map((vKey) => {
              const def = VEHICLE_DEFINITIONS[vKey];
              const isSelected = selectedVehicleKey === vKey;
              const fare = getEstimatedFare(vKey, selectedMode, requestedSeats);

              return (
                <VehicleCard
                  key={vKey}
                  vehicle={def}
                  isSelected={isSelected}
                  fareDisplay={fare}
                  onSelect={() => handleVehicleSelect(vKey)}
                />
              );
            })}

            <View style={{ height: 260 }} />
          </ScrollView>
        </View>

        {/* Bottom Action Bar */}
        <View style={[styles.bottomActionBar, { paddingBottom: Math.max(insets.bottom, 14) }]}>
          {/* Ride Mode Selector (Shared Ride is DEFAULT) */}
          <RideModeSelector
            selectedMode={selectedMode}
            onSelectMode={handleModeChange}
          />

          {/* If Personal Ride: Exclusive Allocation Banner */}
          {selectedMode === "personal" && (
            <PersonalRideBanner vehicleType={selectedVehicleKey} />
          )}

          {/* If Shared Ride: Seat Count Stepper with strict (capacity - 1) rule */}
          {selectedMode === "shared" && (
            <SeatSelector
              vehicle={currentVehicleDef}
              seats={requestedSeats}
              maxSeats={maxSeatsForCurrentVehicle}
              onSeatChange={setRequestedSeats}
            />
          )}

          {/* Payment Method & Fare Summary */}
          <View style={styles.paymentSummaryRow}>
            <TouchableOpacity
              style={styles.paymentChip}
              activeOpacity={0.7}
              onPress={() =>
                setPaymentMethod((prev) => (prev === "Cash" ? "Card" : "Cash"))
              }
            >
              <MaterialIcons name="payments" size={16} color={Colors.primary} />
              <Text style={styles.paymentMethodText}>{paymentMethod}</Text>
              <MaterialIcons
                name="expand-more"
                size={16}
                color={Colors.text.secondary}
              />
            </TouchableOpacity>

            <View style={styles.fareSummaryColumn}>
              <Text style={styles.fareTypeLabel}>
                {selectedMode === "personal"
                  ? "Personal Ride (Exclusive)"
                  : `Shared Fare (${requestedSeats} Seat${requestedSeats > 1 ? "s" : ""})`}
              </Text>
              <Text style={styles.fareValueText}>₹{currentFare}</Text>
            </View>
          </View>

          {/* Confirm Booking CTA */}
          <TouchableOpacity
            style={styles.confirmButton}
            activeOpacity={0.85}
            onPress={() => setConfirmationModalVisible(true)}
          >
            <Text style={styles.confirmButtonText}>
              {selectedMode === "personal"
                ? "Confirm Personal Booking"
                : "Confirm Shared Booking"}
            </Text>

            <View style={styles.confirmButtonRight}>
              <Text style={styles.confirmFareHighlight}>₹{currentFare}</Text>
              <View style={styles.arrowCircle}>
                <Ionicons name="arrow-forward" size={16} color="#064B00" />
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {/* Booking Entry Point Confirmation Modal */}
        <Modal
          animationType="slide"
          transparent
          visible={confirmationModalVisible}
          onRequestClose={() => setConfirmationModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconRow}>
                <View style={styles.modalCheckCircle}>
                  <Ionicons name="checkmark" size={24} color="#FFFFFF" />
                </View>
              </View>

              <Text style={styles.modalTitle}>Booking Selection Ready</Text>
              <Text style={styles.modalSubtitle}>
                You have reached the end of the initial passenger booking entry flow.
              </Text>

              <View style={styles.summaryCard}>
                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Ride Mode:</Text>
                  <Text style={[styles.summaryVal, { textTransform: "capitalize", fontWeight: "800", color: Colors.primary }]}>
                    {selectedMode === "personal" ? "Personal Ride (Exclusive)" : "Shared Ride"}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Vehicle:</Text>
                  <Text style={styles.summaryVal}>{currentVehicleDef.label}</Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Allocation:</Text>
                  <Text style={styles.summaryVal}>
                    {selectedMode === "personal"
                      ? "Entire vehicle reserved exclusively"
                      : `${requestedSeats} seat${requestedSeats > 1 ? "s" : ""} (Max ${maxSeatsForCurrentVehicle})`}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Pickup:</Text>
                  <Text style={styles.summaryVal} numberOfLines={1}>
                    {pickupTitle}
                  </Text>
                </View>

                <View style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Destination:</Text>
                  <Text style={styles.summaryVal} numberOfLines={1}>
                    {destinationTitle}
                  </Text>
                </View>

                <View style={[styles.summaryRow, { borderTopWidth: 1, borderTopColor: "#E5E7EB", paddingTop: 8, marginTop: 4 }]}>
                  <Text style={[styles.summaryLabel, { fontWeight: "700" }]}>Estimated Fare:</Text>
                  <Text style={[styles.summaryVal, { fontSize: 16, fontWeight: "800", color: Colors.text.primary }]}>
                    ₹{currentFare} ({paymentMethod})
                  </Text>
                </View>
              </View>

              <View style={styles.noteBox}>
                <MaterialIcons name="info-outline" size={16} color="#0D6E00" />
                <Text style={styles.noteText}>
                  {selectedMode === "personal"
                    ? "Personal Ride rule: Server-side matching engine will assign driver exclusively and block secondary passenger orders."
                    : "Shared Ride rule: Occupancy-first matching engine will place compatible passengers within physical seat capacity."}
                </Text>
              </View>

              <TouchableOpacity
                style={styles.modalCloseButton}
                activeOpacity={0.85}
                onPress={() => setConfirmationModalVisible(false)}
              >
                <Text style={styles.modalCloseText}>Done / Return to Selection</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#F9F9FF",
    position: "relative",
  },
  topHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    zIndex: 999,
    elevation: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3FF",
  },
  circleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  routeCapsule: {
    flex: 1,
    marginHorizontal: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#F1F3FF",
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderWidth: 1,
    borderColor: "#E1E8FD",
  },
  pickupPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  pickupPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  dropoffPill: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  dropoffPillDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.text.primary,
  },
  routePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  bottomSheet: {
    flex: 1,
    backgroundColor: "#F9F9FF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 6,
    zIndex: 10,
  },
  dragHandleContainer: {
    alignItems: "center",
    paddingTop: 10,
    paddingBottom: 6,
  },
  dragHandle: {
    width: 44,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#D1D5DB",
  },
  sheetScroll: {
    flex: 1,
  },
  sheetScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 4,
  },
  sheetHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sheetHeading: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  fastestEtaBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(31, 198, 0, 0.2)",
  },
  fastestEtaText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0D6E00",
  },
  bottomActionBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingTop: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 12,
    zIndex: 40,
  },
  paymentSummaryRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: "#F1F3FF",
    marginBottom: 8,
  },
  paymentChip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  paymentMethodText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  fareSummaryColumn: {
    alignItems: "flex-end",
  },
  fareTypeLabel: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.secondary,
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  fareValueText: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  confirmButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: Colors.text.primary,
    borderRadius: Radius.pill,
    paddingVertical: 13,
    paddingHorizontal: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  confirmButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#FFFFFF",
    letterSpacing: 0.2,
  },
  confirmButtonRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  confirmFareHighlight: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.primary,
  },
  arrowCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: 22,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 10,
  },
  modalIconRow: {
    marginBottom: 12,
  },
  modalCheckCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: 4,
    textAlign: "center",
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "center",
    marginBottom: 16,
  },
  summaryCard: {
    width: "100%",
    backgroundColor: "#F9FAFB",
    borderRadius: Radius.lg,
    padding: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
  },
  summaryLabel: {
    fontSize: 12,
    color: Colors.text.secondary,
  },
  summaryVal: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
    maxWidth: "60%",
    textAlign: "right",
  },
  noteBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 6,
    backgroundColor: "rgba(31, 198, 0, 0.08)",
    padding: 10,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "rgba(31, 198, 0, 0.2)",
    marginBottom: 16,
    width: "100%",
  },
  noteText: {
    fontSize: 11,
    color: "#064B00",
    lineHeight: 15,
    flex: 1,
  },
  modalCloseButton: {
    width: "100%",
    backgroundColor: Colors.text.primary,
    paddingVertical: 12,
    borderRadius: Radius.pill,
    alignItems: "center",
  },
  modalCloseText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#FFFFFF",
  },
});
