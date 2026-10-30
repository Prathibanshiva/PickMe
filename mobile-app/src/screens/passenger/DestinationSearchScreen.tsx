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
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PassengerMapPreview from "@/components/passenger/PassengerMapPreview";
import { LocationPoint } from "@/types/ride.types";
import { Colors, Radius } from "@/theme";
import {
  BENGALURU_FALLBACK_LOCATION,
  getCurrentPickupLocation,
  getPlaceDetails,
  PlacePrediction,
  reverseGeocodeCoordinates,
  searchPlaces,
} from "@/services/location.service";

/** Creates a UUID v4 session token for Google Places Autocomplete grouping. */
function createSessionToken(): string {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Calculates spherical distance in kilometers between two coordinates. */
function calculateDistanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const d = R * c;
  return Math.round(d * 10) / 10;
}

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
  const searchParams = useLocalSearchParams<{ initialQuery?: string; mode?: string }>();

  // State: Structured Pickup Location
  const [pickupLocation, setPickupLocation] = useState<LocationPoint>(
    BENGALURU_FALLBACK_LOCATION
  );
  const [isPickupLoading, setIsPickupLoading] = useState(true);
  const [pickupError, setPickupError] = useState<string | null>(null);
  const [isEditingPickup, setIsEditingPickup] = useState(searchParams.mode === "pickup");
  const [isReverseGeocodingPickup, setIsReverseGeocodingPickup] = useState(false);

  // State: Places Search
  const [searchQuery, setSearchQuery] = useState(searchParams.initialQuery || "");
  const [isSearching, setIsSearching] = useState(false);
  const [placePredictions, setPlacePredictions] = useState<PlacePrediction[]>([]);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [isNotConfigured, setIsNotConfigured] = useState(false);
  const [resolvingPlaceId, setResolvingPlaceId] = useState<string | null>(null);

  // Google Places Session Token & Debounce Timer
  const sessionTokenRef = useRef<string>(createSessionToken());
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // State: Stitch Recent Destinations
  const [recentList, setRecentList] = useState<LocationPoint[]>(RECENT_DESTINATIONS);

  // On mount: Fetch actual GPS location for pickup
  useEffect(() => {
    let isMounted = true;
    (async () => {
      setIsPickupLoading(true);
      const res = await getCurrentPickupLocation();
      if (!isMounted) return;
      setIsPickupLoading(false);

      if (res.status === "ok") {
        setPickupLocation(res.location);
        setPickupError(null);
      } else if (res.status === "permission_denied") {
        setPickupError("Location permission denied. Move map to position pickup pin.");
        setIsEditingPickup(true);
      } else if (res.status === "timeout") {
        setPickupError("GPS timed out. Move map to position pickup pin.");
        setIsEditingPickup(true);
      } else {
        setPickupError("GPS unavailable. Move map to position pickup pin.");
        setIsEditingPickup(true);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  // Live Google Places Autocomplete Search with 300ms Debounce
  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    const query = searchQuery.trim();
    if (query.length < 2) {
      setPlacePredictions([]);
      setIsSearching(false);
      setSearchError(null);
      return;
    }

    setIsSearching(true);
    setSearchError(null);

    debounceTimerRef.current = setTimeout(async () => {
      const res = await searchPlaces(query, {
        sessiontoken: sessionTokenRef.current,
        lat: pickupLocation.latitude,
        lng: pickupLocation.longitude,
      });

      setIsSearching(false);

      if (res.status === "ok") {
        setPlacePredictions(res.predictions);
        setIsNotConfigured(false);
        setSearchError(null);
      } else if (res.status === "not_configured") {
        setIsNotConfigured(true);
        setPlacePredictions([]);
        setSearchError(
          "Google Places API is not configured on the backend. Please configure GOOGLE_MAPS_SERVER_API_KEY."
        );
      } else {
        setSearchError(res.message);
        setPlacePredictions([]);
      }
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchQuery, pickupLocation.latitude, pickupLocation.longitude]);

  // Handle Pickup Adjustment via Interactive Map
  const handlePickupChange = async (coords: {
    latitude: number;
    longitude: number;
  }) => {
    setIsReverseGeocodingPickup(true);
    const geocoded = await reverseGeocodeCoordinates(
      coords.latitude,
      coords.longitude
    );
    setIsReverseGeocodingPickup(false);
    setPickupLocation({
      title: geocoded.title,
      subtitle: geocoded.subtitle,
      latitude: coords.latitude,
      longitude: coords.longitude,
    });
    setPickupError(null);
  };

  // Explicit Confirm Pickup Action
  const handleConfirmPickup = () => {
    setIsEditingPickup(false);
    setPickupError(null);
    setSearchQuery("");
    setPlacePredictions([]);
  };

  // Back Navigation Handler
  const handleGoBack = () => {
    if (router.canGoBack()) {
      router.back();
    } else {
      router.replace("/");
    }
  };

  // Handle Selection of a Place Prediction (resolves geometry via server-side Place Details proxy)
  const handleSelectPrediction = async (pred: PlacePrediction) => {
    setResolvingPlaceId(pred.placeId);
    const res = await getPlaceDetails(pred.placeId, sessionTokenRef.current);
    setResolvingPlaceId(null);

    // Refresh session token for subsequent searches (closes billing session)
    sessionTokenRef.current = createSessionToken();

    if (res.status === "ok") {
      if (isEditingPickup) {
        // Resolved selected pickup place
        setPickupLocation(res.details);
        setIsEditingPickup(false);
        setPickupError(null);
        setSearchQuery("");
        setPlacePredictions([]);
      } else {
        // Resolved destination
        const dist = calculateDistanceKm(
          pickupLocation.latitude,
          pickupLocation.longitude,
          res.details.latitude,
          res.details.longitude
        );
        handleSelectDestination({
          ...res.details,
          distanceKm: dist,
        });
      }
    } else if (res.status === "not_configured") {
      setIsNotConfigured(true);
      setSearchError("Google Places API is not configured on the backend.");
    } else {
      setSearchError(res.message || "Could not resolve coordinates for this place.");
    }
  };

  // Select a destination and navigate to Vehicle Selection with structured coordinates
  const handleSelectDestination = (dest: LocationPoint) => {
    const dist =
      dest.distanceKm ??
      calculateDistanceKm(
        pickupLocation.latitude,
        pickupLocation.longitude,
        dest.latitude,
        dest.longitude
      );

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
        distanceKm: String(dist),
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
          {/* Google Maps Preview with Center-Pin Pickup Adjustment */}
          <PassengerMapPreview
            mode="search"
            height={isEditingPickup ? 260 : 210}
            pickupCoords={pickupLocation}
            isInteractivePickup={isEditingPickup}
            onPickupChange={handlePickupChange}
          />

          {/* Confirm Pickup Action Bar (displayed whenever user is in interactive pickup mode) */}
          {isEditingPickup && (
            <View style={styles.confirmPickupBar}>
              <View style={styles.confirmPickupInfo}>
                <View style={styles.confirmPickupDot} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.confirmPickupAddress} numberOfLines={1}>
                    {isReverseGeocodingPickup
                      ? "Resolving location..."
                      : pickupLocation.title}
                  </Text>
                  {pickupLocation.subtitle ? (
                    <Text style={styles.confirmPickupSubtitle} numberOfLines={1}>
                      {pickupLocation.subtitle}
                    </Text>
                  ) : null}
                </View>
                {isReverseGeocodingPickup && (
                  <ActivityIndicator size="small" color={Colors.primary} />
                )}
              </View>

              <TouchableOpacity
                style={styles.confirmPickupButton}
                activeOpacity={0.85}
                onPress={handleConfirmPickup}
                disabled={isReverseGeocodingPickup}
              >
                <Ionicons name="checkmark-circle" size={18} color="#FFFFFF" />
                <Text style={styles.confirmPickupButtonText}>Confirm Pickup Location</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Search Input Panel */}
          <View style={styles.searchPanel}>
            <View style={styles.inputContainer}>
              <View style={styles.searchIconBox}>
                {isSearching ? (
                  <ActivityIndicator size="small" color={Colors.primary} />
                ) : (
                  <Ionicons name="search" size={18} color={Colors.primary} />
                )}
              </View>

              <TextInput
                style={styles.searchInput}
                placeholder={
                  isEditingPickup
                    ? "Search pickup address or move map pin..."
                    : "Where do you want to go?"
                }
                placeholderTextColor="#9CA3AF"
                value={searchQuery}
                onChangeText={setSearchQuery}
                returnKeyType="search"
                autoFocus={false}
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

            {/* Error Banner when Places proxy or Google API fails / 503 missing key */}
            {searchError ? (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={18} color="#DC2626" />
                <View style={{ flex: 1 }}>
                  <Text style={styles.errorBannerTitle}>
                    {isNotConfigured ? "Maps Key Required" : "Places Search Notice"}
                  </Text>
                  <Text style={styles.errorBannerText}>{searchError}</Text>
                </View>
              </View>
            ) : null}

            {/* Quick Filter Chips (Stitch Aesthetic) */}
            {!isEditingPickup && (
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
            )}
          </View>

          {/* Search Results / Places Predictions */}
          {searchQuery.trim().length >= 2 ? (
            <View style={styles.suggestionsSection}>
              <Text style={styles.sectionHeaderTitle}>
                {isEditingPickup ? "PICKUP SUGGESTIONS" : "GOOGLE PLACES RESULTS"}
              </Text>

              {placePredictions.map((pred) => (
                <TouchableOpacity
                  key={pred.placeId}
                  style={styles.destinationRow}
                  activeOpacity={0.7}
                  onPress={() => handleSelectPrediction(pred)}
                  disabled={resolvingPlaceId === pred.placeId}
                >
                  <View style={styles.destinationIconCircle}>
                    <Ionicons
                      name={isEditingPickup ? "navigate" : "location-sharp"}
                      size={18}
                      color={Colors.primary}
                    />
                  </View>

                  <View style={styles.destinationInfoColumn}>
                    <Text style={styles.destinationTitle} numberOfLines={1}>
                      {pred.title}
                    </Text>
                    <Text style={styles.destinationSubtitle} numberOfLines={1}>
                      {pred.subtitle || pred.description}
                    </Text>
                  </View>

                  {resolvingPlaceId === pred.placeId ? (
                    <ActivityIndicator size="small" color={Colors.primary} />
                  ) : (
                    <MaterialIcons
                      name="chevron-right"
                      size={20}
                      color={Colors.text.secondary}
                    />
                  )}
                </TouchableOpacity>
              ))}

              {!isSearching && placePredictions.length === 0 && !searchError && (
                <View style={styles.emptyStateContainer}>
                  <MaterialIcons
                    name="search-off"
                    size={32}
                    color={Colors.text.secondary}
                    style={{ marginBottom: 8 }}
                  />
                  <Text style={styles.emptyStateText}>
                    No places found for "{searchQuery}"
                  </Text>
                  <Text
                    style={[
                      styles.emptyStateText,
                      { marginTop: 4, fontSize: 12, color: Colors.text.secondary },
                    ]}
                  >
                    Try searching by locality, street name, or landmark.
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
  confirmPickupBar: {
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
  },
  confirmPickupInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  confirmPickupDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0D6E00",
  },
  confirmPickupAddress: {
    fontSize: 13,
    fontWeight: "700",
    color: "#064B00",
  },
  confirmPickupSubtitle: {
    fontSize: 11,
    color: "#166534",
    marginTop: 2,
  },
  confirmPickupButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: "#0D6E00",
    paddingVertical: 11,
    borderRadius: Radius.lg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  confirmPickupButtonText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: 0.3,
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
