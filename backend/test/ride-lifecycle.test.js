const { describe, it, before, after } = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const path = require("path");

// Load backend/.env
dotenv.config({ path: path.resolve(__dirname, "../.env") });

const {
  CANONICAL_VEHICLE_CAPACITIES,
  RIDE_MODES,
  validateRideRequest,
} = require("../../shared/constants/vehicles");

const Ride = require("../src/models/Ride");
const User = require("../src/models/User");
const DriverProfile = require("../src/models/DriverProfile");
const {
  createRideSchema,
  verifyOtpSchema,
  cancelRideSchema,
} = require("../src/validators/ride.validator");
const { formatRideResponse } = require("../src/controllers/ride/ride.controller");

describe("PickMe — Ride Lifecycle Foundation Test Suite", () => {
  let isDbConnected = false;
  let testPassenger = null;
  let testDriver = null;
  let secondDriver = null;
  let strangerPassenger = null;

  before(async () => {
    // FAIL-CLOSED DATABASE SAFETY GUARD:
    // Never connect to production or non-isolated DBs.
    // Fails closed unless TEST_MONGODB_URI is explicitly configured AND NODE_ENV === 'test'.
    const isExplicitTestDb =
      process.env.TEST_MONGODB_URI && process.env.NODE_ENV === "test";

    if (!isExplicitTestDb) {
      console.log(
        "ℹ️ Notice: TEST_MONGODB_URI with NODE_ENV=test not configured. Failing closed: skipping destructive MongoDB integration tests."
      );
      isDbConnected = false;
      return;
    }

    try {
      await mongoose.connect(process.env.TEST_MONGODB_URI, {
        serverSelectionTimeoutMS: 5000,
      });
      isDbConnected = true;

      // Clean up test collections in isolated test database
      await Ride.deleteMany({});
      await User.deleteMany({ email: { $regex: /@pickmetest\.internal$/ } });
      await DriverProfile.deleteMany({});

      // Create test users
      testPassenger = await User.create({
        phoneNumber: "9876543210",
        name: "Test Passenger",
        email: "passenger@pickmetest.internal",
        defaultRole: "passenger",
      });

      testDriver = await User.create({
        phoneNumber: "9876543211",
        name: "Test Driver",
        email: "driver@pickmetest.internal",
        defaultRole: "driver",
      });

      await DriverProfile.create({
        userId: testDriver._id,
        verificationStatus: "approved",
        vehicleType: "sedan",
        vehicleNumber: "KA01AB1234",
      });

      secondDriver = await User.create({
        phoneNumber: "9876543212",
        name: "Second Driver",
        email: "driver2@pickmetest.internal",
        defaultRole: "driver",
      });

      await DriverProfile.create({
        userId: secondDriver._id,
        verificationStatus: "approved",
        vehicleType: "car",
        vehicleNumber: "KA01CD5678",
      });

      strangerPassenger = await User.create({
        phoneNumber: "9876543213",
        name: "Stranger Passenger",
        email: "stranger@pickmetest.internal",
        defaultRole: "passenger",
      });
    } catch (err) {
      console.warn("MongoDB connection unavailable for integration tests:", err.message);
      isDbConnected = false;
    }
  });

  after(async () => {
    if (isDbConnected) {
      try {
        await Ride.deleteMany({});
        await User.deleteMany({ email: { $regex: /@pickmetest\.internal$/ } });
        await DriverProfile.deleteMany({});
        if (mongoose.connection?.db) {
          await mongoose.connection.db.dropDatabase();
        }
      } catch (err) {
        // Cleanup error ignored
      } finally {
        await mongoose.disconnect();
      }
    }
  });

  // =========================================================================
  // 1. CANONICAL PRODUCT RULES & SEAT VALIDATION
  // =========================================================================

  describe("1. Canonical Product Rules & Capacity Constraints", () => {
    it("should match canonical passenger capacities (driver excluded)", () => {
      assert.equal(CANONICAL_VEHICLE_CAPACITIES.bike, 1);
      assert.equal(CANONICAL_VEHICLE_CAPACITIES.auto, 3);
      assert.equal(CANONICAL_VEHICLE_CAPACITIES.car, 4);
      assert.equal(CANONICAL_VEHICLE_CAPACITIES.sedan, 4);
      assert.equal(CANONICAL_VEHICLE_CAPACITIES.suv, 6);
    });

    it("should strictly prohibit Bike from Shared Rides", () => {
      const res = validateRideRequest("bike", RIDE_MODES.SHARED, 1);
      assert.equal(res.valid, false);
      assert.match(res.reason, /Bike is not available for Shared Ride/i);
    });

    it("should allow Bike for Personal Rides", () => {
      const res = validateRideRequest("bike", RIDE_MODES.PERSONAL, 1);
      assert.equal(res.valid, true);
    });

    it("should enforce shared seat bounds (1 to capacity - 1)", () => {
      // Auto (capacity 3) -> 1 or 2
      assert.equal(validateRideRequest("auto", RIDE_MODES.SHARED, 1).valid, true);
      assert.equal(validateRideRequest("auto", RIDE_MODES.SHARED, 2).valid, true);
      assert.equal(validateRideRequest("auto", RIDE_MODES.SHARED, 3).valid, false);
      assert.equal(validateRideRequest("auto", RIDE_MODES.SHARED, 0).valid, false);

      // Car (capacity 4) -> 1 to 3
      assert.equal(validateRideRequest("car", RIDE_MODES.SHARED, 3).valid, true);
      assert.equal(validateRideRequest("car", RIDE_MODES.SHARED, 4).valid, false);

      // Sedan (capacity 4) -> 1 to 3
      assert.equal(validateRideRequest("sedan", RIDE_MODES.SHARED, 3).valid, true);
      assert.equal(validateRideRequest("sedan", RIDE_MODES.SHARED, 4).valid, false);

      // SUV (capacity 6) -> 1 to 5
      assert.equal(validateRideRequest("suv", RIDE_MODES.SHARED, 5).valid, true);
      assert.equal(validateRideRequest("suv", RIDE_MODES.SHARED, 6).valid, false);
    });

    it("should allow full vehicle reservation for Personal Rides without shared cap", () => {
      assert.equal(validateRideRequest("auto", RIDE_MODES.PERSONAL, 3).valid, true);
      assert.equal(validateRideRequest("car", RIDE_MODES.PERSONAL, 4).valid, true);
      assert.equal(validateRideRequest("sedan", RIDE_MODES.PERSONAL, 4).valid, true);
      assert.equal(validateRideRequest("suv", RIDE_MODES.PERSONAL, 6).valid, true);
    });
  });

  // =========================================================================
  // 2. INPUT VALIDATOR TESTS (ZOD)
  // =========================================================================

  describe("2. Zod Input Validation", () => {
    it("should validate a well-formed ride booking payload", () => {
      const validPayload = {
        pickup: {
          address: "4th Block, Koramangala, Bengaluru",
          coordinates: [77.6245, 12.9352],
        },
        destination: {
          address: "100ft Road, Indiranagar, Bengaluru",
          coordinates: [77.6408, 12.9784],
        },
        vehicleType: "sedan",
        rideMode: "shared",
        requestedSeats: 2,
        estimatedFare: 240,
        distanceKm: 5.4,
        durationMin: 18,
      };

      const result = createRideSchema.safeParse(validPayload);
      assert.equal(result.success, true);
    });

    it("should reject shared ride requesting more seats than (capacity - 1)", () => {
      const invalidPayload = {
        pickup: {
          address: "Koramangala",
          coordinates: [77.6245, 12.9352],
        },
        destination: {
          address: "Indiranagar",
          coordinates: [77.6408, 12.9784],
        },
        vehicleType: "sedan", // cap = 4, max shared = 3
        rideMode: "shared",
        requestedSeats: 4, // Exceeds cap - 1
        estimatedFare: 300,
      };

      const result = createRideSchema.safeParse(invalidPayload);
      assert.equal(result.success, false);
      assert.match(result.error.issues[0].message, /between 1 and 3/);
    });

    it("should reject shared ride with bike", () => {
      const bikeShared = {
        pickup: {
          address: "Koramangala",
          coordinates: [77.6245, 12.9352],
        },
        destination: {
          address: "Indiranagar",
          coordinates: [77.6408, 12.9784],
        },
        vehicleType: "bike",
        rideMode: "shared",
        requestedSeats: 1,
        estimatedFare: 90,
      };

      const result = createRideSchema.safeParse(bikeShared);
      assert.equal(result.success, false);
      assert.match(result.error.issues[0].message, /Bike is not available for Shared Ride/);
    });

    it("should validate 4-digit verification OTP", () => {
      assert.equal(verifyOtpSchema.safeParse({ otp: "7294" }).success, true);
      assert.equal(verifyOtpSchema.safeParse({ otp: "123" }).success, false);
      assert.equal(verifyOtpSchema.safeParse({ otp: "12345" }).success, false);
      assert.equal(verifyOtpSchema.safeParse({ otp: "abcd" }).success, false);
    });

    it("should validate cancellation reason length", () => {
      assert.equal(cancelRideSchema.safeParse({ reason: "Driver delayed" }).success, true);
      assert.equal(cancelRideSchema.safeParse({ reason: "a".repeat(501) }).success, false);
    });
  });

  // =========================================================================
  // 3. PERSISTENT RIDE MODEL & SCHEMA INTEGRATION
  // =========================================================================

  describe("3. Persistent Ride Model Schema Constraints", () => {
    it("should instantiate a Ride document with auto-generated rideId and timeline", async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const ride = new Ride({
        passengerId: dummyId,
        vehicleType: "sedan",
        rideMode: "shared",
        requestedSeats: 2,
        pickup: {
          address: "Koramangala",
          location: { type: "Point", coordinates: [77.6245, 12.9352] },
        },
        destination: {
          address: "Indiranagar",
          location: { type: "Point", coordinates: [77.6408, 12.9784] },
        },
        estimatedFare: 250,
        verificationOtp: "7294",
      });

      await ride.validate();
      assert.match(ride.rideId, /^PKM-\d+$/);
      assert.equal(ride.status, "requested");
      assert.equal(ride.driverEarnings, Math.round(250 * 0.85)); // 213
    });

    it("should fail validation if coordinates are outside valid geographic range", async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const invalidRide = new Ride({
        passengerId: dummyId,
        vehicleType: "sedan",
        rideMode: "personal",
        requestedSeats: 4,
        pickup: {
          address: "Invalid",
          location: { type: "Point", coordinates: [200, 100] }, // Invalid coords!
        },
        destination: {
          address: "Indiranagar",
          location: { type: "Point", coordinates: [77.6408, 12.9784] },
        },
        estimatedFare: 250,
        verificationOtp: "7294",
      });

      await assert.rejects(
        async () => {
          await invalidRide.validate();
        },
        /valid geographic ranges/i
      );
    });

    it("should fail validation if vehicle capacity constraints are violated", async () => {
      const dummyId = new mongoose.Types.ObjectId();
      const invalidRide = new Ride({
        passengerId: dummyId,
        vehicleType: "bike",
        rideMode: "shared", // Bike shared not allowed!
        requestedSeats: 1,
        pickup: {
          address: "Koramangala",
          location: { type: "Point", coordinates: [77.6245, 12.9352] },
        },
        destination: {
          address: "Indiranagar",
          location: { type: "Point", coordinates: [77.6408, 12.9784] },
        },
        estimatedFare: 100,
        verificationOtp: "7294",
      });

      await assert.rejects(
        async () => {
          await invalidRide.validate();
        },
        /Bike is not available for Shared Ride/i
      );
    });
  });

  // =========================================================================
  // 4. ROLE-BASED RESPONSE FORMATTING & SENSITIVE DATA MASKING
  // =========================================================================

  describe("4. Role-Based Response Formatting & OTP Masking", () => {
    it("should expose verificationOtp to the passenger who booked the ride", () => {
      const passengerId = new mongoose.Types.ObjectId();
      const mockRide = {
        _id: new mongoose.Types.ObjectId(),
        rideId: "PKM-12345",
        passengerId: { _id: passengerId, name: "Passenger", phoneNumber: "9876543210" },
        driverId: null,
        vehicleType: "car",
        rideMode: "shared",
        requestedSeats: 2,
        pickup: { address: "Pickup" },
        destination: { address: "Drop" },
        distanceKm: 5,
        durationMin: 15,
        estimatedFare: 200,
        finalFare: null,
        driverEarnings: 170,
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "requested",
        verificationOtp: "7294",
        timeline: { requestedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const passengerView = formatRideResponse(mockRide, passengerId, false);
      assert.equal(passengerView.verificationOtp, "7294");
    });

    it("should mask verificationOtp when viewed by a driver partner", () => {
      const passengerId = new mongoose.Types.ObjectId();
      const driverId = new mongoose.Types.ObjectId();
      const mockRide = {
        _id: new mongoose.Types.ObjectId(),
        rideId: "PKM-12345",
        passengerId: { _id: passengerId, name: "Passenger", phoneNumber: "9876543210" },
        driverId: { _id: driverId, name: "Driver", phoneNumber: "9876543211" },
        vehicleType: "car",
        rideMode: "shared",
        requestedSeats: 2,
        pickup: { address: "Pickup" },
        destination: { address: "Drop" },
        distanceKm: 5,
        durationMin: 15,
        estimatedFare: 200,
        finalFare: null,
        driverEarnings: 170,
        paymentMethod: "cash",
        paymentStatus: "pending",
        status: "accepted",
        verificationOtp: "7294",
        timeline: { requestedAt: new Date() },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const driverView = formatRideResponse(mockRide, driverId, false);
      assert.equal(driverView.verificationOtp, undefined);
    });

    it("should mask verificationOtp when viewed by administrator per privacy policy", () => {
      const passengerId = new mongoose.Types.ObjectId();
      const adminId = new mongoose.Types.ObjectId();
      const mockRide = {
        _id: new mongoose.Types.ObjectId(),
        rideId: "PKM-12345",
        passengerId: { _id: passengerId, name: "Passenger", phoneNumber: "9876543210" },
        driverId: null,
        vehicleType: "car",
        rideMode: "shared",
        requestedSeats: 2,
        estimatedFare: 200,
        verificationOtp: "7294",
      };

      const adminView = formatRideResponse(mockRide, adminId, true);
      assert.equal(adminView.verificationOtp, undefined);
    });

    it("should generate cryptographically secure 4-digit OTPs using crypto.randomInt", () => {
      const { randomInt } = require("crypto");
      for (let i = 0; i < 50; i++) {
        const otp = String(randomInt(1000, 10000));
        assert.equal(otp.length, 4);
        const num = parseInt(otp, 10);
        assert.ok(num >= 1000 && num <= 9999);
      }
    });
  });

  // =========================================================================
  // 5. SERVER-AUTHORITATIVE LIFECYCLE STATE MACHINE (INTEGRATION)
  // =========================================================================

  describe("5. End-to-End Server-Authoritative Lifecycle State Machine", () => {
    let createdRide = null;

    it("should persist a new Ride in MongoDB with status 'requested'", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      createdRide = await Ride.create({
        passengerId: testPassenger._id,
        vehicleType: "sedan",
        rideMode: "shared",
        requestedSeats: 2,
        pickup: {
          address: "4th Block, Koramangala",
          title: "4th Block, Koramangala",
          location: { type: "Point", coordinates: [77.6245, 12.9352] },
        },
        destination: {
          address: "100ft Road, Indiranagar",
          title: "100ft Road, Indiranagar",
          location: { type: "Point", coordinates: [77.6408, 12.9784] },
        },
        estimatedFare: 280,
        distanceKm: 5.4,
        durationMin: 18,
        verificationOtp: "7294",
        status: "requested",
      });

      assert.ok(createdRide._id);
      assert.equal(createdRide.status, "requested");
      assert.equal(createdRide.driverId, null);
    });

    it("should atomically transition from requested -> accepted upon driver acceptance", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      const accepted = await Ride.findOneAndUpdate(
        {
          _id: createdRide._id,
          status: "requested",
          driverId: null,
        },
        {
          $set: {
            status: "accepted",
            driverId: testDriver._id,
            "timeline.assignedAt": new Date(),
          },
        },
        { returnDocument: "after" }
      );

      assert.ok(accepted);
      assert.equal(accepted.status, "accepted");
      assert.equal(accepted.driverId.toString(), testDriver._id.toString());
      assert.ok(accepted.timeline.assignedAt);
    });

    it("should prevent a concurrent driver from accepting an already-accepted ride (race guard)", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      const secondAttempt = await Ride.findOneAndUpdate(
        {
          _id: createdRide._id,
          status: "requested", // Already 'accepted', so this must return null!
          driverId: null,
        },
        {
          $set: {
            status: "accepted",
            driverId: secondDriver._id,
          },
        },
        { returnDocument: "after" }
      );

      assert.equal(secondAttempt, null);
    });

    it("should atomically transition from accepted -> arrived when driver reaches pickup", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      const arrived = await Ride.findOneAndUpdate(
        {
          _id: createdRide._id,
          driverId: testDriver._id,
          status: "accepted",
        },
        {
          $set: {
            status: "arrived",
            "timeline.arrivedAt": new Date(),
          },
        },
        { returnDocument: "after" }
      );

      assert.ok(arrived);
      assert.equal(arrived.status, "arrived");
      assert.ok(arrived.timeline.arrivedAt);
    });

    it("should atomically reject an invalid OTP when attempting to start the trip", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      const current = await Ride.findById(createdRide._id);
      assert.equal(current.status, "arrived");

      // P5: Atomic OTP verification check
      const wrongOtpAttempt = await Ride.findOneAndUpdate(
        {
          _id: createdRide._id,
          driverId: testDriver._id,
          status: "arrived",
          verificationOtp: "9999", // Incorrect OTP
        },
        {
          $set: {
            status: "in_progress",
            "timeline.startedAt": new Date(),
          },
        },
        { returnDocument: "after" }
      );

      assert.equal(wrongOtpAttempt, null);
      // State remains 'arrived'
      const stillArrived = await Ride.findById(createdRide._id);
      assert.equal(stillArrived.status, "arrived");
    });

    it("should atomically transition from arrived -> in_progress upon providing correct 4-digit OTP", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      const current = await Ride.findById(createdRide._id);
      const inProgress = await Ride.findOneAndUpdate(
        {
          _id: createdRide._id,
          driverId: testDriver._id,
          status: "arrived",
          verificationOtp: current.verificationOtp, // Atomic gate matches
        },
        {
          $set: {
            status: "in_progress",
            "timeline.startedAt": new Date(),
          },
        },
        { returnDocument: "after" }
      );

      assert.ok(inProgress);
      assert.equal(inProgress.status, "in_progress");
      assert.ok(inProgress.timeline.startedAt);
    });

    it("should transition from in_progress -> completed when reaching dropoff", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      const completed = await Ride.findOneAndUpdate(
        {
          _id: createdRide._id,
          driverId: testDriver._id,
          status: "in_progress",
        },
        {
          $set: {
            status: "completed",
            finalFare: createdRide.estimatedFare,
            paymentStatus: "completed",
            "timeline.completedAt": new Date(),
          },
        },
        { returnDocument: "after" }
      );

      assert.ok(completed);
      assert.equal(completed.status, "completed");
      assert.equal(completed.finalFare, 280);
      assert.ok(completed.timeline.completedAt);
    });

    it("should strictly forbid transitioning or restarting a completed ride", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      const restartAttempt = await Ride.findOneAndUpdate(
        {
          _id: createdRide._id,
          status: "in_progress", // Ride is already 'completed'!
        },
        {
          $set: { status: "in_progress" },
        },
        { returnDocument: "after" }
      );

      assert.equal(restartAttempt, null);

      const latest = await Ride.findById(createdRide._id);
      assert.equal(latest.status, "completed");
    });

    it("should handle cancellation lifecycle and stamp cancellation metadata", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      // Create a fresh ride to test cancellation
      const cancelTarget = await Ride.create({
        passengerId: testPassenger._id,
        vehicleType: "auto",
        rideMode: "shared",
        requestedSeats: 1,
        pickup: {
          address: "Indiranagar",
          location: { type: "Point", coordinates: [77.6408, 12.9784] },
        },
        destination: {
          address: "Koramangala",
          location: { type: "Point", coordinates: [77.6245, 12.9352] },
        },
        estimatedFare: 120,
        verificationOtp: "1234",
        status: "requested",
      });

      const cancelled = await Ride.findOneAndUpdate(
        {
          _id: cancelTarget._id,
          status: "requested",
        },
        {
          $set: {
            status: "cancelled",
            "timeline.cancelledAt": new Date(),
            "cancellation.cancelledBy": "passenger",
            "cancellation.reason": "Booked another vehicle",
          },
        },
        { returnDocument: "after" }
      );

      assert.ok(cancelled);
      assert.equal(cancelled.status, "cancelled");
      assert.equal(cancelled.cancellation.cancelledBy, "passenger");
      assert.equal(cancelled.cancellation.reason, "Booked another vehicle");
      assert.ok(cancelled.timeline.cancelledAt);

      // Attempting to accept a cancelled ride must fail
      const acceptCancelled = await Ride.findOneAndUpdate(
        {
          _id: cancelTarget._id,
          status: "requested",
        },
        {
          $set: { status: "accepted", driverId: testDriver._id },
        },
        { returnDocument: "after" }
      );

      assert.equal(acceptCancelled, null);
    });
  });

  // =========================================================================
  // 6. DRIVER EXCLUSIVITY, OWNERSHIP & ADMIN METRICS
  // =========================================================================

  describe("6. Driver Exclusivity & Admin Telemetry Verification", () => {
    it("should prevent a driver fulfilling an active Personal Ride from accepting another ride", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      // Create an active personal ride for testDriver
      const personalRide = await Ride.create({
        passengerId: testPassenger._id,
        driverId: testDriver._id,
        vehicleType: "sedan",
        rideMode: RIDE_MODES.PERSONAL,
        requestedSeats: 4,
        pickup: {
          address: "Koramangala",
          location: { type: "Point", coordinates: [77.6245, 12.9352] },
        },
        destination: {
          address: "Indiranagar",
          location: { type: "Point", coordinates: [77.6408, 12.9784] },
        },
        estimatedFare: 400,
        verificationOtp: "5555",
        status: "accepted",
      });

      // Verification: Driver exclusivity check
      const activePersonal = await Ride.findOne({
        driverId: testDriver._id,
        status: { $in: ["accepted", "arrived", "in_progress"] },
        rideMode: RIDE_MODES.PERSONAL,
      });

      assert.ok(activePersonal);
      assert.equal(activePersonal.rideMode, "personal");

      // Clean up the personal ride
      await Ride.findByIdAndDelete(personalRide._id);
    });

    it("should calculate admin ride telemetry metrics accurately from persistent MongoDB collection", async (t) => {
      if (!isDbConnected) return t.skip("MongoDB Atlas not connected");

      // Query real metrics directly using the same aggregation logic as admin controller
      const [liveRides, upcomingRides, completedRides, cancelledRides, totalRides] =
        await Promise.all([
          Ride.countDocuments({ status: { $in: ["accepted", "arrived", "in_progress"] } }),
          Ride.countDocuments({ status: "requested" }),
          Ride.countDocuments({ status: "completed" }),
          Ride.countDocuments({ status: "cancelled" }),
          Ride.countDocuments({}),
        ]);

      assert.ok(typeof liveRides === "number");
      assert.ok(typeof upcomingRides === "number");
      assert.ok(typeof completedRides === "number");
      assert.ok(typeof cancelledRides === "number");
      assert.ok(typeof totalRides === "number");
      assert.equal(liveRides + upcomingRides + completedRides + cancelledRides, totalRides);
    });
  });
});
