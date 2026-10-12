// mobile-app/src/types/ride.types.ts

import { RideMode, VehicleType } from "@/constants/vehicles";

export interface LocationPoint {
  title: string;
  subtitle?: string;
  latitude: number;
  longitude: number;
  distanceKm?: number;
  placeId?: string;
}

export interface RideBookingDraft {
  pickup: LocationPoint;
  destination: LocationPoint;
  rideMode: RideMode; // Default "shared"
  selectedVehicle: VehicleType;
  requestedSeats: number; // For shared mode (1 .. capacity - 1)
  paymentMethod: "cash" | "card" | "upi";
  estimatedFare: number;
}

/**
 * Payload contract for future ride booking request API (POST /api/rides/request)
 */
export interface CreateRideRequestPayload {
  pickup: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  destination: {
    address: string;
    latitude?: number;
    longitude?: number;
  };
  rideMode: RideMode;
  vehicleType: VehicleType;
  // requestedSeats is required for shared; for personal mode it reflects the full vehicle allocation
  requestedSeats: number;
  paymentMethod: string;
}
