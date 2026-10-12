// mobile-app/src/types/driver.types.ts

export type DriverAvailabilityStatus = "ONLINE" | "OFFLINE" | "BUSY";

export type RideLifecycleStatus =
  | "IDLE"
  | "REQUEST_OFFERED"
  | "ACCEPTED"
  | "DRIVING_TO_PICKUP"
  | "ARRIVED_AT_PICKUP"
  | "TRIP_ACTIVE"
  | "TRIP_COMPLETED"
  | "CANCELLED";

export interface RideRequestOffer {
  id: string;
  passengerName: string;
  passengerRating: number;
  passengerTrips: number;
  passengerPhone: string;
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
  rideMode: "Personal" | "Shared";
  vehicleType: string;
  estimatedFare: number;
  driverEarnings: number;
  otp: string;
  expiresInSeconds: number;
}

export interface DriverEarningsSummary {
  todayEarnings: number;
  todayTrips: number;
  onlineHours: string;
  acceptanceRate: string;
}

export interface DriverActiveRideState {
  lifecycleStatus: RideLifecycleStatus;
  activeOffer: RideRequestOffer | null;
  driverLocation: {
    latitude: number;
    longitude: number;
  };
  startedAt?: string;
  completedAt?: string;
}
