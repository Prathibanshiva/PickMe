// shared/constants/vehicles.js

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

const CANONICAL_VEHICLE_CAPACITIES = {
  bike: 1,
  auto: 3,
  car: 4,
  sedan: 4,
  suv: 6,
};

const RIDE_MODES = {
  SHARED: "shared",
  PERSONAL: "personal",
};

/**
 * Validates whether a vehicle and requested seats match PickMe rules.
 *
 * For Shared Ride:
 * - Bike is NOT allowed
 * - requestedSeats must be >= 1
 * - requestedSeats must be <= (capacity - 1)
 *
 * For Personal Ride:
 * - Bike, Auto, Car, Sedan, SUV allowed
 * - Entire vehicle is allocated to that single request
 * - No capacity - 1 restriction
 */
function validateRideRequest(vehicleType, rideMode, requestedSeats = 1) {
  if (!CANONICAL_VEHICLE_CAPACITIES[vehicleType]) {
    return { valid: false, reason: `Unknown vehicle type: ${vehicleType}` };
  }

  if (rideMode === RIDE_MODES.SHARED) {
    if (vehicleType === "bike") {
      return { valid: false, reason: "Bike is not available for Shared Ride" };
    }
    const maxSharedSeats = CANONICAL_VEHICLE_CAPACITIES[vehicleType] - 1;
    if (requestedSeats < 1 || requestedSeats > maxSharedSeats) {
      return {
        valid: false,
        reason: `Requested seats (${requestedSeats}) must be between 1 and ${maxSharedSeats} for ${vehicleType} in Shared Ride`,
      };
    }
    return { valid: true };
  }

  if (rideMode === RIDE_MODES.PERSONAL) {
    // Entire vehicle is exclusively allocated
    return { valid: true };
  }

  return { valid: false, reason: `Invalid ride mode: ${rideMode}` };
}

module.exports = {
  CANONICAL_VEHICLE_CAPACITIES,
  RIDE_MODES,
  validateRideRequest,
};
