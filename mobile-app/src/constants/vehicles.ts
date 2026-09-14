// mobile-app/src/constants/vehicles.ts

/**
 * CANONICAL VEHICLE CAPACITIES — SINGLE SOURCE OF TRUTH
 *
 * Driver is NOT counted in these passenger capacities.
 *
 * Bike = 1
 * Auto = 3
 * Car = 4
 * Sedan = 4
 * SUV = 6
 */

export type VehicleType = "bike" | "auto" | "car" | "sedan" | "suv";
export type RideMode = "shared" | "personal";

export const CANONICAL_VEHICLE_CAPACITIES: Record<VehicleType, number> = {
  bike: 1,
  auto: 3,
  car: 4,
  sedan: 4,
  suv: 6,
};

export interface VehicleDefinition {
  type: VehicleType;
  label: string;
  capacity: number; // Canonical passenger capacity (driver excluded)
  tagline: string;
  etaText: string;
  isRecommended?: boolean;
  // UI Display fare estimates from Stitch reference design (provisional until backend pricing engine)
  stitchSharedFarePerSeat: number;
  stitchPersonalFare: number;
}

export const VEHICLE_DEFINITIONS: Record<VehicleType, VehicleDefinition> = {
  bike: {
    type: "bike",
    label: "Bike",
    capacity: CANONICAL_VEHICLE_CAPACITIES.bike,
    tagline: "Fastest through traffic",
    etaText: "1 min",
    stitchSharedFarePerSeat: 50,
    stitchPersonalFare: 75,
  },
  auto: {
    type: "auto",
    label: "Auto",
    capacity: CANONICAL_VEHICLE_CAPACITIES.auto,
    tagline: "Affordable & breezy",
    etaText: "3 min",
    stitchSharedFarePerSeat: 95,
    stitchPersonalFare: 140,
  },
  car: {
    type: "car",
    label: "Car",
    capacity: CANONICAL_VEHICLE_CAPACITIES.car,
    tagline: "Compact, budget-friendly AC",
    etaText: "3 min",
    stitchSharedFarePerSeat: 145,
    stitchPersonalFare: 210,
  },
  sedan: {
    type: "sedan",
    label: "Sedan",
    capacity: CANONICAL_VEHICLE_CAPACITIES.sedan,
    tagline: "Comfortable top-rated rides",
    etaText: "4 min",
    isRecommended: true,
    stitchSharedFarePerSeat: 195,
    stitchPersonalFare: 280,
  },
  suv: {
    type: "suv",
    label: "SUV",
    capacity: CANONICAL_VEHICLE_CAPACITIES.suv,
    tagline: "Spacious 6-seater · Extra luggage",
    etaText: "8 min",
    stitchSharedFarePerSeat: 260,
    stitchPersonalFare: 380,
  },
};

/**
 * Returns true if the vehicle type is available for the given mode.
 * Bike is strictly UNAVAILABLE for Shared Ride.
 */
export function isVehicleAvailableForMode(
  type: VehicleType,
  mode: RideMode
): boolean {
  if (mode === "shared") {
    return type !== "bike";
  }
  return true;
}

/**
 * Returns the maximum selectable seats for a given vehicle and mode.
 * - Shared Ride: vehicle passenger capacity - 1 (Auto: 2, Car: 3, Sedan: 3, SUV: 5, Bike: 0)
 * - Personal Ride: entire vehicle capacity is allocated; no shared seat restriction.
 */
export function getMaxSelectableSeats(
  type: VehicleType,
  mode: RideMode
): number {
  const capacity = CANONICAL_VEHICLE_CAPACITIES[type] ?? 1;
  if (mode === "shared") {
    if (type === "bike") {
      return 0; // Not available in Shared Ride
    }
    return Math.max(1, capacity - 1);
  }
  // For Personal Ride, entire vehicle is allocated to the passenger
  return capacity;
}

/**
 * Provisional fare estimate using Stitch UI display values.
 * Actual production fare computation will be returned by the backend pricing engine.
 */
export function getEstimatedFare(
  type: VehicleType,
  mode: RideMode,
  seats: number = 1
): number {
  const def = VEHICLE_DEFINITIONS[type];
  if (!def) return 0;

  if (mode === "personal") {
    return def.stitchPersonalFare;
  }

  // Shared fare per seat with multi-seat scaling
  if (seats <= 1) {
    return def.stitchSharedFarePerSeat;
  }
  return Math.round(def.stitchSharedFarePerSeat * seats * 0.9);
}
