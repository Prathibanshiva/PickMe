const express = require("express");

const {
  getDriverProfile,
  createOrGetDriverProfile,
  submitDriverProfile,
} = require("../controllers/driver/driver.controller");

const {
  authenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();

// Retrieve driver profile (read-only, does not auto-create)
router.get(
  "/profile",
  authenticate,
  getDriverProfile
);

// Create or retrieve driver profile
router.post(
  "/profile",
  authenticate,
  createOrGetDriverProfile
);


// Submit driver onboarding information
router.put(
  "/profile",
  authenticate,
  submitDriverProfile
);


module.exports = router;