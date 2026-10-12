// mobile-app/scripts/verify-ride-rules.js

const {
  CANONICAL_VEHICLE_CAPACITIES,
  RIDE_MODES,
  validateRideRequest,
} = require("../../shared/constants/vehicles");

function assert(condition, message) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✅ PASSED: ${message}`);
}

console.log("=== VERIFYING PICKME RIDE RULES ===");

// 1. Verify Canonical Capacities
assert(CANONICAL_VEHICLE_CAPACITIES.bike === 1, "Bike canonical capacity is 1");
assert(CANONICAL_VEHICLE_CAPACITIES.auto === 3, "Auto canonical capacity is 3");
assert(CANONICAL_VEHICLE_CAPACITIES.car === 4, "Car canonical capacity is 4");
assert(CANONICAL_VEHICLE_CAPACITIES.sedan === 4, "Sedan canonical capacity is 4");
assert(CANONICAL_VEHICLE_CAPACITIES.suv === 6, "SUV canonical capacity is 6");

// 2. Shared Ride Validation
// Bike MUST be rejected for Shared Ride
const bikeShared = validateRideRequest("bike", RIDE_MODES.SHARED, 1);
assert(!bikeShared.valid, "Bike is rejected for Shared Ride");

// Auto: 1-2 seats allowed, 3 seats rejected
assert(validateRideRequest("auto", RIDE_MODES.SHARED, 1).valid, "Auto 1 seat allowed in Shared");
assert(validateRideRequest("auto", RIDE_MODES.SHARED, 2).valid, "Auto 2 seats allowed in Shared (max 2)");
assert(!validateRideRequest("auto", RIDE_MODES.SHARED, 3).valid, "Auto 3 seats rejected in Shared (capacity - 1 exceeded)");

// Car: 1-3 seats allowed, 4 seats rejected
assert(validateRideRequest("car", RIDE_MODES.SHARED, 1).valid, "Car 1 seat allowed in Shared");
assert(validateRideRequest("car", RIDE_MODES.SHARED, 3).valid, "Car 3 seats allowed in Shared (max 3)");
assert(!validateRideRequest("car", RIDE_MODES.SHARED, 4).valid, "Car 4 seats rejected in Shared (capacity - 1 exceeded)");

// Sedan: 1-3 seats allowed, 4 seats rejected
assert(validateRideRequest("sedan", RIDE_MODES.SHARED, 1).valid, "Sedan 1 seat allowed in Shared");
assert(validateRideRequest("sedan", RIDE_MODES.SHARED, 3).valid, "Sedan 3 seats allowed in Shared (max 3)");
assert(!validateRideRequest("sedan", RIDE_MODES.SHARED, 4).valid, "Sedan 4 seats rejected in Shared (capacity - 1 exceeded)");

// SUV: 1-5 seats allowed, 6 seats rejected
assert(validateRideRequest("suv", RIDE_MODES.SHARED, 1).valid, "SUV 1 seat allowed in Shared");
assert(validateRideRequest("suv", RIDE_MODES.SHARED, 5).valid, "SUV 5 seats allowed in Shared (max 5)");
assert(!validateRideRequest("suv", RIDE_MODES.SHARED, 6).valid, "SUV 6 seats rejected in Shared (capacity - 1 exceeded)");

// 3. Personal Ride Validation
// Bike MUST be allowed for Personal Ride
assert(validateRideRequest("bike", RIDE_MODES.PERSONAL).valid, "Bike is allowed in Personal Ride");
assert(validateRideRequest("auto", RIDE_MODES.PERSONAL).valid, "Auto is allowed in Personal Ride");
assert(validateRideRequest("car", RIDE_MODES.PERSONAL).valid, "Car is allowed in Personal Ride");
assert(validateRideRequest("sedan", RIDE_MODES.PERSONAL).valid, "Sedan is allowed in Personal Ride");
assert(validateRideRequest("suv", RIDE_MODES.PERSONAL).valid, "SUV is allowed in Personal Ride");

console.log("=== ALL RIDE MODE & CAPACITY ASSERTIONS PASSED ===");
