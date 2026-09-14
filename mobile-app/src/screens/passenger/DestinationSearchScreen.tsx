import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { Ionicons, MaterialIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PassengerMapPreview from "@/components/passenger/PassengerMapPreview";
import { LocationPoint } from "@/types/ride.types";
import { Colors, Radius, Spacing } from "@/theme";

const DEFAULT_PICKUP: LocationPoint = {
  title: "4th Block, Koramangala",
  subtitle: "Bengaluru, Karnataka",
};

const RECENT_DESTINATIONS: LocationPoint[] = [
  {
    title: "Oil Mill Road",
    subtitle: "Kammanahalli, Bengaluru, Karnataka",
    distanceKm: 7.2,
  },
  {
    title: "Jubilee Revival AG Church",
    subtitle: "Kacharakanahalli, St. Thomas Town, Bengaluru",
    distanceKm: 5.8,
  },
  {
    title: "KSR Bengaluru City Junction",
    subtitle: "Majestic, Bengaluru, Karnataka",
    distanceKm: 9.4,
  },
];

export default function DestinationSearchScreen() {
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState("");
  const [recentList, setRecentList] = useState(RECENT_DESTINATIONS);

  const handleSelectDestination = (dest: LocationPoint) => {
    router.push({
      pathname: "/passenger/vehicle-selection",
      params: {
        pickupTitle: DEFAULT_PICKUP.title,
        pickupSubtitle: DEFAULT_PICKUP.subtitle || "",
        destinationTitle: dest.title,
        destinationSubtitle: dest.subtitle || "",
        distanceKm: dest.distanceKm ? String(dest.distanceKm) : "7.2",
      },
    } as any);
  };

  const handleClearAll = () => {
    setRecentList([]);
  };

  const filteredDestinations = recentList.filter((item) =>
    item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top App Bar & Pickup Location Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
          >
            <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Pickup location indicator badge */}
          <TouchableOpacity
            style={styles.pickupBadge}
            activeOpacity={0.8}
            accessibilityLabel="Pickup location"
          >
            <View style={styles.pickupDotHalo}>
              <View style={styles.pickupDotCore} />
            </View>
            <View style={styles.pickupTextColumn}>
              <Text style={styles.pickupLabel}>Pickup Location</Text>
              <Text style={styles.pickupAddress} numberOfLines={1}>
                {DEFAULT_PICKUP.title}, Bengaluru
              </Text>
            </View>
            <MaterialIcons name="expand-more" size={20} color={Colors.text.secondary} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerSearchButton}
            activeOpacity={0.7}
            accessibilityLabel="Search map"
          >
            <Ionicons name="search" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 80 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Map View Section with Cabs Navigation (Stitch Reference) */}
          <PassengerMapPreview
            mode="search"
            height={240}
            pickupLabel={DEFAULT_PICKUP.title}
          />

          {/* Search Input Panel */}
          <View style={styles.searchPanel}>
            <View style={styles.inputContainer}>
              <View style={styles.searchIconBox}>
                <Ionicons name="search" size={18} color={Colors.primary} />
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder="Where do you want to go?"
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                onSubmitEditing={() => {
                  if (searchQuery.trim()) {
                    handleSelectDestination({
                      title: searchQuery.trim(),
                      subtitle: "Bengaluru, Karnataka",
                      distanceKm: 6.5,
                    });
                  }
                }}
              />

              <TouchableOpacity
                style={styles.mapTextButton}
                activeOpacity={0.7}
                onPress={() => {
                  if (searchQuery.trim()) {
                    handleSelectDestination({
                      title: searchQuery.trim(),
                      subtitle: "Custom destination",
                      distanceKm: 5.0,
                    });
                  }
                }}
              >
                <Text style={styles.mapTextButtonLabel}>Map</Text>
              </TouchableOpacity>
            </View>

            {/* Quick Filter Chips (Home, Work, Favorites, Add new) */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chipsRow}
            >
              <TouchableOpacity
                style={styles.chip}
                activeOpacity={0.7}
                onPress={() =>
                  handleSelectDestination({
                    title: "Home",
                    subtitle: "Indiranagar 100ft Road, Bengaluru",
                    distanceKm: 4.8,
                  })
                }
              >
                <MaterialIcons name="home" size={17} color={Colors.primary} />
                <Text style={styles.chipText}>Home</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chip}
                activeOpacity={0.7}
                onPress={() =>
                  handleSelectDestination({
                    title: "Work",
                    subtitle: "Ecospace Business Park, Bellandur",
                    distanceKm: 8.5,
                  })
                }
              >
                <MaterialIcons name="work" size={17} color={Colors.primary} />
                <Text style={styles.chipText}>Work</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.chip}
                activeOpacity={0.7}
                onPress={() =>
                  handleSelectDestination({
                    title: "Favorites",
                    subtitle: "MG Road Metro Station",
                    distanceKm: 6.1,
                  })
                }
              >
                <MaterialIcons name="favorite" size={17} color="#E11D48" />
                <Text style={styles.chipText}>Favorites</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.chipSecondary} activeOpacity={0.7}>
                <Ionicons name="add" size={16} color={Colors.text.secondary} />
                <Text style={styles.chipSecondaryText}>Add new</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Recent Destinations List */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentHeaderTitle}>RECENT DESTINATIONS</Text>
              {recentList.length > 0 && (
                <TouchableOpacity activeOpacity={0.7} onPress={handleClearAll}>
                  <Text style={styles.clearAllText}>Clear all</Text>
                </TouchableOpacity>
              )}
            </View>

            {filteredDestinations.map((item, index) => (
              <TouchableOpacity
                key={index}
                style={styles.destinationRow}
                activeOpacity={0.7}
                onPress={() => handleSelectDestination(item)}
              >
                <View style={styles.destinationIconCircle}>
                  <MaterialIcons
                    name={item.title.toLowerCase().includes("junction") ? "train" : "history"}
                    size={20}
                    color={Colors.text.secondary}
                  />
                </View>

                <View style={styles.destinationInfoColumn}>
                  <Text style={styles.destinationTitle} numberOfLines={1}>
                    {item.title}
                  </Text>
                  <Text style={styles.destinationSubtitle} numberOfLines={1}>
                    {item.subtitle}
                  </Text>
                </View>

                <View style={styles.destinationRight}>
                  {item.distanceKm !== undefined && (
                    <Text style={styles.distanceText}>{item.distanceKm} km</Text>
                  )}
                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={Colors.text.secondary}
                  />
                </View>
              </TouchableOpacity>
            ))}

            {/* Set location on map button */}
            <TouchableOpacity
              style={styles.setLocationMapButton}
              activeOpacity={0.8}
              onPress={() =>
                handleSelectDestination({
                  title: "Pinned Location",
                  subtitle: "Selected via interactive map",
                  distanceKm: 5.5,
                })
              }
            >
              <MaterialIcons name="pin-drop" size={20} color={Colors.primary} />
              <Text style={styles.setLocationMapText}>Set location on map</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* PickMe Passenger Bottom Navigation Bar (Stitch Design: Ride, Schedule, Activity, Profile) */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <View style={styles.navIconActiveBox}>
              <MaterialIcons name="directions-car" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.navLabelActive}>Ride</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <MaterialIcons name="calendar-today" size={22} color="#6B7280" />
            <Text style={styles.navLabelInactive}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <MaterialIcons name="receipt-long" size={22} color="#6B7280" />
            <Text style={styles.navLabelInactive}>Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navItem} activeOpacity={0.8}>
            <Ionicons name="person-outline" size={22} color="#6B7280" />
            <Text style={styles.navLabelInactive}>Profile</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3FF",
    zIndex: 20,
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  pickupBadge: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.pill,
  },
  pickupDotHalo: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: "rgba(31, 198, 0, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  pickupDotCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.primary,
  },
  pickupTextColumn: {
    flex: 1,
  },
  pickupLabel: {
    fontSize: 9,
    fontWeight: "800",
    color: "#6D7B65",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  pickupAddress: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  headerSearchButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flex: 1,
  },
  searchPanel: {
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F1F3FF",
    borderRadius: Radius.lg,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
    borderColor: "transparent",
  },
  searchIconBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(31, 198, 0, 0.15)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    fontWeight: "500",
    color: Colors.text.primary,
    paddingVertical: 0,
  },
  mapTextButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Radius.sm,
  },
  mapTextButtonLabel: {
    fontSize: 12,
    fontWeight: "700",
    color: "#0D6E00",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 10,
    paddingTop: 12,
    paddingBottom: 4,
  },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  chipSecondary: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(241, 243, 255, 0.6)",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "rgba(0, 0, 0, 0.05)",
  },
  chipSecondaryText: {
    fontSize: 12,
    fontWeight: "500",
    color: Colors.text.secondary,
  },
  recentSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  recentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6D7B65",
    letterSpacing: 0.6,
  },
  clearAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  destinationRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3FF",
    gap: 12,
  },
  destinationIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#F1F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  destinationInfoColumn: {
    flex: 1,
  },
  destinationTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  destinationSubtitle: {
    fontSize: 12,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  destinationRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  distanceText: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  setLocationMapButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    backgroundColor: "rgba(241, 243, 255, 0.5)",
  },
  setLocationMapText: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  bottomNav: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingTop: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 8,
  },
  navItem: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 60,
  },
  navIconActiveBox: {
    backgroundColor: "rgba(31, 198, 0, 0.15)",
    paddingHorizontal: 14,
    paddingVertical: 3,
    borderRadius: 14,
    marginBottom: 2,
  },
  navLabelActive: {
    fontSize: 11,
    fontWeight: "700",
    color: Colors.primary,
  },
  navLabelInactive: {
    fontSize: 11,
    fontWeight: "500",
    color: "#6B7280",
    marginTop: 2,
  },
});
