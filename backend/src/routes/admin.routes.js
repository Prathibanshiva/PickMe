const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const { requireAdmin } = require("../middleware/roles/admin.middleware");

const {
  getDrivers,
  getDriverById,
  approveDriver,
  rejectDriver,
} = require("../controllers/admin/driver.controller");

const { loginAdmin } = require("../controllers/admin/auth.controller");
const {
  getPassengers,
  getPassengerById,
  updatePassengerStatus,
} = require("../controllers/admin/passenger.controller");
const {
  getRides,
  getRideById,
} = require("../controllers/admin/ride.controller");
const {
  getScheduledRides,
  getScheduledRideById,
} = require("../controllers/admin/scheduled-ride.controller");
const {
  getDashboardOverview,
} = require("../controllers/admin/dashboard.controller");

const router = express.Router();

/**
 * GET /api/admin/dashboard/overview
 * Operational overview metrics & queue telemetry
 */
router.get("/dashboard/overview", authenticate, requireAdmin, getDashboardOverview);

/**
 * Public Dedicated Admin Authentication Route
 */
router.post("/auth/login", loginAdmin);

/**
 * GET /api/admin/me
 * Protected foundation route to verify administrator session and permissions on server side.
 */
router.get("/me", authenticate, requireAdmin, (req, res) => {
  return res.status(200).json({
    success: true,
    message: "Admin session verified",
    admin: {
      id: req.user._id,
      phoneNumber: req.user.phoneNumber,
      name: req.user.name || "Operations Admin",
      email: req.user.email || "",
      role: req.user.defaultRole || "admin",
      createdAt: req.user.createdAt,
    },
  });
});

/**
 * Driver Verification & Management Routes
 * Enforces authenticate + requireAdmin on every route
 */
router.get("/drivers", authenticate, requireAdmin, getDrivers);
router.get("/drivers/:id", authenticate, requireAdmin, getDriverById);
router.put("/drivers/:id/approve", authenticate, requireAdmin, approveDriver);
router.put("/drivers/:id/reject", authenticate, requireAdmin, rejectDriver);

/**
 * Passenger / User Management Routes
 * Enforces authenticate + requireAdmin on every route
 */
router.get("/passengers", authenticate, requireAdmin, getPassengers);
router.get("/passengers/:id", authenticate, requireAdmin, getPassengerById);
router.put("/passengers/:id/status", authenticate, requireAdmin, updatePassengerStatus);
router.get("/users", authenticate, requireAdmin, getPassengers);
router.get("/users/:id", authenticate, requireAdmin, getPassengerById);
router.put("/users/:id/status", authenticate, requireAdmin, updatePassengerStatus);

/**
 * Ride Telemetry & Management Routes
 * Enforces authenticate + requireAdmin on every route
 */
router.get("/rides", authenticate, requireAdmin, getRides);
router.get("/rides/:id", authenticate, requireAdmin, getRideById);

/**
 * Scheduled Ride Queue & Pre-Booking Routes
 * Enforces authenticate + requireAdmin on every route
 */
router.get("/scheduled-rides", authenticate, requireAdmin, getScheduledRides);
router.get("/scheduled-rides/:id", authenticate, requireAdmin, getScheduledRideById);

module.exports = router;
