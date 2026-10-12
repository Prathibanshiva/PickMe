// mobile-app/src/services/ride-lifecycle.service.ts
//
// Shared development mock ride lifecycle.
// Both passenger screens and driver screens subscribe to the SAME singleton.
// Passenger calls createRide() → driver sees REQUEST_OFFERED → driver calls
// acceptRequest() → passenger sees ACCEPTED, etc.
//
// Architecture:
//   MockRideSession (singleton)
//     ├── activeOffer      (RideRequestOffer | null)
//     ├── lifecycleStatus  (RideLifecycleStatus)
//     ├── driver listeners (Set)
//     └── passenger listeners (Set)

import {
  DriverActiveRideState,
  DriverAvailabilityStatus,
  DriverEarningsSummary,
  RideLifecycleStatus,
  RideRequestOffer,
} from "@/types/driver.types";

// ─── Passenger-facing status mapping ─────────────────────────────────────────
// Maps the shared RideLifecycleStatus to what the passenger cares about.

export type PassengerRideStatus =
  | "IDLE"
  | "SEARCHING"        // ride created, waiting for driver
  | "DRIVER_ASSIGNED"  // driver accepted
  | "DRIVER_EN_ROUTE"  // driver driving to pickup
  | "DRIVER_ARRIVED"   // driver at pickup, show OTP
  | "TRIP_ACTIVE"      // OTP verified, trip started
  | "TRIP_COMPLETED"   // driver completed trip
  | "CANCELLED";

// Maps RideLifecycleStatus → PassengerRideStatus
function toPassengerStatus(status: RideLifecycleStatus): PassengerRideStatus {
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

// ─── Default mock offer (used as fallback when driver opens incoming-request
//     directly without a passenger session, e.g. during driver-only testing) ──
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
  driverEarnings: 238, // 85% net payout
  otp: "7294",
  expiresInSeconds: 15,
};

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

// ─── Service class ────────────────────────────────────────────────────────────

class RideLifecycleService {
  private availabilityStatus: DriverAvailabilityStatus = "ONLINE";

  private state: DriverActiveRideState = {
    lifecycleStatus: "IDLE",
    activeOffer: null,
    driverLocation: {
      latitude: 12.9385,
      longitude: 77.6215, // ~1.2 km from Koramangala pickup
    },
  };

  private earnings: DriverEarningsSummary = {
    todayEarnings: 1480,
    todayTrips: 6,
    onlineHours: "4.5 hrs",
    acceptanceRate: "98%",
  };

  // Driver-side listeners (subscribe to full DriverActiveRideState)
  private driverListeners: Set<(state: DriverActiveRideState) => void> = new Set();

  // Passenger-side listeners (subscribe to PassengerRideStatus + current offer)
  private passengerListeners: Set<
    (status: PassengerRideStatus, offer: RideRequestOffer | null) => void
  > = new Set();

  private availabilityListeners: Set<(status: DriverAvailabilityStatus) => void> = new Set();

  // ── Subscribe ─────────────────────────────────────────────────────────────

  /** Driver screens subscribe here to react to lifecycle state changes. */
  public subscribe(listener: (state: DriverActiveRideState) => void): () => void {
    this.driverListeners.add(listener);
    return () => this.driverListeners.delete(listener);
  }

  /** Passenger screens subscribe here to react to ride status changes. */
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

  // ── Notify ────────────────────────────────────────────────────────────────

  private notify() {
    const stateCopy = { ...this.state };
    this.driverListeners.forEach((l) => l(stateCopy));
    const passengerStatus = toPassengerStatus(this.state.lifecycleStatus);
    this.passengerListeners.forEach((l) => l(passengerStatus, this.state.activeOffer));
  }

  private notifyAvailability() {
    this.availabilityListeners.forEach((l) => l(this.availabilityStatus));
  }

  // ── Getters ───────────────────────────────────────────────────────────────

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

  // ── Passenger-initiated transition ────────────────────────────────────────

  /**
   * Called by the passenger when they confirm a booking.
   * Creates the shared ride offer using passenger-provided data, sets
   * lifecycleStatus to REQUEST_OFFERED so the driver side can see it.
   */
  public createRide(input: CreateRideInput): RideRequestOffer {
    const offer: RideRequestOffer = {
      id: `ride-${Date.now().toString().slice(-6)}`,
      // Passenger info (static for dev)
      passengerName: "Ananya Sharma",
      passengerRating: 4.9,
      passengerTrips: 142,
      passengerPhone: "+91 98765 43210",
      // Passenger-selected locations
      pickupTitle: input.pickupTitle,
      pickupSubtitle: input.pickupSubtitle,
      pickupLat: input.pickupLat,
      pickupLng: input.pickupLng,
      destinationTitle: input.destinationTitle,
      destinationSubtitle: input.destinationSubtitle,
      destLat: input.destLat,
      destLng: input.destLng,
      // Ride parameters
      distanceKm: input.distanceKm,
      durationMin: input.durationMin,
      rideMode: input.rideMode,
      vehicleType: input.vehicleType,
      estimatedFare: input.estimatedFare,
      driverEarnings: Math.round(input.estimatedFare * 0.85),
      // OTP — owned by the session, shown to passenger and verified by driver
      otp: "7294",
      expiresInSeconds: 15,
    };

    this.state.lifecycleStatus = "REQUEST_OFFERED";
    this.state.activeOffer = offer;
    this.notify();
    return offer;
  }

  // ── Driver-initiated transitions ─────────────────────────────────────────

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
   * Driver-only: simulate/trigger an incoming request without a passenger
   * session (used when testing the driver flow independently).
   */
  public triggerIncomingRequest(customOffer?: Partial<RideRequestOffer>): RideRequestOffer {
    const offer: RideRequestOffer = {
      ...DEFAULT_MOCK_OFFER,
      ...customOffer,
      id: `ride-req-${Date.now().toString().slice(-4)}`,
    };

    this.state.lifecycleStatus = "REQUEST_OFFERED";
    this.state.activeOffer = offer;
    this.notify();
    return offer;
  }

  public acceptRequest(): boolean {
    if (!this.state.activeOffer) return false;
    this.state.lifecycleStatus = "ACCEPTED";
    this.availabilityStatus = "BUSY";
    this.notify();
    this.notifyAvailability();
    return true;
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

  public arriveAtPickup() {
    this.state.lifecycleStatus = "ARRIVED_AT_PICKUP";
    if (this.state.activeOffer) {
      this.state.driverLocation = {
        latitude: this.state.activeOffer.pickupLat,
        longitude: this.state.activeOffer.pickupLng,
      };
    }
    this.notify();
  }

  public verifyOtp(code: string): { success: boolean; message?: string } {
    const currentOtp = this.state.activeOffer?.otp || DEFAULT_MOCK_OFFER.otp;
    const cleanCode = code.trim();

    if (cleanCode === currentOtp) {
      this.state.lifecycleStatus = "TRIP_ACTIVE";
      this.state.startedAt = new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      });
      this.notify();
      return { success: true };
    }

    return {
      success: false,
      message: `Invalid OTP. Enter the 4-digit PIN provided by ${
        this.state.activeOffer?.passengerName || "passenger"
      } (${currentOtp}).`,
    };
  }

  public startTripDirectly() {
    this.state.lifecycleStatus = "TRIP_ACTIVE";
    this.state.startedAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
    this.notify();
  }

  public completeTrip() {
    this.state.lifecycleStatus = "TRIP_COMPLETED";
    this.state.completedAt = new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });

    const tripEarnings =
      this.state.activeOffer?.driverEarnings || DEFAULT_MOCK_OFFER.driverEarnings;
    this.earnings = {
      ...this.earnings,
      todayEarnings: this.earnings.todayEarnings + tripEarnings,
      todayTrips: this.earnings.todayTrips + 1,
    };

    this.notify();
  }

  public cancelRide() {
    this.state.lifecycleStatus = "CANCELLED";
    this.notify();
    // Reset after brief delay so passenger can see cancelled state
    setTimeout(() => {
      this.resetToAvailable();
    }, 500);
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
}

export const rideLifecycleService = new RideLifecycleService();
export default rideLifecycleService;
