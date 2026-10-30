const express = require("express");
const rateLimit = require("express-rate-limit");
const { authenticate } = require("../middleware/auth.middleware");
const { requireApprovedDriver } = require("../controllers/driver/driver.controller");
const {
  createRide,
  getActiveRide,
  getAvailableRides,
  getRideById,
  getMyRides,
  acceptRide,
  arriveAtPickup,
  verifyRideOtp,
  completeRide,
  cancelRide,
} = require("../controllers/ride/ride.controller");

const router = express.Router();

/**
 * P1: Rate-limiter for Trip-Start OTP Verification
 * Restricts OTP verification attempts to 5 per 15-minute window per driver/ride.
 * Returns HTTP 429 without leaking the expected OTP.
 */
const verifyOtpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => `${req.user?._id || req.ip}_${req.params.id}`,
  message: {
    success: false,
    message: "Too many failed OTP verification attempts. Please wait 15 minutes before trying again.",
  },
  statusCode: 429,
});

/**
 * Passenger Ride Request Endpoints
 */
router.post("/", authenticate, createRide);
router.get("/active", authenticate, getActiveRide);
router.get("/my-active", authenticate, getActiveRide);
router.get("/available", authenticate, requireApprovedDriver, getAvailableRides);
router.get("/", authenticate, getMyRides);
router.get("/:id", authenticate, getRideById);

/**
 * Driver Lifecycle Action Endpoints (Require Approved Driver)
 */
router.post("/:id/accept", authenticate, requireApprovedDriver, acceptRide);
router.post("/:id/arrive", authenticate, requireApprovedDriver, arriveAtPickup);
router.post("/:id/verify-otp", authenticate, requireApprovedDriver, verifyOtpLimiter, verifyRideOtp);
router.post("/:id/complete", authenticate, requireApprovedDriver, completeRide);

/**
 * Cancellation Endpoints (Passenger, Assigned Driver, or Admin)
 */
router.put("/:id/cancel", authenticate, cancelRide);
router.post("/:id/cancel", authenticate, cancelRide);

module.exports = router;
