const express = require("express");

const {
  createOrGetDriverProfile,
  submitDriverProfile,
} = require("../controllers/driver/driver.controller");

const {
  authenticate,
} = require("../middleware/auth.middleware");

const router = express.Router();


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