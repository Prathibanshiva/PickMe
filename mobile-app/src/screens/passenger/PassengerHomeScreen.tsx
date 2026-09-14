// mobile-app/src/screens/passenger/PassengerHomeScreen.tsx

import React, { useEffect, useState } from "react";
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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useAuth } from "@/store/auth.store";
import { Colors, Radius } from "@/theme";
import { LocationPoint } from "@/types/ride.types";
import {
  BENGALURU_FALLBACK_LOCATION,
  getCurrentPickupLocation,
} from "@/services/location.service";

export default function PassengerHomeScreen() {
  const { user, logout } = useAuth();
  const insets = useSafeAreaInsets();

  const [pickupLocation, setPickupLocation] = useState<LocationPoint>(
    BENGALURU_FALLBACK_LOCATION
  );
  const [activeTab, setActiveTab] = useState<"ride" | "schedule" | "activity" | "profile">("ride");
  const [pendingTabModal, setPendingTabModal] = useState<string | null>(null);

  // Fetch real GPS location on mount
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

  const handleOpenSearch = (initialQuery?: string) => {
    router.push({
      pathname: "/passenger/destination-search",
      params: initialQuery ? { initialQuery } : undefined,
    } as any);
  };

  const handleSelectRecent = (
    title: string,
    subtitle: string,
    latitude: number,
    longitude: number,
    distanceKm: number
  ) => {
    router.push({
      pathname: "/passenger/vehicle-selection",
      params: {
        pickupTitle: pickupLocation.title,
        pickupSubtitle: pickupLocation.subtitle || "",
        pickupLat: String(pickupLocation.latitude),
        pickupLng: String(pickupLocation.longitude),
        destinationTitle: title,
        destinationSubtitle: subtitle,
        destLat: String(latitude),
        destLng: String(longitude),
        distanceKm: String(distanceKm),
      },
    } as any);
  };

  const handleTabPress = (tab: "ride" | "schedule" | "activity" | "profile") => {
    if (tab === "ride") {
      setActiveTab("ride");
    } else {
      const tabNames: Record<string, string> = {
        schedule: "Schedule a Ride",
        activity: "Ride Activity & History",
        profile: "Passenger Profile",
      };
      setPendingTabModal(tabNames[tab]);
    }
  };

  const displayName = user?.name?.trim() || "Passenger";

  return (
    <View style={styles.root}>
      <View style={styles.container}>
        {/* Top Header strictly below Android status bar */}
        <View style={[styles.header, { paddingTop: Math.max(insets.top, 12) }]}>
          <View>
            <Text style={styles.brandTitle}>PickMe</Text>
            <Text style={styles.greetingText}>Hello, {displayName}</Text>
          </View>

          <View style={styles.headerRight}>
            <View style={styles.rolePill}>
              <Text style={styles.rolePillText}>Passenger</Text>
            </View>

            <TouchableOpacity
              style={styles.profileButton}
              activeOpacity={0.8}
              onPress={() => {
                logout();
              }}
              accessibilityLabel="Account menu"
            >
              <Ionicons name="log-out-outline" size={18} color="#6B7280" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollContent}
          contentContainerStyle={{ paddingBottom: insets.bottom + 90 }}
          showsVerticalScrollIndicator={false}
        >
          {/* Pickup location indicator (Real GPS or fallback) */}
          <TouchableOpacity
            style={styles.pickupPill}
            activeOpacity={0.8}
            onPress={() => handleOpenSearch()}
          >
            <View style={styles.pickupDot} />
            <Text style={styles.pickupAddress} numberOfLines={1}>
              {pickupLocation.title}
            </Text>
            <MaterialIcons name="my-location" size={16} color={Colors.primary} />
          </TouchableOpacity>

          {/* Destination Search Trigger */}
          <TouchableOpacity
            style={styles.searchBar}
            activeOpacity={0.85}
            onPress={() => handleOpenSearch()}
          >
            <View style={styles.searchIconBox}>
              <Ionicons name="search" size={20} color={Colors.primary} />
            </View>

            <View style={styles.searchTextColumn}>
              <Text style={styles.searchPlaceholder}>Where do you want to go?</Text>
              <Text style={styles.searchSubtext}>Search destination or pick on map</Text>
            </View>

            <View style={styles.searchArrow}>
              <Ionicons name="arrow-forward" size={18} color="#6B7280" />
            </View>
          </TouchableOpacity>

          {/* Quick Destination Chips */}
          <View style={styles.chipsRow}>
            <TouchableOpacity
              style={styles.chip}
              activeOpacity={0.7}
              onPress={() =>
                handleSelectRecent(
                  "Home",
                  "Indiranagar 100ft Road",
                  12.9784,
                  77.6408,
                  4.8
                )
              }
            >
              <MaterialIcons name="home" size={18} color={Colors.primary} />
              <Text style={styles.chipText}>Home</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chip}
              activeOpacity={0.7}
              onPress={() =>
                handleSelectRecent(
                  "Work",
                  "Ecospace Business Park",
                  12.926,
                  77.6833,
                  8.5
                )
              }
            >
              <MaterialIcons name="work" size={18} color={Colors.primary} />
              <Text style={styles.chipText}>Work</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.chip}
              activeOpacity={0.7}
              onPress={() =>
                handleSelectRecent(
                  "Favorites",
                  "MG Road Metro",
                  12.9756,
                  77.6066,
                  6.1
                )
              }
            >
              <MaterialIcons name="favorite" size={18} color="#E11D48" />
              <Text style={styles.chipText}>Favorites</Text>
            </TouchableOpacity>
          </View>

          {/* Ride Modes Introduction Card */}
          <View style={styles.rideModesCard}>
            <View style={styles.rideModesHeader}>
              <MaterialIcons name="electric-car" size={22} color={Colors.primary} />
              <Text style={styles.rideModesTitle}>Two Ways to Ride</Text>
            </View>

            {/* Shared Ride Highlight */}
            <TouchableOpacity
              style={styles.modeHighlightItem}
              activeOpacity={0.8}
              onPress={() => handleOpenSearch()}
            >
              <View style={styles.modeIconCircle}>
                <MaterialIcons name="group" size={18} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.modeItemTitle}>Shared Ride</Text>
                  <View style={styles.sharedBadge}>
                    <Text style={styles.sharedBadgeText}>Default · Save 30%</Text>
                  </View>
                </View>
                <Text style={styles.modeItemSubtitle}>
                  Occupancy-first matching with compatible passengers. Select 1 to vehicle capacity - 1 seats.
                </Text>
              </View>
            </TouchableOpacity>

            {/* Personal Ride Highlight */}
            <TouchableOpacity
              style={styles.modeHighlightItem}
              activeOpacity={0.8}
              onPress={() => handleOpenSearch()}
            >
              <View style={styles.modeIconCircle}>
                <Ionicons name="person" size={16} color={Colors.text.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                  <Text style={styles.modeItemTitle}>Personal Ride</Text>
                  <View style={styles.personalBadge}>
                    <Text style={styles.personalBadgeText}>Exclusive</Text>
                  </View>
                </View>
                <Text style={styles.modeItemSubtitle}>
                  Entire vehicle exclusively allocated to you. Direct route with no stops. Bike available.
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Recent Destinations Shortcut */}
          <View style={styles.recentSection}>
            <View style={styles.recentHeaderRow}>
              <Text style={styles.recentHeaderTitle}>RECENT PLACES</Text>
              <TouchableOpacity activeOpacity={0.7} onPress={() => handleOpenSearch()}>
                <Text style={styles.viewAllText}>View all</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.recentItem}
              activeOpacity={0.7}
              onPress={() =>
                handleSelectRecent(
                  "Oil Mill Road",
                  "Kammanahalli, Bengaluru, Karnataka",
                  13.0082,
                  77.6321,
                  7.2
                )
              }
            >
              <View style={styles.recentIconBox}>
                <MaterialIcons name="history" size={18} color="#6B7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentItemTitle}>Oil Mill Road</Text>
                <Text style={styles.recentItemSubtitle}>Kammanahalli, Bengaluru</Text>
              </View>
              <Text style={styles.recentDistance}>7.2 km</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.recentItem}
              activeOpacity={0.7}
              onPress={() =>
                handleSelectRecent(
                  "Jubilee Revival AG Church",
                  "Kacharakanahalli, Bengaluru",
                  13.0145,
                  77.6358,
                  5.8
                )
              }
            >
              <View style={styles.recentIconBox}>
                <MaterialIcons name="history" size={18} color="#6B7280" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.recentItemTitle}>Jubilee Revival AG Church</Text>
                <Text style={styles.recentItemSubtitle}>Kacharakanahalli, Bengaluru</Text>
              </View>
              <Text style={styles.recentDistance}>5.8 km</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Bottom Navigation Bar */}
        <View style={[styles.bottomNav, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => handleTabPress("ride")}
          >
            <View style={activeTab === "ride" ? styles.navIconActiveBox : undefined}>
              <MaterialIcons
                name="directions-car"
                size={22}
                color={activeTab === "ride" ? Colors.primary : "#6B7280"}
              />
            </View>
            <Text style={activeTab === "ride" ? styles.navLabelActive : styles.navLabelInactive}>
              Ride
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => handleTabPress("schedule")}
          >
            <MaterialIcons name="calendar-today" size={22} color="#6B7280" />
            <Text style={styles.navLabelInactive}>Schedule</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => handleTabPress("activity")}
          >
            <MaterialIcons name="receipt-long" size={22} color="#6B7280" />
            <Text style={styles.navLabelInactive}>Activity</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            activeOpacity={0.8}
            onPress={() => handleTabPress("profile")}
          >
            <Ionicons name="person-outline" size={22} color="#6B7280" />
            <Text style={styles.navLabelInactive}>Profile</Text>
          </TouchableOpacity>
        </View>

        {/* Informative Modal for Tabs Planned for Future Tasks */}
        <Modal
          animationType="fade"
          transparent
          visible={Boolean(pendingTabModal)}
          onRequestClose={() => setPendingTabModal(null)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modalCard}>
              <View style={styles.modalIconBox}>
                <MaterialIcons name="schedule" size={26} color={Colors.primary} />
              </View>
              <Text style={styles.modalTitle}>{pendingTabModal}</Text>
              <Text style={styles.modalDesc}>
                This section is planned for an upcoming dedicated task according to the project roadmap.
              </Text>
              <TouchableOpacity
                style={styles.modalButton}
                activeOpacity={0.85}
                onPress={() => setPendingTabModal(null)}
              >
                <Text style={styles.modalButtonText}>Close</Text>
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
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F3FF",
    zIndex: 999,
    elevation: 8,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: "900",
    color: Colors.primary,
    letterSpacing: -0.5,
  },
  greetingText: {
    fontSize: 13,
    color: Colors.text.secondary,
    fontWeight: "500",
  },
  headerRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  rolePill: {
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.pill,
    borderWidth: 1,
    borderColor: "#E1E8FD",
  },
  rolePillText: {
    fontSize: 11,
    fontWeight: "700",
    color: "#0D6E00",
    textTransform: "uppercase",
  },
  profileButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F1F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  scrollContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  pickupPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  pickupDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  pickupAddress: {
    flex: 1,
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: 14,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    marginBottom: 14,
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  searchIconBox: {
    width: 42,
    height: 42,
    borderRadius: Radius.lg,
    backgroundColor: "rgba(31, 198, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  searchTextColumn: {
    flex: 1,
  },
  searchPlaceholder: {
    fontSize: 15,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  searchSubtext: {
    fontSize: 11,
    color: Colors.text.secondary,
    marginTop: 2,
  },
  searchArrow: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  chipsRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 18,
  },
  chip: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#FFFFFF",
    paddingVertical: 10,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  rideModesCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 18,
  },
  rideModesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  rideModesTitle: {
    fontSize: 15,
    fontWeight: "800",
    color: Colors.text.primary,
  },
  modeHighlightItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F3FF",
  },
  modeIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#F1F3FF",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 2,
  },
  modeItemTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: Colors.text.primary,
  },
  sharedBadge: {
    backgroundColor: "rgba(31, 198, 0, 0.15)",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
  },
  sharedBadgeText: {
    fontSize: 10,
    fontWeight: "800",
    color: "#064B00",
  },
  personalBadge: {
    backgroundColor: "#F1F3FF",
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#DCE2F7",
  },
  personalBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: Colors.text.secondary,
  },
  modeItemSubtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
    lineHeight: 15,
    marginTop: 2,
  },
  recentSection: {
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.xl,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },
  recentHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  recentHeaderTitle: {
    fontSize: 11,
    fontWeight: "800",
    color: "#6D7B65",
    letterSpacing: 0.5,
  },
  viewAllText: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.primary,
  },
  recentItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#F1F3FF",
    gap: 10,
  },
  recentIconBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#F1F3FF",
    alignItems: "center",
    justifyContent: "center",
  },
  recentItemTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: Colors.text.primary,
  },
  recentItemSubtitle: {
    fontSize: 11,
    color: Colors.text.secondary,
  },
  recentDistance: {
    fontSize: 11,
    fontWeight: "600",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 320,
    backgroundColor: "#FFFFFF",
    borderRadius: Radius.lg,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: "rgba(31, 198, 0, 0.12)",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: Colors.text.primary,
    marginBottom: 6,
    textAlign: "center",
  },
  modalDesc: {
    fontSize: 12,
    color: Colors.text.secondary,
    textAlign: "center",
    lineHeight: 17,
    marginBottom: 16,
  },
  modalButton: {
    backgroundColor: Colors.text.primary,
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: Radius.pill,
  },
  modalButtonText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontWeight: "700",
  },
});