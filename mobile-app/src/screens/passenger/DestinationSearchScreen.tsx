// mobile-app/src/screens/passenger/DestinationSearchScreen.tsx

import React, { useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { Colors, Radius } from "@/theme";
import {
  BENGALURU_FALLBACK_LOCATION,
  getCurrentPickupLocation,
  reverseGeocodeCoordinates,
} from "@/services/location.service";

const RECENT_DESTINATIONS: LocationPoint[] = [
  {
    title: "Oil Mill Road",
    subtitle: "Kammanahalli, Bengaluru, Karnataka",
    latitude: 13.0082,
    longitude: 77.6321,
    distanceKm: 7.2,
  },
  {
    title: "Jubilee Revival AG Church",
    subtitle: "Kacharakanahalli, St. Thomas Town, Bengaluru",
    latitude: 13.0145,
    longitude: 77.6358,
    distanceKm: 5.8,
  },
  {
    title: "KSR Bengaluru City Junction",
    subtitle: "Majestic, Bengaluru, Karnataka",
    latitude: 12.9781,
    longitude: 77.5696,
    distanceKm: 9.4,
  },
];

const QUICK_SAVED_DESTINATIONS: LocationPoint[] = [
  ...RECENT_DESTINATIONS,
  {
    title: "Indiranagar 100ft Road",
    subtitle: "Indiranagar, Bengaluru, Karnataka",
    latitude: 12.9784,
    longitude: 77.6408,
    distanceKm: 4.8,
  },
  {
    title: "Ecospace Business Park",
    subtitle: "Bellandur Outer Ring Road, Bengaluru",
    latitude: 12.926,
    longitude: 77.6833,
    distanceKm: 8.5,
  },
  {
    title: "MG Road Metro Station",
    subtitle: "MG Road, Bengaluru, Karnataka",
    latitude: 12.9756,
    longitude: 77.6066,
    distanceKm: 6.1,
  },
  {
    title: "Kempegowda International Airport",
    subtitle: "Devanahalli, Bengaluru, Karnataka",
    latitude: 13.1979,
    longitude: 77.7063,
    distanceKm: 34.2,
  },
  {
    title: "Forum Mall Koramangala",
    subtitle: "Koramangala, Bengaluru, Karnataka",
    latitude: 12.9345,
    longitude: 77.6101,
    distanceKm: 5.3,
  },
  {
    title: "Manyata Tech Park",
    subtitle: "Hebbal, Nagawara, Bengaluru",
    latitude: 13.047,
    longitude: 77.617,
    distanceKm: 12.6,
  },
  {
    title: "Whitefield",
    subtitle: "Whitefield Main Road, Bengaluru",
    latitude: 12.9698,
    longitude: 77.7499,
    distanceKm: 18.1,
  },
  {
    title: "Brigade Road",
    subtitle: "Central Bengaluru, Karnataka",
    latitude: 12.9719,
    longitude: 77.6086,
    distanceKm: 5.9,
  },
  {
    title: "Manipal Hospital Old Airport Road",
    subtitle: "HAL Old Airport Road, Bengaluru",
    latitude: 12.9601,
    longitude: 77.6488,
    distanceKm: 7.4,
  },
  {
    title: "Yeshwanthpur Railway Station",
    subtitle: "Yeshwanthpur, Bengaluru, Karnataka",
    latitude: 13.0193,
    longitude: 77.5505,
    distanceKm: 10.2,
  },
  {
    title: "Electronic City Phase 1",
    subtitle: "Electronic City, Bengaluru, Karnataka",
    latitude: 12.8399,
    longitude: 77.6771,
    distanceKm: 22.4,
  },
  {
    title: "Koramangala 4th Block",
    subtitle: "Koramangala, Bengaluru, Karnataka",
    latitude: 12.9352,
    longitude: 77.6245,
    distanceKm: 4.1,
  },
  {
    title: "Ulsoor Lake",
    subtitle: "Halasuru, Bengaluru, Karnataka",
    latitude: 12.9817,
    longitude: 77.6178,
    distanceKm: 3.7,
  },
];

export default function DestinationSearchScreen() {
  const insets = useSafeAreaInsets();

  // State: Structured Pickup Location
  const [pickupLocation, setPickupLocation] = useState<LocationPoint>(
    BENGALURU_FALLBACK_LOCATION
  );
  const [isEditingPickup, setIsEditingPickup] = useState(false);

  // State: Destination Search
  const [searchQuery, setSearchQuery] = useState("");

  // State: Stitch Recent Destinations
  const [recentList, setRecentList] = useState<LocationPoint[]>(RECENT_DESTINATIONS);

  // Filtered destinations based on search query
  const filteredDestinations = searchQuery.trim().length > 0
    ? QUICK_SAVED_DESTINATIONS.filter((item) =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.subtitle && item.subtitle.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : [];

  // On mount: Fetch actual GPS location for pickup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      const loc = await getCurrentPickupLocation();
      if (isMounted) {
        setPickupLocation(loc);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Handle Pickup Adjustment via Interactive Map
  const handlePickupChange = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    const geocoded = await reverseGeocodeCoordinates(
      coords.latitude,
      coords.longitude
    );
    setPickupLocation({
      title: geocoded.title,
      subtitle: geocoded.subtitle,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
  };

  // Back Navigation Handler
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // Select a destination and navigate to Vehicle Selection with structured coordinates
  const handleSelectDestination = (dest: LocationPoint) => {
    router.push({
      pathname: "/passenger/vehicle-selection",
      params: {
        pickupTitle: pickupLocation.title,
        pickupSubtitle: pickupLocation.subtitle || "",
        pickupLat: String(pickupLocation.latitude),
        pickupLng: String(pickupLocation.longitude),
        destinationTitle: dest.title,
        destinationSubtitle: dest.subtitle || "",
        destLat: String(dest.latitude),
        destLng: String(dest.longitude),
        distanceKm: dest.distanceKm ? String(dest.distanceKm) : "7.2",
      },
    } as any);
  };

  return (
    <View style={styles.root}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        {/* Top App Bar & Pickup Header strictly below Android status bar */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleGoBack}
            activeOpacity={0.7}
            accessibilityLabel="Go back"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 14 }}
          >
            <Ionicons name="arrow-back" size={22} color={Colors.text.primary} />
          </TouchableOpacity>

          {/* Interactive Pickup Location Badge */}
          <TouchableOpacity
            style={[
              styles.pickupBadge,
              isEditingPickup && styles.pickupBadgeActive,
            ]}
            activeOpacity={0.8}
            onPress={() => setIsEditingPickup(!isEditingPickup)}
            accessibilityLabel="Pickup location"
          >
            <View style={styles.pickupDotHalo}>
              <View style={styles.pickupDotCore} />
            </View>
            <View style={styles.pickupTextColumn}>
              <Text style={styles.pickupLabel}>
                {isEditingPickup ? "ADJUSTING PICKUP ON MAP" : "PICKUP LOCATION"}
              </Text>
              <Text style={styles.pickupAddress} numberOfLines={1}>
                {pickupLocation.title}
              </Text>
            </View>
            <MaterialIcons
              name={isEditingPickup ? "check" : "edit-location"}
              size={18}
              color={isEditingPickup ? "#0D6E00" : Colors.text.secondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerSearchButton}
            activeOpacity={0.7}
            onPress={() => setIsEditingPickup(false)}
            accessibilityLabel="Search map"
          >
            <Ionicons name="search" size={20} color={Colors.text.primary} />
          </TouchableOpacity>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Real MapLibre + OpenStreetMap Preview Section */}
          <PassengerMapPreview
            mode="search"
            height={230}
            pickupCoords={pickupLocation}
            isInteractivePickup={isEditingPickup}
            onPickupChange={handlePickupChange}
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
              />

              {searchQuery.length > 0 && (
                <TouchableOpacity
                  style={styles.clearSearchButton}
                  onPress={() => setSearchQuery("")}
                >
                  <Ionicons name="close-circle" size={18} color="#9CA3AF" />
                </TouchableOpacity>
              )}
            </View>

            {/* Quick Filter Chips (Stitch Aesthetic) */}
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
                    latitude: 12.9784,
                    longitude: 77.6408,
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
                    latitude: 12.926,
                    longitude: 77.6833,
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
                    latitude: 12.9756,
                    longitude: 77.6066,
                    distanceKm: 6.1,
                  })
                }
              >
                <MaterialIcons name="favorite" size={17} color="#E11D48" />
                <Text style={styles.chipText}>Favorites</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>

          {/* Search Results / Matching Destinations */}
          {searchQuery.trim().length > 0 ? (
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionHeaderTitle}>SEARCH RESULTS</Text>

              {filteredDestinations.map((item, idx) => (
                <TouchableOpacity
                  key={`dest-${idx}`}
                  style={styles.destinationRow}
                  activeOpacity={0.7}
                  onPress={() => handleSelectDestination(item)}
                >
                  <View style={styles.destinationIconCircle}>
                    <Ionicons name="location-sharp" size={18} color={Colors.primary} />
                  </View>

                  <View style={styles.destinationInfoColumn}>
                    <Text style={styles.destinationTitle} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.destinationSubtitle} numberOfLines={1}>
                      {item.subtitle}
                    </Text>
                  </View>

                  <MaterialIcons
                    name="chevron-right"
                    size={20}
                    color={Colors.text.secondary}
                  />
                </TouchableOpacity>
              ))}

              {filteredDestinations.length === 0 && (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons name="search-off" size={32} color={Colors.text.secondary} style={{ marginBottom: 8 }} />
                  <Text style={styles.emptyStateText}>
                    No results for "{searchQuery}"
                  </Text>
                  <Text style={[styles.emptyStateText, { marginTop: 4, fontSize: 12, color: Colors.text.secondary }]}>
                    Try a neighbourhood, landmark, or road name.
                  </Text>
                </View>
              )}
            </View>
          ) : (
            /* Stitch Reference Recent Destinations */
            <View style={styles.recentSection}>
              <View style={styles.recentHeaderRow}>
                <Text style={styles.recentHeaderTitle}>RECENT DESTINATIONS</Text>
                {recentList.length > 0 && (
                  <TouchableOpacity
                    activeOpacity={0.7}
                    onPress={() => setRecentList([])}
                  >
                    <Text style={styles.clearAllText}>Clear all</Text>
                  </TouchableOpacity>
                )}
              </View>

              {recentList.map((item, index) => (
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
            </View>
          )}
        </ScrollView>

        {/* Passenger Bottom Navigation Bar */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => router.replace("/")}
          >
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
    backgroundColor: "#FFFFFF",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    paddingBottom: 10,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3FF",
    zIndex: 999,
    elevation: 8,
  },
  backButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    paddingVertical: 7,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "transparent",
  },
  pickupBadgeActive: {
    borderColor: Colors.primary,
    backgroundColor: "rgba(31, 198, 0, 0.1)",
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
  clearSearchButton: {
    padding: 4,
  },
  errorBanner: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 8,
    backgroundColor: "#FEF2F2",
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    padding: 10,
    marginTop: 10,
  },
  errorBannerTitle: {
    fontSize: 12,
    fontWeight: "800",
    color: "#991B1B",
  },
  errorBannerText: {
    fontSize: 11,
    color: "#7F1D1D",
    marginTop: 2,
    lineHeight: 15,
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
  suggestionsSection: {
    marginTop: 16,
    paddingHorizontal: 16,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6D7B65",
    letterSpacing: 0.6,
    marginBottom: 8,
  },
  detailsLoadingRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingVertical: 8,
  },
  detailsLoadingText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: "600",
  },
  emptyStateContainer: {
    paddingVertical: 20,
    alignItems: "center",
  },
  emptyStateText: {
    fontSize: 13,
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
