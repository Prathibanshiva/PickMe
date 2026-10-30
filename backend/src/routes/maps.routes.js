// backend/src/routes/maps.routes.js

const express = require("express");
const { authenticate } = require("../middleware/auth.middleware");
const {
  autocompletePlaces,
  getPlaceDetails,
  reverseGeocode,
} = require("../controllers/maps/maps.controller");

const router = express.Router();

// All Maps proxy endpoints require an authenticated mobile session.
// This prevents anonymous quota exhaustion and enforces user accountability.

/**
 * GET /api/maps/autocomplete
 * Places Autocomplete search.
 * Query: input (req), sessiontoken (opt), lat (opt), lng (opt), radius (opt)
 */
router.get("/autocomplete", authenticate, autocompletePlaces);

/**
 * GET /api/maps/place-details
 * Resolve a Place ID to coordinates + address.
 * Query: place_id (req), sessiontoken (opt)
 */
router.get("/place-details", authenticate, getPlaceDetails);

/**
 * GET /api/maps/reverse-geocode
 * Reverse geocode coordinates to a readable address.
 * Query: lat (req), lng (req)
 */
router.get("/reverse-geocode", authenticate, reverseGeocode);

module.exports = router;
