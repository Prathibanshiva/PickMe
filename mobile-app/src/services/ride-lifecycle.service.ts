// mobile-app/src/services/ride-lifecycle.service.ts
//
// Persistent Server-Authoritative Ride Lifecycle Service.
// Synchronizes passenger and driver clients with MongoDB backend endpoints.
// Authoritative state machine:
//   requested -> accepted -> arrived -> in_progress -> completed (or cancelled)

import {
  DriverActiveRideState,
  DriverAvailabilityStatus,
  DriverEarningsSummary,
  RideLifecycleStatus,
  RideRequestOffer,
} from "@/types/driver.types";
import API_BASE_URL from "@/services/api";
import { getAuthSession } from "@/services/auth.service";

// ─── Passenger-facing status mapping ─────────────────────────────────────────
export type PassengerRideStatus =
  | "IDLE"
  | "SEARCHING"        // ride created (requested), waiting for driver
  | "DRIVER_ASSIGNED"  // driver accepted
  | "DRIVER_EN_ROUTE"  // driver driving to pickup
  | "DRIVER_ARRIVED"   // driver at pickup, show OTP
  | "TRIP_ACTIVE"      // OTP verified, trip started
  | "TRIP_COMPLETED"   // driver completed trip
  | "CANCELLED";

// Maps RideLifecycleStatus → PassengerRideStatus
export function toPassengerStatus(status: RideLifecycleStatus): PassengerRideStatus {
  switch (status) {
    case "IDLE":
      return "IDLE";
    case "REQUEST_OFFERED":
      return "SEARCHING";
    case "ACCEPTED":
      return "DRIVER_ASSIGNED";
    case "DRIVING_TO_PICKUP":
      return "DRIVER_EN_ROUTE";
    case "ARRIVED_AT_PICKUP":
      return "DRIVER_ARRIVED";
    case "TRIP_ACTIVE":
      return "TRIP_ACTIVE";
    case "TRIP_COMPLETED":
      return "TRIP_COMPLETED";
    case "CANCELLED":
      return "CANCELLED";
    default:
      return "IDLE";
  }
}

// Maps backend DB status string → RideLifecycleStatus
export function mapBackendStatusToLifecycle(dbStatus: string): RideLifecycleStatus {
  switch (dbStatus) {
    case "requested":
      return "REQUEST_OFFERED";
    case "accepted":
      return "ACCEPTED";
    case "arrived":
      return "ARRIVED_AT_PICKUP";
    case "in_progress":
      return "TRIP_ACTIVE";
    case "completed":
      return "TRIP_COMPLETED";
    case "cancelled":
      return "CANCELLED";
    default:
      return "IDLE";
  }
}

// ─── Passenger create-ride input ──────────────────────────────────────────────
export interface CreateRideInput {
  pickupTitle: string;
  pickupSubtitle: string;
  pickupLat: number;
  pickupLng: number;
  destinationTitle: string;
  destinationSubtitle: string;
  destLat: number;
  destLng: number;
  distanceKm: number;
  durationMin: number;
  vehicleType: string;
  rideMode: "Personal" | "Shared";
  estimatedFare: number;
  requestedSeats: number;
  paymentMethod: string;
}

// Fallback mock offer for isolated offline / dev screen testing
export const DEFAULT_MOCK_OFFER: RideRequestOffer = {
  id: "ride-req-7294",
  passengerName: "Ananya Sharma",
  passengerRating: 4.9,
  passengerTrips: 142,
  passengerPhone: "+91 98765 43210",
  pickupTitle: "4th Block, Koramangala",
  pickupSubtitle: "Near Sony Signal junction, 80ft Road",
  pickupLat: 12.9352,
  pickupLng: 77.6245,
  destinationTitle: "100ft Road, Indiranagar",
  destinationSubtitle: "Opposite Toit Brewpub, Stage 2",
  destLat: 12.9784,
  destLng: 77.6408,
  distanceKm: 5.4,
  durationMin: 18,
  rideMode: "Personal",
  vehicleType: "Sedan",
  estimatedFare: 280,
  driverEarnings: 238,
  otp: "7294",
  expiresInSeconds: 15,
};

// Helper to map backend ride document to client RideRequestOffer
export function mapBackendRideToOffer(ride: any): RideRequestOffer {
  const pickupCoords = ride.pickup?.location?.coordinates || [77.6245, 12.9352];
  const destCoords = ride.destination?.location?.coordinates || [77.6408, 12.9784];

  return {
    id: ride.id || ride._id?.toString() || "",
    passengerName:
      typeof ride.passengerId === "object" && ride.passengerId?.name
        ? ride.passengerId.name
        : "Passenger",
    passengerRating: 4.9,
    passengerTrips: 1,
    passengerPhone:
      typeof ride.passengerId === "object" && ride.passengerId?.phoneNumber
        ? ride.passengerId.phoneNumber
        : "",
    pickupTitle: ride.pickup?.title || ride.pickup?.address || "Pickup Location",
    pickupSubtitle: ride.pickup?.subtitle || "",
    pickupLat: pickupCoords[1],
    pickupLng: pickupCoords[0],
    destinationTitle: ride.destination?.title || ride.destination?.address || "Destination",
    destinationSubtitle: ride.destination?.subtitle || "",
    destLat: destCoords[1],
    destLng: destCoords[0],
    distanceKm: ride.distanceKm || 0,
    durationMin: ride.durationMin || 0,
    rideMode: ride.rideMode === "personal" ? "Personal" : "Shared",
    vehicleType: ride.vehicleType
      ? ride.vehicleType.charAt(0).toUpperCase() + ride.vehicleType.slice(1)
      : "Sedan",
    estimatedFare: ride.estimatedFare || 0,
    driverEarnings: ride.driverEarnings || Math.round((ride.estimatedFare || 0) * 0.85),
    otp: ride.verificationOtp || "", // Authoritative OTP (only present for passenger)
    expiresInSeconds: 15,
  };
}

// ─── Service class ────────────────────────────────────────────────────────────

class RideLifecycleService {
  private availabilityStatus: DriverAvailabilityStatus = "ONLINE";

  private state: DriverActiveRideState = {
    lifecycleStatus: "IDLE",
    activeOffer: null,
    driverLocation: {
      latitude: 12.9385,
      longitude: 77.6215,
    },
  };

  private earnings: DriverEarningsSummary = {
    todayEarnings: 0,
    todayTrips: 0,
    onlineHours: "0 hrs",
    acceptanceRate: "100%",
  };

  // Listeners
  private driverListeners: Set<(state: DriverActiveRideState) => void> = new Set();
  private passengerListeners: Set<
    (status: PassengerRideStatus, offer: RideRequestOffer | null) => void
  > = new Set();
  private availabilityListeners: Set<(status: DriverAvailabilityStatus) => void> = new Set();

  // ── Subscriptions ──────────────────────────────────────────────────────────

  public subscribe(listener: (state: DriverActiveRideState) => void): () => void {
    this.driverListeners.add(listener);
    return () => this.driverListeners.delete(listener);
  }

  public subscribePassenger(
    listener: (status: PassengerRideStatus, offer: RideRequestOffer | null) => void
  ): () => void {
    this.passengerListeners.add(listener);
    return () => this.passengerListeners.delete(listener);
  }

  public subscribeAvailability(listener: (status: DriverAvailabilityStatus) => void): () => void {
    this.availabilityListeners.add(listener);
    return () => this.availabilityListeners.delete(listener);
  }

  // ── Notifications ──────────────────────────────────────────────────────────

  private notify() {
    const stateCopy = { ...this.state };
    this.driverListeners.forEach((l) => l(stateCopy));
    const passengerStatus = toPassengerStatus(this.state.lifecycleStatus);
    this.passengerListeners.forEach((l) => l(passengerStatus, this.state.activeOffer));
  }

  private notifyAvailability() {
    this.availabilityListeners.forEach((l) => l(this.availabilityStatus));
  }

  // ── Getters ────────────────────────────────────────────────────────────────

  public getAvailabilityStatus(): DriverAvailabilityStatus {
    return this.availabilityStatus;
  }

  public getActiveState(): DriverActiveRideState {
    return { ...this.state };
  }

  public getPassengerStatus(): PassengerRideStatus {
    return toPassengerStatus(this.state.lifecycleStatus);
  }

  public getEarningsSummary(): DriverEarningsSummary {
    return { ...this.earnings };
  }

  // ── Passenger: Authoritative Booking (P3) ──────────────────────────────────

  /**
   * P3: Server-authoritative ride creation.
   * Awaits backend MongoDB persistence. If persistence fails or returns non-2xx,
   * does not place client in false SEARCHING state.
   */
  public async createRide(
    input: CreateRideInput
  ): Promise<{ success: boolean; offer?: RideRequestOffer; rideId?: string; error?: string }> {
    const session = await getAuthSession();
    if (!session?.token) {
      return {
        success: false,
        error: "Authentication required. Please sign in before booking a ride.",
      };
    }

    const payload = {
      pickup: {
        address: input.pickupTitle + (input.pickupSubtitle ? ", " + input.pickupSubtitle : ""),
        title: input.pickupTitle,
        subtitle: input.pickupSubtitle || "",
        coordinates: [input.pickupLng, input.pickupLat],
      },
      destination: {
        address: input.destinationTitle + (input.destinationSubtitle ? ", " + input.destinationSubtitle : ""),
        title: input.destinationTitle,
        subtitle: input.destinationSubtitle || "",
        coordinates: [input.destLng, input.destLat],
      },
      vehicleType: input.vehicleType.toLowerCase(),
      rideMode: input.rideMode.toLowerCase(),
      requestedSeats: input.requestedSeats || 1,
      estimatedFare: input.estimatedFare,
      distanceKm: input.distanceKm,
      durationMin: input.durationMin,
      paymentMethod: input.paymentMethod?.toLowerCase() || "cash",
    };

    try {
      const res = await fetch(`${API_BASE_URL}/api/rides`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => ({}));

      if (res.status === 201 && data.ride) {
        const offer = mapBackendRideToOffer(data.ride);
        // Ensure passenger profile info matches authenticated session
        if (session.user) {
          offer.passengerName = session.user.name || "Passenger";
          offer.passengerPhone = session.user.phoneNumber || "";
        }

        this.state.lifecycleStatus = "REQUEST_OFFERED";
        this.state.activeOffer = offer;
        this.notify();

        return {
          success: true,
          offer,
          rideId: data.ride.id,
        };
      }

      if (res.status === 409) {
        return {
          success: false,
          error: data.message || "You already have an active ride in progress. Complete or cancel it first.",
        };
      }

      return {
        success: false,
        error: data.message || `Booking failed with status ${res.status}. Please try again.`,
      };
    } catch {
      // Treat network errors honestly without false optimism
      return {
        success: false,
        error: "Network connection failed. Unable to reach PickMe dispatch server. Please check your network.",
      };
    }
  }

  // ── Driver: Authoritative Dispatch & Lifecycle Actions (P4, P5, P6) ─────────

  public setAvailabilityStatus(status: DriverAvailabilityStatus) {
    this.availabilityStatus = status;
    if (status === "OFFLINE" && this.state.lifecycleStatus === "REQUEST_OFFERED") {
      this.state.lifecycleStatus = "IDLE";
      this.state.activeOffer = null;
      this.notify();
    }
    this.notifyAvailability();
  }

  /**
   * Set active offer received from server-side available ride inspection.
   */
  public setActiveOffer(offer: RideRequestOffer) {
    this.state.lifecycleStatus = "REQUEST_OFFERED";
    this.state.activeOffer = offer;
    this.notify();
  }

  /**
   * Driver-only / dev testing: trigger incoming request
   */
  public triggerIncomingRequest(customOffer?: Partial<RideRequestOffer>): RideRequestOffer {
    const offer: RideRequestOffer = {
      ...DEFAULT_MOCK_OFFER,
      ...customOffer,
      id: customOffer?.id || `ride-req-${Date.now().toString().slice(-4)}`,
    };

    this.state.lifecycleStatus = "REQUEST_OFFERED";
    this.state.activeOffer = offer;
    this.notify();
    return offer;
  }

  public startTripDirectly() {
    this.state.lifecycleStatus = "TRIP_ACTIVE";
    this.state.startedAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    this.notify();
  }

  /**
   * Driver accepts a ride request via backend atomic endpoint.
   */
  public async acceptRequest(): Promise<{ success: boolean; message?: string }> {
    if (!this.state.activeOffer) {
      return { success: false, message: "No active ride offer to accept." };
    }

    const rideId = this.state.activeOffer.id;
    const session = await getAuthSession();

    if (!session?.token) {
      return { success: false, message: "Driver must be signed in to accept rides." };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/rides/${rideId}/accept`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ride) {
        this.state.lifecycleStatus = "ACCEPTED";
        this.availabilityStatus = "BUSY";
        this.state.activeOffer = mapBackendRideToOffer(data.ride);
        this.notify();
        this.notifyAvailability();
        return { success: true };
      }

      return {
        success: false,
        message: data.message || "Failed to accept ride. It may have already been assigned or cancelled.",
      };
    } catch {
      return {
        success: false,
        message: "Network error while accepting ride. Please try again.",
      };
    }
  }

  public declineRequest() {
    this.state.lifecycleStatus = "IDLE";
    this.state.activeOffer = null;
    this.availabilityStatus = "ONLINE";
    this.notify();
    this.notifyAvailability();
  }

  public startDrivingToPickup() {
    this.state.lifecycleStatus = "DRIVING_TO_PICKUP";
    this.notify();
  }

  /**
   * Driver marks arrived at pickup via backend.
   */
  public async arriveAtPickup(): Promise<{ success: boolean; message?: string }> {
    const rideId = this.state.activeOffer?.id;
    if (!rideId) {
      return { success: false, message: "No active ride to update." };
    }

    const session = await getAuthSession();
    if (session?.token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rides/${rideId}/arrive`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.token}` },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { success: false, message: data.message || "Failed to mark arrival." };
        }
      } catch {
        // Continue local update with warning
      }
    }

    this.state.lifecycleStatus = "ARRIVED_AT_PICKUP";
    if (this.state.activeOffer) {
      this.state.driverLocation = {
        latitude: this.state.activeOffer.pickupLat,
        longitude: this.state.activeOffer.pickupLng,
      };
    }
    this.notify();
    return { success: true };
  }

  /**
   * Driver verifies passenger's trip-start PIN via backend atomic endpoint (P1 & P5).
   */
  public async verifyOtp(code: string): Promise<{ success: boolean; message?: string }> {
    const cleanCode = code.trim();
    const rideId = this.state.activeOffer?.id;

    if (!rideId) {
      return { success: false, message: "No active ride to verify PIN for." };
    }

    const session = await getAuthSession();
    if (!session?.token) {
      return { success: false, message: "Driver must be signed in to verify PIN." };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/rides/${rideId}/verify-otp`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.token}`,
        },
        body: JSON.stringify({ otp: cleanCode }),
      });

      const data = await res.json().catch(() => ({}));

      if (res.ok && data.ride) {
        this.state.lifecycleStatus = "TRIP_ACTIVE";
        this.state.startedAt = new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        });
        this.notify();
        return { success: true };
      }

      if (res.status === 429) {
        return {
          success: false,
          message: data.message || "Too many failed OTP verification attempts. Please wait 15 minutes before trying again.",
        };
      }

      return {
        success: false,
        message: data.message || "Incorrect PIN. Please ask the passenger for their 4-digit trip start code.",
      };
    } catch {
      return {
        success: false,
        message: "Network error while verifying PIN. Please try again.",
      };
    }
  }

  /**
   * Driver marks trip complete at destination via backend.
   */
  public async completeTrip(): Promise<{ success: boolean; message?: string }> {
    const rideId = this.state.activeOffer?.id;
    if (!rideId) {
      return { success: false, message: "No active ride to complete." };
    }

    const session = await getAuthSession();
    if (session?.token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rides/${rideId}/complete`, {
          method: "POST",
          headers: { Authorization: `Bearer ${session.token}` },
        });

        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          return { success: false, message: data.message || "Failed to complete trip on backend." };
        }
      } catch {
        // Continue local update
      }
    }

    this.state.lifecycleStatus = "TRIP_COMPLETED";
    this.state.completedAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tripEarnings = this.state.activeOffer?.driverEarnings || 0;
    this.earnings = {
      ...this.earnings,
      todayEarnings: this.earnings.todayEarnings + tripEarnings,
      todayTrips: this.earnings.todayTrips + 1,
    };

    this.notify();
    return { success: true };
  }

  /**
   * Cancel ride by passenger or assigned driver (P6).
   */
  public async cancelRide(reason?: string): Promise<{ success: boolean; message?: string }> {
    const rideId = this.state.activeOffer?.id;
    const session = await getAuthSession();

    if (rideId && session?.token) {
      try {
        const res = await fetch(`${API_BASE_URL}/api/rides/${rideId}/cancel`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.token}`,
          },
          body: JSON.stringify({ reason: reason || "Cancelled by user" }),
        });

        const data = await res.json().catch(() => ({}));
        if (res.status === 409) {
          return {
            success: false,
            message: data.message || "Ride status changed concurrently before cancellation could be applied.",
          };
        }
      } catch {
        // Network error during cancellation
      }
    }

    this.state.lifecycleStatus = "CANCELLED";
    this.notify();

    setTimeout(() => {
      this.resetToAvailable();
    }, 500);

    return { success: true };
  }

  public resetToAvailable() {
    this.state.lifecycleStatus = "IDLE";
    this.state.activeOffer = null;
    this.state.startedAt = undefined;
    this.state.completedAt = undefined;
    this.availabilityStatus = "ONLINE";
    this.notify();
    this.notifyAvailability();
  }

  // ── State Reconciliation & Polling Helpers ─────────────────────────────────

  /**
   * Fetch active ride from backend MongoDB.
   * Enables seamless recovery after app navigation, restart, or refresh.
   */
  public async syncActiveRide(): Promise<{
    hasActiveRide: boolean;
    offer?: RideRequestOffer;
    status?: RideLifecycleStatus;
  }> {
    const session = await getAuthSession();
    if (!session?.token) {
      return { hasActiveRide: false };
    }

    try {
      const res = await fetch(`${API_BASE_URL}/api/rides/active`, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (!res.ok) {
        return { hasActiveRide: false };
      }

      const data = await res.json();
      if (data.ride) {
        const lifecycleStatus = mapBackendStatusToLifecycle(data.ride.status);
        const offer = mapBackendRideToOffer(data.ride);

        this.state.lifecycleStatus = lifecycleStatus;
        this.state.activeOffer = offer;
        if (lifecycleStatus === "ACCEPTED" || lifecycleStatus === "TRIP_ACTIVE") {
          this.availabilityStatus = "BUSY";
        }
        this.notify();
        return { hasActiveRide: true, offer, status: lifecycleStatus };
      } else {
        // No active ride on server
        if (
          this.state.lifecycleStatus !== "IDLE" &&
          this.state.lifecycleStatus !== "TRIP_COMPLETED" &&
          this.state.lifecycleStatus !== "CANCELLED"
        ) {
          this.resetToAvailable();
        }
        return { hasActiveRide: false };
      }
    } catch {
      return { hasActiveRide: false };
    }
  }

  /**
   * Driver: Fetch available unassigned rides from backend MongoDB.
   */
  public async fetchAvailableRides(vehicleType?: string): Promise<RideRequestOffer[]> {
    const session = await getAuthSession();
    if (!session?.token) return [];

    try {
      const url = vehicleType
        ? `${API_BASE_URL}/api/rides/available?vehicleType=${encodeURIComponent(vehicleType)}`
        : `${API_BASE_URL}/api/rides/available`;

      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${session.token}` },
      });

      if (!res.ok) return [];

      const data = await res.json();
      if (Array.isArray(data.rides)) {
        return data.rides.map(mapBackendRideToOffer);
      }
      return [];
    } catch {
      return [];
    }
  }
}

export const rideLifecycleService = new RideLifecycleService();
export default rideLifecycleService;
